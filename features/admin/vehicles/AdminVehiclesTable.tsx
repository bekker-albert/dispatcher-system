import type { ReactNode, RefObject } from "react";
import type { VehicleFilterKey, VehicleFilters, VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { AdminVehicleFilterHeader } from "./AdminVehicleFilterHeader";
import { AdminVehicleTableRow, type VehicleCellShellProps } from "./AdminVehicleTableRow";
import {
  adminVehicleColumnWidths,
  adminVehicleEmptyRowStyle,
  adminVehicleTableScrollStyle,
  adminVehicleTableStyle,
  adminVehicleThStyle,
} from "./adminVehicleTableStyles";

export type { VehicleCellShellProps };

export type VehicleFilterColumnWithIcon = {
  key: VehicleFilterKey;
  label: string;
  icon?: ReactNode;
};

export function AdminVehiclesTable({
  adminVehiclesEditing,
  visibleVehicleRows,
  filteredVehicleRowsCount,
  vehicleFilterColumns,
  openVehicleFilter,
  activeVehicleFilterOptions,
  vehicleFilters,
  vehicleFilterDrafts,
  vehicleFilterSearch,
  adminVehicleTableScrollRef,
  onOpenVehicleFilterMenu,
  onVehicleFilterSearchChange,
  onToggleVehicleFilterDraftValue,
  onSelectAllVehicleFilterDraftValues,
  onDeselectAllVehicleFilterDraftValues,
  onApplyVehicleFilter,
  onCloseVehicleFilterMenu,
  onToggleVehicleVisibility,
  vehicleCellInputProps,
  onVehicleCellChange,
  onDeleteVehicle,
}: {
  adminVehiclesEditing: boolean;
  visibleVehicleRows: VehicleRow[];
  filteredVehicleRowsCount: number;
  vehicleFilterColumns: VehicleFilterColumnWithIcon[];
  openVehicleFilter: VehicleFilterKey | null;
  activeVehicleFilterOptions: string[];
  vehicleFilters: VehicleFilters;
  vehicleFilterDrafts: VehicleFilters;
  vehicleFilterSearch: Partial<Record<VehicleFilterKey, string>>;
  adminVehicleTableScrollRef: RefObject<HTMLDivElement | null>;
  onOpenVehicleFilterMenu: (key: VehicleFilterKey) => void;
  onVehicleFilterSearchChange: (key: VehicleFilterKey, value: string) => void;
  onToggleVehicleFilterDraftValue: (key: VehicleFilterKey, value: string) => void;
  onSelectAllVehicleFilterDraftValues: (key: VehicleFilterKey) => void;
  onDeselectAllVehicleFilterDraftValues: (key: VehicleFilterKey) => void;
  onApplyVehicleFilter: (key: VehicleFilterKey) => void;
  onCloseVehicleFilterMenu: () => void;
  onToggleVehicleVisibility: (id: number) => void;
  vehicleCellInputProps: (id: number, field: VehicleInlineField) => VehicleCellShellProps;
  onVehicleCellChange: (id: number, field: VehicleInlineField, value: string) => void;
  onDeleteVehicle: (id: number) => void;
}) {
  return (
    <div ref={adminVehicleTableScrollRef} style={adminVehicleTableScrollStyle}>
      <table style={adminVehicleTableStyle}>
        <colgroup>
          {adminVehicleColumnWidths.map((width, index) => (
            <col key={index} style={{ width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {vehicleFilterColumns.map((column) => (
              <th key={column.key} style={adminVehicleThStyle}>
                <AdminVehicleFilterHeader
                  column={column}
                  options={openVehicleFilter === column.key ? activeVehicleFilterOptions : []}
                  appliedSelectedValues={vehicleFilters[column.key]}
                  draftSelectedValues={vehicleFilterDrafts[column.key]}
                  search={vehicleFilterSearch[column.key] ?? ""}
                  isOpen={openVehicleFilter === column.key}
                  onToggleOpen={() => onOpenVehicleFilterMenu(column.key)}
                  onSearchChange={(value) => onVehicleFilterSearchChange(column.key, value)}
                  onToggleValue={(value) => onToggleVehicleFilterDraftValue(column.key, value)}
                  onSelectAll={() => onSelectAllVehicleFilterDraftValues(column.key)}
                  onDeselectAll={() => onDeselectAllVehicleFilterDraftValues(column.key)}
                  onApply={() => onApplyVehicleFilter(column.key)}
                  onClose={onCloseVehicleFilterMenu}
                />
              </th>
            ))}
            <th style={adminVehicleThStyle} />
          </tr>
        </thead>
        <tbody>
          {visibleVehicleRows.map((vehicle) => (
            <AdminVehicleTableRow
              key={vehicle.id}
              adminVehiclesEditing={adminVehiclesEditing}
              vehicle={vehicle}
              vehicleCellInputProps={vehicleCellInputProps}
              onVehicleCellChange={onVehicleCellChange}
              onToggleVehicleVisibility={onToggleVehicleVisibility}
              onDeleteVehicle={onDeleteVehicle}
            />
          ))}
          {filteredVehicleRowsCount === 0 ? (
            <tr>
              <td colSpan={11} style={adminVehicleEmptyRowStyle}>Нет техники по выбранным фильтрам</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
