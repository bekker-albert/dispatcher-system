import {
  ptoManualYearsKey,
  ptoUiStateKey,
  ptoYearDateRange,
} from "../domain/pto/persistence-shared";
import { loadPagedRecords } from "./batch";
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
  type SupabasePtoClient,
} from "./pto-schema";
import type { PtoSettingRecord } from "./pto-records";

export async function loadCurrentSupabaseRows(client: SupabasePtoClient = requireSupabase()) {
  return loadPagedRecords<PtoRowRecord>(async (from, to) => {
    const result = await client
      .from(ptoRowsTable)
      .select("*")
      .range(from, to);
    return { data: (result.data ?? null) as PtoRowRecord[] | null, error: result.error };
  });
}

export async function loadCurrentSupabaseDayValues(
  client: SupabasePtoClient = requireSupabase(),
  options: { yearScope?: string | null } = {},
) {
  const range = options.yearScope ? ptoYearDateRange(options.yearScope) : null;

  return loadPagedRecords<PtoDayValueRecord>(async (from, to) => {
    let query = client
      .from(ptoDayValuesTable)
      .select("*");

    if (range) {
      query = query.gte("work_date", range.start).lte("work_date", range.end);
    }

    const result = await query.range(from, to);
    return { data: (result.data ?? null) as PtoDayValueRecord[] | null, error: result.error };
  });
}

export async function loadCurrentSupabaseBucketRows(client: SupabasePtoClient = requireSupabase()) {
  return loadPagedRecords<PtoBucketRowRecord>(async (from, to) => {
    const result = await client
      .from(ptoBucketRowsTable)
      .select("*")
      .range(from, to);
    return { data: (result.data ?? null) as PtoBucketRowRecord[] | null, error: result.error };
  });
}

export async function loadCurrentSupabaseBucketValues(client: SupabasePtoClient = requireSupabase()) {
  return loadPagedRecords<PtoBucketValueRecord>(async (from, to) => {
    const result = await client
      .from(ptoBucketValuesTable)
      .select("*")
      .range(from, to);
    return { data: (result.data ?? null) as PtoBucketValueRecord[] | null, error: result.error };
  });
}

export async function loadCurrentSupabaseSettings(client: SupabasePtoClient = requireSupabase()) {
  const { data, error } = await client
    .from(ptoSettingsTable)
    .select("*")
    .in("key", [ptoManualYearsKey, ptoUiStateKey]);
  if (error) throw error;
  return (data ?? []) as PtoSettingRecord[];
}
