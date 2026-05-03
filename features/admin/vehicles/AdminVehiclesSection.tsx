"use client";

import type { CSSProperties, ChangeEvent, RefObject } from "react";
import type { VehicleFilterKey, VehicleFilters, VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { AdminVehicleDatalists } from "./AdminVehicleDatalists";
import { AdminVehiclesTable } from "./AdminVehiclesTable";
import type { VehicleCellShellProps, VehicleFilterColumnWithIcon } from "./AdminVehiclesTable";
import { AdminVehiclesToolbar } from "./AdminVehiclesToolbar";

export type AdminVehiclesSectionProps = {
  activeVehicleFilterCount: number;
  filteredVehicleRowsCount: number;
  totalVehicleRowsCount: number;
  adminVehiclesEditing: boolean;
  visibleVehicleRows: VehicleRow[];
  hiddenVehicleRowsCount: number;
  canManageVehicles?: boolean;
  vehicleAutocompleteOptions: Partial<Record<VehicleFilterKey, string[]>>;
  vehicleFilterColumns: VehicleFilterColumnWithIcon[];
  openVehicleFilter: VehicleFilterKey | null;
  activeVehicleFilterOptions: string[];
  vehicleFilters: VehicleFilters;
  vehicleFilterDrafts: VehicleFilters;
  vehicleFilterSearch: Partial<Record<VehicleFilterKey, string>>;
  adminVehicleTableScrollRef: RefObject<HTMLDivElement | null>;
  vehicleImportInputRef: RefObject<HTMLInputElement | null>;
  onClearAllVehicleFilters: () => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  onAddVehicleRow: () => void;
  onOpenVehicleImportFilePicker: () => void;
  onExportVehiclesToExcel: () => void;
  onImportVehiclesFromExcel: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenVehicleFilterMenu: (key: VehicleFilterKey) => void;
  onVehicleFilterSearchChange: (key: VehicleFilterKey, value: string) => void;
  onToggleVehicleFilterDraftValue: (key: VehicleFilterKey, value: string) => void;
  onSelectAllVehicleFilterDraftValues: (key: VehicleFilterKey) => void;
  onDeselectAllVehicleFilterDraftValues: (key: VehicleFilterKey) => void;
  onApplyVehicleFilter: (key: VehicleFilterKey) => void;
  onCloseVehicleFilterMenu: () => void;
  onToggleVehicleVisibility: (id: number) => void;
  vehicleCellInputProps: (id: number, field: VehicleInlineField) => VehicleCellShellProps;
  vehicleRowCellStateSignature: (id: number) => string;
  onVehicleCellChange: (id: number, field: VehicleInlineField, value: string) => void;
  onDeleteVehicle: (id: number) => void;
  onShowAllVehicleRows: () => void;
};

export default function AdminVehiclesSection({
  activeVehicleFilterCount,
  filteredVehicleRowsCount,
  totalVehicleRowsCount,
  adminVehiclesEditing,
  visibleVehicleRows,
  hiddenVehicleRowsCount,
  canManageVehicles = false,
  vehicleAutocompleteOptions,
  vehicleFilterColumns,
  openVehicleFilter,
  activeVehicleFilterOptions,
  vehicleFilters,
  vehicleFilterDrafts,
  vehicleFilterSearch,
  adminVehicleTableScrollRef,
  vehicleImportInputRef,
  onClearAllVehicleFilters,
  onStartEditing,
  onFinishEditing,
  onAddVehicleRow,
  onOpenVehicleImportFilePicker,
  onExportVehiclesToExcel,
  onImportVehiclesFromExcel,
  onOpenVehicleFilterMenu,
  onVehicleFilterSearchChange,
  onToggleVehicleFilterDraftValue,
  onSelectAllVehicleFilterDraftValues,
  onDeselectAllVehicleFilterDraftValues,
  onApplyVehicleFilter,
  onCloseVehicleFilterMenu,
  onToggleVehicleVisibility,
  vehicleCellInputProps,
  vehicleRowCellStateSignature,
  onVehicleCellChange,
  onDeleteVehicle,
  onShowAllVehicleRows,
}: AdminVehiclesSectionProps) {
  return (
    <div style={adminVehiclePanelStyle}>
      <AdminVehiclesToolbar
        activeVehicleFilterCount={activeVehicleFilterCount}
        filteredVehicleRowsCount={filteredVehicleRowsCount}
        totalVehicleRowsCount={totalVehicleRowsCount}
        adminVehiclesEditing={adminVehiclesEditing}
        canManageVehicles={canManageVehicles}
        vehicleImportInputRef={vehicleImportInputRef}
        onClearAllVehicleFilters={onClearAllVehicleFilters}
        onStartEditing={onStartEditing}
        onFinishEditing={onFinishEditing}
        onAddVehicleRow={onAddVehicleRow}
        onOpenVehicleImportFilePicker={onOpenVehicleImportFilePicker}
        onExportVehiclesToExcel={onExportVehiclesToExcel}
        onImportVehiclesFromExcel={onImportVehiclesFromExcel}
      />

      <AdminVehicleDatalists vehicleAutocompleteOptions={vehicleAutocompleteOptions} />

      <AdminVehiclesTable
        adminVehiclesEditing={adminVehiclesEditing}
        visibleVehicleRows={visibleVehicleRows}
        filteredVehicleRowsCount={filteredVehicleRowsCount}
        vehicleFilterColumns={vehicleFilterColumns}
        openVehicleFilter={openVehicleFilter}
        activeVehicleFilterOptions={activeVehicleFilterOptions}
        vehicleFilters={vehicleFilters}
        vehicleFilterDrafts={vehicleFilterDrafts}
        vehicleFilterSearch={vehicleFilterSearch}
        adminVehicleTableScrollRef={adminVehicleTableScrollRef}
        onOpenVehicleFilterMenu={onOpenVehicleFilterMenu}
        onVehicleFilterSearchChange={onVehicleFilterSearchChange}
        onToggleVehicleFilterDraftValue={onToggleVehicleFilterDraftValue}
        onSelectAllVehicleFilterDraftValues={onSelectAllVehicleFilterDraftValues}
        onDeselectAllVehicleFilterDraftValues={onDeselectAllVehicleFilterDraftValues}
        onApplyVehicleFilter={onApplyVehicleFilter}
        onCloseVehicleFilterMenu={onCloseVehicleFilterMenu}
        onToggleVehicleVisibility={onToggleVehicleVisibility}
        vehicleCellInputProps={vehicleCellInputProps}
        vehicleRowCellStateSignature={vehicleRowCellStateSignature}
        onVehicleCellChange={onVehicleCellChange}
        onDeleteVehicle={onDeleteVehicle}
      />

      {hiddenVehicleRowsCount ? (
        <button
          onClick={onShowAllVehicleRows}
          style={adminVehicleShowAllStyle}
          type="button"
        >
          Показать все
        </button>
      ) : null}
    </div>
  );
}

const adminVehiclePanelStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
  marginBottom: 16,
  padding: 10,
};

const adminVehicleShowAllStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  marginTop: 8,
  padding: "7px 10px",
};
