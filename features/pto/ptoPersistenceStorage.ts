import type { DataPtoState } from "../../lib/data/pto";
import { scopePtoStateForYear } from "../../lib/domain/pto/persistence-shared";
import { adminStorageKeys } from "../../lib/storage/keys";

export type PtoBrowserStorageSnapshot = Record<string, string>;
export type PtoBrowserStorageSnapshotCache = {
  snapshot: PtoBrowserStorageSnapshot;
  refs: Record<string, unknown>;
};
export type PtoBrowserStorageSaveOptions = {
  markLocalUpdatedAt: boolean;
  localUpdatedAt?: string | null;
  includeBuckets?: boolean;
};

function jsonFromCache(
  cache: PtoBrowserStorageSnapshotCache | null,
  storageKey: string,
  ref: unknown,
  fallbackValue: unknown,
) {
  if (cache && cache.refs[storageKey] === ref && typeof cache.snapshot[storageKey] === "string") {
    return cache.snapshot[storageKey];
  }

  return JSON.stringify(ref ?? fallbackValue);
}

function readBrowserStorageValue(storageKey: string, failedLocalKeys: string[]) {
  try {
    return window.localStorage.getItem(storageKey);
  } catch (error) {
    console.warn("PTO local storage read failed:", storageKey, error);
    failedLocalKeys.push(storageKey);
    return null;
  }
}

function writeBrowserStorageValue(storageKey: string, value: string, failedLocalKeys: string[]) {
  try {
    window.localStorage.setItem(storageKey, value);
    return true;
  } catch (error) {
    console.warn("PTO local storage write failed:", storageKey, error);
    failedLocalKeys.push(storageKey);
    return false;
  }
}

function ptoBrowserStorageSnapshot(
  state: DataPtoState,
  previousCache: PtoBrowserStorageSnapshotCache | null,
  includeBuckets: boolean,
): PtoBrowserStorageSnapshotCache {
  const uiState = state.uiState ?? {};
  const refs = {
    [adminStorageKeys.ptoYears]: state.manualYears,
    [adminStorageKeys.ptoPlanRows]: state.planRows,
    [adminStorageKeys.ptoSurveyRows]: state.surveyRows,
    [adminStorageKeys.ptoOperRows]: state.operRows,
    [adminStorageKeys.ptoColumnWidths]: uiState.ptoColumnWidths ?? null,
    [adminStorageKeys.ptoRowHeights]: uiState.ptoRowHeights ?? null,
    [adminStorageKeys.ptoHeaderLabels]: uiState.ptoHeaderLabels ?? null,
  };
  const bucketRefs = includeBuckets
    ? {
        [adminStorageKeys.ptoBucketValues]: state.bucketValues ?? null,
        [adminStorageKeys.ptoBucketRows]: state.bucketRows ?? null,
      }
    : {};

  return {
    refs: {
      ...refs,
      ...bucketRefs,
    },
    snapshot: {
      [adminStorageKeys.ptoYears]: jsonFromCache(previousCache, adminStorageKeys.ptoYears, refs[adminStorageKeys.ptoYears], []),
      [adminStorageKeys.ptoPlanRows]: jsonFromCache(previousCache, adminStorageKeys.ptoPlanRows, refs[adminStorageKeys.ptoPlanRows], []),
      [adminStorageKeys.ptoSurveyRows]: jsonFromCache(previousCache, adminStorageKeys.ptoSurveyRows, refs[adminStorageKeys.ptoSurveyRows], []),
      [adminStorageKeys.ptoOperRows]: jsonFromCache(previousCache, adminStorageKeys.ptoOperRows, refs[adminStorageKeys.ptoOperRows], []),
      [adminStorageKeys.ptoColumnWidths]: jsonFromCache(previousCache, adminStorageKeys.ptoColumnWidths, refs[adminStorageKeys.ptoColumnWidths], {}),
      [adminStorageKeys.ptoRowHeights]: jsonFromCache(previousCache, adminStorageKeys.ptoRowHeights, refs[adminStorageKeys.ptoRowHeights], {}),
      [adminStorageKeys.ptoHeaderLabels]: jsonFromCache(previousCache, adminStorageKeys.ptoHeaderLabels, refs[adminStorageKeys.ptoHeaderLabels], {}),
      ...(includeBuckets
        ? {
            [adminStorageKeys.ptoBucketValues]: jsonFromCache(previousCache, adminStorageKeys.ptoBucketValues, bucketRefs[adminStorageKeys.ptoBucketValues], {}),
            [adminStorageKeys.ptoBucketRows]: jsonFromCache(previousCache, adminStorageKeys.ptoBucketRows, bucketRefs[adminStorageKeys.ptoBucketRows], []),
          }
        : {}),
    },
  };
}

export function savePtoStateToBrowserStorage(
  state: DataPtoState,
  options: PtoBrowserStorageSaveOptions,
  previousCache: PtoBrowserStorageSnapshotCache | null = null,
) {
  const cache = ptoBrowserStorageSnapshot(state, previousCache, options.includeBuckets ?? true);
  const { snapshot } = cache;
  let changed = false;
  const failedLocalKeys: string[] = [];

  Object.entries(snapshot).forEach(([storageKey, value]) => {
    const previousValue = previousCache?.snapshot[storageKey] ?? readBrowserStorageValue(storageKey, failedLocalKeys);
    if (previousValue === value) return;

    if (writeBrowserStorageValue(storageKey, value, failedLocalKeys)) {
      changed = true;
    }
  });

  if (!changed) return { changed, snapshot, cache, failedLocalKeys };

  const updatedAt = options.localUpdatedAt === undefined ? new Date().toISOString() : options.localUpdatedAt;
  if (options.markLocalUpdatedAt && updatedAt) {
    writeBrowserStorageValue(adminStorageKeys.ptoLocalUpdatedAt, updatedAt, failedLocalKeys);
  }
  writeBrowserStorageValue(adminStorageKeys.appLocalUpdatedAt, updatedAt ?? new Date().toISOString(), failedLocalKeys);

  return { changed, snapshot, cache, failedLocalKeys };
}

export async function savePtoDatabaseSnapshot(
  state: DataPtoState,
  expectedUpdatedAt: string | null,
  options: { yearScope?: string | null } = {},
) {
  const { savePtoStateToDatabase } = await import("@/lib/data/pto");
  const stateToSave = options.yearScope ? scopePtoStateForYear(state, options.yearScope) : state;
  return savePtoStateToDatabase(stateToSave, { expectedUpdatedAt, yearScope: options.yearScope });
}
