import { Trash2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import type { VehicleInlineField } from "@/lib/domain/vehicles/grid";
import { buildVehicleDisplayName } from "@/lib/domain/vehicles/import-export";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { MiniIconButton } from "@/shared/ui/buttons";
import { AdminVehicleCellInput, AdminVehicleReadOnlyCell } from "./AdminVehicleGridCells";
import {
  adminVehicleActionTdStyle,
  adminVehicleActionsStyle,
  adminVehicleCheckboxStyle,
  adminVehicleNameTdStyle,
  adminVehicleNumberTdStyle,
  adminVehicleTdStyle,
} from "./adminVehicleTableStyles";

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

type EditableVehicleCellProps = {
  vehicle: VehicleRow;
  field: VehicleInlineField;
  list?: string;
  numeric?: boolean;
  onVehicleCellChange: (id: number, field: VehicleInlineField, value: string) => void;
  vehicleCellInputProps: (id: number, field: VehicleInlineField) => VehicleCellShellProps;
};

function EditableVehicleCell({
  vehicle,
  field,
  list,
  numeric = false,
  onVehicleCellChange,
  vehicleCellInputProps,
}: EditableVehicleCellProps) {
  return (
    <AdminVehicleCellInput
      {...vehicleCellInputProps(vehicle.id, field)}
      list={list}
      numeric={numeric}
      type={numeric ? "number" : "text"}
      value={vehicle[field]}
      onChange={(value) => onVehicleCellChange(vehicle.id, field, value)}
    />
  );
}

function VehicleCell({
  adminVehiclesEditing,
  children,
  numeric,
  value,
}: {
  adminVehiclesEditing: boolean;
  children: ReactNode;
  numeric?: boolean;
  value: string | number;
}) {
  if (adminVehiclesEditing) return <>{children}</>;
  return <AdminVehicleReadOnlyCell numeric={numeric} value={value} />;
}

export function AdminVehicleTableRow({
  adminVehiclesEditing,
  vehicle,
  vehicleCellInputProps,
  onVehicleCellChange,
  onToggleVehicleVisibility,
  onDeleteVehicle,
}: {
  adminVehiclesEditing: boolean;
  vehicle: VehicleRow;
  vehicleCellInputProps: (id: number, field: VehicleInlineField) => VehicleCellShellProps;
  onVehicleCellChange: (id: number, field: VehicleInlineField, value: string) => void;
  onToggleVehicleVisibility: (id: number) => void;
  onDeleteVehicle: (id: number) => void;
}) {
  const vehicleDisplayName = buildVehicleDisplayName(vehicle);

  return (
    <tr>
      <td style={{ ...adminVehicleTdStyle, textAlign: "center" }}>
        {adminVehiclesEditing ? (
          <input
            aria-label={`Показывать ${vehicleDisplayName}`}
            checked={vehicle.visible !== false}
            onChange={() => onToggleVehicleVisibility(vehicle.id)}
            type="checkbox"
            style={adminVehicleCheckboxStyle}
          />
        ) : null}
      </td>
      <td style={adminVehicleTdStyle}>
        <VehicleCell adminVehiclesEditing={adminVehiclesEditing} value={vehicle.vehicleType}>
          <EditableVehicleCell
            vehicle={vehicle}
            field="vehicleType"
            list="admin-vehicle-category-options"
            onVehicleCellChange={onVehicleCellChange}
            vehicleCellInputProps={vehicleCellInputProps}
          />
        </VehicleCell>
      </td>
      <td style={adminVehicleNameTdStyle}>
        <VehicleCell adminVehiclesEditing={adminVehiclesEditing} value={vehicle.equipmentType}>
          <EditableVehicleCell
            vehicle={vehicle}
            field="equipmentType"
            list="admin-vehicle-equipment-type-options"
            onVehicleCellChange={onVehicleCellChange}
            vehicleCellInputProps={vehicleCellInputProps}
          />
        </VehicleCell>
      </td>
      <td style={adminVehicleTdStyle}>
        <VehicleCell adminVehiclesEditing={adminVehiclesEditing} value={vehicle.brand}>
          <EditableVehicleCell
            vehicle={vehicle}
            field="brand"
            list="admin-vehicle-brand-options"
            onVehicleCellChange={onVehicleCellChange}
            vehicleCellInputProps={vehicleCellInputProps}
          />
        </VehicleCell>
      </td>
      <td style={adminVehicleTdStyle}>
        <VehicleCell adminVehiclesEditing={adminVehiclesEditing} value={vehicle.model}>
          <EditableVehicleCell
            vehicle={vehicle}
            field="model"
            onVehicleCellChange={onVehicleCellChange}
            vehicleCellInputProps={vehicleCellInputProps}
          />
        </VehicleCell>
      </td>
      <td style={adminVehicleTdStyle}>
        <VehicleCell adminVehiclesEditing={adminVehiclesEditing} value={vehicle.plateNumber}>
          <EditableVehicleCell
            vehicle={vehicle}
            field="plateNumber"
            onVehicleCellChange={onVehicleCellChange}
            vehicleCellInputProps={vehicleCellInputProps}
          />
        </VehicleCell>
      </td>
      <td style={adminVehicleTdStyle}>
        <VehicleCell adminVehiclesEditing={adminVehiclesEditing} value={vehicle.garageNumber}>
          <EditableVehicleCell
            vehicle={vehicle}
            field="garageNumber"
            onVehicleCellChange={onVehicleCellChange}
            vehicleCellInputProps={vehicleCellInputProps}
          />
        </VehicleCell>
      </td>
      <td style={adminVehicleNumberTdStyle}>
        <VehicleCell adminVehiclesEditing={adminVehiclesEditing} numeric value={vehicle.manufactureYear}>
          <EditableVehicleCell
            vehicle={vehicle}
            field="manufactureYear"
            numeric
            onVehicleCellChange={onVehicleCellChange}
            vehicleCellInputProps={vehicleCellInputProps}
          />
        </VehicleCell>
      </td>
      <td style={adminVehicleTdStyle}>
        <VehicleCell adminVehiclesEditing={adminVehiclesEditing} value={vehicle.vin}>
          <EditableVehicleCell
            vehicle={vehicle}
            field="vin"
            onVehicleCellChange={onVehicleCellChange}
            vehicleCellInputProps={vehicleCellInputProps}
          />
        </VehicleCell>
      </td>
      <td style={adminVehicleTdStyle}>
        <VehicleCell adminVehiclesEditing={adminVehiclesEditing} value={vehicle.owner}>
          <EditableVehicleCell
            vehicle={vehicle}
            field="owner"
            list="admin-vehicle-owner-options"
            onVehicleCellChange={onVehicleCellChange}
            vehicleCellInputProps={vehicleCellInputProps}
          />
        </VehicleCell>
      </td>
      <td style={adminVehicleActionTdStyle}>
        {adminVehiclesEditing ? (
          <div style={adminVehicleActionsStyle}>
            <MiniIconButton label={`Удалить ${vehicleDisplayName}`} onClick={() => onDeleteVehicle(vehicle.id)}>
              <Trash2 size={14} aria-hidden />
            </MiniIconButton>
          </div>
        ) : null}
      </td>
    </tr>
  );
}
