import {
  ptoManualYearsKey,
  ptoStateFromPersistenceRecords,
  ptoUiStateKey,
  ptoYearDateRange,
  type PtoPersistenceState,
} from "../../domain/pto/persistence-shared";
import { parseJson, toDateKey, toIsoLike } from "./json";
import { dbRows } from "./pool";
import type { RowDataPacket } from "mysql2/promise";
import type {
  PtoBucketRowRecord,
  PtoBucketValueRecord,
  PtoDayValueRecord,
  PtoRowRecord,
  PtoSettingRecord,
} from "./pto-records";
import { loadPtoVersionUpdatedAt } from "./pto-version";

type UpdatedAtRow = RowDataPacket & {
  updated_at?: string | Date | null;
};

type PtoMysqlLoadOptions = {
  includeBuckets?: boolean;
};

const ptoRowSelectColumns = [
  "table_type",
  "row_id",
  "area",
  "location",
  "structure",
  "customer_code",
  "unit",
  "status",
  "carryover",
  "carryovers",
  "carryover_manual_years",
  "years",
  "sort_index",
  "updated_at",
].join(", ");

const ptoDayValueSelectColumns = [
  "table_type",
  "row_id",
  "work_date",
  "value",
  "updated_at",
].join(", ");

const ptoBucketRowSelectColumns = [
  "row_key",
  "area",
  "structure",
  "source",
  "sort_index",
  "updated_at",
].join(", ");

const ptoBucketValueSelectColumns = [
  "row_key",
  "equipment_key",
  "value",
  "updated_at",
].join(", ");

const ptoSettingSelectColumns = [
  "setting_key",
  "value",
  "updated_at",
].join(", ");

export async function loadPtoBucketsFromMysql() {
  const [ptoBucketRows, ptoBucketValues, ptoVersionUpdatedAt] = await Promise.all([
    dbRows<PtoBucketRowRecord>(`SELECT ${ptoBucketRowSelectColumns} FROM pto_bucket_rows ORDER BY sort_index ASC`),
    dbRows<PtoBucketValueRecord>(`SELECT ${ptoBucketValueSelectColumns} FROM pto_bucket_values`),
    loadPtoVersionUpdatedAt(),
  ]);

  return {
    bucketRows: ptoBucketRows,
    bucketValues: ptoBucketValues,
    updatedAt: ptoVersionUpdatedAt ?? await loadPtoUpdatedAtFromMysql(),
  };
}

export async function loadPtoStateFromMysql(): Promise<PtoPersistenceState | null> {
  const [ptoRows, ptoDayValues, ptoSettings, ptoBucketRows, ptoBucketValues, ptoVersionUpdatedAt] = await Promise.all([
    dbRows<PtoRowRecord>(`SELECT ${ptoRowSelectColumns} FROM pto_rows ORDER BY table_type ASC, sort_index ASC`),
    dbRows<PtoDayValueRecord>(`SELECT ${ptoDayValueSelectColumns} FROM pto_day_values ORDER BY work_date ASC`),
    dbRows<PtoSettingRecord>(`SELECT ${ptoSettingSelectColumns} FROM pto_settings WHERE setting_key IN (?, ?)`, [ptoManualYearsKey, ptoUiStateKey]),
    dbRows<PtoBucketRowRecord>(`SELECT ${ptoBucketRowSelectColumns} FROM pto_bucket_rows ORDER BY sort_index ASC`),
    dbRows<PtoBucketValueRecord>(`SELECT ${ptoBucketValueSelectColumns} FROM pto_bucket_values`),
    loadPtoVersionUpdatedAt(),
  ]);
  const ptoUpdatedAt = ptoVersionUpdatedAt ?? await loadPtoUpdatedAtFromMysql();

  return ptoStateFromMysqlRecords({
    ptoRows,
    ptoDayValues,
    ptoSettings,
    ptoBucketRows,
    ptoBucketValues,
    ptoVersionUpdatedAt: ptoUpdatedAt,
  });
}

export async function loadPtoStateFromMysqlForYear(
  year: string,
  options: PtoMysqlLoadOptions = {},
): Promise<PtoPersistenceState | null> {
  const { start, end } = ptoYearDateRange(year);
  const includeBuckets = options.includeBuckets === true;
  const carryoverJsonPath = `$."${year}"`;
  const [ptoRows, ptoDayValues, ptoSettings, ptoBucketRows, ptoBucketValues, ptoVersionUpdatedAt] = await Promise.all([
    dbRows<PtoRowRecord>(
      `WITH values_for_year AS (
        SELECT DISTINCT table_type, row_id
        FROM pto_day_values
        WHERE work_date >= ? AND work_date <= ?
      )
      SELECT ${ptoRowSelectColumns.split(", ").map((column) => `rows_for_year.${column}`).join(", ")}
      FROM pto_rows AS rows_for_year
      LEFT JOIN values_for_year
        ON values_for_year.table_type = rows_for_year.table_type
        AND values_for_year.row_id = rows_for_year.row_id
      WHERE values_for_year.row_id IS NOT NULL
        OR JSON_CONTAINS(COALESCE(rows_for_year.years, JSON_ARRAY()), JSON_QUOTE(?))
        OR JSON_CONTAINS(COALESCE(rows_for_year.carryover_manual_years, JSON_ARRAY()), JSON_QUOTE(?))
        OR JSON_EXTRACT(COALESCE(rows_for_year.carryovers, JSON_OBJECT()), ?) IS NOT NULL
      ORDER BY rows_for_year.table_type ASC, rows_for_year.sort_index ASC`,
      [start, end, year, year, carryoverJsonPath],
    ),
    dbRows<PtoDayValueRecord>(
      `SELECT ${ptoDayValueSelectColumns} FROM pto_day_values
      WHERE work_date >= ? AND work_date <= ?
      ORDER BY work_date ASC`,
      [start, end],
    ),
    dbRows<PtoSettingRecord>(`SELECT ${ptoSettingSelectColumns} FROM pto_settings WHERE setting_key IN (?, ?)`, [ptoManualYearsKey, ptoUiStateKey]),
    includeBuckets ? dbRows<PtoBucketRowRecord>(`SELECT ${ptoBucketRowSelectColumns} FROM pto_bucket_rows ORDER BY sort_index ASC`) : Promise.resolve([]),
    includeBuckets ? dbRows<PtoBucketValueRecord>(`SELECT ${ptoBucketValueSelectColumns} FROM pto_bucket_values`) : Promise.resolve([]),
    loadPtoVersionUpdatedAt(),
  ]);
  const ptoUpdatedAt = ptoVersionUpdatedAt ?? await loadPtoUpdatedAtFromMysql();

  return ptoStateFromMysqlRecords({
    ptoRows,
    ptoDayValues,
    ptoSettings,
    ptoBucketRows,
    ptoBucketValues,
    ptoVersionUpdatedAt: ptoUpdatedAt,
  });
}

export async function loadPtoUpdatedAtFromMysql() {
  const versionUpdatedAt = await loadPtoVersionUpdatedAt();
  if (versionUpdatedAt) return versionUpdatedAt;

  const rows = await dbRows<UpdatedAtRow>(`
    SELECT MAX(updated_at) AS updated_at
    FROM (
      SELECT MAX(updated_at) AS updated_at FROM pto_rows
      UNION ALL
      SELECT MAX(updated_at) AS updated_at FROM pto_day_values
      UNION ALL
      SELECT MAX(updated_at) AS updated_at FROM pto_settings
      UNION ALL
      SELECT MAX(updated_at) AS updated_at FROM pto_bucket_rows
      UNION ALL
      SELECT MAX(updated_at) AS updated_at FROM pto_bucket_values
    ) AS pto_updated_groups
  `);

  return rows
    .map((record) => toIsoLike(record.updated_at))
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
}

export function ptoStateFromMysqlRecords({
  ptoRows,
  ptoDayValues,
  ptoSettings,
  ptoBucketRows,
  ptoBucketValues,
  ptoVersionUpdatedAt,
}: {
  ptoRows: PtoRowRecord[];
  ptoDayValues: PtoDayValueRecord[];
  ptoSettings: PtoSettingRecord[];
  ptoBucketRows: PtoBucketRowRecord[];
  ptoBucketValues: PtoBucketValueRecord[];
  ptoVersionUpdatedAt?: string | null;
}) {
  const state = ptoStateFromPersistenceRecords({
    rowRecords: ptoRows,
    dayValueRecords: ptoDayValues,
    settingRecords: ptoSettings,
    bucketRowRecords: ptoBucketRows,
    bucketValueRecords: ptoBucketValues,
    getSettingKey: (setting) => setting.setting_key,
    getSettingValue: (setting) => parseJson(setting.value, null),
    normalizeUpdatedAt: toIsoLike,
    normalizeDate: toDateKey,
    parseStoredValue: (value) => parseJson(value, value),
  });

  return state && ptoVersionUpdatedAt
    ? { ...state, updatedAt: ptoVersionUpdatedAt }
    : state;
}
