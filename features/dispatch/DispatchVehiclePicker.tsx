"use client";

import { useId, useMemo, type ChangeEvent, type KeyboardEvent } from "react";

import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { normalizeLookupValue } from "@/lib/utils/text";
import { dispatchSummaryInputStyle } from "@/features/dispatch/dispatchSectionStyles";
import { buildDispatchVehicleLabel } from "./dispatchVehicleLabel";

type DispatchVehiclePickerProps = {
  disabled: boolean;
  isTruckRow: boolean;
  value: number | null;
  vehicle?: VehicleRow;
  vehicles: VehicleRow[];
  onChange: (vehicleId: string) => void;
};

function isVehicleType(vehicle: VehicleRow, expected: string) {
  return normalizeLookupValue(vehicle.vehicleType) === normalizeLookupValue(expected);
}

export function DispatchVehiclePicker({
  disabled,
  isTruckRow,
  value,
  vehicle,
  vehicles,
  onChange,
}: DispatchVehiclePickerProps) {
  const listId = useId();
  const availableVehicles = useMemo(() => (
    vehicles.filter((item) => (
      isTruckRow
        ? isVehicleType(item, "Транспортировочная")
        : isVehicleType(item, "Погрузочная")
    ))
  ), [isTruckRow, vehicles]);
  const selectedGarageNumber = vehicle?.garageNumber.trim() ?? "";

  const findVehicleByGarageNumber = (garageNumber: string) => {
    const normalizedGarageNumber = normalizeLookupValue(garageNumber);
    if (!normalizedGarageNumber) return undefined;

    return availableVehicles.find((item) => (
      normalizeLookupValue(item.garageNumber) === normalizedGarageNumber
    ));
  };

  const selectExactGarageNumber = (garageNumber: string) => {
    const matchedVehicle = findVehicleByGarageNumber(garageNumber);
    if (!matchedVehicle) return false;

    onChange(String(matchedVehicle.id));
    return true;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectExactGarageNumber(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    selectExactGarageNumber(event.currentTarget.value);
  };

  return (
    <>
      <input
        key={value ?? "empty"}
        type="text"
        list={disabled ? undefined : listId}
        disabled={disabled}
        defaultValue={selectedGarageNumber}
        placeholder="Гаражный №"
        autoComplete="off"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          if (!selectExactGarageNumber(event.currentTarget.value)) {
            event.currentTarget.value = selectedGarageNumber;
          }
        }}
        style={{ ...dispatchSummaryInputStyle, textAlign: "center", fontVariantNumeric: "tabular-nums" }}
        aria-label="Гаражный номер техники"
      />
      {!disabled ? (
        <datalist id={listId}>
          {availableVehicles
            .filter((item) => item.garageNumber.trim())
            .map((item) => (
              <option
                key={item.id}
                value={item.garageNumber.trim()}
                label={buildDispatchVehicleLabel(item)}
              />
            ))}
        </datalist>
      ) : null}
    </>
  );
}
