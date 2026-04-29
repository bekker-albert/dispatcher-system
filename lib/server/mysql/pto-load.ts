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

export async function loadPtoBucketsFromMysql() {
  const [ptoBucketRows, ptoBucketValues, ptoVersionUpdatedAt] = await Promise.all([
    dbRows<PtoBucketRowRecord>("SELECT * FROM pto_bucket_rows ORDER BY sort_index ASC"),
    dbRows<PtoBucketValueRecord>("SELECT * FROM pto_bucket_values"),
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
    dbRows<PtoRowRecord>("SELECT * FROM pto_rows ORDER BY table_type ASC, sort_index ASC"),
    dbRows<PtoDayValueRecord>("SELECT * FROM pto_day_values ORDER BY work_date ASC"),
    dbRows<PtoSettingRecord>("SELECT * FROM pto_settings WHERE setting_key IN (?, ?)", [ptoManualYearsKey, ptoUiStateKey]),
    dbRows<PtoBucketRowRecord>("SELECT * FROM pto_bucket_rows ORDER BY sort_index ASC"),
    dbRows<PtoBucketValueRecord>("SELECT * FROM pto_bucket_values"),
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
  const [ptoRows, ptoDayValues, ptoSettings, ptoBucketRows, ptoBucketValues, ptoVersionUpdatedAt] = await Promise.all([
    dbRows<PtoRowRecord>("SELECT * FROM pto_rows ORDER BY table_type ASC, sort_index ASC"),
    dbRows<PtoDayValueRecord>(
      `SELECT * FROM pto_day_values
      WHERE work_date >= ? AND work_date <= ?
      ORDER BY work_date ASC`,
      [start, end],
    ),
    dbRows<PtoSettingRecord>("SELECT * FROM pto_settings WHERE setting_key IN (?, ?)", [ptoManualYearsKey, ptoUiStateKey]),
    includeBuckets ? dbRows<PtoBucketRowRecord>("SELECT * FROM pto_bucket_rows ORDER BY sort_index ASC") : Promise.resolve([]),
    includeBuckets ? dbRows<PtoBucketValueRecord>("SELECT * FROM pto_bucket_values") : Promise.resolve([]),
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
