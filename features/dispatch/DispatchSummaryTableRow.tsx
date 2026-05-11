"use client";

import { type ChangeEvent } from "react";
import { Trash2 } from "lucide-react";

import {
  buildDispatchSummaryRowView,
  dispatchNumberInputValue,
  type DispatchSummaryNumberField,
  type DispatchSummaryRow,
  type DispatchSummaryTextField,
} from "@/lib/domain/dispatch/summary";
import { formatPtoCellNumber } from "@/lib/domain/pto/formatting";
import { buildVehicleDisplayName } from "@/lib/domain/vehicles/import-export";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { MiniIconButton } from "@/shared/ui/buttons";
import {
  dispatchSummaryActionTdStyle,
  dispatchSummaryBadRowStyle,
  dispatchSummaryInputStyle,
  dispatchSummaryMutedTextStyle,
  dispatchSummaryNumberInputStyle,
  dispatchSummaryReadonlyNumberStyle,
  dispatchSummaryTdNumberStyle,
  dispatchSummaryTdStyle,
} from "@/features/dispatch/dispatchSectionStyles";
import {
  dispatchMaterialEmptyValue,
  dispatchMaterialPlaceholder,
} from "./dispatchMaterialRules";
import {
  dispatchRowExceedsHourLimit,
  dispatchRowHourTotal,
  dispatchShiftHourLimit,
} from "./dispatchHoursValidation";

export type DispatchSummaryTableRowProps = {
  row: DispatchSummaryRow;
  isReadOnly: boolean;
  isChildRow: boolean;
  vehicle?: VehicleRow;
  vehicles: VehicleRow[];
  locationOptions: string[];
  structureOptions: string[];
  onUpdateDispatchSummaryVehicle: (rowId: string, vehicleId: string) => void;
  onUpdateDispatchSummaryText: (rowId: string, field: DispatchSummaryTextField, value: string) => void;
  onUpdateDispatchSummaryNumber: (rowId: string, field: DispatchSummaryNumberField, value: string) => void;
  onDeleteDispatchSummaryRow: (rowId: string) => void;
};

function vehicleKind(vehicle: VehicleRow | undefined) {
  return vehicle?.equipmentType || vehicle?.vehicleType || "";
}

function vehicleNumber(vehicle: VehicleRow | undefined) {
  return vehicle?.garageNumber || vehicle?.plateNumber || "";
}

function optionValues(values: string[], current: string) {
  const unique = Array.from(new Set([current, ...values].map((value) => value.trim()).filter(Boolean)));
  return unique.sort((left, right) => left.localeCompare(right, "ru"));
}

export function DispatchSummaryTableRow({
  row,
  isReadOnly,
  isChildRow,
  vehicle,
  vehicles,
  locationOptions,
  structureOptions,
  onUpdateDispatchSummaryVehicle,
  onUpdateDispatchSummaryText,
  onUpdateDispatchSummaryNumber,
  onDeleteDispatchSummaryRow,
}: DispatchSummaryTableRowProps) {
  const rowView = buildDispatchSummaryRowView(row);
  const productivityText = formatPtoCellNumber(rowView.productivity);
  const hoursError = dispatchRowExceedsHourLimit(row);

  const handleTextChange = (field: DispatchSummaryTextField) => (event: ChangeEvent<HTMLSelectElement>) => {
    onUpdateDispatchSummaryText(row.id, field, event.target.value);
  };
  const handleNumberChange = (field: DispatchSummaryNumberField) => (event: ChangeEvent<HTMLInputElement>) => {
    onUpdateDispatchSummaryNumber(row.id, field, event.target.value);
  };

  return (
    <tr style={hoursError ? dispatchSummaryBadRowStyle : undefined}>
      <td style={dispatchSummaryTdStyle}>
        <select disabled={isReadOnly} value={row.location} onChange={handleTextChange("location")} style={dispatchSummaryInputStyle}>
          <option value="">Местонахождение</option>
          {optionValues(locationOptions, row.location).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </td>
      <td style={dispatchSummaryTdStyle}>
        <select disabled={isReadOnly || structureOptions.length === 0} value={row.workType} onChange={handleTextChange("workType")} style={dispatchSummaryInputStyle}>
          <option value="">{structureOptions.length === 0 ? "Нет структур в плане для выбранного участка" : "Структура"}</option>
          {optionValues(structureOptions, row.workType).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </td>
      <td style={dispatchSummaryTdStyle}>
        <div style={dispatchSummaryMutedTextStyle}>{vehicleKind(vehicle) || "—"}</div>
      </td>
      <td style={dispatchSummaryTdStyle}>
        <select
          disabled={isReadOnly}
          value={row.vehicleId ? String(row.vehicleId) : ""}
          onChange={(event) => onUpdateDispatchSummaryVehicle(row.id, event.target.value)}
          style={{ ...dispatchSummaryInputStyle, paddingLeft: isChildRow ? 18 : undefined }}
        >
          <option value="">Выбрать технику</option>
          {vehicles.map((item) => (
            <option key={item.id} value={item.id}>{buildVehicleDisplayName(item)}</option>
          ))}
        </select>
        {row.excavator && isChildRow ? (
          <div style={{ ...dispatchSummaryMutedTextStyle, marginTop: 3 }}>под {row.excavator}</div>
        ) : null}
      </td>
      <td style={dispatchSummaryTdStyle}>
        <div style={dispatchSummaryMutedTextStyle}>{vehicleNumber(vehicle) || "—"}</div>
      </td>
      <td style={dispatchSummaryTdStyle}>
        <select disabled value={dispatchMaterialEmptyValue} style={dispatchSummaryInputStyle} title="Материал не равен местонахождению">
          <option value={dispatchMaterialEmptyValue}>{dispatchMaterialPlaceholder}</option>
        </select>
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="numeric" step={1} min={0} value={dispatchNumberInputValue(row.rentHours)} onChange={handleNumberChange("rentHours")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="numeric" step={1} min={0} value={dispatchNumberInputValue(row.workHours)} onChange={handleNumberChange("workHours")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="numeric" step={1} min={0} value={dispatchNumberInputValue(row.downtimeHours)} onChange={handleNumberChange("downtimeHours")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="numeric" step={1} min={0} value={dispatchNumberInputValue(row.repairHours)} onChange={handleNumberChange("repairHours")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="numeric" step={1} min={0} value={dispatchNumberInputValue(row.trips)} onChange={handleNumberChange("trips")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryReadonlyNumberStyle}>
        {productivityText}
        {hoursError ? (
          <div style={{ ...dispatchSummaryMutedTextStyle, color: "#b45309" }}>
            {dispatchRowHourTotal(row)} / {dispatchShiftHourLimit} ч.
          </div>
        ) : null}
      </td>
      <td style={dispatchSummaryActionTdStyle}>
        {!isReadOnly ? (
          <MiniIconButton label="Удалить строку сводки" onClick={() => onDeleteDispatchSummaryRow(row.id)}>
            <Trash2 size={14} aria-hidden />
          </MiniIconButton>
        ) : null}
      </td>
    </tr>
  );
}
