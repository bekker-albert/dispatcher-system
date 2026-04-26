"use client";

import { useAppSharedPersistence } from "@/features/app/useAppSharedPersistence";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;

type UseAppSharedPersistenceControllerOptions = {
  appState: AppStateBundle;
  databaseConfigured: boolean;
};

export function useAppSharedPersistenceController({
  appState,
  databaseConfigured,
}: UseAppSharedPersistenceControllerOptions) {
  useAppSharedPersistence({
    adminDataLoaded: appState.adminDataLoaded,
    appSettingsDatabaseLoadedRef: appState.appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef: appState.appSettingsDatabaseSaveSnapshotRef,
    vehiclesDatabaseLoadedRef: appState.vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef: appState.vehiclesDatabaseSaveSnapshotRef,
    requestClientSnapshotSave: appState.requestClientSnapshotSave,
    showSaveStatus: appState.showSaveStatus,
    databaseConfigured,
    reportCustomers: appState.reportCustomers,
    reportAreaOrder: appState.reportAreaOrder,
    reportWorkOrder: appState.reportWorkOrder,
    reportHeaderLabels: appState.reportHeaderLabels,
    reportColumnWidths: appState.reportColumnWidths,
    reportReasons: appState.reportReasons,
    areaShiftCutoffs: appState.areaShiftCutoffs,
    customTabs: appState.customTabs,
    topTabs: appState.topTabs,
    subTabs: appState.subTabs,
    dispatchSummaryRows: appState.dispatchSummaryRows,
    orgMembers: appState.orgMembers,
    dependencyNodes: appState.dependencyNodes,
    dependencyLinks: appState.dependencyLinks,
    adminLogs: appState.adminLogs,
    vehicleRows: appState.vehicleRows,
    vehicleRowsRef: appState.vehicleRowsRef,
  });
}
