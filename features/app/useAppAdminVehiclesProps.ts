"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";

import type { AdminVehiclesSectionProps } from "@/features/admin/vehicles/AdminVehiclesSection";
import type { VehicleFilterKey, VehicleFilters } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type UseAppAdminVehiclesPropsOptions = {
  activeVehicleFilterCount: number;
  filteredVehicleRows: VehicleRow[];
  vehicleRows: VehicleRow[];
  adminVehiclesEditing: boolean;
  visibleVehicleRows: VehicleRow[];
  hiddenVehicleRowsCount: number;
  vehicleAutocompleteOptions: AdminVehiclesSectionProps["vehicleAutocompleteOptions"];
  vehicleFilterColumns: AdminVehiclesSectionProps["vehicleFilterColumns"];
  openVehicleFilter: VehicleFilterKey | null;
  activeVehicleFilterOptions: string[];
  vehicleFilters: VehicleFilters;
  vehicleFilterDrafts: VehicleFilters;
  vehicleFilterSearch: Partial<Record<VehicleFilterKey, string>>;
  setVehicleFilterSearch: Dispatch<SetStateAction<Partial<Record<VehicleFilterKey, string>>>>;
  adminVehicleTableScrollRef: AdminVehiclesSectionProps["adminVehicleTableScrollRef"];
  vehicleImportInputRef: AdminVehiclesSectionProps["vehicleImportInputRef"];
  clearAllVehicleFilters: () => void;
  startAdminVehiclesEditing: () => void;
  finishAdminVehiclesEditing: () => void;
  addVehicleRow: () => void;
  openVehicleImportFilePicker: () => void;
  exportVehiclesToExcel: () => void;
  importVehiclesFromExcel: AdminVehiclesSectionProps["onImportVehiclesFromExcel"];
  openVehicleFilterMenu: AdminVehiclesSectionProps["onOpenVehicleFilterMenu"];
  toggleVehicleFilterDraftValue: AdminVehiclesSectionProps["onToggleVehicleFilterDraftValue"];
  selectAllVehicleFilterDraftValues: AdminVehiclesSectionProps["onSelectAllVehicleFilterDraftValues"];
  deselectAllVehicleFilterDraftValues: AdminVehiclesSectionProps["onDeselectAllVehicleFilterDraftValues"];
  applyVehicleFilter: AdminVehiclesSectionProps["onApplyVehicleFilter"];
  closeVehicleFilterMenu: () => void;
  toggleVehicleVisibility: AdminVehiclesSectionProps["onToggleVehicleVisibility"];
  vehicleCellInputProps: AdminVehiclesSectionProps["vehicleCellInputProps"];
  vehicleRowCellStateSignature: AdminVehiclesSectionProps["vehicleRowCellStateSignature"];
  updateVehicleRow: AdminVehiclesSectionProps["onVehicleCellChange"];
  deleteVehicle: AdminVehiclesSectionProps["onDeleteVehicle"];
  setShowAllVehicleRows: Dispatch<SetStateAction<boolean>>;
};

export function useAppAdminVehiclesProps({
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
  vehicleRowCellStateSignature,
  updateVehicleRow,
  deleteVehicle,
  setShowAllVehicleRows,
}: UseAppAdminVehiclesPropsOptions): AdminVehiclesSectionProps {
  const handleVehicleFilterSearchChange = useCallback((key: VehicleFilterKey, value: string) => {
    setVehicleFilterSearch((current) => ({ ...current, [key]: value }));
  }, [setVehicleFilterSearch]);

  const handleShowAllVehicleRows = useCallback(() => {
    setShowAllVehicleRows(true);
  }, [setShowAllVehicleRows]);

  return {
    activeVehicleFilterCount,
    filteredVehicleRowsCount: filteredVehicleRows.length,
    totalVehicleRowsCount: vehicleRows.length,
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
    adminVehicleTableScrollRef,
    vehicleImportInputRef,
    onClearAllVehicleFilters: clearAllVehicleFilters,
    onStartEditing: startAdminVehiclesEditing,
    onFinishEditing: finishAdminVehiclesEditing,
    onAddVehicleRow: addVehicleRow,
    onOpenVehicleImportFilePicker: openVehicleImportFilePicker,
    onExportVehiclesToExcel: exportVehiclesToExcel,
    onImportVehiclesFromExcel: importVehiclesFromExcel,
    onOpenVehicleFilterMenu: openVehicleFilterMenu,
    onVehicleFilterSearchChange: handleVehicleFilterSearchChange,
    onToggleVehicleFilterDraftValue: toggleVehicleFilterDraftValue,
    onSelectAllVehicleFilterDraftValues: selectAllVehicleFilterDraftValues,
    onDeselectAllVehicleFilterDraftValues: deselectAllVehicleFilterDraftValues,
    onApplyVehicleFilter: applyVehicleFilter,
    onCloseVehicleFilterMenu: closeVehicleFilterMenu,
    onToggleVehicleVisibility: toggleVehicleVisibility,
    vehicleCellInputProps,
    vehicleRowCellStateSignature,
    onVehicleCellChange: updateVehicleRow,
    onDeleteVehicle: deleteVehicle,
    onShowAllVehicleRows: handleShowAllVehicleRows,
  };
}
