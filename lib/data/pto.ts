import { databaseRequest, type DatabaseAction } from "@/lib/database/rpc";
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
type DataPtoInlineAction = Extract<
  DatabaseAction,
  | "delete"
  | "delete-bucket-row"
  | "delete-bucket-values"
  | "delete-year"
  | "save-bucket-row"
  | "save-bucket-value"
  | "save-day"
  | "save-day-with-row"
  | "save-days"
  | "save-days-with-row"
>;

const ptoLoadRequestCache = new Map<string, Promise<unknown>>();

function dedupePtoLoadRequest<T>(key: string, load: () => Promise<T>): Promise<T> {
  const activeRequest = ptoLoadRequestCache.get(key);
  if (activeRequest) return activeRequest as Promise<T>;

  const request = load().finally(() => {
    ptoLoadRequestCache.delete(key);
  });
  ptoLoadRequestCache.set(key, request);
  return request;
}

function ptoInlineSavePayload(options: DataPtoInlineSaveOptions) {
  return { expectedUpdatedAt: options.expectedUpdatedAt };
}

function latestPtoStateUpdatedAt(values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .sort()
    .at(-1);
}

function mysqlPtoYearLoadKey(year: string, includeBuckets: boolean) {
  return `mysql:pto:load-year:${year}:${includeBuckets ? "buckets" : "date"}`;
}

async function loadSupabasePtoAdapter() {
  return import("@/lib/supabase/pto");
}

function writeMysqlPtoInline(action: DataPtoInlineAction, payload: Record<string, unknown>) {
  return databaseRequest<PtoPersistenceSnapshotWriteResult>("pto", action, payload);
}

function writePtoInline<T>(
  action: DataPtoInlineAction,
  payload: Record<string, unknown>,
  supabaseWrite: (adapter: Awaited<ReturnType<typeof loadSupabasePtoAdapter>>) => Promise<T>,
) {
  if (serverDatabaseConfigured) {
    return writeMysqlPtoInline(action, payload);
  }

  return loadSupabasePtoAdapter().then(supabaseWrite);
}

export function loadPtoStateFromDatabase(options: DataPtoLoadOptions = {}) {
  if (serverDatabaseConfigured) {
    if (options.year) {
      const includeBuckets = options.includeBuckets === true;
      const year = options.year;
      const dateLoadKey = mysqlPtoYearLoadKey(year, false);

      if (includeBuckets) {
        const activeDateLoad = ptoLoadRequestCache.get(dateLoadKey) as Promise<DataPtoState | null> | undefined;
        if (activeDateLoad) {
          return dedupePtoLoadRequest(mysqlPtoYearLoadKey(year, true), async () => {
            const [dateState, bucketState] = await Promise.all([
              activeDateLoad,
              loadPtoBucketsFromDatabase(),
            ]);
            if (!dateState) return dateState;

            return {
              ...dateState,
              bucketRows: bucketState.bucketRows,
              bucketValues: bucketState.bucketValues,
              updatedAt: latestPtoStateUpdatedAt([dateState.updatedAt, bucketState.updatedAt]) ?? dateState.updatedAt,
            };
          });
        }
      }

      return dedupePtoLoadRequest(mysqlPtoYearLoadKey(year, includeBuckets), () => databaseRequest<DataPtoState | null>("pto", "load-year", {
        year: options.year,
        includeBuckets,
      }));
    }

    return dedupePtoLoadRequest("mysql:pto:load", () => databaseRequest<DataPtoState | null>("pto", "load"));
  }

  return dedupePtoLoadRequest(`supabase:pto:load:${options.year ?? "all"}:${options.includeBuckets === true ? "buckets" : "date"}`, () => loadSupabasePtoAdapter().then(({ loadPtoStateFromSupabase, loadPtoStateFromSupabaseForYear }) => {
    if (options.year) return loadPtoStateFromSupabaseForYear(options.year, { includeBuckets: options.includeBuckets });
    return loadPtoStateFromSupabase();
  }));
}

export function loadPtoUpdatedAtFromDatabase() {
  if (serverDatabaseConfigured) {
    return dedupePtoLoadRequest("mysql:pto:load-updated-at", () => databaseRequest<string | null | undefined>("pto", "load-updated-at"));
  }

  return dedupePtoLoadRequest("supabase:pto:load-updated-at", () => loadSupabasePtoAdapter().then(({ loadPtoUpdatedAtFromSupabase }) => loadPtoUpdatedAtFromSupabase()));
}

export function loadPtoBucketsFromDatabase() {
  const loadBucketRecords = dedupePtoLoadRequest(
    serverDatabaseConfigured ? "mysql:pto:load-buckets" : "supabase:pto:load-buckets",
    () => (
      serverDatabaseConfigured
        ? databaseRequest<DataPtoBucketRecordsLoadResult>("pto", "load-buckets")
        : loadSupabasePtoAdapter().then(({ loadPtoBucketsFromSupabase }) => loadPtoBucketsFromSupabase())
    ),
  );

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
  return writePtoInline(
    "save-day",
    {
      table,
      rowId,
      day,
      value,
      ...ptoInlineSavePayload(options),
    },
    ({ savePtoDayValueToSupabase }) => savePtoDayValueToSupabase(table, rowId, day, value, options),
  );
}

export function savePtoDayValueWithRowToDatabase(
  table: DataPtoTable,
  row: PtoPlanRow,
  day: string,
  value: number | null,
  options: DataPtoInlineSaveOptions = {},
) {
  return writePtoInline(
    "save-day-with-row",
    {
      table,
      row,
      day,
      value,
      ...ptoInlineSavePayload(options),
    },
    ({ savePtoDayValueWithRowToSupabase }) => savePtoDayValueWithRowToSupabase(table, row, day, value, options),
  );
}

export function savePtoDayValuesToDatabase(
  table: DataPtoTable,
  values: Array<{ rowId: string; day: string; value: number | null }>,
  options: DataPtoInlineSaveOptions = {},
) {
  return writePtoInline(
    "save-days",
    {
      table,
      values,
      ...ptoInlineSavePayload(options),
    },
    ({ savePtoDayValuesToSupabase }) => savePtoDayValuesToSupabase(table, values, options),
  );
}

export function savePtoDayValuesWithRowToDatabase(
  table: DataPtoTable,
  row: PtoPlanRow,
  values: Array<{ rowId: string; day: string; value: number | null }>,
  options: DataPtoInlineSaveOptions = {},
) {
  return writePtoInline(
    "save-days-with-row",
    {
      table,
      row,
      values,
      ...ptoInlineSavePayload(options),
    },
    ({ savePtoDayValuesWithRowToSupabase }) => savePtoDayValuesWithRowToSupabase(table, row, values, options),
  );
}

export function deletePtoRowsFromDatabase(table: DataPtoTable, rowIds: string[], options: DataPtoInlineSaveOptions = {}) {
  return writePtoInline(
    "delete",
    {
      table,
      rowIds,
      ...ptoInlineSavePayload(options),
    },
    ({ deletePtoRowsFromSupabase }) => deletePtoRowsFromSupabase(table, rowIds, options),
  );
}

export function deletePtoYearFromDatabase(year: string, options: DataPtoInlineSaveOptions = {}) {
  return writePtoInline(
    "delete-year",
    {
      year,
      ...ptoInlineSavePayload(options),
    },
    ({ deletePtoYearFromSupabase }) => deletePtoYearFromSupabase(year, options),
  );
}

export function savePtoBucketRowToDatabase(row: PtoBucketRow, sortIndex = 0, options: DataPtoInlineSaveOptions = {}) {
  return writePtoInline(
    "save-bucket-row",
    {
      row,
      sortIndex,
      ...ptoInlineSavePayload(options),
    },
    ({ savePtoBucketRowToSupabase }) => savePtoBucketRowToSupabase(row, sortIndex, options),
  );
}

export function deletePtoBucketRowFromDatabase(rowKey: string, options: DataPtoInlineSaveOptions = {}) {
  return writePtoInline(
    "delete-bucket-row",
    {
      rowKey,
      ...ptoInlineSavePayload(options),
    },
    ({ deletePtoBucketRowFromSupabase }) => deletePtoBucketRowFromSupabase(rowKey, options),
  );
}

export function savePtoBucketValueToDatabase(cellKey: string, value: number | null, options: DataPtoInlineSaveOptions = {}) {
  return writePtoInline(
    "save-bucket-value",
    {
      cellKey,
      value,
      ...ptoInlineSavePayload(options),
    },
    ({ savePtoBucketValueToSupabase }) => savePtoBucketValueToSupabase(cellKey, value, options),
  );
}

export function deletePtoBucketValuesFromDatabase(cellKeys: string[], options: DataPtoInlineSaveOptions = {}) {
  return writePtoInline(
    "delete-bucket-values",
    {
      cellKeys,
      ...ptoInlineSavePayload(options),
    },
    ({ deletePtoBucketValuesFromSupabase }) => deletePtoBucketValuesFromSupabase(cellKeys, options),
  );
}
