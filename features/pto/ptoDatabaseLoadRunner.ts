"use client";

import { databaseConfigured } from "@/lib/data/config";
import { clientSnapshotRestoreFlagKey, savePtoLocalRecoveryBackup } from "@/lib/storage/client-snapshots";
import { adminStorageKeys } from "@/lib/storage/keys";
import { errorToMessage } from "@/lib/utils/normalizers";
import {
  applyLoadedPtoDatabaseState,
  createPtoDatabaseLoadBaselineWithBuckets,
} from "@/features/pto/ptoDatabaseLoadApply";
import type { PtoDatabaseLoadOptions } from "@/features/pto/ptoDatabaseLoadTypes";
import {
  createPtoDatabaseSaveBaseline,
  localPtoCanSkipFullDatabaseLoad,
  localPtoNeedsDatabaseFreshnessCheck,
  normalizeLoadedPtoDatabaseState,
  ptoDatabaseMessages,
  resolvePtoDatabaseLoadResolution,
  validatePtoDatabaseLoadState,
} from "@/features/pto/ptoPersistenceModel";

export type PtoDatabaseLoadRunOptions = PtoDatabaseLoadOptions & {
  isCancelled: () => boolean;
};

export async function runPtoDatabaseLoadOnce(options: PtoDatabaseLoadRunOptions) {
  const {
    isCancelled,
    ptoTab,
    ptoPlanYear,
    ptoDatabaseStateRef,
    hasStoredPtoStateRef,
    ptoDatabaseLoadedRef,
    ptoDatabaseLoadedYearRef,
    ptoDatabaseLoadedBucketsYearRef,
    ptoDatabaseFullSaveNextRef,
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
  } = options;

  const includeBuckets = ptoTab === "buckets";
  const currentYearLoaded = ptoDatabaseLoadedRef.current && ptoDatabaseLoadedYearRef.current === ptoPlanYear;
  const currentYearBucketsLoaded = ptoDatabaseLoadedBucketsYearRef.current === ptoPlanYear;
  if (currentYearLoaded && (!includeBuckets || currentYearBucketsLoaded)) {
    setPtoDatabaseReady(true);
    return;
  }

  if (!databaseConfigured) {
    setPtoDatabaseReady(true);
    ptoDatabaseLoadedYearRef.current = ptoPlanYear;
    ptoDatabaseLoadedBucketsYearRef.current = includeBuckets ? ptoPlanYear : null;
    setPtoDatabaseMessage(ptoDatabaseMessages.notConfigured);
    return;
  }

  if (currentYearLoaded && includeBuckets && !currentYearBucketsLoaded) {
    setPtoDatabaseReady(false);
    setPtoDatabaseMessage(ptoDatabaseMessages.loading);

    try {
      const { loadPtoBucketsFromDatabase } = await import("@/lib/data/pto");
      const bucketState = await loadPtoBucketsFromDatabase();
      if (isCancelled()) return;

      setPtoBucketManualRows(bucketState.bucketRows);
      setPtoBucketValues(bucketState.bucketValues);
      ptoDatabaseLoadedRef.current = true;
      ptoDatabaseLoadedYearRef.current = ptoPlanYear;
      ptoDatabaseLoadedBucketsYearRef.current = ptoPlanYear;
      ptoDatabaseSaveSnapshotRef.current = createPtoDatabaseLoadBaselineWithBuckets(
        ptoDatabaseSaveSnapshotRef.current,
        bucketState.bucketRows,
        bucketState.bucketValues,
        bucketState.updatedAt ?? null,
      );
      setPtoDatabaseReady(true);
      setPtoDatabaseMessage(ptoDatabaseMessages.loaded);
    } catch (error) {
      if (!isCancelled()) {
        ptoDatabaseLoadedBucketsYearRef.current = null;
        setPtoDatabaseReady(true);
        const message = ptoDatabaseMessages.loadError(errorToMessage(error));
        setPtoDatabaseMessage(message);
        showSaveStatus("error", message);
      }
    }
    return;
  }

  ptoDatabaseLoadedRef.current = false;
  ptoDatabaseLoadedYearRef.current = null;
  ptoDatabaseLoadedBucketsYearRef.current = null;
  setPtoDatabaseReady(false);
  setPtoDatabaseMessage(ptoDatabaseMessages.loading);

  try {
    const { loadPtoStateFromDatabase, loadPtoUpdatedAtFromDatabase } = await import("@/lib/data/pto");
    const localUpdatedAt = window.localStorage.getItem(adminStorageKeys.ptoLocalUpdatedAt);
    if (localPtoNeedsDatabaseFreshnessCheck({
      currentState: ptoDatabaseStateRef.current,
      hasStoredPtoState: hasStoredPtoStateRef.current,
      localUpdatedAt,
    })) {
      const databaseUpdatedAt = await loadPtoUpdatedAtFromDatabase();
      if (isCancelled()) return;

      if (localPtoCanSkipFullDatabaseLoad({
        currentState: ptoDatabaseStateRef.current,
        hasStoredPtoState: hasStoredPtoStateRef.current,
        localUpdatedAt,
        databaseUpdatedAt,
      })) {
        savePtoLocalRecoveryBackup("local-pto-newer-than-database", databaseUpdatedAt ?? null);
        ptoDatabaseLoadedRef.current = true;
        ptoDatabaseLoadedYearRef.current = ptoPlanYear;
        ptoDatabaseLoadedBucketsYearRef.current = includeBuckets ? ptoPlanYear : null;
        ptoDatabaseFullSaveNextRef.current = true;
        ptoDatabaseSaveSnapshotRef.current = createPtoDatabaseSaveBaseline("", databaseUpdatedAt ?? null);
        setPtoDatabaseReady(true);
        setPtoSaveRevision((revision) => revision + 1);
        setPtoDatabaseMessage(ptoDatabaseMessages.localNewer);
        return;
      }
    }

    const databaseState = await loadPtoStateFromDatabase({ year: ptoPlanYear, includeBuckets });
    if (isCancelled()) return;

    validatePtoDatabaseLoadState(databaseState);

    const resolution = resolvePtoDatabaseLoadResolution({
      databaseState,
      currentState: ptoDatabaseStateRef.current,
      hasStoredPtoState: hasStoredPtoStateRef.current,
      localUpdatedAt,
      shouldRestoreClientSnapshot: window.sessionStorage.getItem(clientSnapshotRestoreFlagKey) === "1",
    });

    if (resolution.kind === "empty-save-local" || resolution.kind === "empty-ready") {
      ptoDatabaseLoadedRef.current = true;
      ptoDatabaseLoadedYearRef.current = ptoPlanYear;
      ptoDatabaseLoadedBucketsYearRef.current = includeBuckets ? ptoPlanYear : null;
      ptoDatabaseFullSaveNextRef.current = resolution.kind === "empty-save-local";
      ptoDatabaseSaveSnapshotRef.current = createPtoDatabaseSaveBaseline("", null);
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
      ptoDatabaseLoadedYearRef.current = ptoPlanYear;
      ptoDatabaseLoadedBucketsYearRef.current = includeBuckets ? ptoPlanYear : null;
      ptoDatabaseFullSaveNextRef.current = true;
      ptoDatabaseSaveSnapshotRef.current = createPtoDatabaseSaveBaseline("", databaseState?.updatedAt ?? null);
      setPtoDatabaseReady(true);
      setPtoSaveRevision((revision) => revision + 1);
      setPtoDatabaseMessage(resolution.message);
      return;
    }

    if (!databaseState) return;
    ptoDatabaseFullSaveNextRef.current = false;

    if (resolution.backupReason) {
      savePtoLocalRecoveryBackup(resolution.backupReason, databaseState.updatedAt);
    }

    const loadedState = normalizeLoadedPtoDatabaseState(databaseState, ptoDatabaseStateRef.current, {
      preserveFallbackBuckets: !includeBuckets,
    });

    applyLoadedPtoDatabaseState({
      applySavedPtoTab: !currentYearLoaded,
      databaseUpdatedAt: databaseState.updatedAt,
      loadedMessage: ptoDatabaseMessages.loaded,
      loadedState,
      ptoPlanYear,
      ptoDatabaseLoadedRef,
      ptoDatabaseLoadedYearRef,
      ptoDatabaseSaveSnapshotRef,
      resetUndoHistoryForExternalRestore,
      setPtoManualYears,
      setPtoPlanRows,
      setPtoOperRows,
      setPtoSurveyRows,
      setPtoBucketValues,
      setPtoBucketManualRows,
      setPtoTab,
      applyRequestedPlanYear: () => setPtoPlanYear(ptoPlanYear),
      setPtoAreaFilter,
      setExpandedPtoMonths,
      setReportColumnWidths,
      setReportReasons,
      setPtoColumnWidths,
      setPtoRowHeights,
      setPtoHeaderLabels,
      setPtoDatabaseReady,
      setPtoDatabaseMessage,
    });
    ptoDatabaseLoadedBucketsYearRef.current = includeBuckets ? ptoPlanYear : null;
  } catch (error) {
    if (!isCancelled()) {
      ptoDatabaseLoadedRef.current = false;
      ptoDatabaseLoadedYearRef.current = null;
      ptoDatabaseLoadedBucketsYearRef.current = null;
      setPtoDatabaseReady(true);
      const message = ptoDatabaseMessages.loadError(errorToMessage(error));
      setPtoDatabaseMessage(message);
      showSaveStatus("error", message);
    }
  }
}
