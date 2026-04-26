"use client";

import { defaultSubTabs } from "@/features/app/appDefaults";
import { useInitialAppDataLoad } from "@/features/app/useInitialAppDataLoad";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;

type UseAppInitialDataLoadControllerOptions = {
  appState: AppStateBundle;
};

export function useAppInitialDataLoadController({
  appState,
}: UseAppInitialDataLoadControllerOptions) {
  useInitialAppDataLoad({
    defaultSubTabs,
    saveClientSnapshotToDatabase: appState.saveClientSnapshotToDatabase,
    restoreAdminLogs: appState.restoreAdminLogs,
    appDatabaseSaveSnapshotRef: appState.appDatabaseSaveSnapshotRef,
    appSettingsDatabaseLoadedRef: appState.appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef: appState.appSettingsDatabaseSaveSnapshotRef,
    vehiclesDatabaseLoadedRef: appState.vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef: appState.vehiclesDatabaseSaveSnapshotRef,
    hasStoredPtoStateRef: appState.hasStoredPtoStateRef,
    setAdminDataLoaded: appState.setAdminDataLoaded,
    setReportCustomers: appState.setReportCustomers,
    setReportAreaOrder: appState.setReportAreaOrder,
    setReportWorkOrder: appState.setReportWorkOrder,
    setReportHeaderLabels: appState.setReportHeaderLabels,
    setReportColumnWidths: appState.setReportColumnWidths,
    setReportReasons: appState.setReportReasons,
    setAreaShiftCutoffs: appState.setAreaShiftCutoffs,
    setCustomTabs: appState.setCustomTabs,
    setTopTabs: appState.setTopTabs,
    setSubTabs: appState.setSubTabs,
    setVehicleRows: appState.setVehicleRows,
    setDispatchSummaryRows: appState.setDispatchSummaryRows,
    setPtoManualYears: appState.setPtoManualYears,
    setPtoPlanRows: appState.setPtoPlanRows,
    setPtoSurveyRows: appState.setPtoSurveyRows,
    setPtoOperRows: appState.setPtoOperRows,
    setPtoColumnWidths: appState.setPtoColumnWidths,
    setPtoRowHeights: appState.setPtoRowHeights,
    setPtoHeaderLabels: appState.setPtoHeaderLabels,
    setPtoBucketValues: appState.setPtoBucketValues,
    setPtoBucketManualRows: appState.setPtoBucketManualRows,
    setOrgMembers: appState.setOrgMembers,
    setDependencyNodes: appState.setDependencyNodes,
    setDependencyLinks: appState.setDependencyLinks,
    setDependencyLinkForm: appState.setDependencyLinkForm,
  });
}
