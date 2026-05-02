import { databaseRequest } from "@/lib/database/rpc";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import {
  ptoBucketRowsFromRecords,
  ptoBucketValuesFromRecords,
  type PtoPersistenceBucketRowRecord,
  type PtoPersistenceBucketValueRecord,
  type PtoPersistenceSnapshotWriteOptions,
  type PtoPersistenceSnapshotWriteResult,
  type PtoPersistenceState,
  type PtoPersistenceTable,
} from "@/lib/domain/pto/persistence-shared";
import { serverDatabaseConfigured } from "./config";

export type DataPtoState = PtoPersistenceState;
export type DataPtoTable = PtoPersistenceTable;
export type DataPtoSaveOptions = PtoPersistenceSnapshotWriteOptions;
export type DataPtoLoadOptions = {
  year?: string | null;
  includeBuckets?: boolean;
};
export type DataPtoInlineSaveOptions = {
  expectedUpdatedAt?: string | null;
};

type DataPtoBucketRecordsLoadResult = {
  bucketRows: PtoPersistenceBucketRowRecord[];
  bucketValues: PtoPersistenceBucketValueRecord[];
  updatedAt?: string | null;
};

function ptoInlineSavePayload(options: DataPtoInlineSaveOptions) {
  return { expectedUpdatedAt: options.expectedUpdatedAt };
}

async function loadSupabasePtoAdapter() {
  return import("@/lib/supabase/pto");
}

export function loadPtoStateFromDatabase(options: DataPtoLoadOptions = {}) {
  if (serverDatabaseConfigured) {
    if (options.year) {
      return databaseRequest<DataPtoState | null>("pto", "load-year", {
        year: options.year,
        includeBuckets: options.includeBuckets === true,
      });
    }

    return databaseRequest<DataPtoState | null>("pto", "load");
  }

  return loadSupabasePtoAdapter().then(({ loadPtoStateFromSupabase, loadPtoStateFromSupabaseForYear }) => {
    if (options.year) return loadPtoStateFromSupabaseForYear(options.year, { includeBuckets: options.includeBuckets });
    return loadPtoStateFromSupabase();
  });
}

export function loadPtoUpdatedAtFromDatabase() {
  if (serverDatabaseConfigured) {
    return databaseRequest<string | null | undefined>("pto", "load-updated-at");
  }

  return loadSupabasePtoAdapter().then(({ loadPtoUpdatedAtFromSupabase }) => loadPtoUpdatedAtFromSupabase());
}

export function loadPtoBucketsFromDatabase() {
  const loadBucketRecords = serverDatabaseConfigured
    ? databaseRequest<DataPtoBucketRecordsLoadResult>("pto", "load-buckets")
    : loadSupabasePtoAdapter().then(({ loadPtoBucketsFromSupabase }) => loadPtoBucketsFromSupabase());

  return loadBucketRecords.then((result) => ({
    bucketRows: ptoBucketRowsFromRecords(result.bucketRows),
    bucketValues: ptoBucketValuesFromRecords(result.bucketValues),
    updatedAt: result.updatedAt ?? null,
  }));
}

export function savePtoStateToDatabase(state: DataPtoState, options: DataPtoSaveOptions = {}) {
  if (serverDatabaseConfigured) {
    return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", "save", {
      state,
      expectedUpdatedAt: options.expectedUpdatedAt,
      yearScope: options.yearScope,
    });
  }

  return loadSupabasePtoAdapter().then(({ savePtoStateToSupabase }) => savePtoStateToSupabase(state, options));
}

export function savePtoDayValueToDatabase(
  table: DataPtoTable,
  rowId: string,
  day: string,
  value: number | null,
  options: DataPtoInlineSaveOptions = {},
) {
  if (serverDatabaseConfigured) {
    return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", "save-day", {
      table,
      rowId,
      day,
      value,
      ...ptoInlineSavePayload(options),
    });
  }

  return loadSupabasePtoAdapter()
    .then(({ savePtoDayValueToSupabase }) => savePtoDayValueToSupabase(table, rowId, day, value, options));
}

export function savePtoDayValueWithRowToDatabase(
  table: DataPtoTable,
  row: PtoPlanRow,
  day: string,
  value: number | null,
  options: DataPtoInlineSaveOptions = {},
) {
  if (serverDatabaseConfigured) {
    return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", "save-day-with-row", {
      table,
      row,
      day,
      value,
      ...ptoInlineSavePayload(options),
    });
  }

  return loadSupabasePtoAdapter()
    .then(({ savePtoDayValueWithRowToSupabase }) => savePtoDayValueWithRowToSupabase(table, row, day, value, options));
}

export function savePtoDayValuesToDatabase(
  table: DataPtoTable,
  values: Array<{ rowId: string; day: string; value: number | null }>,
  options: DataPtoInlineSaveOptions = {},
) {
  if (serverDatabaseConfigured) {
    return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", "save-days", {
      table,
      values,
      ...ptoInlineSavePayload(options),
    });
  }

  return loadSupabasePtoAdapter()
    .then(({ savePtoDayValuesToSupabase }) => savePtoDayValuesToSupabase(table, values, options));
}

export function savePtoDayValuesWithRowToDatabase(
  table: DataPtoTable,
  row: PtoPlanRow,
  values: Array<{ rowId: string; day: string; value: number | null }>,
  options: DataPtoInlineSaveOptions = {},
) {
  if (serverDatabaseConfigured) {
    return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", "save-days-with-row", {
      table,
      row,
      values,
      ...ptoInlineSavePayload(options),
    });
  }

  return loadSupabasePtoAdapter()
    .then(({ savePtoDayValuesWithRowToSupabase }) => savePtoDayValuesWithRowToSupabase(table, row, values, options));
}

export function deletePtoRowsFromDatabase(table: DataPtoTable, rowIds: string[], options: DataPtoInlineSaveOptions = {}) {
  if (serverDatabaseConfigured) {
    return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", "delete", {
      table,
      rowIds,
      ...ptoInlineSavePayload(options),
    });
  }

  return loadSupabasePtoAdapter()
    .then(({ deletePtoRowsFromSupabase }) => deletePtoRowsFromSupabase(table, rowIds, options));
}

export function deletePtoYearFromDatabase(year: string, options: DataPtoInlineSaveOptions = {}) {
  if (serverDatabaseConfigured) {
    return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", "delete-year", {
      year,
      ...ptoInlineSavePayload(options),
    });
  }

  return loadSupabasePtoAdapter()
    .then(({ deletePtoYearFromSupabase }) => deletePtoYearFromSupabase(year, options));
}

export function savePtoBucketRowToDatabase(row: PtoBucketRow, sortIndex = 0, options: DataPtoInlineSaveOptions = {}) {
  if (serverDatabaseConfigured) {
    return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", "save-bucket-row", {
      row,
      sortIndex,
      ...ptoInlineSavePayload(options),
    });
  }

  return loadSupabasePtoAdapter()
    .then(({ savePtoBucketRowToSupabase }) => savePtoBucketRowToSupabase(row, sortIndex, options));
}

export function deletePtoBucketRowFromDatabase(rowKey: string, options: DataPtoInlineSaveOptions = {}) {
  if (serverDatabaseConfigured) {
    return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", "delete-bucket-row", {
      rowKey,
      ...ptoInlineSavePayload(options),
    });
  }

  return loadSupabasePtoAdapter()
    .then(({ deletePtoBucketRowFromSupabase }) => deletePtoBucketRowFromSupabase(rowKey, options));
}

export function savePtoBucketValueToDatabase(cellKey: string, value: number | null, options: DataPtoInlineSaveOptions = {}) {
  if (serverDatabaseConfigured) {
    return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", "save-bucket-value", {
      cellKey,
      value,
      ...ptoInlineSavePayload(options),
    });
  }

  return loadSupabasePtoAdapter()
    .then(({ savePtoBucketValueToSupabase }) => savePtoBucketValueToSupabase(cellKey, value, options));
}

export function deletePtoBucketValuesFromDatabase(cellKeys: string[], options: DataPtoInlineSaveOptions = {}) {
  if (serverDatabaseConfigured) {
    return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", "delete-bucket-values", {
      cellKeys,
      ...ptoInlineSavePayload(options),
    });
  }

  return loadSupabasePtoAdapter()
    .then(({ deletePtoBucketValuesFromSupabase }) => deletePtoBucketValuesFromSupabase(cellKeys, options));
}
