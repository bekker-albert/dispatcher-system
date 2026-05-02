import type { PtoPersistenceRowRecord } from "../../domain/pto/persistence-shared";
import { ptoYearDateRange } from "../../domain/pto/persistence-shared";
import { parseJson, stringifyJson } from "./json";

export const ptoWriteBatchSize = 250;
export const ptoRowInsertColumns = `
        table_type, row_id, area, location, structure, customer_code, unit, status,
        carryover, carryovers, carryover_manual_years, years, sort_index
      `;

export function scopedDateClause(yearScope: string | null | undefined, values: unknown[]) {
  if (!yearScope) return "";

  const { start, end } = ptoYearDateRange(yearScope);
  values.push(start, end);
  return " AND work_date >= ? AND work_date <= ?";
}

export function chunkValues<T>(values: T[], size = ptoWriteBatchSize) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

export function stringArrayFromStoredJson(value: unknown) {
  const parsed = parseJson(value, value);
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : [];
}

export function objectFromStoredJson(value: unknown) {
  const parsed = parseJson(value, value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};
}

export function ptoRowRecordKey(record: Pick<PtoPersistenceRowRecord, "table_type" | "row_id">) {
  return `${record.table_type}:${record.row_id}`;
}

export function ptoRowBatchValues(records: PtoPersistenceRowRecord[]) {
  return {
    placeholders: records.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", "),
    values: records.flatMap((record) => [
      record.table_type,
      record.row_id,
      record.area,
      record.location,
      record.structure,
      record.customer_code,
      record.unit,
      record.status,
      record.carryover,
      stringifyJson(record.carryovers),
      stringifyJson(record.carryover_manual_years),
      stringifyJson(record.years),
      record.sort_index,
    ]),
  };
}
