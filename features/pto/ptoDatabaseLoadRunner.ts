"use client";

import { databaseConfigured } from "@/lib/data/config";
import { clientSnapshotRestoreFlagKey, savePtoLocalRecoveryBackup } from "@/lib/storage/client-snapshots";
import { adminStorageKeys } from "@/lib/storage/keys";
import { errorToMessage } from "@/lib/utils/normalizers";
import { hasInitialStoredPtoState, readInitialStoredPtoState } from "@/features/app/initialAppStorage";
import { applyInitialPtoState } from "@/features/pto/applyInitialPtoState";
import { buildInitialPtoState } from "@/features/pto/initialPtoState";
import {
  applyLoadedPtoDatabaseState,
  createPtoDatabaseLoadBaselineWithBuckets,
} from "@/features/pto/ptoDatabaseLoadApply";
import { createPtoDatabaseLoadMetrics } from "@/features/pto/ptoDatabaseLoadMetrics";
import type { PtoDatabaseLoadOptions } from "@/features/pto/ptoDatabaseLoadTypes";
import {
  createPtoDatabaseState,
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
  const loadMetrics = createPtoDatabaseLoadMetrics({ includeBuckets, year: ptoPlanYear });
  let localPtoStateForResolution = ptoDatabaseStateRef.current;
  let localPtoHydrated = false;

  const hydrateInitialLocalPtoState = () => {
    if (localPtoHydrated) return localPtoStateForResolution;
    localPtoHydrated = true;

    if (!hasInitialStoredPtoState()) {
      hasStoredPtoStateRef.current = false;
      return localPtoStateForResolution;
    }

    const localInitialPtoState = buildInitialPtoState(readInitialStoredPtoState());
    if (!localInitialPtoState.hasSavedPtoState) {
      hasStoredPtoStateRef.current = false;
      return localPtoStateForResolution;
    }

    const currentState = ptoDatabaseStateRef.current;
    const nextLocalPtoState = createPtoDatabaseState({
      manualYears: localInitialPtoState.manualYears ?? currentState.manualYears,
      planRows: localInitialPtoState.planRows ?? currentState.planRows,
      operRows: localInitialPtoState.operRows ?? currentState.operRows,
      surveyRows: localInitialPtoState.surveyRows ?? currentState.surveyRows,
      bucketValues: localInitialPtoState.bucketValues,
      bucketRows: localInitialPtoState.bucketRows,
      uiState: {
        ...currentState.uiState,
        ptoColumnWidths: localInitialPtoState.columnWidths,
        ptoRowHeights: localInitialPtoState.rowHeights,
        ptoHeaderLabels: localInitialPtoState.headerLabels,
      },
    });

    localPtoStateForResolution = nextLocalPtoState;
    ptoDatabaseStateRef.current = nextLocalPtoState;
    applyInitialPtoState(localInitialPtoState, {
      hasStoredPtoStateRef,
      setPtoManualYears,
      setPtoPlanRows,
      setPtoSurveyRows,
      setPtoOperRows,
      setPtoColumnWidths,
      setPtoRowHeights,
      setPtoHeaderLabels,
      setPtoBucketValues,
      setPtoBucketManualRows,
    });

    return nextLocalPtoState;
  };

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
      loadMetrics.mark("bucket-module-loaded");
      const bucketState = await loadPtoBucketsFromDatabase();
      if (isCancelled()) return;
      loadMetrics.mark("bucket-state-loaded", {
        bucketRows: bucketState.bucketRows.length,
        bucketValues: Object.keys(bucketState.bucketValues).length,
      });

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
      loadMetrics.finish({ mode: "buckets" });
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
    loadMetrics.mark("pto-module-loaded");
    const localUpdatedAt = window.localStorage.getItem(adminStorageKeys.ptoLocalUpdatedAt);
    const hasLocalPtoSnapshot = hasStoredPtoStateRef.current || hasInitialStoredPtoState();
    if (
      hasLocalPtoSnapshot
      && (
        Boolean(localUpdatedAt)
        || localPtoNeedsDatabaseFreshnessCheck({
          currentState: ptoDatabaseStateRef.current,
          hasStoredPtoState: hasLocalPtoSnapshot,
          localUpdatedAt,
        })
      )
    ) {
      const databaseUpdatedAt = await loadPtoUpdatedAtFromDatabase();
      if (isCancelled()) return;
      loadMetrics.mark("freshness-checked", { databaseUpdatedAt: databaseUpdatedAt ?? null });

      const localUpdatedTime = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;
      const databaseUpdatedTime = databaseUpdatedAt ? Date.parse(databaseUpdatedAt) : 0;
      if (databaseUpdatedAt !== undefined && localUpdatedTime > 0 && localUpdatedTime > databaseUpdatedTime) {
        hydrateInitialLocalPtoState();
      }

      if (localPtoCanSkipFullDatabaseLoad({
        currentState: localPtoStateForResolution,
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
        loadMetrics.finish({ mode: "local-newer" });
        return;
      }
    }

    const databaseState = await loadPtoStateFromDatabase({ year: ptoPlanYear, includeBuckets });
    if (isCancelled()) return;
    loadMetrics.mark("year-state-loaded", {
      planRows: databaseState?.planRows.length ?? 0,
      operRows: databaseState?.operRows.length ?? 0,
      surveyRows: databaseState?.surveyRows.length ?? 0,
      bucketRows: databaseState?.bucketRows?.length ?? 0,
      bucketValues: databaseState?.bucketValues ? Object.keys(databaseState.bucketValues).length : 0,
    });

    validatePtoDatabaseLoadState(databaseState);

    const shouldRestoreClientSnapshot = window.sessionStorage.getItem(clientSnapshotRestoreFlagKey) === "1";
    const localUpdatedTime = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;
    const databaseUpdatedTime = databaseState?.updatedAt ? Date.parse(databaseState.updatedAt) : 0;
    const shouldHydrateLocalPtoForResolution = hasLocalPtoSnapshot && (
      !databaseState
      || shouldRestoreClientSnapshot
      || (localUpdatedTime > 0 && localUpdatedTime > databaseUpdatedTime)
    );
    if (shouldHydrateLocalPtoForResolution) {
      hydrateInitialLocalPtoState();
    } else if (hasLocalPtoSnapshot && databaseState) {
      savePtoLocalRecoveryBackup("before-database-pto-load", databaseState.updatedAt);
    }

    const resolution = resolvePtoDatabaseLoadResolution({
      databaseState,
      currentState: localPtoStateForResolution,
      hasStoredPtoState: hasStoredPtoStateRef.current,
      localUpdatedAt,
      shouldRestoreClientSnapshot,
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
      loadMetrics.finish({ mode: resolution.kind });
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
      loadMetrics.finish({ mode: resolution.kind });
      return;
    }

    if (!databaseState) return;
    ptoDatabaseFullSaveNextRef.current = false;

    if (resolution.backupReason) {
      savePtoLocalRecoveryBackup(resolution.backupReason, databaseState.updatedAt);
    }

    const loadedState = normalizeLoadedPtoDatabaseState(databaseState, localPtoStateForResolution, {
      preserveFallbackBuckets: !includeBuckets,
    });
    loadMetrics.mark("state-normalized");

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
    loadMetrics.finish({ mode: "database" });
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
