import { ptoBucketCellKey } from "./buckets";
import type { PtoDateTableKey } from "./date-table-types";
import type {
  PtoPersistenceBucketRowRecord,
  PtoPersistenceBucketValueRecord,
  PtoPersistenceDayValueRecord,
  PtoPersistenceRowRecord,
} from "./persistence-types";

export function ptoRowKey(table: PtoDateTableKey, rowId: string) {
  return `${table}:${rowId}`;
}

export { ptoBucketCellKey };

export function splitPtoBucketCellKey(cellKey: string) {
  const [rowKeyValue, equipmentKey] = cellKey.split("::");
  if (!rowKeyValue || !equipmentKey) return null;
  return { rowKey: rowKeyValue, equipmentKey };
}

export function ptoBucketCellKeysToPairs(cellKeys: string[]) {
  return cellKeys.flatMap((cellKey) => {
    const parsed = splitPtoBucketCellKey(cellKey);
    return parsed ? [parsed] : [];
  });
}

export function ptoPersistenceRowRecordKey(record: Pick<PtoPersistenceRowRecord, "table_type" | "row_id">) {
  return ptoRowKey(record.table_type, record.row_id);
}

export function ptoDayValueRecordKey(
  record: Pick<PtoPersistenceDayValueRecord, "table_type" | "row_id" | "work_date">,
  normalizeDate: (value: string) => string | null = (value) => value,
) {
  const dateKey = normalizeDate(record.work_date);
  return dateKey ? `${record.table_type}:${record.row_id}:${dateKey}` : null;
}

export function ptoBucketRowRecordKey(record: Pick<PtoPersistenceBucketRowRecord, "row_key">) {
  return record.row_key;
}

export function ptoBucketValueRecordKey(
  record: Pick<PtoPersistenceBucketValueRecord, "row_key" | "equipment_key">,
) {
  return ptoBucketCellKey(record.row_key, record.equipment_key);
}
