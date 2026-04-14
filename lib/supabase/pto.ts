import { supabase, supabaseConfigured } from "./client";

export type SupabasePtoTable = "plan" | "oper" | "survey";

export type SupabasePtoRow = {
  id: string;
  area: string;
  location: string;
  structure: string;
  unit: string;
  coefficient: number;
  status: string;
  carryover: number;
  carryovers?: Record<string, number>;
  carryoverManualYears?: string[];
  dailyPlans: Record<string, number>;
  years?: string[];
};

export type SupabasePtoState = {
  manualYears: string[];
  planRows: SupabasePtoRow[];
  operRows: SupabasePtoRow[];
  surveyRows: SupabasePtoRow[];
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
};

const ptoRowsTable = "pto_date_rows";
const ptoSettingsTable = "pto_settings";
const ptoManualYearsKey = "pto_manual_years";

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
      .eq("key", ptoManualYearsKey)
      .maybeSingle(),
  ]);

  if (rowsError) throw rowsError;
  if (settingsError) throw settingsError;
  if (!rows?.length) return null;

  const manualYears = Array.isArray((settings as PtoSettingRecord | null)?.value)
    ? ((settings as PtoSettingRecord).value as unknown[]).filter((year): year is string => typeof year === "string")
    : [];

  return {
    manualYears,
    planRows: rowsByTable(rows as PtoDateRowRecord[], "plan"),
    operRows: rowsByTable(rows as PtoDateRowRecord[], "oper"),
    surveyRows: rowsByTable(rows as PtoDateRowRecord[], "survey"),
  };
}

export async function savePtoStateToSupabase(state: SupabasePtoState) {
  const client = requireSupabase();
  const records = [
    ...tableRowsToRecords("plan", state.planRows),
    ...tableRowsToRecords("oper", state.operRows),
    ...tableRowsToRecords("survey", state.surveyRows),
  ];

  const { error: deleteError } = await client.from(ptoRowsTable).delete().neq("row_id", "__never__");
  if (deleteError) throw deleteError;

  if (records.length) {
    const { error: insertError } = await client.from(ptoRowsTable).insert(records);
    if (insertError) throw insertError;
  }

  const { error: settingsError } = await client
    .from(ptoSettingsTable)
    .upsert({
      key: ptoManualYearsKey,
      value: state.manualYears,
      updated_at: new Date().toISOString(),
    });

  if (settingsError) throw settingsError;
}
