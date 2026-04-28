import {
  ptoManualYearsKey,
  ptoUiStateKey,
  ptoYearDateRange,
} from "../domain/pto/persistence-shared";
import { loadPagedRecords } from "./batch";
import {
  ptoStateFromSupabaseRecords,
  type PtoSettingRecord,
} from "./pto-records";
import {
  ptoDatabaseRequest,
  shouldRoutePtoThroughServerDatabase,
} from "./pto-routing";
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
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<SupabasePtoState | null>("load");
  }

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
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<SupabasePtoState | null>("load-year", {
      year,
      includeBuckets: options.includeBuckets === true,
    });
  }

  const client = requireSupabase();
  const includeBuckets = options.includeBuckets === true;
  const [ptoRows, ptoDayValues, { data: settings, error: settingsError }, ptoBucketRows, ptoBucketValues] = await Promise.all([
    loadSupabasePtoRows(client),
    loadSupabasePtoDayValues(client, year),
    loadSupabasePtoSettings(client),
    includeBuckets ? loadSupabasePtoBucketRows(client) : Promise.resolve([]),
    includeBuckets ? loadSupabasePtoBucketValues(client) : Promise.resolve([]),
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

export async function loadPtoUpdatedAtFromSupabase(): Promise<string | null | undefined> {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<string | null>("load-updated-at");
  }

  return undefined;
}

export async function loadPtoBucketsFromSupabase(): Promise<PtoBucketsLoadResult> {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoBucketsLoadResult>("load-buckets");
  }

  const client = requireSupabase();
  const [bucketRows, bucketValues] = await Promise.all([
    loadSupabasePtoBucketRows(client),
    loadSupabasePtoBucketValues(client),
  ]);

  return { bucketRows, bucketValues };
}
