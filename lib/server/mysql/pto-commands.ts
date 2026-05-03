import type { PtoBucketRow } from "../../domain/pto/buckets";
import type { PtoDateTableKey, PtoPlanRow } from "../../domain/pto/date-table";
import {
  ptoDayValueRecordsForYear,
  ptoBucketCellKeysToPairs,
  ptoBucketRowToRecord,
  ptoBucketValueToRecord,
  ptoDayValuePatchesToRecords,
  ptoRowsToRecords,
  ptoPersistenceStateToRecords,
  ptoPlanRowIds,
  ptoYearDateRange,
  splitPtoBucketCellKey,
  type PtoPersistenceDayValuePatch,
  type PtoPersistenceSnapshotWriteOptions,
  type PtoPersistenceSnapshotWriteResult,
  type PtoPersistenceState,
} from "../../domain/pto/persistence-shared";
import { dbTransaction, type DbExecutor } from "./pool";
import { assertMysqlPtoMatchesExpectedUpdatedAt as assertFreshMysqlPtoMatchesExpectedUpdatedAt } from "./pto-freshness";
import { assertPtoVersionMatchesExpectedUpdatedAt, touchPtoVersion } from "./pto-version";
import {
  deletePtoBucketRowsMissingFromState as deleteMissingPtoBucketRowsFromMysqlState,
  deletePtoBucketValuesMissingFromState as deleteMissingPtoBucketValuesFromMysqlState,
  upsertPtoBucketRows as upsertMysqlPtoBucketRows,
  upsertPtoBucketValues as upsertMysqlPtoBucketValues,
} from "./pto-bucket-writes";
import {
  deletePtoDayValuesForRowsMissingFromYearState as deleteMissingPtoYearRowValuesFromMysqlState,
  deletePtoDayValuesMissingFromState as deleteMissingPtoDayValuesFromMysqlState,
  deletePtoRowsWithoutData as deleteMysqlPtoRowsWithoutData,
  deletePtoRowsMissingFromState as deleteMissingPtoRowsFromMysqlState,
  insertPtoRowsIfMissing as insertMissingMysqlPtoRows,
  prunePtoYearFromRows as pruneMysqlPtoYearFromRows,
  upsertPtoDayValues as upsertMysqlPtoDayValues,
  upsertPtoRows as upsertMysqlPtoRows,
  upsertPtoRowsForYearScope as upsertMysqlPtoRowsForYearScope,
  upsertPtoSettings as upsertMysqlPtoSettings,
} from "./pto-writes";
import { chunkValues } from "./pto-write-utils";
import {
  rebuildPtoRowYearMembership,
  refreshPtoRowYearMembershipForRows,
  refreshPtoRowYearMembershipForYear,
} from "./pto-row-year-membership";

export type PtoSnapshotWriteOptions = PtoPersistenceSnapshotWriteOptions;
export type PtoSnapshotWriteResult = PtoPersistenceSnapshotWriteResult;

type PtoDayValuePatch = PtoPersistenceDayValuePatch;
type PtoInlineWriteOptions = Pick<PtoSnapshotWriteOptions, "expectedUpdatedAt">;

const assertMysqlPtoMatchesExpectedUpdatedAt = assertFreshMysqlPtoMatchesExpectedUpdatedAt;
const deletePtoBucketRowsMissingFromState = deleteMissingPtoBucketRowsFromMysqlState;
const deletePtoBucketValuesMissingFromState = deleteMissingPtoBucketValuesFromMysqlState;
const deletePtoDayValuesMissingFromState = deleteMissingPtoDayValuesFromMysqlState;
const deletePtoDayValuesForRowsMissingFromYearState = deleteMissingPtoYearRowValuesFromMysqlState;
const deletePtoRowsWithoutData = deleteMysqlPtoRowsWithoutData;
const deletePtoRowsMissingFromState = deleteMissingPtoRowsFromMysqlState;
const insertPtoRowsIfMissing = insertMissingMysqlPtoRows;
const prunePtoYearFromRows = pruneMysqlPtoYearFromRows;
const upsertPtoBucketRows = upsertMysqlPtoBucketRows;
const upsertPtoBucketValues = upsertMysqlPtoBucketValues;
const upsertPtoDayValues = upsertMysqlPtoDayValues;
const upsertPtoRows = upsertMysqlPtoRows;
const upsertPtoRowsForYearScope = upsertMysqlPtoRowsForYearScope;
const upsertPtoSettings = upsertMysqlPtoSettings;

async function writePtoTransaction(callback: (execute: DbExecutor) => Promise<void>) {
  const updatedAt = await dbTransaction(async (execute) => {
    await callback(execute);
    return await touchPtoVersion(execute);
  });

  return { updatedAt };
}

async function deletePtoDayValuePatches(
  table: PtoDateTableKey,
  values: PtoDayValuePatch[],
  execute: DbExecutor,
) {
  for (const batch of chunkValues(values)) {
    if (batch.length === 0) continue;

    const placeholders = batch.map(() => "(?, ?)").join(", ");
    await execute(
      `DELETE FROM pto_day_values
      WHERE table_type = ?
        AND (row_id, work_date) IN (${placeholders})`,
      [table, ...batch.flatMap((item) => [item.rowId, item.day])],
    );
  }
}

async function deletePtoBucketValuePairs(
  pairs: Array<{ rowKey: string; equipmentKey: string }>,
  execute: DbExecutor,
) {
  for (const batch of chunkValues(pairs)) {
    if (batch.length === 0) continue;

    const placeholders = batch.map(() => "(?, ?)").join(", ");
    await execute(
      `DELETE FROM pto_bucket_values
      WHERE (row_key, equipment_key) IN (${placeholders})`,
      batch.flatMap((item) => [item.rowKey, item.equipmentKey]),
    );
  }
}

export async function savePtoStateToMysql(
  state: PtoPersistenceState,
  options: PtoSnapshotWriteOptions = {},
): Promise<PtoSnapshotWriteResult> {
  const {
    planRows,
    operRows,
    surveyRows,
    rowRecords,
    dayRecords,
    bucketRowRecords,
    bucketValueRecords,
  } = ptoPersistenceStateToRecords(state);

  await assertMysqlPtoMatchesExpectedUpdatedAt(state, options.expectedUpdatedAt, {
    yearScope: options.yearScope,
  });

  const isYearScopedSave = Boolean(options.yearScope);
  const scopedDayRecords = options.yearScope
    ? ptoDayValueRecordsForYear(dayRecords, options.yearScope)
    : dayRecords;

  return await writePtoTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    if (options.yearScope) {
      await upsertPtoRowsForYearScope(rowRecords, options.yearScope, execute);
    } else {
      await upsertPtoRows(rowRecords, execute);
    }
    await upsertPtoDayValues(scopedDayRecords, execute);
    await deletePtoDayValuesMissingFromState("plan", planRows, execute, { yearScope: options.yearScope });
    await deletePtoDayValuesMissingFromState("oper", operRows, execute, { yearScope: options.yearScope });
    await deletePtoDayValuesMissingFromState("survey", surveyRows, execute, { yearScope: options.yearScope });
    if (options.yearScope) {
      await deletePtoDayValuesForRowsMissingFromYearState("plan", planRows, options.yearScope, execute);
      await deletePtoDayValuesForRowsMissingFromYearState("oper", operRows, options.yearScope, execute);
      await deletePtoDayValuesForRowsMissingFromYearState("survey", surveyRows, options.yearScope, execute);
      await prunePtoYearFromRows(options.yearScope, execute, {
        excludeRowIdsByTable: {
          plan: ptoPlanRowIds(planRows),
          oper: ptoPlanRowIds(operRows),
          survey: ptoPlanRowIds(surveyRows),
        },
      });
      await deletePtoRowsWithoutData(execute);
    }
    if (!isYearScopedSave) {
      await deletePtoRowsMissingFromState("plan", planRows, execute);
      await deletePtoRowsMissingFromState("oper", operRows, execute);
      await deletePtoRowsMissingFromState("survey", surveyRows, execute);
      await upsertPtoBucketRows(bucketRowRecords, execute);
      await upsertPtoBucketValues(bucketValueRecords, execute);
      await deletePtoBucketValuesMissingFromState(bucketValueRecords, execute);
      await deletePtoBucketRowsMissingFromState(bucketRowRecords, execute);
    }
    if (options.yearScope) {
      await refreshPtoRowYearMembershipForYear(options.yearScope, execute);
    } else {
      await rebuildPtoRowYearMembership(execute);
    }
    await upsertPtoSettings(state, execute);
  });
}

export async function savePtoDayValueToMysql(
  table: PtoDateTableKey,
  rowId: string,
  day: string,
  value: number | null,
  options: PtoInlineWriteOptions = {},
) {
  return await writePtoTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    if (value === null) {
      await execute(
        "DELETE FROM pto_day_values WHERE table_type = ? AND row_id = ? AND work_date = ?",
        [table, rowId, day],
      );
    } else {
      await upsertPtoDayValues([{ table_type: table, row_id: rowId, work_date: day, value }], execute);
    }
    await refreshPtoRowYearMembershipForRows([{ table_type: table, row_id: rowId }], execute);
  });
}

export async function savePtoDayValueWithRowToMysql(
  table: PtoDateTableKey,
  row: PtoPlanRow,
  day: string,
  value: number | null,
  options: PtoInlineWriteOptions = {},
) {
  return await writePtoTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await insertPtoRowsIfMissing(ptoRowsToRecords(table, [row]), execute);
    if (value === null) {
      await execute(
        "DELETE FROM pto_day_values WHERE table_type = ? AND row_id = ? AND work_date = ?",
        [table, row.id, day],
      );
    } else {
      await upsertPtoDayValues([{ table_type: table, row_id: row.id, work_date: day, value }], execute);
    }
    await refreshPtoRowYearMembershipForRows([{ table_type: table, row_id: row.id }], execute);
  });
}

export async function savePtoDayValuesToMysql(
  table: PtoDateTableKey,
  values: PtoDayValuePatch[],
  options: PtoInlineWriteOptions = {},
) {
  const { upsertRecords, deleteValues } = ptoDayValuePatchesToRecords(table, values);

  return await writePtoTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await upsertPtoDayValues(upsertRecords, execute);
    await deletePtoDayValuePatches(table, deleteValues, execute);
    await refreshPtoRowYearMembershipForRows(values.map((item) => ({ table_type: table, row_id: item.rowId })), execute);
  });
}

export async function savePtoDayValuesWithRowToMysql(
  table: PtoDateTableKey,
  row: PtoPlanRow,
  values: PtoDayValuePatch[],
  options: PtoInlineWriteOptions = {},
) {
  const normalizedValues = values.map((item) => ({ ...item, rowId: row.id }));
  const { upsertRecords, deleteValues } = ptoDayValuePatchesToRecords(table, normalizedValues);

  return await writePtoTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await insertPtoRowsIfMissing(ptoRowsToRecords(table, [row]), execute);
    await upsertPtoDayValues(upsertRecords, execute);
    await deletePtoDayValuePatches(table, deleteValues, execute);
    await refreshPtoRowYearMembershipForRows([{ table_type: table, row_id: row.id }], execute);
  });
}

export async function deletePtoRowsFromMysql(
  table: PtoDateTableKey,
  rowIds: string[],
  options: PtoInlineWriteOptions = {},
) {
  if (rowIds.length === 0) return;

  return await writePtoTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    for (const rowIdBatch of chunkValues(rowIds)) {
      const placeholders = rowIdBatch.map(() => "?").join(", ");
      await execute(
        `DELETE FROM pto_day_values WHERE table_type = ? AND row_id IN (${placeholders})`,
        [table, ...rowIdBatch],
      );
      await execute(
        `DELETE FROM pto_rows WHERE table_type = ? AND row_id IN (${placeholders})`,
        [table, ...rowIdBatch],
      );
      await execute(
        `DELETE FROM pto_row_years WHERE table_type = ? AND row_id IN (${placeholders})`,
        [table, ...rowIdBatch],
      );
    }
  });
}

export async function deletePtoYearFromMysql(year: string, options: PtoInlineWriteOptions = {}) {
  const { start, end } = ptoYearDateRange(year);
  return await writePtoTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await execute(
      "DELETE FROM pto_day_values WHERE work_date >= ? AND work_date <= ?",
      [start, end],
    );
    await prunePtoYearFromRows(year, execute);
    await deletePtoRowsWithoutData(execute);
    await execute("DELETE FROM pto_row_years WHERE year_value = ?", [year]);
  });
}

export async function savePtoBucketRowToMysql(
  row: PtoBucketRow,
  sortIndex = 0,
  options: PtoInlineWriteOptions = {},
) {
  return await writePtoTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await upsertPtoBucketRows([ptoBucketRowToRecord(row, sortIndex)], execute);
  });
}

export async function deletePtoBucketRowFromMysql(rowKeyValue: string, options: PtoInlineWriteOptions = {}) {
  return await writePtoTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await execute("DELETE FROM pto_bucket_values WHERE row_key = ?", [rowKeyValue]);
    await execute("DELETE FROM pto_bucket_rows WHERE row_key = ?", [rowKeyValue]);
  });
}

export async function savePtoBucketValueToMysql(
  cellKey: string,
  value: number | null,
  options: PtoInlineWriteOptions = {},
) {
  const parsed = splitPtoBucketCellKey(cellKey);
  if (!parsed) return;

  return await writePtoTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    if (value === null) {
      await execute(
        "DELETE FROM pto_bucket_values WHERE row_key = ? AND equipment_key = ?",
        [parsed.rowKey, parsed.equipmentKey],
      );
    } else {
      const record = ptoBucketValueToRecord(cellKey, value);
      if (record) await upsertPtoBucketValues([record], execute);
    }
  });
}

export async function deletePtoBucketValuesFromMysql(
  cellKeys: string[],
  options: PtoInlineWriteOptions = {},
) {
  const pairs = ptoBucketCellKeysToPairs(cellKeys);
  if (pairs.length === 0) return;

  return await writePtoTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await deletePtoBucketValuePairs(pairs, execute);
  });
}
