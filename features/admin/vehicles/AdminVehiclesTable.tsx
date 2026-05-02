"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { VehicleFilterKey, VehicleFilters, VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { AdminVehicleFilterHeader } from "./AdminVehicleFilterHeader";
import { AdminVehicleTableRow, type VehicleCellShellProps } from "./AdminVehicleTableRow";
import { createAdminVehicleVirtualRows } from "./adminVehicleVirtualRows";
import {
  adminVehicleColumnWidths,
  adminVehicleEmptyRowStyle,
  adminVehicleSpacerCellStyle,
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
  const viewportFrameRef = useRef<number | null>(null);
  const [vehicleRowsViewport, setVehicleRowsViewport] = useState({ height: 520, scrollTop: 0 });

  const updateVehicleRowsViewport = useCallback(() => {
    const element = adminVehicleTableScrollRef.current;
    if (!element) return;

    const nextViewport = {
      height: element.clientHeight || 520,
      scrollTop: element.scrollTop,
    };

    setVehicleRowsViewport((current) => (
      current.height === nextViewport.height && current.scrollTop === nextViewport.scrollTop
        ? current
        : nextViewport
    ));
  }, [adminVehicleTableScrollRef]);

  const scheduleVehicleRowsViewportUpdate = useCallback(() => {
    if (viewportFrameRef.current !== null) return;

    viewportFrameRef.current = window.requestAnimationFrame(() => {
      viewportFrameRef.current = null;
      updateVehicleRowsViewport();
    });
  }, [updateVehicleRowsViewport]);

  useEffect(() => {
    updateVehicleRowsViewport();
    window.addEventListener("resize", updateVehicleRowsViewport);

    return () => {
      window.removeEventListener("resize", updateVehicleRowsViewport);

      if (viewportFrameRef.current !== null) {
        window.cancelAnimationFrame(viewportFrameRef.current);
        viewportFrameRef.current = null;
      }
    };
  }, [updateVehicleRowsViewport, visibleVehicleRows.length]);

  const virtualVehicleRows = useMemo(() => (
    createAdminVehicleVirtualRows(visibleVehicleRows, vehicleRowsViewport, !adminVehiclesEditing)
  ), [adminVehiclesEditing, vehicleRowsViewport, visibleVehicleRows]);
  const columnSpan = vehicleFilterColumns.length + 1;

  return (
    <div ref={adminVehicleTableScrollRef} onScroll={scheduleVehicleRowsViewportUpdate} style={adminVehicleTableScrollStyle}>
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
          {virtualVehicleRows.topSpacerHeight > 0 ? (
            <tr aria-hidden>
              <td colSpan={columnSpan} style={{ ...adminVehicleSpacerCellStyle, height: virtualVehicleRows.topSpacerHeight }} />
            </tr>
          ) : null}
          {virtualVehicleRows.rows.map((vehicle) => (
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
          {virtualVehicleRows.bottomSpacerHeight > 0 ? (
            <tr aria-hidden>
              <td colSpan={columnSpan} style={{ ...adminVehicleSpacerCellStyle, height: virtualVehicleRows.bottomSpacerHeight }} />
            </tr>
          ) : null}
          {filteredVehicleRowsCount === 0 ? (
            <tr>
              <td colSpan={columnSpan} style={adminVehicleEmptyRowStyle}>Нет техники по выбранным фильтрам</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
