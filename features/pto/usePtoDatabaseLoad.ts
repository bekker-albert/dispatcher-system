"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { databaseConfigured } from "@/lib/data/config";
import { clientSnapshotRestoreFlagKey, savePtoLocalRecoveryBackup } from "@/lib/storage/client-snapshots";
import { adminStorageKeys } from "@/lib/storage/keys";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";
import {
  normalizeLoadedPtoDatabaseState,
  ptoDatabaseMessages,
  resolvePtoDatabaseLoadResolution,
  serializePtoDatabaseState,
  validatePtoDatabaseLoadState,
  type PtoDatabaseState,
} from "@/features/pto/ptoPersistenceModel";

type MutableRef<T> = {
  current: T;
};

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type PtoDatabaseLoadOptions = {
  adminDataLoaded: boolean;
  ptoDatabaseStateRef: MutableRef<PtoDatabaseState>;
  hasStoredPtoStateRef: MutableRef<boolean>;
  ptoDatabaseLoadedRef: MutableRef<boolean>;
  ptoDatabaseSaveSnapshotRef: MutableRef<string>;
  resetUndoHistoryForExternalRestore: () => void;
  showSaveStatus: ShowSaveStatus;
  setPtoDatabaseReady: Dispatch<SetStateAction<boolean>>;
  setPtoDatabaseMessage: Dispatch<SetStateAction<string>>;
  setPtoSaveRevision: Dispatch<SetStateAction<number>>;
  setPtoManualYears: Dispatch<SetStateAction<string[]>>;
  setPtoPlanRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoOperRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoSurveyRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoBucketValues: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoBucketManualRows: Dispatch<SetStateAction<PtoBucketRow[]>>;
  setPtoTab: Dispatch<SetStateAction<string>>;
  setPtoPlanYear: Dispatch<SetStateAction<string>>;
  setPtoAreaFilter: Dispatch<SetStateAction<string>>;
  setExpandedPtoMonths: Dispatch<SetStateAction<Record<string, boolean>>>;
  setReportColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setReportReasons: Dispatch<SetStateAction<Record<string, string>>>;
  setPtoColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoRowHeights: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoHeaderLabels: Dispatch<SetStateAction<Record<string, string>>>;
};

export function usePtoDatabaseLoad({
  adminDataLoaded,
  ptoDatabaseStateRef,
  hasStoredPtoStateRef,
  ptoDatabaseLoadedRef,
  ptoDatabaseSaveSnapshotRef,
  resetUndoHistoryForExternalRestore,
  showSaveStatus,
  setPtoDatabaseReady,
  setPtoDatabaseMessage,
  setPtoSaveRevision,
  setPtoManualYears,
  setPtoPlanRows,
  setPtoOperRows,
  setPtoSurveyRows,
  setPtoBucketValues,
  setPtoBucketManualRows,
  setPtoTab,
  setPtoPlanYear,
  setPtoAreaFilter,
  setExpandedPtoMonths,
  setReportColumnWidths,
  setReportReasons,
  setPtoColumnWidths,
  setPtoRowHeights,
  setPtoHeaderLabels,
}: PtoDatabaseLoadOptions) {
  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    let cancelled = false;

    async function loadPtoDatabase() {
      if (!databaseConfigured) {
        setPtoDatabaseReady(true);
        setPtoDatabaseMessage(ptoDatabaseMessages.notConfigured);
        return;
      }

      ptoDatabaseLoadedRef.current = false;
      setPtoDatabaseReady(false);
      setPtoDatabaseMessage(ptoDatabaseMessages.loading);

      try {
        const { loadPtoStateFromDatabase } = await import("@/lib/data/pto");
        const databaseState = await loadPtoStateFromDatabase();
        if (cancelled) return;

        validatePtoDatabaseLoadState(databaseState);

        const resolution = resolvePtoDatabaseLoadResolution({
          databaseState,
          currentState: ptoDatabaseStateRef.current,
          hasStoredPtoState: hasStoredPtoStateRef.current,
          localUpdatedAt: window.localStorage.getItem(adminStorageKeys.ptoLocalUpdatedAt),
          shouldRestoreClientSnapshot: window.sessionStorage.getItem(clientSnapshotRestoreFlagKey) === "1",
        });

        if (resolution.kind === "empty-save-local" || resolution.kind === "empty-ready") {
          ptoDatabaseLoadedRef.current = true;
          ptoDatabaseSaveSnapshotRef.current = "";
          setPtoDatabaseReady(true);
          if (resolution.kind === "empty-save-local") {
            setPtoSaveRevision((revision) => revision + 1);
          }
          setPtoDatabaseMessage(resolution.message);
          return;
        }

        if (resolution.kind === "restore-local" || resolution.kind === "keep-local") {
          if (resolution.kind === "restore-local") {
            window.sessionStorage.removeItem(clientSnapshotRestoreFlagKey);
          }
          savePtoLocalRecoveryBackup(resolution.backupReason, databaseState?.updatedAt);
          ptoDatabaseLoadedRef.current = true;
          ptoDatabaseSaveSnapshotRef.current = "";
          setPtoDatabaseReady(true);
          setPtoSaveRevision((revision) => revision + 1);
          setPtoDatabaseMessage(resolution.message);
          return;
        }

        if (!databaseState) return;

        if (resolution.backupReason) {
          savePtoLocalRecoveryBackup(resolution.backupReason, databaseState.updatedAt);
        }

        const loadedState = normalizeLoadedPtoDatabaseState(databaseState, ptoDatabaseStateRef.current);

        ptoDatabaseLoadedRef.current = true;
        resetUndoHistoryForExternalRestore();
        ptoDatabaseSaveSnapshotRef.current = serializePtoDatabaseState(loadedState.snapshotState);
        setPtoManualYears(loadedState.manualYears);
        setPtoPlanRows(loadedState.planRows);
        setPtoOperRows(loadedState.operRows);
        setPtoSurveyRows(loadedState.surveyRows);
        setPtoBucketValues(loadedState.bucketValues);
        setPtoBucketManualRows(loadedState.bucketRows);
        if (loadedState.uiState.ptoTab) setPtoTab(loadedState.uiState.ptoTab);
        if (loadedState.uiState.ptoPlanYear) setPtoPlanYear(loadedState.uiState.ptoPlanYear);
        if (loadedState.uiState.ptoAreaFilter) setPtoAreaFilter(loadedState.uiState.ptoAreaFilter);
        setExpandedPtoMonths(loadedState.uiState.expandedPtoMonths);
        setReportColumnWidths(loadedState.uiState.reportColumnWidths);
        setReportReasons(loadedState.uiState.reportReasons);
        setPtoColumnWidths(loadedState.uiState.ptoColumnWidths);
        setPtoRowHeights(loadedState.uiState.ptoRowHeights);
        setPtoHeaderLabels(loadedState.uiState.ptoHeaderLabels);
        setPtoDatabaseReady(true);
        setPtoDatabaseMessage(ptoDatabaseMessages.loaded);
      } catch (error) {
        if (!cancelled) {
          ptoDatabaseLoadedRef.current = false;
          setPtoDatabaseReady(true);
          const message = ptoDatabaseMessages.loadError(errorToMessage(error));
          setPtoDatabaseMessage(message);
          showSaveStatus("error", message);
        }
      }
    }

    void loadPtoDatabase();

    return () => {
      cancelled = true;
    };
  }, [
    adminDataLoaded,
    hasStoredPtoStateRef,
    ptoDatabaseLoadedRef,
    ptoDatabaseSaveSnapshotRef,
    ptoDatabaseStateRef,
    resetUndoHistoryForExternalRestore,
    setExpandedPtoMonths,
    setPtoAreaFilter,
    setPtoBucketManualRows,
    setPtoBucketValues,
    setPtoColumnWidths,
    setPtoDatabaseMessage,
    setPtoDatabaseReady,
    setPtoHeaderLabels,
    setPtoManualYears,
    setPtoOperRows,
    setPtoPlanRows,
    setPtoPlanYear,
    setPtoRowHeights,
    setPtoSaveRevision,
    setPtoSurveyRows,
    setPtoTab,
    setReportColumnWidths,
    setReportReasons,
    showSaveStatus,
  ]);
}
