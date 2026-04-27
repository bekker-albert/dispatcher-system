"use client";

import { useAppAdminVehiclesProps } from "@/features/app/useAppAdminVehiclesProps";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";
import type { useAppVehicleEditing } from "@/features/app/useAppVehicleEditing";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;
type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
type AppVehicleEditing = ReturnType<typeof useAppVehicleEditing>;

type UseAppAdminVehiclesScreenPropsArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
  vehicleEditing: AppVehicleEditing;
};

export function useAppAdminVehiclesScreenProps({
  appState,
  models,
  vehicleEditing,
}: UseAppAdminVehiclesScreenPropsArgs): ReturnType<typeof useAppAdminVehiclesProps> {
  const {
    adminVehiclesEditing,
    setShowAllVehicleRows,
    vehicleRows,
    vehicleFilters,
    vehicleFilterDrafts,
    openVehicleFilter,
    vehicleFilterSearch,
    setVehicleFilterSearch,
    vehicleImportInputRef,
    adminVehicleTableScrollRef,
  } = appState;

  const {
    vehicleAutocompleteOptions,
    activeVehicleFilterOptions,
    filteredVehicleRows,
    visibleVehicleRows,
    hiddenVehicleRowsCount,
    activeVehicleFilterCount,
    vehicleFilterColumns,
    openVehicleFilterMenu,
    toggleVehicleFilterDraftValue,
    selectAllVehicleFilterDraftValues,
    deselectAllVehicleFilterDraftValues,
    applyVehicleFilter,
    clearAllVehicleFilters,
    closeVehicleFilterMenu,
  } = models;

  const {
    addVehicleRow,
    updateVehicleRow,
    toggleVehicleVisibility,
    deleteVehicle,
    vehicleCellInputProps,
    startAdminVehiclesEditing,
    finishAdminVehiclesEditing,
    openVehicleImportFilePicker,
    importVehiclesFromExcel,
    exportVehiclesToExcel,
  } = vehicleEditing;

  return useAppAdminVehiclesProps({
    activeVehicleFilterCount,
    filteredVehicleRows,
    vehicleRows,
    adminVehiclesEditing,
    visibleVehicleRows,
    hiddenVehicleRowsCount,
    vehicleAutocompleteOptions,
    vehicleFilterColumns,
    openVehicleFilter,
    activeVehicleFilterOptions,
    vehicleFilters,
    vehicleFilterDrafts,
    vehicleFilterSearch,
    setVehicleFilterSearch,
    adminVehicleTableScrollRef,
    vehicleImportInputRef,
    clearAllVehicleFilters,
    startAdminVehiclesEditing,
    finishAdminVehiclesEditing,
    addVehicleRow,
    openVehicleImportFilePicker,
    exportVehiclesToExcel,
    importVehiclesFromExcel,
    openVehicleFilterMenu,
    toggleVehicleFilterDraftValue,
    selectAllVehicleFilterDraftValues,
    deselectAllVehicleFilterDraftValues,
    applyVehicleFilter,
    closeVehicleFilterMenu,
    toggleVehicleVisibility,
    vehicleCellInputProps,
    updateVehicleRow,
    deleteVehicle,
    setShowAllVehicleRows,
  });
}
