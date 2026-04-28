import type { PtoPlanRow } from "./date-table";
import type {
  PtoPersistenceDayValuePatch,
  PtoPersistenceDayValuePatchRecords,
  PtoPersistenceDayValueRecord,
  PtoPersistenceRowRecord,
  PtoPersistenceTable,
} from "./persistence-types";
import { ptoRowKey } from "./persistence-keys";
import { asFiniteNumber, asNumberRecord, asStringArray } from "./persistence-values";

export function ptoPlanRowIds(rows: PtoPlanRow[]) {
  return rows
    .map((row) => typeof row.id === "string" ? row.id : "")
    .filter((rowId) => rowId.trim().length > 0);
}

export function ptoRowsToRecords(table: PtoPersistenceTable, rows: PtoPlanRow[]): PtoPersistenceRowRecord[] {
  return rows.map((row, index) => ({
    table_type: table,
    row_id: row.id,
    area: row.area,
    location: row.location,
    structure: row.structure,
    customer_code: row.customerCode ?? "",
    unit: row.unit,
    status: row.status,
    carryover: Number(row.carryover ?? 0),
    carryovers: row.carryovers ?? {},
    carryover_manual_years: row.carryoverManualYears ?? [],
    years: row.years ?? [],
    sort_index: index,
  }));
}

export function ptoRowsToDayRecords(
  table: PtoPersistenceTable,
  rows: PtoPlanRow[],
): PtoPersistenceDayValueRecord[] {
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

export function ptoDayValuePatchToRecord(
  table: PtoPersistenceTable,
  patch: PtoPersistenceDayValuePatch,
): PtoPersistenceDayValueRecord | null {
  if (patch.value === null) return null;

  return {
    table_type: table,
    row_id: patch.rowId,
    work_date: patch.day,
    value: patch.value,
  };
}

export function ptoDayValuePatchesToRecords(
  table: PtoPersistenceTable,
  values: PtoPersistenceDayValuePatch[],
): PtoPersistenceDayValuePatchRecords {
  return values.reduce<PtoPersistenceDayValuePatchRecords>((result, patch) => {
    const record = ptoDayValuePatchToRecord(table, patch);

    if (record) {
      result.upsertRecords.push(record);
    } else {
      result.deleteValues.push(patch);
    }

    return result;
  }, { upsertRecords: [], deleteValues: [] });
}

export function ptoDayValueRecordDates(rows: PtoPlanRow[]) {
  return rows.map((row) => ({
    rowId: row.id,
    dates: Object.keys(row.dailyPlans ?? {})
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .sort(),
  }));
}

export function ptoRecordToRow(
  record: PtoPersistenceRowRecord,
  dailyPlans: Record<string, number>,
  parseStoredValue: (value: unknown) => unknown = (value) => value,
): PtoPlanRow {
  return {
    id: record.row_id,
    area: record.area ?? "",
    location: record.location ?? "",
    structure: record.structure ?? "",
    customerCode: record.customer_code ?? "",
    unit: record.unit ?? "",
    status: record.status ?? "",
    carryover: asFiniteNumber(record.carryover),
    carryovers: asNumberRecord(parseStoredValue(record.carryovers)),
    carryoverManualYears: asStringArray(parseStoredValue(record.carryover_manual_years)),
    dailyPlans,
    years: asStringArray(parseStoredValue(record.years)),
  };
}

export function ptoRowsByTable(
  records: PtoPersistenceRowRecord[],
  dayValues: PtoPersistenceDayValueRecord[],
  table: PtoPersistenceTable,
  options: {
    normalizeDate?: (value: string) => string | null;
    parseStoredValue?: (value: unknown) => unknown;
  } = {},
) {
  const dailyPlansByRow = dayValues.reduce<Map<string, Record<string, number>>>((map, dayValue) => {
    if (dayValue.table_type !== table) return map;

    const numberValue = Number(dayValue.value);
    const dateKey = options.normalizeDate ? options.normalizeDate(dayValue.work_date) : dayValue.work_date;
    if (!Number.isFinite(numberValue) || !dateKey) return map;

    const key = ptoRowKey(dayValue.table_type, dayValue.row_id);
    const dailyPlans = map.get(key) ?? {};
    dailyPlans[dateKey] = numberValue;
    map.set(key, dailyPlans);
    return map;
  }, new Map<string, Record<string, number>>());

  return records
    .filter((record) => record.table_type === table)
    .sort((left, right) => asFiniteNumber(left.sort_index) - asFiniteNumber(right.sort_index))
    .map((record) =>
      ptoRecordToRow(
        record,
        dailyPlansByRow.get(ptoRowKey(table, record.row_id)) ?? {},
        options.parseStoredValue,
      )
    );
}
