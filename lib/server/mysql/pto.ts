import type { RowDataPacket } from "mysql2/promise";
import type { PtoBucketRow } from "../../domain/pto/buckets";
import type { PtoDateTableKey, PtoPlanRow } from "../../domain/pto/date-table";
import { dbExecute, dbRows } from "./pool";
import { parseJson, stringifyJson, toDateKey, toIsoLike } from "./json";

export type MysqlPtoTable = PtoDateTableKey;
export type MysqlPtoRow = PtoPlanRow;

export type MysqlPtoState = {
  updatedAt?: string;
  manualYears: string[];
  planRows: MysqlPtoRow[];
  operRows: MysqlPtoRow[];
  surveyRows: MysqlPtoRow[];
  bucketValues?: Record<string, number>;
  bucketRows?: PtoBucketRow[];
  uiState?: {
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

type PtoRowRecord = RowDataPacket & {
  table_type: MysqlPtoTable;
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

type PtoDayValueRecord = RowDataPacket & {
  table_type: MysqlPtoTable;
  row_id: string;
  work_date: string;
  value: number | string | null;
  updated_at?: string | null;
};

type PtoBucketRowRecord = RowDataPacket & {
  row_key: string;
  area: string | null;
  structure: string | null;
  source: string | null;
  sort_index: number | null;
  updated_at?: string | null;
};

type PtoBucketValueRecord = RowDataPacket & {
  row_key: string;
  equipment_key: string;
  value: number | string | null;
  updated_at?: string | null;
};

type PtoSettingRecord = RowDataPacket & {
  setting_key: string;
  value: unknown;
  updated_at?: string | null;
};

type PtoDayValuePatch = {
  rowId: string;
  day: string;
  value: number | null;
};

const ptoManualYearsKey = "pto_manual_years";
const ptoUiStateKey = "pto_ui_state";
const ptoTables: MysqlPtoTable[] = ["plan", "oper", "survey"];
const batchSize = 250;

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

function rowKey(table: MysqlPtoTable, rowId: string) {
  return `${table}:${rowId}`;
}

function ptoRowsToRecords(table: MysqlPtoTable, rows: MysqlPtoRow[]) {
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

function ptoRowsToDayRecords(table: MysqlPtoTable, rows: MysqlPtoRow[]) {
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

function recordToRow(record: PtoRowRecord, dailyPlans: Record<string, number>): MysqlPtoRow {
  return {
    id: record.row_id,
    area: record.area ?? "",
    location: record.location ?? "",
    structure: record.structure ?? "",
    unit: record.unit ?? "",
    coefficient: asFiniteNumber(record.coefficient),
    status: record.status ?? "",
    carryover: asFiniteNumber(record.carryover),
    carryovers: asNumberRecord(parseJson(record.carryovers, record.carryovers)),
    carryoverManualYears: asStringArray(parseJson(record.carryover_manual_years, record.carryover_manual_years)),
    dailyPlans,
    years: asStringArray(parseJson(record.years, record.years)),
  };
}

function rowsByTable(records: PtoRowRecord[], dayValues: PtoDayValueRecord[], table: MysqlPtoTable) {
  const dailyPlansByRow = dayValues.reduce<Map<string, Record<string, number>>>((map, dayValue) => {
    if (dayValue.table_type !== table) return map;

    const numberValue = Number(dayValue.value);
    const dateKey = toDateKey(dayValue.work_date);
    if (!Number.isFinite(numberValue) || !dateKey) return map;

    const key = rowKey(dayValue.table_type, dayValue.row_id);
    const dailyPlans = map.get(key) ?? {};
    dailyPlans[dateKey] = numberValue;
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

function latestUpdatedAt(...groups: Array<Array<{ updated_at?: string | null }>>) {
  return groups
    .flatMap((group) => group.map((item) => item.updated_at))
    .map(toIsoLike)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
}

async function upsertPtoRows(records: ReturnType<typeof ptoRowsToRecords>) {
  if (!records.length) return;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = batch.flatMap((record) => [
      record.table_type,
      record.row_id,
      record.area,
      record.location,
      record.structure,
      record.unit,
      record.coefficient,
      record.status,
      record.carryover,
      stringifyJson(record.carryovers),
      stringifyJson(record.carryover_manual_years),
      stringifyJson(record.years),
      record.sort_index,
    ]);

    await dbExecute(
      `INSERT INTO pto_rows (
        table_type, row_id, area, location, structure, unit, coefficient, status,
        carryover, carryovers, carryover_manual_years, years, sort_index
      ) VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        area = VALUES(area),
        location = VALUES(location),
        structure = VALUES(structure),
        unit = VALUES(unit),
        coefficient = VALUES(coefficient),
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

async function upsertPtoDayValues(records: ReturnType<typeof ptoRowsToDayRecords>) {
  if (!records.length) return;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const placeholders = batch.map(() => "(?, ?, ?, ?)").join(", ");
    const values = batch.flatMap((record) => [
      record.table_type,
      record.row_id,
      record.work_date,
      record.value,
    ]);

    await dbExecute(
      `INSERT INTO pto_day_values (table_type, row_id, work_date, value)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        value = VALUES(value),
        updated_at = CURRENT_TIMESTAMP(3)`,
      values,
    );
  }
}

async function upsertPtoBucketRows(records: PtoBucketRowRecord[]) {
  if (!records.length) return;

  const placeholders = records.map(() => "(?, ?, ?, ?, ?)").join(", ");
  const values = records.flatMap((record) => [
    record.row_key,
    record.area,
    record.structure,
    record.source,
    record.sort_index,
  ]);

  await dbExecute(
    `INSERT INTO pto_bucket_rows (row_key, area, structure, source, sort_index)
    VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      area = VALUES(area),
      structure = VALUES(structure),
      source = VALUES(source),
      sort_index = VALUES(sort_index),
      updated_at = CURRENT_TIMESTAMP(3)`,
    values,
  );
}

async function upsertPtoBucketValues(records: PtoBucketValueRecord[]) {
  if (!records.length) return;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const placeholders = batch.map(() => "(?, ?, ?)").join(", ");
    const values = batch.flatMap((record) => [record.row_key, record.equipment_key, record.value]);

    await dbExecute(
      `INSERT INTO pto_bucket_values (row_key, equipment_key, value)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        value = VALUES(value),
        updated_at = CURRENT_TIMESTAMP(3)`,
      values,
    );
  }
}

export async function loadPtoStateFromMysql(): Promise<MysqlPtoState | null> {
  const [ptoRows, ptoDayValues, ptoSettings, ptoBucketRows, ptoBucketValues] = await Promise.all([
    dbRows<PtoRowRecord>("SELECT * FROM pto_rows ORDER BY table_type ASC, sort_index ASC"),
    dbRows<PtoDayValueRecord>("SELECT * FROM pto_day_values ORDER BY work_date ASC"),
    dbRows<PtoSettingRecord>("SELECT * FROM pto_settings WHERE setting_key IN (?, ?)", [ptoManualYearsKey, ptoUiStateKey]),
    dbRows<PtoBucketRowRecord>("SELECT * FROM pto_bucket_rows ORDER BY sort_index ASC"),
    dbRows<PtoBucketValueRecord>("SELECT * FROM pto_bucket_values"),
  ]);

  if (
    ptoRows.length === 0
    && ptoDayValues.length === 0
    && ptoSettings.length === 0
    && ptoBucketRows.length === 0
    && ptoBucketValues.length === 0
  ) {
    return null;
  }

  const settingsByKey = new Map(ptoSettings.map((setting) => [setting.setting_key, parseJson(setting.value, null)]));
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
    uiState: asObjectRecord(uiStateValue) as MysqlPtoState["uiState"],
  };
}

export async function savePtoStateToMysql(state: MysqlPtoState) {
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
  const bucketRowRecords = (state.bucketRows ?? []).map((row, index) => ({
    row_key: row.key,
    area: row.area,
    structure: row.structure,
    source: row.source ?? "manual",
    sort_index: index,
  })) as PtoBucketRowRecord[];
  const bucketValueRecords = Object.entries(state.bucketValues ?? {}).flatMap(([cellKey, value]) => {
    const parsed = splitBucketCellKey(cellKey);
    if (!parsed || !Number.isFinite(Number(value))) return [];

    return [{
      row_key: parsed.rowKey,
      equipment_key: parsed.equipmentKey,
      value: Number(value),
    }] as PtoBucketValueRecord[];
  });

  await upsertPtoRows(rowRecords);
  await upsertPtoDayValues(dayRecords);
  await upsertPtoBucketRows(bucketRowRecords);
  await upsertPtoBucketValues(bucketValueRecords);
  await dbExecute(
    `INSERT INTO pto_settings (setting_key, value)
    VALUES (?, ?), (?, ?)
    ON DUPLICATE KEY UPDATE
      value = VALUES(value),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      ptoManualYearsKey,
      stringifyJson(state.manualYears),
      ptoUiStateKey,
      stringifyJson(state.uiState ?? {}),
    ],
  );
}

export async function savePtoDayValueToMysql(
  table: MysqlPtoTable,
  rowId: string,
  day: string,
  value: number | null,
) {
  if (value === null) {
    await dbExecute(
      "DELETE FROM pto_day_values WHERE table_type = ? AND row_id = ? AND work_date = ?",
      [table, rowId, day],
    );
    return;
  }

  await upsertPtoDayValues([{ table_type: table, row_id: rowId, work_date: day, value }]);
}

export async function savePtoDayValuesToMysql(table: MysqlPtoTable, values: PtoDayValuePatch[]) {
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
    await dbExecute(
      "DELETE FROM pto_day_values WHERE table_type = ? AND row_id = ? AND work_date = ?",
      [table, item.rowId, item.day],
    );
  }
}

export async function deletePtoRowsFromMysql(rowIds: string[]) {
  if (rowIds.length === 0) return;

  const placeholders = rowIds.map(() => "?").join(", ");

  for (const table of ptoTables) {
    await dbExecute(
      `DELETE FROM pto_rows WHERE table_type = ? AND row_id IN (${placeholders})`,
      [table, ...rowIds],
    );
  }
}

export async function deletePtoYearFromMysql(year: string) {
  await dbExecute(
    "DELETE FROM pto_day_values WHERE work_date >= ? AND work_date <= ?",
    [`${year}-01-01`, `${year}-12-31`],
  );
}

export async function savePtoBucketRowToMysql(row: PtoBucketRow, sortIndex = 0) {
  await upsertPtoBucketRows([{
    row_key: row.key,
    area: row.area,
    structure: row.structure,
    source: row.source ?? "manual",
    sort_index: sortIndex,
  } as PtoBucketRowRecord]);
}

export async function deletePtoBucketRowFromMysql(rowKeyValue: string) {
  await dbExecute("DELETE FROM pto_bucket_rows WHERE row_key = ?", [rowKeyValue]);
}

export async function savePtoBucketValueToMysql(cellKey: string, value: number | null) {
  const parsed = splitBucketCellKey(cellKey);
  if (!parsed) return;

  if (value === null) {
    await dbExecute(
      "DELETE FROM pto_bucket_values WHERE row_key = ? AND equipment_key = ?",
      [parsed.rowKey, parsed.equipmentKey],
    );
    return;
  }

  await upsertPtoBucketValues([{
    row_key: parsed.rowKey,
    equipment_key: parsed.equipmentKey,
    value,
  } as PtoBucketValueRecord]);
}

export async function deletePtoBucketValuesFromMysql(cellKeys: string[]) {
  for (const cellKey of cellKeys) {
    const parsed = splitBucketCellKey(cellKey);
    if (!parsed) continue;

    await dbExecute(
      "DELETE FROM pto_bucket_values WHERE row_key = ? AND equipment_key = ?",
      [parsed.rowKey, parsed.equipmentKey],
    );
  }
}
