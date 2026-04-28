import type { PtoDateTableKey, PtoPlanRow } from "../../domain/pto/date-table";
import {
  ptoDayValueRecordDates,
  ptoManualYearsKey,
  ptoPlanRowIds,
  ptoUiStateKey,
  ptoYearDateRange,
  type PtoPersistenceBucketRowRecord,
  type PtoPersistenceBucketValueRecord,
  type PtoPersistenceDayValueRecord,
  type PtoPersistenceRowRecord,
  type PtoPersistenceState,
} from "../../domain/pto/persistence-shared";
import { stringifyJson } from "./json";
import { dbExecute, type DbExecutor } from "./pool";

const batchSize = 250;

type DeletePtoDayValuesOptions = {
  yearScope?: string | null;
};

function scopedDateClause(yearScope: string | null | undefined, values: unknown[]) {
  if (!yearScope) return "";

  const { start, end } = ptoYearDateRange(yearScope);
  values.push(start, end);
  return " AND work_date >= ? AND work_date <= ?";
}

export async function upsertPtoRows(records: PtoPersistenceRowRecord[], execute: DbExecutor = dbExecute) {
  if (!records.length) return;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = batch.flatMap((record) => [
      record.table_type,
      record.row_id,
      record.area,
      record.location,
      record.structure,
      record.customer_code,
      record.unit,
      record.status,
      record.carryover,
      stringifyJson(record.carryovers),
      stringifyJson(record.carryover_manual_years),
      stringifyJson(record.years),
      record.sort_index,
    ]);

    await execute(
      `INSERT INTO pto_rows (
        table_type, row_id, area, location, structure, customer_code, unit, status,
        carryover, carryovers, carryover_manual_years, years, sort_index
      ) VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        area = VALUES(area),
        location = VALUES(location),
        structure = VALUES(structure),
        customer_code = VALUES(customer_code),
        unit = VALUES(unit),
        status = VALUES(status),
        carryover = VALUES(carryover),
        carryovers = VALUES(carryovers),
        carryover_manual_years = VALUES(carryover_manual_years),
        years = VALUES(years),
        sort_index = VALUES(sort_index),
        updated_at = CURRENT_TIMESTAMP(3)`,
      values,
    );
  }
}

export async function insertPtoRowsIfMissing(records: PtoPersistenceRowRecord[], execute: DbExecutor = dbExecute) {
  if (!records.length) return;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = batch.flatMap((record) => [
      record.table_type,
      record.row_id,
      record.area,
      record.location,
      record.structure,
      record.customer_code,
      record.unit,
      record.status,
      record.carryover,
      stringifyJson(record.carryovers),
      stringifyJson(record.carryover_manual_years),
      stringifyJson(record.years),
      record.sort_index,
    ]);

    await execute(
      `INSERT IGNORE INTO pto_rows (
        table_type, row_id, area, location, structure, customer_code, unit, status,
        carryover, carryovers, carryover_manual_years, years, sort_index
      ) VALUES ${placeholders}`,
      values,
    );
  }
}

export async function upsertPtoDayValues(records: PtoPersistenceDayValueRecord[], execute: DbExecutor = dbExecute) {
  if (!records.length) return;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const placeholders = batch.map(() => "(?, ?, ?, ?)").join(", ");
    const values = batch.flatMap((record) => [
      record.table_type,
      record.row_id,
      record.work_date,
      record.value,
    ]);

    await execute(
      `INSERT INTO pto_day_values (table_type, row_id, work_date, value)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        value = VALUES(value),
        updated_at = CURRENT_TIMESTAMP(3)`,
      values,
    );
  }
}

export async function deletePtoDayValuesMissingFromState(
  table: PtoDateTableKey,
  rows: PtoPlanRow[],
  execute: DbExecutor = dbExecute,
  options: DeletePtoDayValuesOptions = {},
) {
  for (const { rowId, dates } of ptoDayValueRecordDates(rows)) {
    if (!rowId) continue;

    if (dates.length === 0) {
      const values: unknown[] = [table, rowId];
      await execute(
        `DELETE FROM pto_day_values WHERE table_type = ? AND row_id = ?${scopedDateClause(options.yearScope, values)}`,
        values,
      );
      continue;
    }

    const values: unknown[] = [table, rowId];
    const dateScopeClause = scopedDateClause(options.yearScope, values);
    const placeholders = dates.map(() => "?").join(", ");
    await execute(
      `DELETE FROM pto_day_values
      WHERE table_type = ?
        AND row_id = ?
        ${dateScopeClause}
        AND work_date NOT IN (${placeholders})`,
      [...values, ...dates],
    );
  }
}

export async function deletePtoRowsMissingFromState(
  table: PtoDateTableKey,
  rows: PtoPlanRow[],
  execute: DbExecutor = dbExecute,
) {
  const rowIds = ptoPlanRowIds(rows);

  if (rowIds.length === 0) {
    await execute("DELETE FROM pto_day_values WHERE table_type = ?", [table]);
    await execute("DELETE FROM pto_rows WHERE table_type = ?", [table]);
    return;
  }

  const placeholders = rowIds.map(() => "?").join(", ");

  await execute(
    `DELETE FROM pto_day_values
    WHERE table_type = ?
      AND row_id NOT IN (${placeholders})`,
    [table, ...rowIds],
  );
  await execute(
    `DELETE FROM pto_rows
    WHERE table_type = ?
      AND row_id NOT IN (${placeholders})`,
    [table, ...rowIds],
  );
}

export async function upsertPtoBucketRows(
  records: PtoPersistenceBucketRowRecord[],
  execute: DbExecutor = dbExecute,
) {
  if (!records.length) return;

  const placeholders = records.map(() => "(?, ?, ?, ?, ?)").join(", ");
  const values = records.flatMap((record) => [
    record.row_key,
    record.area,
    record.structure,
    record.source,
    record.sort_index,
  ]);

  await execute(
    `INSERT INTO pto_bucket_rows (row_key, area, structure, source, sort_index)
    VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      area = VALUES(area),
      structure = VALUES(structure),
      source = VALUES(source),
      sort_index = VALUES(sort_index),
      updated_at = CURRENT_TIMESTAMP(3)`,
    values,
  );
}

export async function upsertPtoBucketValues(
  records: PtoPersistenceBucketValueRecord[],
  execute: DbExecutor = dbExecute,
) {
  if (!records.length) return;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const placeholders = batch.map(() => "(?, ?, ?)").join(", ");
    const values = batch.flatMap((record) => [record.row_key, record.equipment_key, record.value]);

    await execute(
      `INSERT INTO pto_bucket_values (row_key, equipment_key, value)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        value = VALUES(value),
        updated_at = CURRENT_TIMESTAMP(3)`,
      values,
    );
  }
}

export async function deletePtoBucketRowsMissingFromState(
  records: PtoPersistenceBucketRowRecord[],
  execute: DbExecutor = dbExecute,
) {
  if (records.length === 0) {
    await execute("DELETE FROM pto_bucket_rows");
    return;
  }

  const placeholders = records.map(() => "?").join(", ");

  await execute(
    `DELETE FROM pto_bucket_rows
    WHERE row_key NOT IN (${placeholders})`,
    records.map((record) => record.row_key),
  );
}

export async function deletePtoBucketValuesMissingFromState(
  records: PtoPersistenceBucketValueRecord[],
  execute: DbExecutor = dbExecute,
) {
  if (records.length === 0) {
    await execute("DELETE FROM pto_bucket_values");
    return;
  }

  const placeholders = records.map(() => "(?, ?)").join(", ");

  await execute(
    `DELETE FROM pto_bucket_values
    WHERE (row_key, equipment_key) NOT IN (${placeholders})`,
    records.flatMap((record) => [record.row_key, record.equipment_key]),
  );
}

export async function upsertPtoSettings(
  state: Pick<PtoPersistenceState, "manualYears" | "uiState">,
  execute: DbExecutor = dbExecute,
) {
  await execute(
    `INSERT INTO pto_settings (setting_key, value)
    VALUES (?, ?), (?, ?)
    ON DUPLICATE KEY UPDATE
      value = VALUES(value),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      ptoManualYearsKey,
      stringifyJson(state.manualYears),
      ptoUiStateKey,
      stringifyJson(state.uiState ?? {}),
    ],
  );
}
