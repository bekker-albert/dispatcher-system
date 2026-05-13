"use client";

import { useMemo, useState } from "react";

import { buildVehicleDisplayName } from "@/lib/domain/vehicles/import-export";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import {
  dispatchSummaryInputStyle,
  dispatchSummaryVehicleButtonStyle,
} from "@/features/dispatch/dispatchSectionStyles";

type DispatchVehiclePickerProps = {
  disabled: boolean;
  isTruckRow: boolean;
  value: number | null;
  vehicle?: VehicleRow;
  vehicles: VehicleRow[];
  onChange: (vehicleId: string) => void;
};

export function DispatchVehiclePicker({
  disabled,
  isTruckRow,
  value,
  vehicle,
  vehicles,
  onChange,
}: DispatchVehiclePickerProps) {
  const [editing, setEditing] = useState(false);
  const displayValue = useMemo(() => (
    vehicle ? buildVehicleDisplayName(vehicle) : "Выбрать технику"
  ), [vehicle]);

  if (disabled || !editing) {
    return (
      <button
        type="button"
        disabled={disabled}
        title={displayValue}
        onClick={() => setEditing(true)}
        style={{ ...dispatchSummaryVehicleButtonStyle, paddingLeft: isTruckRow ? 18 : undefined }}
      >
        {displayValue}
      </button>
    );
  }

  return (
    <select
      autoFocus
      value={value ? String(value) : ""}
      onBlur={() => setEditing(false)}
      onChange={(event) => {
        onChange(event.target.value);
        setEditing(false);
      }}
      style={{ ...dispatchSummaryInputStyle, paddingLeft: isTruckRow ? 18 : undefined }}
    >
      <option value="">Выбрать технику</option>
      {vehicles.map((item) => (
        <option key={item.id} value={item.id}>{buildVehicleDisplayName(item)}</option>
      ))}
    </select>
  );
}
