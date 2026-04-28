import { ChevronDown } from "lucide-react";

import {
  adminVehicleFilterButtonActiveStyle,
  adminVehicleFilterButtonStyle,
  adminVehicleHeaderIconStyle,
  adminVehicleHeaderTextStyle,
} from "./AdminVehicleFilterStyles";
import type { VehicleFilterColumnLike } from "./AdminVehicleFilterTypes";

export function AdminVehicleFilterColumnLabel({
  column,
  label,
}: {
  column: VehicleFilterColumnLike;
  label: string;
}) {
  if (column.icon) {
    return (
      <span style={adminVehicleHeaderIconStyle} title={label}>
        {column.icon}
      </span>
    );
  }

  return <span style={adminVehicleHeaderTextStyle}>{column.label}</span>;
}

export function AdminVehicleFilterToggleButton({
  isActive,
  label,
  onToggleOpen,
}: {
  isActive: boolean;
  label: string;
  onToggleOpen: () => void;
}) {
  return (
    <button
      aria-label={`Фильтр: ${label}`}
      title={`Фильтр: ${label}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggleOpen();
      }}
      style={{
        ...adminVehicleFilterButtonStyle,
        ...(isActive ? adminVehicleFilterButtonActiveStyle : null),
      }}
      type="button"
    >
      <ChevronDown size={12} aria-hidden />
    </button>
  );
}
