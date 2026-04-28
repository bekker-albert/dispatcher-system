import type { PtoBucketRow } from "./buckets";
import type {
  PtoPersistenceBucketRowRecord,
  PtoPersistenceBucketValueRecord,
} from "./persistence-types";
import { ptoBucketCellKey, splitPtoBucketCellKey } from "./persistence-keys";
import { asFiniteNumber } from "./persistence-values";

export function ptoBucketRowsToRecords(rows: PtoBucketRow[] = []): PtoPersistenceBucketRowRecord[] {
  return rows.map((row, index) => ({
    ...ptoBucketRowToRecord(row, index),
  }));
}

export function ptoBucketRowToRecord(row: PtoBucketRow, sortIndex = 0): PtoPersistenceBucketRowRecord {
  return {
    row_key: row.key,
    area: row.area,
    structure: row.structure,
    source: row.source ?? "manual",
    sort_index: sortIndex,
  };
}

export function ptoBucketValueToRecord(cellKey: string, value: number | null): PtoPersistenceBucketValueRecord | null {
  const parsed = splitPtoBucketCellKey(cellKey);
  if (!parsed || value === null || !Number.isFinite(Number(value))) return null;

  return {
    row_key: parsed.rowKey,
    equipment_key: parsed.equipmentKey,
    value: Number(value),
  };
}

export function ptoBucketValuesToRecords(values: Record<string, number> = {}): PtoPersistenceBucketValueRecord[] {
  return Object.entries(values).flatMap(([cellKey, value]) => {
    const record = ptoBucketValueToRecord(cellKey, value);
    return record ? [record] : [];
  });
}

export function ptoBucketValuesFromRecords(records: PtoPersistenceBucketValueRecord[]) {
  return Object.fromEntries(
    records
      .map((record) => [ptoBucketCellKey(record.row_key, record.equipment_key), asFiniteNumber(record.value)] as const)
      .filter(([, value]) => Number.isFinite(value)),
  );
}

export function ptoBucketRowsFromRecords(records: PtoPersistenceBucketRowRecord[]): PtoBucketRow[] {
  return records.map((record) => ({
    key: record.row_key,
    area: record.area ?? "",
    structure: record.structure ?? "",
    source: record.source === "auto" ? "auto" : "manual",
  }));
}
