import type { RowDataPacket } from "mysql2/promise";
import type { PtoDateTableKey, PtoPlanRow } from "../../domain/pto/date-table";
import {
  ptoDayValueRecordDates,
  ptoManualYearsKey,
  ptoPlanRowIds,
  ptoUiStateKey,
  ptoYearDateRange,
  type PtoPersistenceDayValueRecord,
  type PtoPersistenceRowRecord,
  type PtoPersistenceState,
} from "../../domain/pto/persistence-shared";
import { parseJson, stringifyJson } from "./json";
import { dbExecute, type DbExecutor } from "./pool";

const batchSize = 250;
const ptoRowInsertColumns = `
        table_type, row_id, area, location, structure, customer_code, unit, status,
        carryover, carryovers, carryover_manual_years, years, sort_index
      `;

type DeletePtoDayValuesOptions = {
  yearScope?: string | null;
};

type PtoRowYearMetadataRecord = RowDataPacket & {
  table_type: PtoDateTableKey;
  row_id: string;
  carryovers: unknown;
  carryover_manual_years: unknown;
  years: unknown;
};

type PtoDayValueRowIdRecord = RowDataPacket & {
  row_id: string;
};

function scopedDateClause(yearScope: string | null | undefined, values: unknown[]) {
  if (!yearScope) return "";

  const { start, end } = ptoYearDateRange(yearScope);
  values.push(start, end);
  return " AND work_date >= ? AND work_date <= ?";
}

function chunkValues<T>(values: T[], size = batchSize) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function stringArrayFromStoredJson(value: unknown) {
  const parsed = parseJson(value, value);
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : [];
}

function objectFromStoredJson(value: unknown) {
  const parsed = parseJson(value, value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};
}

async function selectPtoRowsWithYearMetadata(
  execute: DbExecutor,
  options: {
    table?: PtoDateTableKey;
    excludeRowIdsByTable?: Partial<Record<PtoDateTableKey, string[]>>;
  } = {},
) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (options.table) {
    clauses.push("table_type = ?");
    values.push(options.table);
  }

  Object.entries(options.excludeRowIdsByTable ?? {}).forEach(([table, rowIds]) => {
    if (!rowIds || rowIds.length === 0) return;

    const placeholders = rowIds.map(() => "?").join(", ");
    clauses.push("(table_type <> ? OR row_id NOT IN (" + placeholders + "))");
    values.push(table, ...rowIds);
  });

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return await (execute.rows?.<PtoRowYearMetadataRecord>(
    `SELECT table_type, row_id, carryovers, carryover_manual_years, years
    FROM pto_rows
    ${where}`,
    values,
  ) ?? Promise.resolve([]));
}

async function prunePtoYearFromRowMetadataRecords(
  records: PtoRowYearMetadataRecord[],
  year: string,
  execute: DbExecutor,
) {
  for (const record of records) {
    const years = stringArrayFromStoredJson(record.years).filter((item) => item !== year);
    const carryoverManualYears = stringArrayFromStoredJson(record.carryover_manual_years)
      .filter((item) => item !== year);
    const carryovers = objectFromStoredJson(record.carryovers);
    delete carryovers[year];

    await execute(
      `UPDATE pto_rows
      SET years = ?,
        carryover_manual_years = ?,
        carryovers = ?,
        updated_at = CURRENT_TIMESTAMP(3)
      WHERE table_type = ? AND row_id = ?`,
      [
        stringifyJson(years),
        stringifyJson(carryoverManualYears),
        stringifyJson(carryovers),
        record.table_type,
        record.row_id,
      ],
    );
  }
}

export async function prunePtoYearFromRows(
  year: string,
  execute: DbExecutor = dbExecute,
  options: {
    table?: PtoDateTableKey;
    excludeRowIdsByTable?: Partial<Record<PtoDateTableKey, string[]>>;
  } = {},
) {
  await prunePtoYearFromRowMetadataRecords(
    await selectPtoRowsWithYearMetadata(execute, options),
    year,
    execute,
  );
}

export async function deletePtoRowsWithoutData(execute: DbExecutor = dbExecute) {
  await execute(
    `DELETE rows_without_data
    FROM pto_rows AS rows_without_data
    WHERE JSON_LENGTH(COALESCE(rows_without_data.years, JSON_ARRAY())) = 0
      AND JSON_LENGTH(COALESCE(rows_without_data.carryover_manual_years, JSON_ARRAY())) = 0
      AND JSON_LENGTH(COALESCE(rows_without_data.carryovers, JSON_OBJECT())) = 0
      AND NOT EXISTS (
        SELECT 1
        FROM pto_day_values AS values_for_row
        WHERE values_for_row.table_type = rows_without_data.table_type
          AND values_for_row.row_id = rows_without_data.row_id
        LIMIT 1
      )`,
  );
}

function ptoDayValueDateGroups(rows: PtoPlanRow[]) {
  const groups = new Map<string, { dates: string[]; rowIds: string[] }>();

  ptoDayValueRecordDates(rows).forEach(({ rowId, dates }) => {
    if (!rowId) return;

    const key = dates.join("\u0001");
    const group = groups.get(key) ?? { dates, rowIds: [] };
    group.rowIds.push(rowId);
    groups.set(key, group);
  });

  return Array.from(groups.values());
}

function ptoRowBatchValues(records: PtoPersistenceRowRecord[]) {
  return {
    placeholders: records.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", "),
    values: records.flatMap((record) => [
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
    ]),
  };
}

export async function upsertPtoRows(records: PtoPersistenceRowRecord[], execute: DbExecutor = dbExecute) {
  if (!records.length) return;

  for (const batch of chunkValues(records)) {
    const { placeholders, values } = ptoRowBatchValues(batch);

    await execute(
      `INSERT INTO pto_rows (${ptoRowInsertColumns}) VALUES ${placeholders}
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

  for (const batch of chunkValues(records)) {
    const { placeholders, values } = ptoRowBatchValues(batch);

    await execute(
      `INSERT IGNORE INTO pto_rows (${ptoRowInsertColumns}) VALUES ${placeholders}`,
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
  for (const { rowIds, dates } of ptoDayValueDateGroups(rows)) {
    for (const rowIdBatch of chunkValues(rowIds)) {
      const rowPlaceholders = rowIdBatch.map(() => "?").join(", ");

      if (dates.length === 0) {
        const values: unknown[] = [table, ...rowIdBatch];
        await execute(
          `DELETE FROM pto_day_values
          WHERE table_type = ?
            AND row_id IN (${rowPlaceholders})${scopedDateClause(options.yearScope, values)}`,
          values,
        );
        continue;
      }

      const values: unknown[] = [table, ...rowIdBatch];
      const dateScopeClause = scopedDateClause(options.yearScope, values);
      const datePlaceholders = dates.map(() => "?").join(", ");
      await execute(
        `DELETE FROM pto_day_values
        WHERE table_type = ?
          AND row_id IN (${rowPlaceholders})
          ${dateScopeClause}
          AND work_date NOT IN (${datePlaceholders})`,
        [...values, ...dates],
      );
    }
  }
}

export async function deletePtoDayValuesForRowsMissingFromYearState(
  table: PtoDateTableKey,
  rows: PtoPlanRow[],
  yearScope: string,
  execute: DbExecutor = dbExecute,
) {
  const { start, end } = ptoYearDateRange(yearScope);
  const rowIds = new Set(ptoPlanRowIds(rows));

  if (rowIds.size === 0) {
    await execute(
      `DELETE FROM pto_day_values
      WHERE table_type = ?
        AND work_date >= ?
        AND work_date <= ?`,
      [table, start, end],
    );
    return;
  }

  const existingRows = await (execute.rows?.<PtoDayValueRowIdRecord>(
    `SELECT DISTINCT row_id
    FROM pto_day_values
    WHERE table_type = ?
      AND work_date >= ?
      AND work_date <= ?`,
    [table, start, end],
  ) ?? Promise.resolve([]));

  const staleRowIds = existingRows
    .map((record) => record.row_id)
    .filter((rowId) => !rowIds.has(rowId));

  for (const rowIdBatch of chunkValues(staleRowIds)) {
    if (rowIdBatch.length === 0) continue;

    const rowPlaceholders = rowIdBatch.map(() => "?").join(", ");
    await execute(
      `DELETE FROM pto_day_values
      WHERE table_type = ?
        AND work_date >= ?
        AND work_date <= ?
        AND row_id IN (${rowPlaceholders})`,
      [table, start, end, ...rowIdBatch],
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
