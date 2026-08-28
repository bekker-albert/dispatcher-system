"use client";

import { useId, useMemo, type ChangeEvent, type KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";

import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { normalizeLookupValue } from "@/lib/utils/text";
import { dispatchSummaryInputStyle } from "@/features/dispatch/dispatchSectionStyles";
import type { DispatchSummaryCategoryTab } from "./DispatchSummaryToolbar";
import { buildDispatchVehicleLabel } from "./dispatchVehicleLabel";

type DispatchVehiclePickerProps = {
  disabled: boolean;
  isTruckRow: boolean;
  categoryTab: DispatchSummaryCategoryTab;
  value: number | null;
  vehicle?: VehicleRow;
  vehicles: VehicleRow[];
  onChange: (vehicleId: string) => void;
};

function isVehicleType(vehicle: VehicleRow, expected: string) {
  return normalizeLookupValue(vehicle.vehicleType) === normalizeLookupValue(expected);
}

function vehicleMatchesCategory(
  vehicle: VehicleRow,
  categoryTab: DispatchSummaryCategoryTab,
  isTruckRow: boolean,
) {
  if (categoryTab === "Производственная") {
    return isTruckRow
      ? isVehicleType(vehicle, "Транспортировочная")
      : isVehicleType(vehicle, "Погрузочная");
  }
  if (categoryTab === "Спецтехника") return isVehicleType(vehicle, "Спецтехника");
  if (categoryTab === "Вспомогательная") return isVehicleType(vehicle, "Вспомогательная");
  if (categoryTab === "Легковая/Пассажирская") {
    return isVehicleType(vehicle, "Легковая")
      || isVehicleType(vehicle, "Пассажирская")
      || isVehicleType(vehicle, "Легковая/Пассажирская");
  }
  return true;
}

export function DispatchVehiclePicker({
  disabled,
  isTruckRow,
  categoryTab,
  value,
  vehicle,
  vehicles,
  onChange,
}: DispatchVehiclePickerProps) {
  const listId = useId();
  const availableVehicles = useMemo(() => (
    vehicles.filter((item) => vehicleMatchesCategory(item, categoryTab, isTruckRow))
  ), [categoryTab, isTruckRow, vehicles]);
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
      <div style={{ position: "relative", width: "100%" }}>
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
          style={{
            ...dispatchSummaryInputStyle,
            paddingRight: 24,
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
          }}
          aria-label="Гаражный номер техники"
        />
        <ChevronDown
          size={14}
          aria-hidden
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            color: disabled ? "#94a3b8" : "#475569",
            pointerEvents: "none",
          }}
        />
      </div>
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
