import type { RowDataPacket } from "mysql2/promise";
import type { PtoDateTableKey } from "../../domain/pto/date-table";
import { ptoYearDateRange, type PtoPersistenceRowRecord } from "../../domain/pto/persistence-shared";
import { objectFromStoredJson, chunkValues, stringArrayFromStoredJson } from "./pto-write-utils";
import type { DbExecutor } from "./pool";

type PtoRowYearMembershipKey = Pick<PtoPersistenceRowRecord, "table_type" | "row_id">;

type PtoRowYearMetadataRecord = RowDataPacket & {
  table_type: PtoDateTableKey;
  row_id: string;
  carryovers: unknown;
  carryover_manual_years: unknown;
  years: unknown;
};

type PtoRowYearMembershipRecord = {
  table_type: PtoDateTableKey;
  row_id: string;
  year_value: string;
};

function uniquePtoRowYearMembershipKeys(keys: PtoRowYearMembershipKey[]) {
  const seen = new Set<string>();
  const uniqueKeys: PtoRowYearMembershipKey[] = [];

  for (const key of keys) {
    const recordKey = `${key.table_type}:${key.row_id}`;
    if (seen.has(recordKey)) continue;

    seen.add(recordKey);
    uniqueKeys.push(key);
  }

  return uniqueKeys;
}

function rowKeyWhereClause(keys: PtoRowYearMembershipKey[], values: unknown[]) {
  const placeholders = keys.map(() => "(?, ?)").join(", ");
  values.push(...keys.flatMap((key) => [key.table_type, key.row_id]));
  return `(table_type, row_id) IN (${placeholders})`;
}

function metadataYears(record: PtoRowYearMetadataRecord) {
  const years = new Set<string>();

  stringArrayFromStoredJson(record.years).forEach((year) => years.add(year));
  stringArrayFromStoredJson(record.carryover_manual_years).forEach((year) => years.add(year));
  Object.keys(objectFromStoredJson(record.carryovers)).forEach((year) => years.add(year));

  return Array.from(years).filter(Boolean).sort();
}

async function insertPtoRowYearMembershipRecords(
  records: PtoRowYearMembershipRecord[],
  execute: DbExecutor,
) {
  if (!records.length) return;

  const uniqueRecords = Array.from(
    new Map(records.map((record) => [`${record.table_type}:${record.row_id}:${record.year_value}`, record])).values(),
  );

  for (const batch of chunkValues(uniqueRecords)) {
    const placeholders = batch.map(() => "(?, ?, ?)").join(", ");
    await execute(
      `INSERT IGNORE INTO pto_row_years (table_type, row_id, year_value)
      VALUES ${placeholders}`,
      batch.flatMap((record) => [record.table_type, record.row_id, record.year_value]),
    );
  }
}

async function insertPtoRowYearMembershipFromDayValues(
  execute: DbExecutor,
  keys: PtoRowYearMembershipKey[] | null = null,
) {
  const values: unknown[] = [];
  const where = keys?.length ? `WHERE ${rowKeyWhereClause(keys, values)}` : "";

  await execute(
    `INSERT IGNORE INTO pto_row_years (table_type, row_id, year_value)
    SELECT DISTINCT table_type, row_id, CAST(YEAR(work_date) AS CHAR)
    FROM pto_day_values
    ${where}`,
    values,
  );
}

async function insertPtoRowYearMembershipFromDayValuesForYear(year: string, execute: DbExecutor) {
  const { start, end } = ptoYearDateRange(year);
  await execute(
    `INSERT IGNORE INTO pto_row_years (table_type, row_id, year_value)
    SELECT table_type, row_id, ?
    FROM pto_day_values
    WHERE work_date >= ? AND work_date <= ?
    GROUP BY table_type, row_id`,
    [year, start, end],
  );
}

async function insertPtoRowYearMembershipFromMetadataForYear(year: string, execute: DbExecutor) {
  const carryoverJsonPath = `$."${year}"`;
  await execute(
    `INSERT IGNORE INTO pto_row_years (table_type, row_id, year_value)
    SELECT table_type, row_id, ?
    FROM pto_rows
    WHERE JSON_CONTAINS(COALESCE(years, JSON_ARRAY()), JSON_QUOTE(?))
      OR JSON_CONTAINS(COALESCE(carryover_manual_years, JSON_ARRAY()), JSON_QUOTE(?))
      OR JSON_EXTRACT(COALESCE(carryovers, JSON_OBJECT()), ?) IS NOT NULL`,
    [year, year, year, carryoverJsonPath],
  );
}

async function selectPtoRowYearMetadata(
  execute: DbExecutor,
  keys: PtoRowYearMembershipKey[] | null = null,
) {
  if (!execute.rows) {
    throw new Error("PTO row-year membership refresh requires a row-capable database executor.");
  }

  const values: unknown[] = [];
  const where = keys?.length ? `WHERE ${rowKeyWhereClause(keys, values)}` : "";

  return await execute.rows<PtoRowYearMetadataRecord>(
    `SELECT table_type, row_id, carryovers, carryover_manual_years, years
    FROM pto_rows
    ${where}`,
    values,
  );
}

async function insertPtoRowYearMembershipFromMetadata(
  execute: DbExecutor,
  keys: PtoRowYearMembershipKey[] | null = null,
) {
  const metadataRows = await selectPtoRowYearMetadata(execute, keys);
  const records = metadataRows.flatMap((record) => (
    metadataYears(record).map((year) => ({
      table_type: record.table_type,
      row_id: record.row_id,
      year_value: year,
    }))
  ));

  await insertPtoRowYearMembershipRecords(records, execute);
}

export async function rebuildPtoRowYearMembership(execute: DbExecutor) {
  await execute("DELETE FROM pto_row_years");
  await insertPtoRowYearMembershipFromDayValues(execute);
  await insertPtoRowYearMembershipFromMetadata(execute);
}

export async function refreshPtoRowYearMembershipForYear(year: string, execute: DbExecutor) {
  await execute("DELETE FROM pto_row_years WHERE year_value = ?", [year]);
  await insertPtoRowYearMembershipFromDayValuesForYear(year, execute);
  await insertPtoRowYearMembershipFromMetadataForYear(year, execute);
}

export async function refreshPtoRowYearMembershipForRows(
  keys: PtoRowYearMembershipKey[],
  execute: DbExecutor,
) {
  const uniqueKeys = uniquePtoRowYearMembershipKeys(keys);
  if (!uniqueKeys.length) return;

  for (const batch of chunkValues(uniqueKeys)) {
    const deleteValues: unknown[] = [];
    await execute(
      `DELETE FROM pto_row_years
      WHERE ${rowKeyWhereClause(batch, deleteValues)}`,
      deleteValues,
    );

    await insertPtoRowYearMembershipFromDayValues(execute, batch);
    await insertPtoRowYearMembershipFromMetadata(execute, batch);
  }
}
