import { Trash2 } from "lucide-react";
import type { CSSProperties, ComponentProps, ReactNode, RefObject } from "react";
import { buildVehicleDisplayName } from "@/lib/domain/vehicles/import-export";
import type { VehicleFilterKey, VehicleFilters, VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { MiniIconButton } from "@/shared/ui/buttons";
import { AdminVehicleFilterHeader } from "./AdminVehicleFilterHeader";
import { AdminVehicleCellInput, AdminVehicleReadOnlyCell } from "./AdminVehicleGridCells";

export type VehicleFilterColumnWithIcon = {
  key: VehicleFilterKey;
  label: string;
  icon?: ReactNode;
};

export type VehicleCellShellProps = Pick<
  ComponentProps<typeof AdminVehicleCellInput>,
  | "active"
  | "selected"
  | "editing"
  | "draft"
  | "fieldKey"
  | "onSelect"
  | "onExtendSelection"
  | "onStartEdit"
  | "onDraftChange"
  | "onCommitEdit"
  | "onKeyDown"
>;

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
          <col style={{ width: 46 }} />
          <col style={{ width: 165 }} />
          <col style={{ width: 190 }} />
          <col style={{ width: 100 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 112 }} />
          <col style={{ width: 96 }} />
          <col style={{ width: 96 }} />
          <col style={{ width: 170 }} />
          <col style={{ width: 180 }} />
          <col style={{ width: 34 }} />
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
            <tr key={vehicle.id}>
              <td style={{ ...adminVehicleTdStyle, textAlign: "center" }}>
                {adminVehiclesEditing ? (
                  <input
                    aria-label={`Показывать ${buildVehicleDisplayName(vehicle)}`}
                    checked={vehicle.visible !== false}
                    onChange={() => onToggleVehicleVisibility(vehicle.id)}
                    type="checkbox"
                    style={adminVehicleCheckboxStyle}
                  />
                ) : null}
              </td>
              <td style={adminVehicleTdStyle}>
                {adminVehiclesEditing ? (
                  <AdminVehicleCellInput {...vehicleCellInputProps(vehicle.id, "vehicleType")} list="admin-vehicle-category-options" value={vehicle.vehicleType} onChange={(value) => onVehicleCellChange(vehicle.id, "vehicleType", value)} />
                ) : (
                  <AdminVehicleReadOnlyCell value={vehicle.vehicleType} />
                )}
              </td>
              <td style={adminVehicleNameTdStyle}>
                {adminVehiclesEditing ? (
                  <AdminVehicleCellInput {...vehicleCellInputProps(vehicle.id, "equipmentType")} list="admin-vehicle-equipment-type-options" value={vehicle.equipmentType} onChange={(value) => onVehicleCellChange(vehicle.id, "equipmentType", value)} />
                ) : (
                  <AdminVehicleReadOnlyCell value={vehicle.equipmentType} />
                )}
              </td>
              <td style={adminVehicleTdStyle}>
                {adminVehiclesEditing ? (
                  <AdminVehicleCellInput {...vehicleCellInputProps(vehicle.id, "brand")} list="admin-vehicle-brand-options" value={vehicle.brand} onChange={(value) => onVehicleCellChange(vehicle.id, "brand", value)} />
                ) : (
                  <AdminVehicleReadOnlyCell value={vehicle.brand} />
                )}
              </td>
              <td style={adminVehicleTdStyle}>
                {adminVehiclesEditing ? (
                  <AdminVehicleCellInput {...vehicleCellInputProps(vehicle.id, "model")} value={vehicle.model} onChange={(value) => onVehicleCellChange(vehicle.id, "model", value)} />
                ) : (
                  <AdminVehicleReadOnlyCell value={vehicle.model} />
                )}
              </td>
              <td style={adminVehicleTdStyle}>
                {adminVehiclesEditing ? (
                  <AdminVehicleCellInput {...vehicleCellInputProps(vehicle.id, "plateNumber")} value={vehicle.plateNumber} onChange={(value) => onVehicleCellChange(vehicle.id, "plateNumber", value)} />
                ) : (
                  <AdminVehicleReadOnlyCell value={vehicle.plateNumber} />
                )}
              </td>
              <td style={adminVehicleTdStyle}>
                {adminVehiclesEditing ? (
                  <AdminVehicleCellInput {...vehicleCellInputProps(vehicle.id, "garageNumber")} value={vehicle.garageNumber} onChange={(value) => onVehicleCellChange(vehicle.id, "garageNumber", value)} />
                ) : (
                  <AdminVehicleReadOnlyCell value={vehicle.garageNumber} />
                )}
              </td>
              <td style={adminVehicleNumberTdStyle}>
                {adminVehiclesEditing ? (
                  <AdminVehicleCellInput {...vehicleCellInputProps(vehicle.id, "manufactureYear")} type="number" numeric value={vehicle.manufactureYear} onChange={(value) => onVehicleCellChange(vehicle.id, "manufactureYear", value)} />
                ) : (
                  <AdminVehicleReadOnlyCell numeric value={vehicle.manufactureYear} />
                )}
              </td>
              <td style={adminVehicleTdStyle}>
                {adminVehiclesEditing ? (
                  <AdminVehicleCellInput {...vehicleCellInputProps(vehicle.id, "vin")} value={vehicle.vin} onChange={(value) => onVehicleCellChange(vehicle.id, "vin", value)} />
                ) : (
                  <AdminVehicleReadOnlyCell value={vehicle.vin} />
                )}
              </td>
              <td style={adminVehicleTdStyle}>
                {adminVehiclesEditing ? (
                  <AdminVehicleCellInput {...vehicleCellInputProps(vehicle.id, "owner")} list="admin-vehicle-owner-options" value={vehicle.owner} onChange={(value) => onVehicleCellChange(vehicle.id, "owner", value)} />
                ) : (
                  <AdminVehicleReadOnlyCell value={vehicle.owner} />
                )}
              </td>
              <td style={adminVehicleActionTdStyle}>
                {adminVehiclesEditing ? (
                  <div style={adminVehicleActionsStyle}>
                    <MiniIconButton label={`Удалить ${buildVehicleDisplayName(vehicle)}`} onClick={() => onDeleteVehicle(vehicle.id)}>
                      <Trash2 size={14} aria-hidden />
                    </MiniIconButton>
                  </div>
                ) : null}
              </td>
            </tr>
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

const adminVehicleTableScrollStyle: CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
};

const adminVehicleTableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1309,
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
};

const adminVehicleThStyle: CSSProperties = {
  padding: "5px 6px",
  borderBottom: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "left",
  whiteSpace: "normal",
  lineHeight: 1.15,
  position: "relative",
  overflow: "visible",
  verticalAlign: "middle",
  zIndex: 1,
};

const adminVehicleTdStyle: CSSProperties = {
  padding: "4px 6px",
  borderBottom: "1px solid #e2e8f0",
  color: "#0f172a",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

const adminVehicleActionTdStyle: CSSProperties = {
  ...adminVehicleTdStyle,
  padding: "4px 1px",
  overflow: "visible",
};

const adminVehicleNameTdStyle: CSSProperties = {
  ...adminVehicleTdStyle,
};

const adminVehicleEmptyRowStyle: CSSProperties = {
  ...adminVehicleTdStyle,
  color: "#64748b",
  padding: "14px 10px",
  textAlign: "center",
};

const adminVehicleNumberTdStyle: CSSProperties = {
  ...adminVehicleTdStyle,
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
};

const adminVehicleCheckboxStyle: CSSProperties = {
  width: 14,
  height: 14,
  margin: 0,
  verticalAlign: "middle",
};

const adminVehicleActionsStyle: CSSProperties = {
  display: "flex",
  gap: 4,
  justifyContent: "flex-end",
  alignItems: "center",
};
