"use client";

import { useEffect, useId, useMemo, useState, type ChangeEvent, type KeyboardEvent } from "react";

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
    isTruckRow
      ? vehicles
      : vehicles.filter((item) => (
          normalizeLookupValue(item.vehicleType) === normalizeLookupValue("Погрузочная")
        ))
  ), [isTruckRow, vehicles]);
  const selectedGarageNumber = vehicle?.garageNumber.trim() ?? "";
  const [query, setQuery] = useState(selectedGarageNumber);

  useEffect(() => {
    setQuery(selectedGarageNumber);
  }, [selectedGarageNumber, value]);

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
    setQuery(matchedVehicle.garageNumber.trim());
    return true;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setQuery(nextValue);
    selectExactGarageNumber(nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    selectExactGarageNumber(query);
  };

  return (
    <>
      <input
        type="text"
        list={disabled ? undefined : listId}
        disabled={disabled}
        value={query}
        placeholder="Гаражный №"
        autoComplete="off"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!selectExactGarageNumber(query)) setQuery(selectedGarageNumber);
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
