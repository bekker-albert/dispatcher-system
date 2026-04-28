"use client";

import { useEffect } from "react";
import { useAppGlobalUndoKeyHandler } from "./useAppGlobalUndoKeyHandler";
import type { AppUndoHistoryOptions } from "./appUndoHistoryTypes";
import { useAppUndoRestore } from "./useAppUndoRestore";
import { useAppUndoScheduler } from "./useAppUndoScheduler";
import { useAppUndoSnapshotSource } from "./useAppUndoSnapshotSource";
import { useVehicleRowsUndoHistory } from "./useVehicleRowsUndoHistory";

export function useAppUndoHistory(options: AppUndoHistoryOptions) {
  const {
    adminDataLoaded,
    topTab,
    adminSection,
    vehicleRows,
    vehicleRowsRef,
    addAdminLog,
    setVehicleRows,
    setEditingVehicleCell,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setOpenVehicleFilter,
  } = options;

  const vehicleUndoActive = topTab === "admin" && adminSection === "vehicles";

  const createUndoSnapshot = useAppUndoSnapshotSource(options);
  const restoreUndoSnapshot = useAppUndoRestore(options);
  const {
    clearPendingUndoSnapshot,
    hasAppUndoSnapshot,
    popPreviousAppUndoSnapshot,
    resetUndoHistoryForExternalRestore,
    scheduleAppUndoSnapshot,
  } = useAppUndoScheduler({
    adminDataLoaded,
    disabled: vehicleUndoActive,
    createUndoSnapshot,
  });

  const {
    hasVehicleUndoSnapshot,
    pushVehicleUndoSnapshot,
    restoreVehicleUndoSnapshot,
  } = useVehicleRowsUndoHistory({
    addAdminLog,
    vehicleRowsRef,
    setVehicleRows,
    setEditingVehicleCell,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setOpenVehicleFilter,
  });

  useEffect(() => {
    vehicleRowsRef.current = vehicleRows;
  }, [vehicleRows, vehicleRowsRef]);

  useEffect(() => {
    if (topTab !== "reports") return;
    scheduleAppUndoSnapshot("reports");
    return clearPendingUndoSnapshot;
  }, [
    clearPendingUndoSnapshot,
    options.areaShiftCutoffs,
    options.reportAreaOrder,
    options.reportColumnWidths,
    options.reportCustomers,
    options.reportHeaderLabels,
    options.reportReasons,
    options.reportWorkOrder,
    scheduleAppUndoSnapshot,
    topTab,
  ]);

  useEffect(() => {
    if (topTab !== "pto") return;
    scheduleAppUndoSnapshot("pto");
    return clearPendingUndoSnapshot;
  }, [
    clearPendingUndoSnapshot,
    options.expandedPtoMonths,
    options.ptoBucketManualRows,
    options.ptoBucketValues,
    options.ptoColumnWidths,
    options.ptoHeaderLabels,
    options.ptoManualYears,
    options.ptoOperRows,
    options.ptoPlanRows,
    options.ptoRowHeights,
    options.ptoSurveyRows,
    scheduleAppUndoSnapshot,
    topTab,
  ]);

  useEffect(() => {
    if (topTab !== "admin" || vehicleUndoActive) return;
    scheduleAppUndoSnapshot("admin");
    return clearPendingUndoSnapshot;
  }, [
    clearPendingUndoSnapshot,
    options.areaShiftCutoffs,
    options.dependencyLinks,
    options.dependencyNodes,
    options.orgMembers,
    scheduleAppUndoSnapshot,
    topTab,
    vehicleUndoActive,
  ]);

  useEffect(() => {
    if (vehicleUndoActive) return;
    scheduleAppUndoSnapshot("navigation");
    return clearPendingUndoSnapshot;
  }, [
    clearPendingUndoSnapshot,
    options.customTabs,
    options.subTabs,
    options.topTabs,
    scheduleAppUndoSnapshot,
    vehicleUndoActive,
  ]);

  useAppGlobalUndoKeyHandler({
    topTab,
    adminSection,
    vehicleUndoActive,
    hasVehicleUndoSnapshot,
    hasAppUndoSnapshot,
    restoreVehicleUndoSnapshot,
    popPreviousAppUndoSnapshot,
    restoreUndoSnapshot,
  });

  return {
    pushVehicleUndoSnapshot,
    restoreVehicleUndoSnapshot,
    resetUndoHistoryForExternalRestore,
  };
}
