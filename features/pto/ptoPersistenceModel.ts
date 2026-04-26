import type { DataPtoState } from "@/lib/data/pto";
import { normalizePtoBucketManualRows, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import { normalizePtoPlanRow, normalizeStoredPtoYears, type PtoPlanRow } from "@/lib/domain/pto/date-table";
import { countPtoStateData } from "@/lib/domain/pto/state-stats";
import { adminStorageKeys } from "@/lib/storage/keys";
import { isRecord, normalizeDecimalRecord, normalizeNumberRecord, normalizeStringRecord } from "@/lib/utils/normalizers";

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

export type PtoDatabaseLoadResolution =
  | {
    kind: "empty-save-local";
    message: string;
  }
  | {
    kind: "empty-ready";
    message: string;
  }
  | {
    kind: "restore-local";
    backupReason: string;
    message: string;
  }
  | {
    kind: "keep-local";
    backupReason: string;
    message: string;
  }
  | {
    kind: "use-database";
    backupReason?: string;
  };

export type NormalizedPtoDatabaseLoadState = {
  manualYears: string[];
  planRows: PtoPlanRow[];
  operRows: PtoPlanRow[];
  surveyRows: PtoPlanRow[];
  bucketValues: Record<string, number>;
  bucketRows: PtoBucketRow[];
  uiState: {
    ptoTab?: string;
    ptoPlanYear?: string;
    ptoAreaFilter?: string;
    expandedPtoMonths: Record<string, boolean>;
    reportColumnWidths: Record<string, number>;
    reportReasons: Record<string, string>;
    ptoColumnWidths: Record<string, number>;
    ptoRowHeights: Record<string, number>;
    ptoHeaderLabels: Record<string, string>;
  };
  snapshotState: PtoDatabaseState;
};

export const ptoDatabaseMessages = {
  notConfigured: "База данных не настроена.",
  loading: "Загружаю ПТО из базы данных...",
  invalidShape: "Сервер вернул не таблицу ПТО. Обнови страницу через Ctrl+F5 и повтори вход.",
  emptySaveLocal: "В базе данных ПТО нет - оставил локальные данные и поставил сохранение в базу.",
  emptyReady: "База подключена. Данных ПТО пока нет - внеси изменение, оно сохранится автоматически.",
  restoredLocal: "Локальные данные ПТО восстановлены из снимка и поставлены на сохранение в базу данных.",
  localNewer: "Локальные данные ПТО новее базы - оставил их и поставил сохранение на сервер.",
  loaded: "ПТО загружено из базы данных.",
  loadError: (message: string) => `Не удалось загрузить ПТО из базы данных: ${message}`,
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

export function validatePtoDatabaseLoadState(state: DataPtoState | null) {
  if (
    state
    && (
      !Array.isArray(state.manualYears)
      || !Array.isArray(state.planRows)
      || !Array.isArray(state.operRows)
      || !Array.isArray(state.surveyRows)
    )
  ) {
    throw new Error(ptoDatabaseMessages.invalidShape);
  }
}

export function resolvePtoDatabaseLoadResolution({
  databaseState,
  currentState,
  hasStoredPtoState,
  localUpdatedAt,
  shouldRestoreClientSnapshot,
}: {
  databaseState: DataPtoState | null;
  currentState: DataPtoState;
  hasStoredPtoState: boolean;
  localUpdatedAt: string | null;
  shouldRestoreClientSnapshot: boolean;
}): PtoDatabaseLoadResolution {
  if (!databaseState) {
    return hasStoredPtoState
      ? { kind: "empty-save-local", message: ptoDatabaseMessages.emptySaveLocal }
      : { kind: "empty-ready", message: ptoDatabaseMessages.emptyReady };
  }

  const localUpdatedTime = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;
  const databaseUpdatedTime = databaseState.updatedAt ? Date.parse(databaseState.updatedAt) : 0;
  const localPtoStats = countPtoStateData(currentState);
  const databasePtoStats = countPtoStateData(databaseState);
  const hasLocalData = hasStoredPtoState && localPtoStats.total > 0;

  if (
    shouldRestoreClientSnapshot
    && hasLocalData
    && (localPtoStats.total >= databasePtoStats.total || localUpdatedTime >= databaseUpdatedTime)
  ) {
    return {
      kind: "restore-local",
      backupReason: "restored-client-snapshot-to-database",
      message: ptoDatabaseMessages.restoredLocal,
    };
  }

  if (hasLocalData && localUpdatedTime > 0 && localUpdatedTime > databaseUpdatedTime) {
    return {
      kind: "keep-local",
      backupReason: "local-pto-newer-than-database",
      message: ptoDatabaseMessages.localNewer,
    };
  }

  return {
    kind: "use-database",
    backupReason: hasLocalData ? "before-database-pto-load" : undefined,
  };
}

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

export function normalizeLoadedPtoDatabaseState(
  databaseState: DataPtoState,
  fallbackState: PtoDatabaseState,
): NormalizedPtoDatabaseLoadState {
  const nextUiState = databaseState.uiState ?? {};
  const fallbackUiState = fallbackState.uiState;
  const expandedPtoMonths = isRecord(nextUiState.expandedPtoMonths)
    ? Object.fromEntries(
      Object.entries(nextUiState.expandedPtoMonths).filter((entry): entry is [string, boolean] => typeof entry[0] === "string" && typeof entry[1] === "boolean"),
    )
    : fallbackUiState.expandedPtoMonths ?? {};
  const manualYears = normalizeStoredPtoYears(databaseState.manualYears);
  const planRows = databaseState.planRows.map((row) => normalizePtoPlanRow(row));
  const operRows = databaseState.operRows.map((row) => normalizePtoPlanRow(row));
  const surveyRows = databaseState.surveyRows.map((row) => normalizePtoPlanRow(row));
  const bucketValues = normalizeDecimalRecord(databaseState.bucketValues, 0, 100000);
  const bucketRows = normalizePtoBucketManualRows(databaseState.bucketRows);
  const uiState = {
    ptoTab: typeof nextUiState.ptoTab === "string" ? nextUiState.ptoTab : fallbackUiState.ptoTab,
    ptoPlanYear: typeof nextUiState.ptoPlanYear === "string" ? nextUiState.ptoPlanYear : fallbackUiState.ptoPlanYear,
    ptoAreaFilter: typeof nextUiState.ptoAreaFilter === "string" ? nextUiState.ptoAreaFilter : fallbackUiState.ptoAreaFilter,
    expandedPtoMonths,
    reportColumnWidths: normalizeNumberRecord(nextUiState.reportColumnWidths ?? fallbackUiState.reportColumnWidths, 42, 520),
    reportReasons: normalizeStringRecord(nextUiState.reportReasons ?? fallbackUiState.reportReasons),
    ptoColumnWidths: normalizeNumberRecord(nextUiState.ptoColumnWidths ?? fallbackUiState.ptoColumnWidths, 44, 800),
    ptoRowHeights: normalizeNumberRecord(nextUiState.ptoRowHeights ?? fallbackUiState.ptoRowHeights, 28, 180),
    ptoHeaderLabels: normalizeStringRecord(nextUiState.ptoHeaderLabels ?? fallbackUiState.ptoHeaderLabels),
  };
  const snapshotState = createPtoDatabaseState({
    manualYears,
    planRows,
    operRows,
    surveyRows,
    bucketValues,
    bucketRows,
    uiState,
  });

  return {
    manualYears,
    planRows,
    operRows,
    surveyRows,
    bucketValues,
    bucketRows,
    uiState,
    snapshotState,
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
