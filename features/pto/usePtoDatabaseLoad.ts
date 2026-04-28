"use client";

import { useEffect } from "react";
import type { PtoDatabaseLoadOptions } from "@/features/pto/ptoDatabaseLoadTypes";
import { runPtoDatabaseLoadOnce } from "@/features/pto/ptoDatabaseLoadRunner";

export function usePtoDatabaseLoad(options: PtoDatabaseLoadOptions) {
  const {
    adminDataLoaded,
    hasStoredPtoStateRef,
    ptoTab,
    ptoPlanYear,
    ptoDatabaseLoadedRef,
    ptoDatabaseLoadedBucketsYearRef,
    ptoDatabaseLoadedYearRef,
    ptoDatabaseFullSaveNextRef,
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
  } = options;

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    let cancelled = false;
    void runPtoDatabaseLoadOnce({
      adminDataLoaded,
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
      isCancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, [
    adminDataLoaded,
    hasStoredPtoStateRef,
    ptoTab,
    ptoPlanYear,
    ptoDatabaseLoadedRef,
    ptoDatabaseLoadedBucketsYearRef,
    ptoDatabaseLoadedYearRef,
    ptoDatabaseFullSaveNextRef,
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
