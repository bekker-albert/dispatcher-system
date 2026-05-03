"use client";

import { useAppPtoPersistence } from "@/features/app/useAppPtoPersistence";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { databaseConfigured } from "@/lib/data/config";
import { isPtoDateTableKey } from "@/lib/domain/pto/date-table";

type UseAppPtoPersistenceControllerOptions = {
  appState: AppStateBundle;
  resetUndoHistoryForExternalRestore: () => void;
};

export function useAppPtoPersistenceController({
  appState,
  resetUndoHistoryForExternalRestore,
}: UseAppPtoPersistenceControllerOptions) {
  const reportsNeedPtoDatabase = appState.topTab === "reports"
    || (appState.topTab === "admin" && appState.adminSection === "reports");
  const activePtoTabNeedsDatabase = appState.topTab === "pto"
    && (isPtoDateTableKey(appState.ptoTab) || appState.ptoTab === "buckets");
  const ptoDatabaseLoadEnabled = appState.ptoDatabaseLoadStarted
    || (
      appState.ptoBootstrapLoaded
      && (!databaseConfigured || reportsNeedPtoDatabase || activePtoTabNeedsDatabase)
    );
  const ptoPersistenceEnabled = appState.adminDataLoaded
    && (!databaseConfigured || appState.ptoDatabaseReady);

  return useAppPtoPersistence({
    ptoDatabaseLoadEnabled,
    ptoPersistenceEnabled,
    ptoSaveRevision: appState.ptoSaveRevision,
    ptoManualYears: appState.ptoManualYears,
    ptoPlanRows: appState.ptoPlanRows,
    ptoOperRows: appState.ptoOperRows,
    ptoSurveyRows: appState.ptoSurveyRows,
    ptoBucketValues: appState.ptoBucketValues,
    ptoBucketManualRows: appState.ptoBucketManualRows,
    ptoTab: appState.ptoTab,
    ptoPlanYear: appState.ptoPlanYear,
    ptoAreaFilter: appState.ptoAreaFilter,
    expandedPtoMonths: appState.expandedPtoMonths,
    reportColumnWidths: appState.reportColumnWidths,
    reportReasons: appState.reportReasons,
    ptoColumnWidths: appState.ptoColumnWidths,
    ptoRowHeights: appState.ptoRowHeights,
    ptoHeaderLabels: appState.ptoHeaderLabels,
    ptoDatabaseLoadedRef: appState.ptoDatabaseLoadedRef,
    hasStoredPtoStateRef: appState.hasStoredPtoStateRef,
    requestClientSnapshotSave: appState.requestClientSnapshotSave,
    resetUndoHistoryForExternalRestore,
    showSaveStatus: appState.showSaveStatus,
    setPtoDatabaseReady: appState.setPtoDatabaseReady,
    setPtoDatabaseMessage: appState.setPtoDatabaseMessage,
    setPtoSaveRevision: appState.setPtoSaveRevision,
    setPtoManualYears: appState.setPtoManualYears,
    setPtoPlanRows: appState.setPtoPlanRows,
    setPtoOperRows: appState.setPtoOperRows,
    setPtoSurveyRows: appState.setPtoSurveyRows,
    setPtoBucketValues: appState.setPtoBucketValues,
    setPtoBucketManualRows: appState.setPtoBucketManualRows,
    setPtoTab: appState.setPtoTab,
    setPtoPlanYear: appState.setPtoPlanYear,
    setPtoAreaFilter: appState.setPtoAreaFilter,
    setExpandedPtoMonths: appState.setExpandedPtoMonths,
    setReportColumnWidths: appState.setReportColumnWidths,
    setReportReasons: appState.setReportReasons,
    setPtoColumnWidths: appState.setPtoColumnWidths,
    setPtoRowHeights: appState.setPtoRowHeights,
    setPtoHeaderLabels: appState.setPtoHeaderLabels,
  });
}
