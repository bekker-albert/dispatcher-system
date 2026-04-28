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
  ptoYearDateRange,
  splitPtoBucketCellKey,
  type PtoPersistenceDayValuePatch,
  type PtoPersistenceSnapshotWriteOptions,
  type PtoPersistenceSnapshotWriteResult,
  type PtoPersistenceState,
} from "../../domain/pto/persistence-shared";
import { dbTransaction } from "./pool";
import { assertMysqlPtoMatchesExpectedUpdatedAt as assertFreshMysqlPtoMatchesExpectedUpdatedAt } from "./pto-freshness";
import { loadPtoUpdatedAtFromMysql } from "./pto-load";
import { assertPtoVersionMatchesExpectedUpdatedAt, touchPtoVersion } from "./pto-version";
import {
  deletePtoBucketRowsMissingFromState as deleteMissingPtoBucketRowsFromMysqlState,
  deletePtoBucketValuesMissingFromState as deleteMissingPtoBucketValuesFromMysqlState,
  deletePtoDayValuesMissingFromState as deleteMissingPtoDayValuesFromMysqlState,
  deletePtoRowsMissingFromState as deleteMissingPtoRowsFromMysqlState,
  insertPtoRowsIfMissing as insertMissingMysqlPtoRows,
  upsertPtoBucketRows as upsertMysqlPtoBucketRows,
  upsertPtoBucketValues as upsertMysqlPtoBucketValues,
  upsertPtoDayValues as upsertMysqlPtoDayValues,
  upsertPtoRows as upsertMysqlPtoRows,
  upsertPtoSettings as upsertMysqlPtoSettings,
} from "./pto-writes";

export type PtoSnapshotWriteOptions = PtoPersistenceSnapshotWriteOptions;
export type PtoSnapshotWriteResult = PtoPersistenceSnapshotWriteResult;

type PtoDayValuePatch = PtoPersistenceDayValuePatch;
type PtoInlineWriteOptions = Pick<PtoSnapshotWriteOptions, "expectedUpdatedAt">;

const assertMysqlPtoMatchesExpectedUpdatedAt = assertFreshMysqlPtoMatchesExpectedUpdatedAt;
const deletePtoBucketRowsMissingFromState = deleteMissingPtoBucketRowsFromMysqlState;
const deletePtoBucketValuesMissingFromState = deleteMissingPtoBucketValuesFromMysqlState;
const deletePtoDayValuesMissingFromState = deleteMissingPtoDayValuesFromMysqlState;
const deletePtoRowsMissingFromState = deleteMissingPtoRowsFromMysqlState;
const insertPtoRowsIfMissing = insertMissingMysqlPtoRows;
const upsertPtoBucketRows = upsertMysqlPtoBucketRows;
const upsertPtoBucketValues = upsertMysqlPtoBucketValues;
const upsertPtoDayValues = upsertMysqlPtoDayValues;
const upsertPtoRows = upsertMysqlPtoRows;
const upsertPtoSettings = upsertMysqlPtoSettings;

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

  await dbTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await upsertPtoRows(rowRecords, execute);
    await upsertPtoDayValues(scopedDayRecords, execute);
    await deletePtoDayValuesMissingFromState("plan", planRows, execute, { yearScope: options.yearScope });
    await deletePtoDayValuesMissingFromState("oper", operRows, execute, { yearScope: options.yearScope });
    await deletePtoDayValuesMissingFromState("survey", surveyRows, execute, { yearScope: options.yearScope });
    if (!isYearScopedSave) {
      await deletePtoRowsMissingFromState("plan", planRows, execute);
      await deletePtoRowsMissingFromState("oper", operRows, execute);
      await deletePtoRowsMissingFromState("survey", surveyRows, execute);
      await upsertPtoBucketRows(bucketRowRecords, execute);
      await upsertPtoBucketValues(bucketValueRecords, execute);
      await deletePtoBucketValuesMissingFromState(bucketValueRecords, execute);
      await deletePtoBucketRowsMissingFromState(bucketRowRecords, execute);
    }
    await upsertPtoSettings(state, execute);
    await touchPtoVersion(execute);
  });

  return { updatedAt: await loadPtoUpdatedAtFromMysql() };
}

export async function savePtoDayValueToMysql(
  table: PtoDateTableKey,
  rowId: string,
  day: string,
  value: number | null,
  options: PtoInlineWriteOptions = {},
) {
  await dbTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    if (value === null) {
      await execute(
        "DELETE FROM pto_day_values WHERE table_type = ? AND row_id = ? AND work_date = ?",
        [table, rowId, day],
      );
    } else {
      await upsertPtoDayValues([{ table_type: table, row_id: rowId, work_date: day, value }], execute);
    }
    await touchPtoVersion(execute);
  });

  return { updatedAt: await loadPtoUpdatedAtFromMysql() };
}

export async function savePtoDayValueWithRowToMysql(
  table: PtoDateTableKey,
  row: PtoPlanRow,
  day: string,
  value: number | null,
  options: PtoInlineWriteOptions = {},
) {
  await dbTransaction(async (execute) => {
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
    await touchPtoVersion(execute);
  });

  return { updatedAt: await loadPtoUpdatedAtFromMysql() };
}

export async function savePtoDayValuesToMysql(
  table: PtoDateTableKey,
  values: PtoDayValuePatch[],
  options: PtoInlineWriteOptions = {},
) {
  const { upsertRecords, deleteValues } = ptoDayValuePatchesToRecords(table, values);

  await dbTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await upsertPtoDayValues(upsertRecords, execute);

    for (const item of deleteValues) {
      await execute(
        "DELETE FROM pto_day_values WHERE table_type = ? AND row_id = ? AND work_date = ?",
        [table, item.rowId, item.day],
      );
    }
    await touchPtoVersion(execute);
  });

  return { updatedAt: await loadPtoUpdatedAtFromMysql() };
}

export async function savePtoDayValuesWithRowToMysql(
  table: PtoDateTableKey,
  row: PtoPlanRow,
  values: PtoDayValuePatch[],
  options: PtoInlineWriteOptions = {},
) {
  const normalizedValues = values.map((item) => ({ ...item, rowId: row.id }));
  const { upsertRecords, deleteValues } = ptoDayValuePatchesToRecords(table, normalizedValues);

  await dbTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await insertPtoRowsIfMissing(ptoRowsToRecords(table, [row]), execute);
    await upsertPtoDayValues(upsertRecords, execute);

    for (const item of deleteValues) {
      await execute(
        "DELETE FROM pto_day_values WHERE table_type = ? AND row_id = ? AND work_date = ?",
        [table, row.id, item.day],
      );
    }
    await touchPtoVersion(execute);
  });

  return { updatedAt: await loadPtoUpdatedAtFromMysql() };
}

export async function deletePtoRowsFromMysql(
  table: PtoDateTableKey,
  rowIds: string[],
  options: PtoInlineWriteOptions = {},
) {
  if (rowIds.length === 0) return;

  const placeholders = rowIds.map(() => "?").join(", ");

  await dbTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await execute(
      `DELETE FROM pto_day_values WHERE table_type = ? AND row_id IN (${placeholders})`,
      [table, ...rowIds],
    );
    await execute(
      `DELETE FROM pto_rows WHERE table_type = ? AND row_id IN (${placeholders})`,
      [table, ...rowIds],
    );
    await touchPtoVersion(execute);
  });

  return { updatedAt: await loadPtoUpdatedAtFromMysql() };
}

export async function deletePtoYearFromMysql(year: string, options: PtoInlineWriteOptions = {}) {
  const { start, end } = ptoYearDateRange(year);
  await dbTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await execute(
      "DELETE FROM pto_day_values WHERE work_date >= ? AND work_date <= ?",
      [start, end],
    );
    await touchPtoVersion(execute);
  });

  return { updatedAt: await loadPtoUpdatedAtFromMysql() };
}

export async function savePtoBucketRowToMysql(
  row: PtoBucketRow,
  sortIndex = 0,
  options: PtoInlineWriteOptions = {},
) {
  await dbTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await upsertPtoBucketRows([ptoBucketRowToRecord(row, sortIndex)], execute);
    await touchPtoVersion(execute);
  });

  return { updatedAt: await loadPtoUpdatedAtFromMysql() };
}

export async function deletePtoBucketRowFromMysql(rowKeyValue: string, options: PtoInlineWriteOptions = {}) {
  await dbTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    await execute("DELETE FROM pto_bucket_values WHERE row_key = ?", [rowKeyValue]);
    await execute("DELETE FROM pto_bucket_rows WHERE row_key = ?", [rowKeyValue]);
    await touchPtoVersion(execute);
  });

  return { updatedAt: await loadPtoUpdatedAtFromMysql() };
}

export async function savePtoBucketValueToMysql(
  cellKey: string,
  value: number | null,
  options: PtoInlineWriteOptions = {},
) {
  const parsed = splitPtoBucketCellKey(cellKey);
  if (!parsed) return;

  await dbTransaction(async (execute) => {
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
    await touchPtoVersion(execute);
  });

  return { updatedAt: await loadPtoUpdatedAtFromMysql() };
}

export async function deletePtoBucketValuesFromMysql(
  cellKeys: string[],
  options: PtoInlineWriteOptions = {},
) {
  const pairs = ptoBucketCellKeysToPairs(cellKeys);
  if (pairs.length === 0) return;

  await dbTransaction(async (execute) => {
    await assertPtoVersionMatchesExpectedUpdatedAt(options.expectedUpdatedAt, execute);
    for (const parsed of pairs) {
      await execute(
        "DELETE FROM pto_bucket_values WHERE row_key = ? AND equipment_key = ?",
        [parsed.rowKey, parsed.equipmentKey],
      );
    }
    await touchPtoVersion(execute);
  });

  return { updatedAt: await loadPtoUpdatedAtFromMysql() };
}
