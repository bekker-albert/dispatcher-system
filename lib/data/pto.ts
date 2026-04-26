import {
  deletePtoBucketRowFromSupabase as deletePtoBucketRowFromBackend,
  deletePtoBucketValuesFromSupabase as deletePtoBucketValuesFromBackend,
  deletePtoRowsFromSupabase as deletePtoRowsFromBackend,
  deletePtoYearFromSupabase as deletePtoYearFromBackend,
  loadPtoStateFromSupabase as loadPtoStateFromBackend,
  savePtoBucketRowToSupabase as savePtoBucketRowToBackend,
  savePtoBucketValueToSupabase as savePtoBucketValueToBackend,
  savePtoDayValueToSupabase as savePtoDayValueToBackend,
  savePtoDayValuesToSupabase as savePtoDayValuesToBackend,
  savePtoStateToSupabase as savePtoStateToBackend,
  type SupabasePtoState as BackendPtoState,
  type SupabasePtoTable as BackendPtoTable,
} from "@/lib/supabase/pto";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";

// The legacy Supabase adapter routes to /api/database and MySQL when the server database is configured.
// Keep this public data layer provider-neutral so new tables do not depend on a storage brand name.
export type DataPtoState = BackendPtoState;
export type DataPtoTable = BackendPtoTable;

export function loadPtoStateFromDatabase() {
  return loadPtoStateFromBackend();
}

export function savePtoStateToDatabase(state: DataPtoState) {
  return savePtoStateToBackend(state);
}

export function savePtoDayValueToDatabase(
  table: DataPtoTable,
  rowId: string,
  day: string,
  value: number | null,
) {
  return savePtoDayValueToBackend(table, rowId, day, value);
}

export function savePtoDayValuesToDatabase(
  table: DataPtoTable,
  values: Array<{ rowId: string; day: string; value: number | null }>,
) {
  return savePtoDayValuesToBackend(table, values);
}

export function deletePtoRowsFromDatabase(table: DataPtoTable, rowIds: string[]) {
  return deletePtoRowsFromBackend(table, rowIds);
}

export function deletePtoYearFromDatabase(year: string) {
  return deletePtoYearFromBackend(year);
}

export function savePtoBucketRowToDatabase(row: PtoBucketRow, sortIndex = 0) {
  return savePtoBucketRowToBackend(row, sortIndex);
}

export function deletePtoBucketRowFromDatabase(rowKey: string) {
  return deletePtoBucketRowFromBackend(rowKey);
}

export function savePtoBucketValueToDatabase(cellKey: string, value: number | null) {
  return savePtoBucketValueToBackend(cellKey, value);
}

export function deletePtoBucketValuesFromDatabase(cellKeys: string[]) {
  return deletePtoBucketValuesFromBackend(cellKeys);
}
