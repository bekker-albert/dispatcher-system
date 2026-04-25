import {
  deletePtoBucketRowFromSupabase,
  deletePtoBucketValuesFromSupabase,
  deletePtoRowsFromSupabase,
  deletePtoYearFromSupabase,
  loadPtoStateFromSupabase,
  savePtoBucketRowToSupabase,
  savePtoBucketValueToSupabase,
  savePtoDayValueToSupabase,
  savePtoDayValuesToSupabase,
  savePtoStateToSupabase,
  type SupabasePtoState,
  type SupabasePtoTable,
} from "@/lib/supabase/pto";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";

export type DataPtoState = SupabasePtoState;
export type DataPtoTable = SupabasePtoTable;

export function loadPtoStateFromDatabase() {
  return loadPtoStateFromSupabase();
}

export function savePtoStateToDatabase(state: DataPtoState) {
  return savePtoStateToSupabase(state);
}

export function savePtoDayValueToDatabase(
  table: DataPtoTable,
  rowId: string,
  day: string,
  value: number | null,
) {
  return savePtoDayValueToSupabase(table, rowId, day, value);
}

export function savePtoDayValuesToDatabase(
  table: DataPtoTable,
  values: Array<{ rowId: string; day: string; value: number | null }>,
) {
  return savePtoDayValuesToSupabase(table, values);
}

export function deletePtoRowsFromDatabase(table: DataPtoTable, rowIds: string[]) {
  return deletePtoRowsFromSupabase(table, rowIds);
}

export function deletePtoYearFromDatabase(year: string) {
  return deletePtoYearFromSupabase(year);
}

export function savePtoBucketRowToDatabase(row: PtoBucketRow, sortIndex = 0) {
  return savePtoBucketRowToSupabase(row, sortIndex);
}

export function deletePtoBucketRowFromDatabase(rowKey: string) {
  return deletePtoBucketRowFromSupabase(rowKey);
}

export function savePtoBucketValueToDatabase(cellKey: string, value: number | null) {
  return savePtoBucketValueToSupabase(cellKey, value);
}

export function deletePtoBucketValuesFromDatabase(cellKeys: string[]) {
  return deletePtoBucketValuesFromSupabase(cellKeys);
}
