import type { Dispatch, SetStateAction } from "react";
import {
  createPtoDatabaseSaveBaseline,
  readPtoDatabaseSaveBaseline,
  serializePtoDatabaseState,
  type NormalizedPtoDatabaseLoadState,
} from "@/features/pto/ptoPersistenceModel";
import type { PtoDatabaseLoadOptions } from "@/features/pto/ptoDatabaseLoadTypes";

type ApplyLoadedPtoDatabaseStateOptions = Pick<
  PtoDatabaseLoadOptions,
  | "ptoPlanYear"
  | "ptoDatabaseLoadedRef"
  | "ptoDatabaseLoadedYearRef"
  | "ptoDatabaseSaveSnapshotRef"
  | "resetUndoHistoryForExternalRestore"
  | "setPtoManualYears"
  | "setPtoPlanRows"
  | "setPtoOperRows"
  | "setPtoSurveyRows"
  | "setPtoBucketValues"
  | "setPtoBucketManualRows"
  | "setPtoTab"
  | "setPtoAreaFilter"
  | "setExpandedPtoMonths"
  | "setReportColumnWidths"
  | "setReportReasons"
  | "setPtoColumnWidths"
  | "setPtoRowHeights"
  | "setPtoHeaderLabels"
  | "setPtoDatabaseReady"
  | "setPtoDatabaseMessage"
> & {
  applyRequestedPlanYear: () => void;
  databaseUpdatedAt: string | null | undefined;
  loadedState: NormalizedPtoDatabaseLoadState;
  loadedMessage: string;
  applySavedPtoTab: boolean;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
};

export function applyLegacyReportFallback<T extends Record<string, string | number>>(
  setState: Dispatch<SetStateAction<T>>,
  fallbackState: T,
) {
  if (Object.keys(fallbackState).length === 0) return;

  setState((currentState) => (
    Object.keys(currentState).length > 0 ? currentState : fallbackState
  ));
}

export function createPtoDatabaseLoadBaselineWithBuckets(
  currentBaseline: string,
  bucketRows: unknown,
  bucketValues: unknown,
  updatedAt: string | null,
) {
  const baseline = readPtoDatabaseSaveBaseline(currentBaseline);
  let snapshot = {};
  try {
    snapshot = baseline.snapshot ? JSON.parse(baseline.snapshot) : {};
  } catch {
    snapshot = {};
  }

  return createPtoDatabaseSaveBaseline(JSON.stringify({
    ...snapshot,
    bucketRows,
    bucketValues,
  }), updatedAt);
}

function schedulePtoDatabaseLoadBaseline(callback: () => void) {
  if (typeof window === "undefined") {
    callback();
    return;
  }

  const idleWindow = window as IdleWindow;
  if (typeof idleWindow.requestIdleCallback === "function") {
    idleWindow.requestIdleCallback(callback, { timeout: 2000 });
    return;
  }

  window.setTimeout(callback, 0);
}

function setDeferredPtoDatabaseLoadBaseline({
  ptoDatabaseSaveSnapshotRef,
  snapshotState,
  updatedAt,
}: {
  ptoDatabaseSaveSnapshotRef: Pick<PtoDatabaseLoadOptions, "ptoDatabaseSaveSnapshotRef">["ptoDatabaseSaveSnapshotRef"];
  snapshotState: NormalizedPtoDatabaseLoadState["snapshotState"];
  updatedAt: string | null;
}) {
  const placeholderBaseline = createPtoDatabaseSaveBaseline("", updatedAt);
  ptoDatabaseSaveSnapshotRef.current = placeholderBaseline;

  schedulePtoDatabaseLoadBaseline(() => {
    if (ptoDatabaseSaveSnapshotRef.current !== placeholderBaseline) return;

    ptoDatabaseSaveSnapshotRef.current = createPtoDatabaseSaveBaseline(
      serializePtoDatabaseState(snapshotState),
      updatedAt,
    );
  });
}

export function applyLoadedPtoDatabaseState(options: ApplyLoadedPtoDatabaseStateOptions) {
  const {
    applyRequestedPlanYear,
    applySavedPtoTab,
    databaseUpdatedAt,
    loadedMessage,
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
    setPtoAreaFilter,
    setExpandedPtoMonths,
    setReportColumnWidths,
    setReportReasons,
    setPtoColumnWidths,
    setPtoRowHeights,
    setPtoHeaderLabels,
    setPtoDatabaseReady,
    setPtoDatabaseMessage,
  } = options;

  ptoDatabaseLoadedRef.current = true;
  ptoDatabaseLoadedYearRef.current = ptoPlanYear;
  resetUndoHistoryForExternalRestore();
  setDeferredPtoDatabaseLoadBaseline({
    ptoDatabaseSaveSnapshotRef,
    snapshotState: loadedState.snapshotState,
    updatedAt: databaseUpdatedAt ?? null,
  });
  setPtoManualYears(loadedState.manualYears);
  setPtoPlanRows(loadedState.planRows);
  setPtoOperRows(loadedState.operRows);
  setPtoSurveyRows(loadedState.surveyRows);
  setPtoBucketValues(loadedState.bucketValues);
  setPtoBucketManualRows(loadedState.bucketRows);
  if (applySavedPtoTab && loadedState.uiState.ptoTab) setPtoTab(loadedState.uiState.ptoTab);
  // The database load is scoped to the year requested by the current screen.
  // Do not overwrite that selection with the last saved UI year, otherwise switching
  // to an older/newer year can immediately jump back and trigger a second load.
  applyRequestedPlanYear();
  if (loadedState.uiState.ptoAreaFilter) setPtoAreaFilter(loadedState.uiState.ptoAreaFilter);
  setExpandedPtoMonths(loadedState.uiState.expandedPtoMonths);
  applyLegacyReportFallback(setReportColumnWidths, loadedState.reportFallbackState.reportColumnWidths);
  applyLegacyReportFallback(setReportReasons, loadedState.reportFallbackState.reportReasons);
  setPtoColumnWidths(loadedState.uiState.ptoColumnWidths);
  setPtoRowHeights(loadedState.uiState.ptoRowHeights);
  setPtoHeaderLabels(loadedState.uiState.ptoHeaderLabels);
  setPtoDatabaseReady(true);
  setPtoDatabaseMessage(loadedMessage);
}
