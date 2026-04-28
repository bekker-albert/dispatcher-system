import {
  deletePtoBucketRowFromSupabase as deletePtoBucketRowFromBackend,
  deletePtoBucketValuesFromSupabase as deletePtoBucketValuesFromBackend,
  deletePtoRowsFromSupabase as deletePtoRowsFromBackend,
  deletePtoYearFromSupabase as deletePtoYearFromBackend,
  loadPtoBucketsFromSupabase as loadPtoBucketsFromBackend,
  loadPtoStateFromSupabase as loadPtoStateFromBackend,
  loadPtoStateFromSupabaseForYear as loadPtoStateFromBackendForYear,
  loadPtoUpdatedAtFromSupabase as loadPtoUpdatedAtFromBackend,
  savePtoBucketRowToSupabase as savePtoBucketRowToBackend,
  savePtoBucketValueToSupabase as savePtoBucketValueToBackend,
  savePtoDayValueToSupabase as savePtoDayValueToBackend,
  savePtoDayValueWithRowToSupabase as savePtoDayValueWithRowToBackend,
  savePtoDayValuesToSupabase as savePtoDayValuesToBackend,
  savePtoDayValuesWithRowToSupabase as savePtoDayValuesWithRowToBackend,
  savePtoStateToSupabase as savePtoStateToBackend,
  type SupabasePtoState as BackendPtoState,
  type SupabasePtoTable as BackendPtoTable,
} from "@/lib/supabase/pto";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import {
  ptoBucketRowsFromRecords,
  ptoBucketValuesFromRecords,
} from "@/lib/domain/pto/persistence-shared";
import type { PtoPersistenceSnapshotWriteOptions } from "@/lib/domain/pto/persistence-shared";

// The legacy Supabase adapter routes to /api/database and MySQL when the server database is configured.
// Keep this public data layer provider-neutral so new tables do not depend on a storage brand name.
export type DataPtoState = BackendPtoState;
export type DataPtoTable = BackendPtoTable;
export type DataPtoSaveOptions = PtoPersistenceSnapshotWriteOptions;
export type DataPtoLoadOptions = {
  year?: string | null;
  includeBuckets?: boolean;
};
export type DataPtoInlineSaveOptions = {
  expectedUpdatedAt?: string | null;
};

export function loadPtoStateFromDatabase(options: DataPtoLoadOptions = {}) {
  if (options.year) return loadPtoStateFromBackendForYear(options.year, { includeBuckets: options.includeBuckets });
  return loadPtoStateFromBackend();
}

export function loadPtoUpdatedAtFromDatabase() {
  return loadPtoUpdatedAtFromBackend();
}

export function loadPtoBucketsFromDatabase() {
  return loadPtoBucketsFromBackend().then((result) => ({
    bucketRows: ptoBucketRowsFromRecords(result.bucketRows),
    bucketValues: ptoBucketValuesFromRecords(result.bucketValues),
    updatedAt: result.updatedAt ?? null,
  }));
}

export function savePtoStateToDatabase(state: DataPtoState, options: DataPtoSaveOptions = {}) {
  return savePtoStateToBackend(state, options);
}

export function savePtoDayValueToDatabase(
  table: DataPtoTable,
  rowId: string,
  day: string,
  value: number | null,
  options: DataPtoInlineSaveOptions = {},
) {
  return savePtoDayValueToBackend(table, rowId, day, value, options);
}

export function savePtoDayValueWithRowToDatabase(
  table: DataPtoTable,
  row: PtoPlanRow,
  day: string,
  value: number | null,
  options: DataPtoInlineSaveOptions = {},
) {
  return savePtoDayValueWithRowToBackend(table, row, day, value, options);
}

export function savePtoDayValuesToDatabase(
  table: DataPtoTable,
  values: Array<{ rowId: string; day: string; value: number | null }>,
  options: DataPtoInlineSaveOptions = {},
) {
  return savePtoDayValuesToBackend(table, values, options);
}

export function savePtoDayValuesWithRowToDatabase(
  table: DataPtoTable,
  row: PtoPlanRow,
  values: Array<{ rowId: string; day: string; value: number | null }>,
  options: DataPtoInlineSaveOptions = {},
) {
  return savePtoDayValuesWithRowToBackend(table, row, values, options);
}

export function deletePtoRowsFromDatabase(table: DataPtoTable, rowIds: string[], options: DataPtoInlineSaveOptions = {}) {
  return deletePtoRowsFromBackend(table, rowIds, options);
}

export function deletePtoYearFromDatabase(year: string, options: DataPtoInlineSaveOptions = {}) {
  return deletePtoYearFromBackend(year, options);
}

export function savePtoBucketRowToDatabase(row: PtoBucketRow, sortIndex = 0, options: DataPtoInlineSaveOptions = {}) {
  return savePtoBucketRowToBackend(row, sortIndex, options);
}

export function deletePtoBucketRowFromDatabase(rowKey: string, options: DataPtoInlineSaveOptions = {}) {
  return deletePtoBucketRowFromBackend(rowKey, options);
}

export function savePtoBucketValueToDatabase(cellKey: string, value: number | null, options: DataPtoInlineSaveOptions = {}) {
  return savePtoBucketValueToBackend(cellKey, value, options);
}

export function deletePtoBucketValuesFromDatabase(cellKeys: string[], options: DataPtoInlineSaveOptions = {}) {
  return deletePtoBucketValuesFromBackend(cellKeys, options);
}
