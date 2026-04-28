"use client";

import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { useAppVehicleEditing } from "@/features/app/useAppVehicleEditing";
import { databaseConfigured } from "@/lib/data/config";

type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;

type UseAppVehicleControllersArgs = {
  active: boolean;
  appState: AppStateBundle;
  models: AppDerivedModels;
  runtime: AppRuntimeControllers;
};

export function useAppVehicleControllers({
  active,
  appState,
  models,
  runtime,
}: UseAppVehicleControllersArgs) {
  const {
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    vehicleRows,
    setVehicleRows,
    setVehicleFilters,
    setVehicleFilterDrafts,
    setOpenVehicleFilter,
    setPendingVehicleFocus,
    activeVehicleCell,
    setActiveVehicleCell,
    vehicleSelectionAnchorCell,
    setVehicleSelectionAnchorCell,
    selectedVehicleCellKeys,
    setSelectedVehicleCellKeys,
    editingVehicleCell,
    setEditingVehicleCell,
    vehicleCellDraft,
    setVehicleCellDraft,
    vehicleCellInitialDraft,
    setVehicleCellInitialDraft,
    vehicleCellSkipBlurCommitRef,
    vehicleSelectionDraggingRef,
    vehicleSelectionAnchorRef,
    vehicleImportInputRef,
    vehicleRowsRef,
    vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef,
    addAdminLog,
    showSaveStatus,
  } = appState;

  const {
    visibleVehicleRows,
    clearAllVehicleFilters,
  } = models;

  const {
    pushVehicleUndoSnapshot,
  } = runtime;

  const vehicleEditing = useAppVehicleEditing({
    vehicleRows: active ? vehicleRows : [],
    visibleVehicleRows: active ? visibleVehicleRows : [],
    vehicleRowsRef,
    vehicleImportInputRef,
    vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef,
    databaseConfigured: active && databaseConfigured,
    activeVehicleCell,
    selectedVehicleCellKeys,
    editingVehicleCell,
    vehicleCellDraft,
    vehicleCellInitialDraft,
    vehicleSelectionAnchorCell,
    vehicleCellSkipBlurCommitRef,
    vehicleSelectionDraggingRef,
    vehicleSelectionAnchorRef,
    setVehicleRows,
    setVehicleFilters,
    setVehicleFilterDrafts,
    setOpenVehicleFilter,
    setPendingVehicleFocus,
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    pushVehicleUndoSnapshot: active ? pushVehicleUndoSnapshot : () => undefined,
    clearAllVehicleFilters,
    showSaveStatus,
    addAdminLog: active ? addAdminLog : () => undefined,
  });

  return {
    vehicleEditing,
  };
}
