import type { PtoDateTableKey, PtoPlanRow } from "../domain/pto/date-table";
import { supabase, supabaseConfigured } from "./client";

export type SupabasePtoTable = PtoDateTableKey;

export type SupabasePtoRow = PtoPlanRow;

export type SupabasePtoState = {
  updatedAt?: string;
  manualYears: string[];
  planRows: SupabasePtoRow[];
  operRows: SupabasePtoRow[];
  surveyRows: SupabasePtoRow[];
  bucketValues?: Record<string, number>;
  bucketRows?: Array<{
    key: string;
    area: string;
    structure: string;
  }>;
  uiState?: {
    reportDate?: string;
    topTab?: string;
    ptoTab?: string;
    ptoPlanYear?: string;
    ptoAreaFilter?: string;
    expandedPtoMonths?: Record<string, boolean>;
    reportColumnWidths?: Record<string, number>;
    reportReasons?: Record<string, string>;
    ptoColumnWidths?: Record<string, number>;
    ptoRowHeights?: Record<string, number>;
    ptoHeaderLabels?: Record<string, string>;
  };
};

type PtoDateRowRecord = {
  table_type: SupabasePtoTable;
  row_id: string;
  area: string;
  location: string;
  structure: string;
  unit: string;
  coefficient: number;
  status: string;
  carryover: number;
  carryovers: Record<string, number>;
  carryover_manual_years: string[];
  daily_plans: Record<string, number>;
  years: string[];
  sort_index: number;
};

type PtoSettingRecord = {
  key: string;
  value: unknown;
  updated_at?: string | null;
};

const ptoRowsTable = "pto_date_rows";
const ptoSettingsTable = "pto_settings";
const ptoManualYearsKey = "pto_manual_years";
const ptoUiStateKey = "pto_ui_state";
const ptoBucketValuesKey = "pto_bucket_values";
const ptoBucketRowsKey = "pto_bucket_rows";
const ptoTables: SupabasePtoTable[] = ["plan", "oper", "survey"];

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  return supabase;
}

function tableRowsToRecords(table: SupabasePtoTable, rows: SupabasePtoRow[]): PtoDateRowRecord[] {
  return rows.map((row, index) => ({
    table_type: table,
    row_id: row.id,
    area: row.area,
    location: row.location,
    structure: row.structure,
    unit: row.unit,
    coefficient: Number(row.coefficient ?? 0),
    status: row.status,
    carryover: Number(row.carryover ?? 0),
    carryovers: row.carryovers ?? {},
    carryover_manual_years: row.carryoverManualYears ?? [],
    daily_plans: row.dailyPlans ?? {},
    years: row.years ?? [],
    sort_index: index,
  }));
}

function recordToRow(record: PtoDateRowRecord): SupabasePtoRow {
  return {
    id: record.row_id,
    area: record.area ?? "",
    location: record.location ?? "",
    structure: record.structure ?? "",
    unit: record.unit ?? "",
    coefficient: Number(record.coefficient ?? 0),
    status: record.status ?? "",
    carryover: Number(record.carryover ?? 0),
    carryovers: record.carryovers ?? {},
    carryoverManualYears: record.carryover_manual_years ?? [],
    dailyPlans: record.daily_plans ?? {},
    years: record.years ?? [],
  };
}

function rowsByTable(records: PtoDateRowRecord[], table: SupabasePtoTable) {
  return records
    .filter((record) => record.table_type === table)
    .sort((left, right) => left.sort_index - right.sort_index)
    .map(recordToRow);
}

function currentRowIdsByTable(records: PtoDateRowRecord[]) {
  return ptoTables.reduce<Record<SupabasePtoTable, Set<string>>>((idsByTable, table) => {
    idsByTable[table] = new Set(
      records
        .filter((record) => record.table_type === table)
        .map((record) => record.row_id),
    );
    return idsByTable;
  }, {
    plan: new Set<string>(),
    oper: new Set<string>(),
    survey: new Set<string>(),
  });
}

export async function loadPtoStateFromSupabase(): Promise<SupabasePtoState | null> {
  const client = requireSupabase();

  const [{ data: rows, error: rowsError }, { data: settings, error: settingsError }] = await Promise.all([
    client
      .from(ptoRowsTable)
      .select("*")
      .order("table_type", { ascending: true })
      .order("sort_index", { ascending: true }),
    client
      .from(ptoSettingsTable)
      .select("*")
      .in("key", [ptoManualYearsKey, ptoUiStateKey, ptoBucketValuesKey, ptoBucketRowsKey]),
  ]);

  if (rowsError) throw rowsError;
  if (settingsError) throw settingsError;
  if (!rows?.length && !settings?.length) return null;

  const settingsByKey = new Map((settings as PtoSettingRecord[] | null ?? []).map((setting) => [setting.key, setting.value]));
  const updatedAt = (settings as PtoSettingRecord[] | null ?? [])
    .map((setting) => setting.updated_at)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .sort()
    .at(-1);
  const manualYearsValue = settingsByKey.get(ptoManualYearsKey);
  const uiStateValue = settingsByKey.get(ptoUiStateKey);
  const bucketValuesValue = settingsByKey.get(ptoBucketValuesKey);
  const bucketRowsValue = settingsByKey.get(ptoBucketRowsKey);
  const manualYears = Array.isArray(manualYearsValue)
    ? manualYearsValue.filter((year): year is string => typeof year === "string")
    : [];

  return {
    updatedAt,
    manualYears,
    planRows: rowsByTable(rows as PtoDateRowRecord[], "plan"),
    operRows: rowsByTable(rows as PtoDateRowRecord[], "oper"),
    surveyRows: rowsByTable(rows as PtoDateRowRecord[], "survey"),
    bucketValues: typeof bucketValuesValue === "object" && bucketValuesValue !== null ? bucketValuesValue as Record<string, number> : {},
    bucketRows: Array.isArray(bucketRowsValue) ? bucketRowsValue as SupabasePtoState["bucketRows"] : [],
    uiState: typeof uiStateValue === "object" && uiStateValue !== null ? uiStateValue as SupabasePtoState["uiState"] : undefined,
  };
}

export async function savePtoStateToSupabase(state: SupabasePtoState) {
  const client = requireSupabase();
  const records = [
    ...tableRowsToRecords("plan", state.planRows),
    ...tableRowsToRecords("oper", state.operRows),
    ...tableRowsToRecords("survey", state.surveyRows),
  ];
  const rowIdsByTable = currentRowIdsByTable(records);

  const { data: existingRows, error: existingRowsError } = await client
    .from(ptoRowsTable)
    .select("table_type,row_id");
  if (existingRowsError) throw existingRowsError;

  if (records.length) {
    const { error: upsertError } = await client
      .from(ptoRowsTable)
      .upsert(records, { onConflict: "table_type,row_id" });
    if (upsertError) throw upsertError;
  }

  const staleRows = (existingRows as Pick<PtoDateRowRecord, "table_type" | "row_id">[] | null ?? [])
    .filter((row) => !rowIdsByTable[row.table_type]?.has(row.row_id));

  for (const staleRow of staleRows) {
    const { error: deleteError } = await client
      .from(ptoRowsTable)
      .delete()
      .eq("table_type", staleRow.table_type)
      .eq("row_id", staleRow.row_id);
    if (deleteError) throw deleteError;
  }

  const updatedAt = new Date().toISOString();
  const { error: settingsError } = await client
    .from(ptoSettingsTable)
    .upsert([
      {
        key: ptoManualYearsKey,
        value: state.manualYears,
        updated_at: updatedAt,
      },
      {
        key: ptoUiStateKey,
        value: state.uiState ?? {},
        updated_at: updatedAt,
      },
      {
        key: ptoBucketValuesKey,
        value: state.bucketValues ?? {},
        updated_at: updatedAt,
      },
      {
        key: ptoBucketRowsKey,
        value: state.bucketRows ?? [],
        updated_at: updatedAt,
      },
    ]);

  if (settingsError) throw settingsError;
}
