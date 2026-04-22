import type { PtoBucketRow } from "../domain/pto/buckets";
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
  bucketRows?: PtoBucketRow[];
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

type PtoRowRecord = {
  table_type: SupabasePtoTable;
  row_id: string;
  area: string | null;
  location: string | null;
  structure: string | null;
  unit: string | null;
  coefficient: number | string | null;
  status: string | null;
  carryover: number | string | null;
  carryovers: unknown;
  carryover_manual_years: unknown;
  years: unknown;
  sort_index: number | null;
  updated_at?: string | null;
};

type PtoDayValueRecord = {
  table_type: SupabasePtoTable;
  row_id: string;
  work_date: string;
  value: number | string | null;
  updated_at?: string | null;
};

type PtoBucketRowRecord = {
  row_key: string;
  area: string | null;
  structure: string | null;
  source: string | null;
  sort_index: number | null;
  updated_at?: string | null;
};

type PtoBucketValueRecord = {
  row_key: string;
  equipment_key: string;
  value: number | string | null;
  updated_at?: string | null;
};

type PtoSettingRecord = {
  key: string;
  value: unknown;
  updated_at?: string | null;
};

type PtoDayValuePatch = {
  rowId: string;
  day: string;
  value: number | null;
};

const ptoRowsTable = "pto_rows";
const ptoDayValuesTable = "pto_day_values";
const ptoSettingsTable = "pto_settings";
const ptoBucketRowsTable = "pto_bucket_rows";
const ptoBucketValuesTable = "pto_bucket_values";
const ptoManualYearsKey = "pto_manual_years";
const ptoUiStateKey = "pto_ui_state";
const ptoTables: SupabasePtoTable[] = ["plan", "oper", "survey"];
const batchSize = 500;

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  return supabase;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, Number(item)] as const)
      .filter(([, item]) => Number.isFinite(item)),
  );
}

function asObjectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asFiniteNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function rowKey(table: SupabasePtoTable, rowId: string) {
  return `${table}:${rowId}`;
}

function ptoRowsToRecords(table: SupabasePtoTable, rows: SupabasePtoRow[]): PtoRowRecord[] {
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
    years: row.years ?? [],
    sort_index: index,
  }));
}

function ptoRowsToDayRecords(table: SupabasePtoTable, rows: SupabasePtoRow[]): PtoDayValueRecord[] {
  return rows.flatMap((row) =>
    Object.entries(row.dailyPlans ?? {})
      .filter(([day, value]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Number(value)))
      .map(([day, value]) => ({
        table_type: table,
        row_id: row.id,
        work_date: day,
        value: Number(value),
      })),
  );
}

function recordToRow(record: PtoRowRecord, dailyPlans: Record<string, number>): SupabasePtoRow {
  return {
    id: record.row_id,
    area: record.area ?? "",
    location: record.location ?? "",
    structure: record.structure ?? "",
    unit: record.unit ?? "",
    coefficient: asFiniteNumber(record.coefficient),
    status: record.status ?? "",
    carryover: asFiniteNumber(record.carryover),
    carryovers: asNumberRecord(record.carryovers),
    carryoverManualYears: asStringArray(record.carryover_manual_years),
    dailyPlans,
    years: asStringArray(record.years),
  };
}

function rowsByTable(records: PtoRowRecord[], dayValues: PtoDayValueRecord[], table: SupabasePtoTable) {
  const dailyPlansByRow = dayValues.reduce<Map<string, Record<string, number>>>((map, dayValue) => {
    if (dayValue.table_type !== table) return map;

    const numberValue = Number(dayValue.value);
    if (!Number.isFinite(numberValue)) return map;

    const key = rowKey(dayValue.table_type, dayValue.row_id);
    const dailyPlans = map.get(key) ?? {};
    dailyPlans[dayValue.work_date] = numberValue;
    map.set(key, dailyPlans);
    return map;
  }, new Map<string, Record<string, number>>());

  return records
    .filter((record) => record.table_type === table)
    .sort((left, right) => asFiniteNumber(left.sort_index) - asFiniteNumber(right.sort_index))
    .map((record) => recordToRow(record, dailyPlansByRow.get(rowKey(table, record.row_id)) ?? {}));
}

function bucketCellKey(rowKeyValue: string, equipmentKey: string) {
  return `${rowKeyValue}::${equipmentKey}`;
}

function splitBucketCellKey(cellKey: string) {
  const [rowKeyValue, equipmentKey] = cellKey.split("::");
  if (!rowKeyValue || !equipmentKey) return null;
  return { rowKey: rowKeyValue, equipmentKey };
}

function bucketRowsToRecords(rows: PtoBucketRow[] = []): PtoBucketRowRecord[] {
  return rows.map((row, index) => ({
    row_key: row.key,
    area: row.area,
    structure: row.structure,
    source: row.source ?? "manual",
    sort_index: index,
  }));
}

function bucketValuesToRecords(values: Record<string, number> = {}): PtoBucketValueRecord[] {
  return Object.entries(values).flatMap(([cellKey, value]) => {
    const parsed = splitBucketCellKey(cellKey);
    if (!parsed || !Number.isFinite(Number(value))) return [];

    return [{
      row_key: parsed.rowKey,
      equipment_key: parsed.equipmentKey,
      value: Number(value),
    }];
  });
}

function latestUpdatedAt(...groups: Array<Array<{ updated_at?: string | null }>>) {
  return groups
    .flatMap((group) => group.map((item) => item.updated_at))
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .sort()
    .at(-1);
}

async function upsertPtoRows(records: PtoRowRecord[]) {
  if (!records.length) return;
  const client = requireSupabase();

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const { error } = await client
      .from(ptoRowsTable)
      .upsert(batch, { onConflict: "table_type,row_id" });
    if (error) throw error;
  }
}

async function upsertPtoDayValues(records: PtoDayValueRecord[]) {
  if (!records.length) return;
  const client = requireSupabase();

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const { error } = await client
      .from(ptoDayValuesTable)
      .upsert(batch, { onConflict: "table_type,row_id,work_date" });
    if (error) throw error;
  }
}

async function upsertPtoBucketRows(records: PtoBucketRowRecord[]) {
  if (!records.length) return;
  const client = requireSupabase();

  const { error } = await client
    .from(ptoBucketRowsTable)
    .upsert(records, { onConflict: "row_key" });
  if (error) throw error;
}

async function upsertPtoBucketValues(records: PtoBucketValueRecord[]) {
  if (!records.length) return;
  const client = requireSupabase();

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const { error } = await client
      .from(ptoBucketValuesTable)
      .upsert(batch, { onConflict: "row_key,equipment_key" });
    if (error) throw error;
  }
}

export async function loadPtoStateFromSupabase(): Promise<SupabasePtoState | null> {
  const client = requireSupabase();

  const [
    { data: rows, error: rowsError },
    { data: dayValues, error: dayValuesError },
    { data: settings, error: settingsError },
    { data: bucketRows, error: bucketRowsError },
    { data: bucketValues, error: bucketValuesError },
  ] = await Promise.all([
    client
      .from(ptoRowsTable)
      .select("*")
      .order("table_type", { ascending: true })
      .order("sort_index", { ascending: true }),
    client
      .from(ptoDayValuesTable)
      .select("*")
      .order("work_date", { ascending: true }),
    client
      .from(ptoSettingsTable)
      .select("*")
      .in("key", [ptoManualYearsKey, ptoUiStateKey]),
    client
      .from(ptoBucketRowsTable)
      .select("*")
      .order("sort_index", { ascending: true }),
    client
      .from(ptoBucketValuesTable)
      .select("*"),
  ]);

  if (rowsError) throw rowsError;
  if (dayValuesError) throw dayValuesError;
  if (settingsError) throw settingsError;
  if (bucketRowsError) throw bucketRowsError;
  if (bucketValuesError) throw bucketValuesError;

  const ptoRows = (rows ?? []) as PtoRowRecord[];
  const ptoDayValues = (dayValues ?? []) as PtoDayValueRecord[];
  const ptoSettings = (settings ?? []) as PtoSettingRecord[];
  const ptoBucketRows = (bucketRows ?? []) as PtoBucketRowRecord[];
  const ptoBucketValues = (bucketValues ?? []) as PtoBucketValueRecord[];

  if (
    ptoRows.length === 0
    && ptoDayValues.length === 0
    && ptoSettings.length === 0
    && ptoBucketRows.length === 0
    && ptoBucketValues.length === 0
  ) {
    return null;
  }

  const settingsByKey = new Map(ptoSettings.map((setting) => [setting.key, setting.value]));
  const manualYears = asStringArray(settingsByKey.get(ptoManualYearsKey));
  const uiStateValue = settingsByKey.get(ptoUiStateKey);

  return {
    updatedAt: latestUpdatedAt(ptoRows, ptoDayValues, ptoSettings, ptoBucketRows, ptoBucketValues),
    manualYears,
    planRows: rowsByTable(ptoRows, ptoDayValues, "plan"),
    operRows: rowsByTable(ptoRows, ptoDayValues, "oper"),
    surveyRows: rowsByTable(ptoRows, ptoDayValues, "survey"),
    bucketValues: Object.fromEntries(
      ptoBucketValues
        .map((record) => [bucketCellKey(record.row_key, record.equipment_key), asFiniteNumber(record.value)] as const)
        .filter(([, value]) => Number.isFinite(value)),
    ),
    bucketRows: ptoBucketRows.map((record) => ({
      key: record.row_key,
      area: record.area ?? "",
      structure: record.structure ?? "",
      source: record.source === "auto" ? "auto" : "manual",
    })),
    uiState: asObjectRecord(uiStateValue) as SupabasePtoState["uiState"],
  };
}

export async function savePtoStateToSupabase(state: SupabasePtoState) {
  const updatedAt = new Date().toISOString();
  const client = requireSupabase();
  const rowRecords = [
    ...ptoRowsToRecords("plan", state.planRows),
    ...ptoRowsToRecords("oper", state.operRows),
    ...ptoRowsToRecords("survey", state.surveyRows),
  ];
  const dayRecords = [
    ...ptoRowsToDayRecords("plan", state.planRows),
    ...ptoRowsToDayRecords("oper", state.operRows),
    ...ptoRowsToDayRecords("survey", state.surveyRows),
  ];
  const bucketRowRecords = bucketRowsToRecords(state.bucketRows ?? []);
  const bucketValueRecords = bucketValuesToRecords(state.bucketValues ?? {});

  await upsertPtoRows(rowRecords);
  await upsertPtoDayValues(dayRecords);
  await upsertPtoBucketRows(bucketRowRecords);
  await upsertPtoBucketValues(bucketValueRecords);

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
    ], { onConflict: "key" });

  if (settingsError) throw settingsError;
}

export async function savePtoDayValueToSupabase(
  table: SupabasePtoTable,
  rowId: string,
  day: string,
  value: number | null,
) {
  const client = requireSupabase();

  if (value === null) {
    const { error } = await client
      .from(ptoDayValuesTable)
      .delete()
      .eq("table_type", table)
      .eq("row_id", rowId)
      .eq("work_date", day);
    if (error) throw error;
    return;
  }

  await upsertPtoDayValues([{
    table_type: table,
    row_id: rowId,
    work_date: day,
    value,
  }]);
}

export async function savePtoDayValuesToSupabase(table: SupabasePtoTable, values: PtoDayValuePatch[]) {
  const client = requireSupabase();
  const upsertRecords = values
    .filter((item) => item.value !== null)
    .map((item) => ({
      table_type: table,
      row_id: item.rowId,
      work_date: item.day,
      value: item.value as number,
    }));
  const deleteValues = values.filter((item) => item.value === null);

  await upsertPtoDayValues(upsertRecords);

  for (const item of deleteValues) {
    const { error } = await client
      .from(ptoDayValuesTable)
      .delete()
      .eq("table_type", table)
      .eq("row_id", item.rowId)
      .eq("work_date", item.day);
    if (error) throw error;
  }
}

export async function deletePtoRowsFromSupabase(rowIds: string[]) {
  if (rowIds.length === 0) return;
  const client = requireSupabase();

  for (const table of ptoTables) {
    const { error } = await client
      .from(ptoRowsTable)
      .delete()
      .eq("table_type", table)
      .in("row_id", rowIds);
    if (error) throw error;
  }
}

export async function deletePtoYearFromSupabase(year: string) {
  const client = requireSupabase();
  const { error } = await client
    .from(ptoDayValuesTable)
    .delete()
    .gte("work_date", `${year}-01-01`)
    .lte("work_date", `${year}-12-31`);
  if (error) throw error;
}

export async function savePtoBucketRowToSupabase(row: PtoBucketRow, sortIndex = 0) {
  await upsertPtoBucketRows([{
    row_key: row.key,
    area: row.area,
    structure: row.structure,
    source: row.source ?? "manual",
    sort_index: sortIndex,
  }]);
}

export async function deletePtoBucketRowFromSupabase(rowKeyValue: string) {
  const client = requireSupabase();
  const { error } = await client
    .from(ptoBucketRowsTable)
    .delete()
    .eq("row_key", rowKeyValue);
  if (error) throw error;
}

export async function savePtoBucketValueToSupabase(cellKey: string, value: number | null) {
  const parsed = splitBucketCellKey(cellKey);
  if (!parsed) return;

  const client = requireSupabase();

  if (value === null) {
    const { error } = await client
      .from(ptoBucketValuesTable)
      .delete()
      .eq("row_key", parsed.rowKey)
      .eq("equipment_key", parsed.equipmentKey);
    if (error) throw error;
    return;
  }

  await upsertPtoBucketValues([{
    row_key: parsed.rowKey,
    equipment_key: parsed.equipmentKey,
    value,
  }]);
}

export async function deletePtoBucketValuesFromSupabase(cellKeys: string[]) {
  const client = requireSupabase();

  for (const cellKey of cellKeys) {
    const parsed = splitBucketCellKey(cellKey);
    if (!parsed) continue;

    const { error } = await client
      .from(ptoBucketValuesTable)
      .delete()
      .eq("row_key", parsed.rowKey)
      .eq("equipment_key", parsed.equipmentKey);
    if (error) throw error;
  }
}
