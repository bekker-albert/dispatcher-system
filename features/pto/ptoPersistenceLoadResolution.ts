import type { DataPtoState } from "../../lib/data/pto";
import { countPtoStateData } from "../../lib/domain/pto/state-stats";
import { ptoDatabaseMessages } from "./ptoPersistenceMessages";
import type { PtoDatabaseLoadResolution } from "./ptoPersistenceTypes";

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

export function localPtoCanSkipFullDatabaseLoad({
  currentState,
  hasStoredPtoState,
  localUpdatedAt,
  databaseUpdatedAt,
}: {
  currentState: DataPtoState;
  hasStoredPtoState: boolean;
  localUpdatedAt: string | null;
  databaseUpdatedAt: string | null | undefined;
}) {
  if (databaseUpdatedAt === undefined) return false;

  const localUpdatedTime = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;
  const databaseUpdatedTime = databaseUpdatedAt ? Date.parse(databaseUpdatedAt) : 0;
  const localPtoStats = countPtoStateData(currentState);

  return hasStoredPtoState
    && localPtoStats.total > 0
    && localUpdatedTime > 0
    && localUpdatedTime > databaseUpdatedTime;
}

export function localPtoNeedsDatabaseFreshnessCheck({
  currentState,
  hasStoredPtoState,
  localUpdatedAt,
}: {
  currentState: DataPtoState;
  hasStoredPtoState: boolean;
  localUpdatedAt: string | null;
}) {
  const localUpdatedTime = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;
  if (!hasStoredPtoState || localUpdatedTime <= 0) return false;

  return countPtoStateData(currentState).total > 0;
}
