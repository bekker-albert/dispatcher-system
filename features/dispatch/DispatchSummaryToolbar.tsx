"use client";

import { Plus } from "lucide-react";

import { Field } from "@/shared/ui/layout";
import {
  dispatchSummaryButtonStyle,
  dispatchSummaryReadonlyNoteStyle,
  dispatchSummarySecondaryButtonStyle,
  dispatchSummaryToolbarDailyStyle,
  dispatchSummaryToolbarStyle,
  inputStyle,
} from "@/features/dispatch/dispatchSectionStyles";
import type { DispatchVehicleSelectOption } from "@/features/dispatch/dispatchSectionTypes";

type DispatchSummaryToolbarProps = {
  areaFilter: string;
  dispatchAreaOptions: string[];
  dispatchVehicleToAddId: string;
  isDailyDispatchShift: boolean;
  onAddFilteredVehiclesToDispatchSummary: () => void;
  onAddSelectedDispatchVehicle: () => void;
  onAreaFilterChange: (value: string) => void;
  onDispatchVehicleToAddIdChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  search: string;
  vehicleSelectOptions: DispatchVehicleSelectOption[];
};

export function DispatchSummaryToolbar({
  areaFilter,
  dispatchAreaOptions,
  dispatchVehicleToAddId,
  isDailyDispatchShift,
  onAddFilteredVehiclesToDispatchSummary,
  onAddSelectedDispatchVehicle,
  onAreaFilterChange,
  onDispatchVehicleToAddIdChange,
  onSearchChange,
  search,
  vehicleSelectOptions,
}: DispatchSummaryToolbarProps) {
  return (
    <div style={isDailyDispatchShift ? dispatchSummaryToolbarDailyStyle : dispatchSummaryToolbarStyle}>
      <Field label="Поиск">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Техника, участок, вид работ, причина..."
          style={{ ...inputStyle, padding: "9px 10px" }}
        />
      </Field>
      <Field label="Участок">
        <select value={areaFilter} onChange={(event) => onAreaFilterChange(event.target.value)} style={{ ...inputStyle, padding: "9px 10px" }}>
          {dispatchAreaOptions.map((area) => (
            <option key={area}>{area}</option>
          ))}
        </select>
      </Field>
      {isDailyDispatchShift ? (
        <div style={dispatchSummaryReadonlyNoteStyle}>
          Редактирование закрыто: заполняй вкладки Ночь и День, эта вкладка покажет их сумму.
        </div>
      ) : (
        <>
          <Field label="Техника">
            <select
              value={dispatchVehicleToAddId}
              onChange={(event) => onDispatchVehicleToAddIdChange(event.target.value)}
              style={{ ...inputStyle, padding: "9px 10px" }}
            >
              <option value="">Пустая строка</option>
              {vehicleSelectOptions.map((vehicle) => (
                <option key={vehicle.value} value={vehicle.value}>{vehicle.label}</option>
              ))}
            </select>
          </Field>
          <button onClick={onAddSelectedDispatchVehicle} style={dispatchSummaryButtonStyle} type="button">
            <Plus size={14} aria-hidden />
            Добавить строку
          </button>
          <button onClick={onAddFilteredVehiclesToDispatchSummary} style={dispatchSummarySecondaryButtonStyle} type="button">
            Заполнить из техники
          </button>
        </>
      )}
    </div>
  );
}
