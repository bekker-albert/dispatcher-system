"use client";

import type { RefObject } from "react";

import { useVehicleRowsPersistence } from "@/features/admin/vehicles/useVehicleRowsPersistence";
import { useAppLocalPersistence } from "@/features/app/useAppLocalPersistence";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type UseAppSharedPersistenceOptions = {
  adminDataLoaded: boolean;
  appDatabaseSaveSnapshotRef: RefObject<string>;
  appSettingsDatabaseLoadedRef: RefObject<boolean>;
  appSettingsDatabaseSaveSnapshotRef: RefObject<string>;
  vehiclesDatabaseLoadedRef: RefObject<boolean>;
  vehiclesDatabaseSaveSnapshotRef: RefObject<string>;
  requestClientSnapshotSave: (reason?: string) => void;
  showSaveStatus: ShowSaveStatus;
  databaseConfigured: boolean;
  reportCustomers: unknown;
  reportAreaOrder: unknown;
  reportWorkOrder: unknown;
  reportHeaderLabels: unknown;
  reportColumnWidths: unknown;
  reportReasons: unknown;
  areaShiftCutoffs: unknown;
  customTabs: unknown;
  topTabs: unknown;
  subTabs: unknown;
  dispatchSummaryRows: unknown;
  orgMembers: unknown;
  dependencyNodes: unknown;
  dependencyLinks: unknown;
  adminLogs: unknown;
  vehicleRows: VehicleRow[];
  vehicleRowsRef: RefObject<VehicleRow[]>;
};

export function useAppSharedPersistence({
  adminDataLoaded,
  appDatabaseSaveSnapshotRef,
  appSettingsDatabaseLoadedRef,
  appSettingsDatabaseSaveSnapshotRef,
  vehiclesDatabaseLoadedRef,
  vehiclesDatabaseSaveSnapshotRef,
  requestClientSnapshotSave,
  showSaveStatus,
  databaseConfigured,
  reportCustomers,
  reportAreaOrder,
  reportWorkOrder,
  reportHeaderLabels,
  reportColumnWidths,
  reportReasons,
  areaShiftCutoffs,
  customTabs,
  topTabs,
  subTabs,
  dispatchSummaryRows,
  orgMembers,
  dependencyNodes,
  dependencyLinks,
  adminLogs,
  vehicleRows,
  vehicleRowsRef,
}: UseAppSharedPersistenceOptions) {
  useAppLocalPersistence({
    adminDataLoaded,
    appDatabaseSaveSnapshotRef,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    requestClientSnapshotSave,
    showSaveStatus,
    reportCustomers,
    reportAreaOrder,
    reportWorkOrder,
    reportHeaderLabels,
    reportColumnWidths,
    reportReasons,
    areaShiftCutoffs,
    customTabs,
    topTabs,
    subTabs,
    dispatchSummaryRows,
    orgMembers,
    dependencyNodes,
    dependencyLinks,
    adminLogs,
  });

  useVehicleRowsPersistence({
    adminDataLoaded,
    vehicleRows,
    vehicleRowsRef,
    databaseConfigured,
    databaseLoadedRef: vehiclesDatabaseLoadedRef,
    databaseSaveSnapshotRef: vehiclesDatabaseSaveSnapshotRef,
    requestClientSnapshotSave,
    showSaveStatus,
  });
}
