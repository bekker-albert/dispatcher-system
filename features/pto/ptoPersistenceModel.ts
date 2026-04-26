import type { DataPtoState } from "@/lib/data/pto";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import { adminStorageKeys } from "@/lib/storage/keys";

export type CreatePtoDatabaseStateOptions = {
  manualYears: string[];
  planRows: PtoPlanRow[];
  operRows: PtoPlanRow[];
  surveyRows: PtoPlanRow[];
  bucketValues: Record<string, number>;
  bucketRows: PtoBucketRow[];
  uiState: NonNullable<DataPtoState["uiState"]>;
};

export type PtoDatabaseState = DataPtoState & {
  uiState: NonNullable<DataPtoState["uiState"]>;
};

export type PtoDatabaseSaveMode = "auto" | "manual";

export const ptoDatabaseMessages = {
  notConfigured: "База данных не настроена.",
  loadingSaveDeferred: "База данных еще загружается. Сохранение ПТО отложено.",
  loadingSaveDeferredStatus: "База еще загружается, сохранение ПТО отложено.",
  alreadySaved: "ПТО сохранено в базе данных.",
  queued: "Есть изменения. Автосохраняю после завершенного действия...",
  saving: "Сохраняю ПТО...",
  savedStatus: "ПТО сохранено.",
  savingState: (mode: PtoDatabaseSaveMode) => mode === "auto" ? "Автосохраняю ПТО в базе данных..." : "Сохраняю ПТО в базе данных...",
  savedState: (mode: PtoDatabaseSaveMode) => mode === "auto" ? "ПТО автосохранено в базе данных." : "ПТО сохранено в базе данных.",
  saveError: (message: string) => `Не удалось сохранить в базе данных: ${message}`,
  saveErrorStatus: (message: string) => `ПТО не сохранено: ${message}`,
};

export function createPtoDatabaseState({
  manualYears,
  planRows,
  operRows,
  surveyRows,
  bucketValues,
  bucketRows,
  uiState,
}: CreatePtoDatabaseStateOptions): PtoDatabaseState {
  return {
    manualYears,
    planRows,
    operRows,
    surveyRows,
    bucketValues,
    bucketRows,
    uiState,
  };
}

export function savePtoStateToBrowserStorage(state: DataPtoState, markLocalUpdatedAt: boolean) {
  const uiState = state.uiState ?? {};

  window.localStorage.setItem(adminStorageKeys.ptoYears, JSON.stringify(state.manualYears));
  window.localStorage.setItem(adminStorageKeys.ptoPlanRows, JSON.stringify(state.planRows));
  window.localStorage.setItem(adminStorageKeys.ptoSurveyRows, JSON.stringify(state.surveyRows));
  window.localStorage.setItem(adminStorageKeys.ptoOperRows, JSON.stringify(state.operRows));
  window.localStorage.setItem(adminStorageKeys.ptoColumnWidths, JSON.stringify(uiState.ptoColumnWidths ?? {}));
  window.localStorage.setItem(adminStorageKeys.ptoRowHeights, JSON.stringify(uiState.ptoRowHeights ?? {}));
  window.localStorage.setItem(adminStorageKeys.ptoHeaderLabels, JSON.stringify(uiState.ptoHeaderLabels ?? {}));
  window.localStorage.setItem(adminStorageKeys.ptoBucketValues, JSON.stringify(state.bucketValues ?? {}));
  window.localStorage.setItem(adminStorageKeys.ptoBucketRows, JSON.stringify(state.bucketRows ?? []));

  if (markLocalUpdatedAt) {
    window.localStorage.setItem(adminStorageKeys.ptoLocalUpdatedAt, new Date().toISOString());
  }
  window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
}

export function serializePtoDatabaseState(state: DataPtoState) {
  return JSON.stringify(state);
}

export function ptoDatabaseStateChanged(state: DataPtoState, savedSnapshot: string) {
  return serializePtoDatabaseState(state) !== savedSnapshot;
}

export function ptoDatabaseSaveShouldSkip(mode: PtoDatabaseSaveMode, snapshotToSave: string, savedSnapshot: string) {
  return mode === "auto" && snapshotToSave === savedSnapshot;
}

export async function savePtoDatabaseSnapshot(state: DataPtoState) {
  const { savePtoStateToDatabase } = await import("@/lib/data/pto");
  await savePtoStateToDatabase(state);
}
