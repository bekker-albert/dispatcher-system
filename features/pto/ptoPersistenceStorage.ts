import type { DataPtoState } from "../../lib/data/pto";
import { adminStorageKeys } from "../../lib/storage/keys";

export type PtoBrowserStorageSnapshot = Record<string, string>;

function ptoBrowserStorageSnapshot(state: DataPtoState): PtoBrowserStorageSnapshot {
  const uiState = state.uiState ?? {};

  return {
    [adminStorageKeys.ptoYears]: JSON.stringify(state.manualYears),
    [adminStorageKeys.ptoPlanRows]: JSON.stringify(state.planRows),
    [adminStorageKeys.ptoSurveyRows]: JSON.stringify(state.surveyRows),
    [adminStorageKeys.ptoOperRows]: JSON.stringify(state.operRows),
    [adminStorageKeys.ptoColumnWidths]: JSON.stringify(uiState.ptoColumnWidths ?? {}),
    [adminStorageKeys.ptoRowHeights]: JSON.stringify(uiState.ptoRowHeights ?? {}),
    [adminStorageKeys.ptoHeaderLabels]: JSON.stringify(uiState.ptoHeaderLabels ?? {}),
    [adminStorageKeys.ptoBucketValues]: JSON.stringify(state.bucketValues ?? {}),
    [adminStorageKeys.ptoBucketRows]: JSON.stringify(state.bucketRows ?? []),
  };
}

export function savePtoStateToBrowserStorage(
  state: DataPtoState,
  markLocalUpdatedAt: boolean,
  previousSnapshot: PtoBrowserStorageSnapshot | null = null,
) {
  const snapshot = ptoBrowserStorageSnapshot(state);
  let changed = false;

  Object.entries(snapshot).forEach(([storageKey, value]) => {
    if (previousSnapshot?.[storageKey] === value) return;
    window.localStorage.setItem(storageKey, value);
    changed = true;
  });

  if (!changed) return { changed, snapshot };

  if (markLocalUpdatedAt) {
    window.localStorage.setItem(adminStorageKeys.ptoLocalUpdatedAt, new Date().toISOString());
  }
  window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());

  return { changed, snapshot };
}

export async function savePtoDatabaseSnapshot(
  state: DataPtoState,
  expectedUpdatedAt: string | null,
  options: { yearScope?: string | null } = {},
) {
  const { savePtoStateToDatabase } = await import("@/lib/data/pto");
  return savePtoStateToDatabase(state, { expectedUpdatedAt, yearScope: options.yearScope });
}
