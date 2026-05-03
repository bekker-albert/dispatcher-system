import {
  asObjectRecord,
  asStringArray,
  ptoManualYearsKey,
  ptoPersistenceRowRecordKey,
  ptoUiStateKey,
  ptoYearDateRange,
} from "../domain/pto/persistence-shared";
import { loadPagedRecords } from "./batch";
import {
  ptoStateFromSupabaseRecords,
  type PtoSettingRecord,
} from "./pto-records";
import {
  ptoBucketRowsTable,
  ptoBucketValuesTable,
  ptoDayValuesTable,
  ptoRowsTable,
  ptoSettingsTable,
  requireSupabase,
  type PtoBucketRowRecord,
  type PtoBucketValueRecord,
  type PtoDayValueRecord,
  type PtoRowRecord,
} from "./pto-storage";
import type { SupabasePtoState } from "./pto-types";

export type PtoLoadScopeOptions = {
  includeBuckets?: boolean;
};

export type PtoBucketsLoadResult = {
  bucketRows: PtoBucketRowRecord[];
  bucketValues: PtoBucketValueRecord[];
  updatedAt?: string | null;
};

function loadSupabasePtoRows(client: ReturnType<typeof requireSupabase>) {
  return loadPagedRecords<PtoRowRecord>(async (from, to) => {
    const result = await client
      .from(ptoRowsTable)
      .select("*")
      .order("table_type", { ascending: true })
      .order("sort_index", { ascending: true })
      .range(from, to);
    return { data: (result.data ?? null) as PtoRowRecord[] | null, error: result.error };
  });
}

function safeSupabaseYearFilter(year: string) {
  const trimmedYear = year.trim();
  return /^[\w-]+$/.test(trimmedYear) ? trimmedYear : "";
}

function parseSupabaseJsonValue(value: unknown) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function supabasePtoRowHasYearMetadata(row: PtoRowRecord, year: string) {
  return asStringArray(parseSupabaseJsonValue(row.years)).includes(year)
    || asStringArray(parseSupabaseJsonValue(row.carryover_manual_years)).includes(year)
    || Object.prototype.hasOwnProperty.call(
      asObjectRecord(parseSupabaseJsonValue(row.carryovers)),
      year,
    );
}

function ptoDayValueRowKeySet(dayValueRecords: PtoDayValueRecord[]) {
  return new Set(dayValueRecords.map(ptoPersistenceRowRecordKey));
}

function uniquePtoRowsForYear(
  rowRecords: PtoRowRecord[],
  year: string,
  dayValueRecords: PtoDayValueRecord[],
) {
  const dayValueRowKeys = ptoDayValueRowKeySet(dayValueRecords);
  const rowsByKey = new Map<string, PtoRowRecord>();

  for (const row of rowRecords) {
    const key = ptoPersistenceRowRecordKey(row);
    if (!dayValueRowKeys.has(key) && !supabasePtoRowHasYearMetadata(row, year)) continue;
    if (!rowsByKey.has(key)) rowsByKey.set(key, row);
  }

  return Array.from(rowsByKey.values()).sort((left, right) => {
    const tableOrder = left.table_type.localeCompare(right.table_type);
    if (tableOrder !== 0) return tableOrder;
    return Number(left.sort_index ?? 0) - Number(right.sort_index ?? 0);
  });
}

function chunkValues<TValue>(values: TValue[], chunkSize = 100) {
  const chunks: TValue[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

async function loadSupabasePtoRowsByDayValueRows(
  client: ReturnType<typeof requireSupabase>,
  dayValueRecords: PtoDayValueRecord[],
) {
  const rowIds = Array.from(new Set(dayValueRecords.map((record) => record.row_id).filter(Boolean)));
  const rowBatches = await Promise.all(
    chunkValues(rowIds).map((rowIdBatch) =>
      loadPagedRecords<PtoRowRecord>(async (from, to) => {
        const result = await client
          .from(ptoRowsTable)
          .select("*")
          .in("row_id", rowIdBatch)
          .order("table_type", { ascending: true })
          .order("sort_index", { ascending: true })
          .range(from, to);
        return { data: (result.data ?? null) as PtoRowRecord[] | null, error: result.error };
      }),
    ),
  );

  return rowBatches.flat();
}

async function loadSupabasePtoRowsByYearMetadata(
  client: ReturnType<typeof requireSupabase>,
  year: string,
) {
  const safeYear = safeSupabaseYearFilter(year);
  if (!safeYear) return loadSupabasePtoRows(client);

  const yearJsonArrayFilter = JSON.stringify([year]);

  try {
    return await loadPagedRecords<PtoRowRecord>(async (from, to) => {
      const result = await client
        .from(ptoRowsTable)
        .select("*")
        .or(`years.cs.${yearJsonArrayFilter},carryover_manual_years.cs.${yearJsonArrayFilter},carryovers->>${safeYear}.not.is.null`)
        .order("table_type", { ascending: true })
        .order("sort_index", { ascending: true })
        .range(from, to);
      return { data: (result.data ?? null) as PtoRowRecord[] | null, error: result.error };
    });
  } catch {
    return loadSupabasePtoRows(client);
  }
}

async function loadSupabasePtoRowsForYear(
  client: ReturnType<typeof requireSupabase>,
  year: string,
  dayValueRecords: PtoDayValueRecord[],
) {
  const [rowsByDayValues, rowsByMetadata] = await Promise.all([
    loadSupabasePtoRowsByDayValueRows(client, dayValueRecords),
    loadSupabasePtoRowsByYearMetadata(client, year),
  ]);

  return uniquePtoRowsForYear([...rowsByDayValues, ...rowsByMetadata], year, dayValueRecords);
}

function loadSupabasePtoDayValues(client: ReturnType<typeof requireSupabase>, year?: string) {
  const range = year ? ptoYearDateRange(year) : null;

  return loadPagedRecords<PtoDayValueRecord>(async (from, to) => {
    let query = client
      .from(ptoDayValuesTable)
      .select("*");

    if (range) {
      query = query
        .gte("work_date", range.start)
        .lte("work_date", range.end);
    }

    const result = await query
      .order("work_date", { ascending: true })
      .range(from, to);
    return { data: (result.data ?? null) as PtoDayValueRecord[] | null, error: result.error };
  });
}

function loadSupabasePtoSettings(client: ReturnType<typeof requireSupabase>) {
  return client
    .from(ptoSettingsTable)
    .select("*")
    .in("key", [ptoManualYearsKey, ptoUiStateKey]);
}

function loadSupabasePtoBucketRows(client: ReturnType<typeof requireSupabase>) {
  return loadPagedRecords<PtoBucketRowRecord>(async (from, to) => {
    const result = await client
      .from(ptoBucketRowsTable)
      .select("*")
      .order("sort_index", { ascending: true })
      .range(from, to);
    return { data: (result.data ?? null) as PtoBucketRowRecord[] | null, error: result.error };
  });
}

function loadSupabasePtoBucketValues(client: ReturnType<typeof requireSupabase>) {
  return loadPagedRecords<PtoBucketValueRecord>(async (from, to) => {
    const result = await client
      .from(ptoBucketValuesTable)
      .select("*")
      .range(from, to);
    return { data: (result.data ?? null) as PtoBucketValueRecord[] | null, error: result.error };
  });
}

export async function loadPtoStateFromSupabase(): Promise<SupabasePtoState | null> {
  const client = requireSupabase();

  const [ptoRows, ptoDayValues, { data: settings, error: settingsError }, ptoBucketRows, ptoBucketValues] = await Promise.all([
    loadSupabasePtoRows(client),
    loadSupabasePtoDayValues(client),
    loadSupabasePtoSettings(client),
    loadSupabasePtoBucketRows(client),
    loadSupabasePtoBucketValues(client),
  ]);

  if (settingsError) throw settingsError;

  return ptoStateFromSupabaseRecords({
    rowRecords: ptoRows,
    dayValueRecords: ptoDayValues,
    settingRecords: (settings ?? []) as PtoSettingRecord[],
    bucketRowRecords: ptoBucketRows,
    bucketValueRecords: ptoBucketValues,
  });
}

export async function loadPtoStateFromSupabaseForYear(
  year: string,
  options: PtoLoadScopeOptions = {},
): Promise<SupabasePtoState | null> {
  const client = requireSupabase();
  const includeBuckets = options.includeBuckets === true;
  const [ptoDayValues, { data: settings, error: settingsError }, ptoBucketRows, ptoBucketValues] = await Promise.all([
    loadSupabasePtoDayValues(client, year),
    loadSupabasePtoSettings(client),
    includeBuckets ? loadSupabasePtoBucketRows(client) : Promise.resolve([]),
    includeBuckets ? loadSupabasePtoBucketValues(client) : Promise.resolve([]),
  ]);
  const ptoRows = await loadSupabasePtoRowsForYear(client, year, ptoDayValues);

  if (settingsError) throw settingsError;

  return ptoStateFromSupabaseRecords({
    rowRecords: ptoRows,
    dayValueRecords: ptoDayValues,
    settingRecords: (settings ?? []) as PtoSettingRecord[],
    bucketRowRecords: ptoBucketRows,
    bucketValueRecords: ptoBucketValues,
  });
}

export async function loadPtoUpdatedAtFromSupabase(): Promise<string | null | undefined> {
  return undefined;
}

export async function loadPtoBucketsFromSupabase(): Promise<PtoBucketsLoadResult> {
  const client = requireSupabase();
  const [bucketRows, bucketValues] = await Promise.all([
    loadSupabasePtoBucketRows(client),
    loadSupabasePtoBucketValues(client),
  ]);

  return { bucketRows, bucketValues };
}
