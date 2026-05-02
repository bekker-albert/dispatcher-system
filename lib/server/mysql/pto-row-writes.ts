import type { RowDataPacket } from "mysql2/promise";
import type { PtoDateTableKey, PtoPlanRow } from "../../domain/pto/date-table";
import {
  ptoPlanRowIds,
  type PtoPersistenceRowRecord,
} from "../../domain/pto/persistence-shared";
import { stringifyJson } from "./json";
import { dbExecute, type DbExecutor } from "./pool";
import {
  chunkValues,
  objectFromStoredJson,
  ptoRowBatchValues,
  ptoRowInsertColumns,
  ptoRowRecordKey,
  stringArrayFromStoredJson,
} from "./pto-write-utils";

type PtoRowYearMetadataRecord = RowDataPacket & {
  table_type: PtoDateTableKey;
  row_id: string;
  carryovers: unknown;
  carryover_manual_years: unknown;
  years: unknown;
};

export type PtoRowYearMetadataInput = {
  carryovers: unknown;
  carryover_manual_years: unknown;
  years: unknown;
};

export function createPrunedPtoRowYearMetadata(record: PtoRowYearMetadataInput, year: string) {
  const existingYears = stringArrayFromStoredJson(record.years);
  const existingCarryoverManualYears = stringArrayFromStoredJson(record.carryover_manual_years);
  const existingCarryovers = objectFromStoredJson(record.carryovers);
  const hasYearMetadata = existingYears.includes(year)
    || existingCarryoverManualYears.includes(year)
    || Object.prototype.hasOwnProperty.call(existingCarryovers, year);

  if (!hasYearMetadata) return null;

  const carryovers = { ...existingCarryovers };
  delete carryovers[year];

  return {
    years: existingYears.filter((item) => item !== year),
    carryoverManualYears: existingCarryoverManualYears.filter((item) => item !== year),
    carryovers,
  };
}

async function selectPtoRowsWithYearMetadata(
  year: string,
  execute: DbExecutor,
  options: {
    table?: PtoDateTableKey;
    excludeRowIdsByTable?: Partial<Record<PtoDateTableKey, string[]>>;
  } = {},
) {
  const clauses: string[] = [];
  const values: unknown[] = [];
  const carryoverJsonPath = `$."${year}"`;

  clauses.push(`(
    JSON_CONTAINS(COALESCE(years, JSON_ARRAY()), JSON_QUOTE(?))
    OR JSON_CONTAINS(COALESCE(carryover_manual_years, JSON_ARRAY()), JSON_QUOTE(?))
    OR JSON_EXTRACT(COALESCE(carryovers, JSON_OBJECT()), ?) IS NOT NULL
  )`);
  values.push(year, year, carryoverJsonPath);

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

async function selectPtoRowsWithYearMetadataByRecords(
  records: PtoPersistenceRowRecord[],
  execute: DbExecutor,
) {
  if (!records.length) return [];

  const rows: PtoRowYearMetadataRecord[] = [];
  for (const batch of chunkValues(records)) {
    const placeholders = batch.map(() => "(?, ?)").join(", ");
    const values = batch.flatMap((record) => [record.table_type, record.row_id]);
    rows.push(...await (execute.rows?.<PtoRowYearMetadataRecord>(
      `SELECT table_type, row_id, carryovers, carryover_manual_years, years
      FROM pto_rows
      WHERE (table_type, row_id) IN (${placeholders})`,
      values,
    ) ?? Promise.resolve([])));
  }

  return rows;
}

async function prunePtoYearFromRowMetadataRecords(
  records: PtoRowYearMetadataRecord[],
  year: string,
  execute: DbExecutor,
) {
  for (const record of records) {
    const prunedMetadata = createPrunedPtoRowYearMetadata(record, year);
    if (!prunedMetadata) continue;

    await execute(
      `UPDATE pto_rows
      SET years = ?,
        carryover_manual_years = ?,
        carryovers = ?,
        updated_at = CURRENT_TIMESTAMP(3)
      WHERE table_type = ? AND row_id = ?`,
      [
        stringifyJson(prunedMetadata.years),
        stringifyJson(prunedMetadata.carryoverManualYears),
        stringifyJson(prunedMetadata.carryovers),
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
    await selectPtoRowsWithYearMetadata(year, execute, options),
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

function mergePtoYearList(existingValue: unknown, incomingValue: unknown, year: string) {
  const incomingValues = stringArrayFromStoredJson(incomingValue);
  const values = stringArrayFromStoredJson(existingValue).filter((item) => item !== year);
  if (incomingValues.includes(year)) values.push(year);
  return Array.from(new Set(values)).sort();
}

function mergePtoCarryovers(existingValue: unknown, incomingValue: unknown, year: string) {
  const carryovers = objectFromStoredJson(existingValue);
  const incomingCarryovers = objectFromStoredJson(incomingValue);
  delete carryovers[year];

  if (Object.prototype.hasOwnProperty.call(incomingCarryovers, year)) {
    carryovers[year] = incomingCarryovers[year];
  }

  return carryovers;
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

export async function upsertPtoRowsForYearScope(
  records: PtoPersistenceRowRecord[],
  year: string,
  execute: DbExecutor = dbExecute,
) {
  if (!records.length) return;

  const existingMetadataByKey = new Map(
    (await selectPtoRowsWithYearMetadataByRecords(records, execute))
      .map((record) => [ptoRowRecordKey(record), record] as const),
  );
  const mergedRecords = records.map((record) => {
    const existingMetadata = existingMetadataByKey.get(ptoRowRecordKey(record));
    if (!existingMetadata) return record;

    return {
      ...record,
      years: mergePtoYearList(existingMetadata.years, record.years, year),
      carryover_manual_years: mergePtoYearList(
        existingMetadata.carryover_manual_years,
        record.carryover_manual_years,
        year,
      ),
      carryovers: mergePtoCarryovers(existingMetadata.carryovers, record.carryovers, year),
    };
  });

  await upsertPtoRows(mergedRecords, execute);
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
