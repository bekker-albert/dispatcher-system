"use client";

import { useMemo } from "react";

import { defaultSubTabs } from "@/features/app/appDefaults";
import { useInitialAppDataLoad } from "@/features/app/useInitialAppDataLoad";
import type { AppStateBundle } from "@/features/app/AppStateBundle";


type UseAppInitialDataLoadControllerOptions = {
  appState: AppStateBundle;
};

export function useAppInitialDataLoadController({
  appState,
}: UseAppInitialDataLoadControllerOptions) {
  const initialLoadOptions = useMemo(() => ({
    defaultSubTabs,
    restoreAdminLogs: appState.restoreAdminLogs,
    databaseRefs: {
      appDatabaseSaveSnapshotRef: appState.appDatabaseSaveSnapshotRef,
      appSettingsDatabaseLoadedRef: appState.appSettingsDatabaseLoadedRef,
      appSettingsDatabaseSaveSnapshotRef: appState.appSettingsDatabaseSaveSnapshotRef,
      vehiclesDatabaseLoadedRef: appState.vehiclesDatabaseLoadedRef,
      vehiclesDatabaseSaveSnapshotRef: appState.vehiclesDatabaseSaveSnapshotRef,
    },
    loadFlags: {
      setPtoDatabaseLoadStarted: appState.setPtoDatabaseLoadStarted,
      setPtoBootstrapLoaded: appState.setPtoBootstrapLoaded,
      setAdminDataLoaded: appState.setAdminDataLoaded,
    },
    reportSetters: {
      setReportCustomers: appState.setReportCustomers,
      setReportAreaOrder: appState.setReportAreaOrder,
      setReportWorkOrder: appState.setReportWorkOrder,
      setReportHeaderLabels: appState.setReportHeaderLabels,
      setReportColumnWidths: appState.setReportColumnWidths,
      setReportReasons: appState.setReportReasons,
      setAreaShiftCutoffs: appState.setAreaShiftCutoffs,
    },
    ptoSetters: {
      hasStoredPtoStateRef: appState.hasStoredPtoStateRef,
      setPtoManualYears: appState.setPtoManualYears,
      setPtoPlanRows: appState.setPtoPlanRows,
      setPtoSurveyRows: appState.setPtoSurveyRows,
      setPtoOperRows: appState.setPtoOperRows,
      setPtoColumnWidths: appState.setPtoColumnWidths,
      setPtoRowHeights: appState.setPtoRowHeights,
      setPtoHeaderLabels: appState.setPtoHeaderLabels,
      setPtoBucketValues: appState.setPtoBucketValues,
      setPtoBucketManualRows: appState.setPtoBucketManualRows,
    },
    adminStructureSetters: {
      setOrgMembers: appState.setOrgMembers,
      setDependencyNodes: appState.setDependencyNodes,
      setDependencyLinks: appState.setDependencyLinks,
      setDependencyLinkForm: appState.setDependencyLinkForm,
    },
    navigationSetters: {
      setCustomTabs: appState.setCustomTabs,
      setTopTabs: appState.setTopTabs,
      setSubTabs: appState.setSubTabs,
    },
    vehicleSetters: {
      setVehicleRows: appState.setVehicleRows,
    },
    dispatchSetters: {
      setDispatchSummaryRows: appState.setDispatchSummaryRows,
    },
  }), [
    appState.appDatabaseSaveSnapshotRef,
    appState.appSettingsDatabaseLoadedRef,
    appState.appSettingsDatabaseSaveSnapshotRef,
    appState.hasStoredPtoStateRef,
    appState.restoreAdminLogs,
    appState.setAdminDataLoaded,
    appState.setAreaShiftCutoffs,
    appState.setCustomTabs,
    appState.setDependencyLinkForm,
    appState.setDependencyLinks,
    appState.setDependencyNodes,
    appState.setDispatchSummaryRows,
    appState.setOrgMembers,
    appState.setPtoBootstrapLoaded,
    appState.setPtoBucketManualRows,
    appState.setPtoBucketValues,
    appState.setPtoColumnWidths,
    appState.setPtoDatabaseLoadStarted,
    appState.setPtoHeaderLabels,
    appState.setPtoManualYears,
    appState.setPtoOperRows,
    appState.setPtoPlanRows,
    appState.setPtoRowHeights,
    appState.setPtoSurveyRows,
    appState.setReportAreaOrder,
    appState.setReportColumnWidths,
    appState.setReportCustomers,
    appState.setReportHeaderLabels,
    appState.setReportReasons,
    appState.setReportWorkOrder,
    appState.setSubTabs,
    appState.setTopTabs,
    appState.setVehicleRows,
    appState.vehiclesDatabaseLoadedRef,
    appState.vehiclesDatabaseSaveSnapshotRef,
  ]);

  useInitialAppDataLoad(initialLoadOptions);
}
