"use client";

import type { CSSProperties, ReactNode } from "react";

import { AdminVehicleFilterHeader } from "@/features/admin/vehicles/AdminVehicleFilterHeader";
import type { AdminVehiclesSectionProps } from "@/features/admin/vehicles/AdminVehiclesSection";
import type { VehicleFilterKey } from "@/lib/domain/vehicles/grid";
import { driverToggleStyle, thStyle } from "@/features/fleet/fleetVehicleTableStyles";

export type FleetVehicleFilterControls = Pick<
  AdminVehiclesSectionProps,
  | "activeVehicleFilterCount"
  | "vehicleFilterColumns"
  | "openVehicleFilter"
  | "activeVehicleFilterOptions"
  | "vehicleFilters"
  | "vehicleFilterDrafts"
  | "vehicleFilterSearch"
  | "onOpenVehicleFilterMenu"
  | "onVehicleFilterSearchChange"
  | "onToggleVehicleFilterDraftValue"
  | "onSelectAllVehicleFilterDraftValues"
  | "onDeselectAllVehicleFilterDraftValues"
  | "onApplyVehicleFilter"
  | "onCloseVehicleFilterMenu"
  | "onClearAllVehicleFilters"
>;

export const collapsibleFleetVehicleColumns = [
  { key: "fuelCardNumber", label: "№ топл.карты" },
  { key: "manufactureYear", label: "Год выпуска" },
  { key: "vin", label: "VIN" },
  { key: "owner", label: "Собственник" },
] as const;

export type CollapsibleFleetVehicleColumnKey = typeof collapsibleFleetVehicleColumns[number]["key"];

export function FleetVehicleColumnToggleButtons({
  collapsedColumns,
  onToggleColumn,
}: {
  collapsedColumns: Record<CollapsibleFleetVehicleColumnKey, boolean>;
  onToggleColumn: (key: CollapsibleFleetVehicleColumnKey) => void;
}) {
  return (
    <div style={columnToggleGroupStyle} aria-label="Сворачивание колонок справочника техники">
      {collapsibleFleetVehicleColumns.map((column) => {
        const isCollapsed = collapsedColumns[column.key];

        return (
          <button
            key={column.key}
            aria-pressed={!isCollapsed}
            onClick={() => onToggleColumn(column.key)}
            style={{
              ...columnToggleButtonStyle,
              ...(!isCollapsed ? columnToggleButtonActiveStyle : null),
            }}
            title={`${isCollapsed ? "Показать" : "Скрыть"} столбец: ${column.label}`}
            type="button"
          >
            {column.label}
          </button>
        );
      })}
    </div>
  );
}

export function FilterableFleetVehicleTh({
  children,
  filterControls,
  filterKey,
  rowSpan,
}: {
  children: ReactNode;
  filterControls?: FleetVehicleFilterControls;
  filterKey: VehicleFilterKey;
  rowSpan?: number;
}) {
  const column = filterControls?.vehicleFilterColumns.find((filterColumn) => filterColumn.key === filterKey);

  if (!filterControls || !column) {
    return (
      <th rowSpan={rowSpan} style={thStyle}>
        {children}
      </th>
    );
  }

  return (
    <th rowSpan={rowSpan} style={thStyle}>
      <AdminVehicleFilterHeader
        column={column}
        options={filterControls.openVehicleFilter === filterKey ? filterControls.activeVehicleFilterOptions : []}
        appliedSelectedValues={filterControls.vehicleFilters[filterKey]}
        draftSelectedValues={filterControls.vehicleFilterDrafts[filterKey]}
        search={filterControls.vehicleFilterSearch[filterKey] ?? ""}
        isOpen={filterControls.openVehicleFilter === filterKey}
        onToggleOpen={() => filterControls.onOpenVehicleFilterMenu(filterKey)}
        onSearchChange={(value) => filterControls.onVehicleFilterSearchChange(filterKey, value)}
        onToggleValue={(value) => filterControls.onToggleVehicleFilterDraftValue(filterKey, value)}
        onSelectAll={() => filterControls.onSelectAllVehicleFilterDraftValues(filterKey)}
        onDeselectAll={() => filterControls.onDeselectAllVehicleFilterDraftValues(filterKey)}
        onApply={() => filterControls.onApplyVehicleFilter(filterKey)}
        onClose={filterControls.onCloseVehicleFilterMenu}
      />
    </th>
  );
}

const columnToggleGroupStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  flexWrap: "wrap",
};

const columnToggleButtonStyle: CSSProperties = {
  ...driverToggleStyle,
  padding: "7px 8px",
};

const columnToggleButtonActiveStyle: CSSProperties = {
  background: "#0f172a",
  color: "#ffffff",
  borderColor: "#0f172a",
};
