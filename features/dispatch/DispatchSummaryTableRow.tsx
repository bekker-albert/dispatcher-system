"use client";

import { useMemo, type ChangeEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  buildDispatchSummaryRowView,
  dispatchNumberInputValue,
  type DispatchSummaryNumberField,
  type DispatchSummaryRow,
  type DispatchSummaryTextField,
} from "@/lib/domain/dispatch/summary";
import { formatPtoCellNumber } from "@/lib/domain/pto/formatting";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { normalizeLookupValue } from "@/lib/utils/text";
import { MiniIconButton } from "@/shared/ui/buttons";
import {
  dispatchSummaryActionGroupStyle,
  dispatchSummaryActionTdStyle,
  dispatchSummaryBadRowStyle,
  dispatchSummaryInputStyle,
  dispatchSummaryLoaderRowStyle,
  dispatchSummaryMutedTextStyle,
  dispatchSummaryNumberInputStyle,
  dispatchSummaryReadonlyNumberStyle,
  dispatchSummaryTdNumberStyle,
  dispatchSummaryTdStyle,
  dispatchSummaryTruckCellStyle,
  dispatchSummaryTruckLinkCellStyle,
  dispatchSummaryTruckRowStyle,
} from "@/features/dispatch/dispatchSectionStyles";
import {
  dispatchMaterialEmptyValue,
  dispatchMaterialPlaceholder,
} from "./dispatchMaterialRules";
import { DispatchVehiclePicker } from "./DispatchVehiclePicker";
import {
  dispatchRowExceedsHourLimit,
  dispatchRowHourTotal,
  dispatchShiftHourLimit,
} from "./dispatchHoursValidation";
import {
  type DispatchStructureOptionIndex,
  getDispatchLocationOptionsFromIndex,
  getDispatchStructureOptionsFromIndex,
} from "./dispatchStructureOptions";

export type DispatchSummaryTableRowProps = {
  row: DispatchSummaryRow;
  isReadOnly: boolean;
  rowRole: "loading" | "truck" | "unassigned";
  vehicle?: VehicleRow;
  vehicles: VehicleRow[];
  areaOptions: string[];
  locationOptions: string[];
  structureOptions: string[];
  ptoPlanIndex: DispatchStructureOptionIndex | null;
  onAddDumpTruckToCurrentLink?: () => void;
  onUpdateDispatchSummaryVehicle: (rowId: string, vehicleId: string) => void;
  onUpdateDispatchSummaryText: (rowId: string, field: DispatchSummaryTextField, value: string) => void;
  onUpdateDispatchSummaryNumber: (rowId: string, field: DispatchSummaryNumberField, value: string) => void;
  onDeleteDispatchSummaryRow: (rowId: string) => void;
};

function vehicleNumber(vehicle: VehicleRow | undefined) {
  return vehicle?.garageNumber || vehicle?.plateNumber || "";
}

function optionValues(values: string[], current: string) {
  const unique = Array.from(new Set([current, ...values].map((value) => value.trim()).filter(Boolean)));
  return unique.sort((left, right) => left.localeCompare(right, "ru"));
}

function optionMatches(values: string[], current: string) {
  const normalizedCurrent = normalizeLookupValue(current);
  return !normalizedCurrent || values.some((value) => normalizeLookupValue(value) === normalizedCurrent);
}

export function DispatchSummaryTableRow({
  row,
  isReadOnly,
  rowRole,
  vehicle,
  vehicles,
  areaOptions,
  locationOptions,
  structureOptions,
  ptoPlanIndex,
  onAddDumpTruckToCurrentLink,
  onUpdateDispatchSummaryVehicle,
  onUpdateDispatchSummaryText,
  onUpdateDispatchSummaryNumber,
  onDeleteDispatchSummaryRow,
}: DispatchSummaryTableRowProps) {
  const rowView = buildDispatchSummaryRowView(row);
  const productivityText = formatPtoCellNumber(rowView.productivity);
  const hoursError = dispatchRowExceedsHourLimit(row);
  const isTruckRow = rowRole === "truck";
  const rowStyle = {
    ...(isTruckRow ? dispatchSummaryTruckRowStyle : dispatchSummaryLoaderRowStyle),
    ...(hoursError ? dispatchSummaryBadRowStyle : {}),
  };
  const vehicleCellStyle = isTruckRow
    ? { ...dispatchSummaryTdStyle, ...dispatchSummaryTruckCellStyle }
    : dispatchSummaryTdStyle;
  const rowLocationOptions = useMemo(() => {
    if (!ptoPlanIndex) return locationOptions;

    return getDispatchLocationOptionsFromIndex(ptoPlanIndex, row.area);
  }, [locationOptions, ptoPlanIndex, row.area]);
  const rowStructureOptions = useMemo(() => {
    if (!ptoPlanIndex) return structureOptions;

    return getDispatchStructureOptionsFromIndex(ptoPlanIndex, row.area, row.location);
  }, [ptoPlanIndex, row.area, row.location, structureOptions]);

  const handleTextChange = (field: DispatchSummaryTextField) => (event: ChangeEvent<HTMLSelectElement>) => {
    onUpdateDispatchSummaryText(row.id, field, event.target.value);
  };
  const handleAreaChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextArea = event.target.value;
    const nextLocations = ptoPlanIndex ? getDispatchLocationOptionsFromIndex(ptoPlanIndex, nextArea) : [];
    const shouldClearLocation = Boolean(ptoPlanIndex) && !optionMatches(nextLocations, row.location);
    const nextLocation = shouldClearLocation ? "" : row.location;
    const nextStructures = ptoPlanIndex ? getDispatchStructureOptionsFromIndex(ptoPlanIndex, nextArea, nextLocation) : [];
    const shouldClearStructure = Boolean(ptoPlanIndex) && !optionMatches(nextStructures, row.workType);

    onUpdateDispatchSummaryText(row.id, "area", nextArea);
    if (shouldClearLocation) onUpdateDispatchSummaryText(row.id, "location", "");
    if (shouldClearStructure) onUpdateDispatchSummaryText(row.id, "workType", "");
  };
  const handleLocationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocation = event.target.value;
    const nextStructures = ptoPlanIndex ? getDispatchStructureOptionsFromIndex(ptoPlanIndex, row.area, nextLocation) : [];
    const shouldClearStructure = Boolean(ptoPlanIndex) && !optionMatches(nextStructures, row.workType);

    onUpdateDispatchSummaryText(row.id, "location", nextLocation);
    if (shouldClearStructure) onUpdateDispatchSummaryText(row.id, "workType", "");
  };
  const handleNumberChange = (field: DispatchSummaryNumberField) => (event: ChangeEvent<HTMLInputElement>) => {
    onUpdateDispatchSummaryNumber(row.id, field, event.target.value);
  };

  return (
    <tr style={rowStyle}>
      {isTruckRow ? (
        <td colSpan={3} style={dispatchSummaryTruckLinkCellStyle}>
          ↳
        </td>
      ) : (
        <>
          <td style={dispatchSummaryTdStyle}>
            <select disabled={isReadOnly} value={row.area} onChange={handleAreaChange} style={dispatchSummaryInputStyle}>
              <option value="">Участок</option>
              {optionValues(areaOptions, row.area).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </td>
          <td style={dispatchSummaryTdStyle}>
            <select disabled={isReadOnly} value={row.location} onChange={handleLocationChange} style={dispatchSummaryInputStyle}>
              <option value="">Местонахождение</option>
              {optionValues(rowLocationOptions, row.location).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </td>
          <td style={dispatchSummaryTdStyle}>
            <select disabled={isReadOnly || rowStructureOptions.length === 0} value={row.workType} onChange={handleTextChange("workType")} style={dispatchSummaryInputStyle}>
              <option value="">{rowStructureOptions.length === 0 ? "Нет структур в плане для выбранной связки" : "Структура"}</option>
              {optionValues(rowStructureOptions, row.workType).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </td>
        </>
      )}
      <td style={vehicleCellStyle}>
        <DispatchVehiclePicker
          disabled={isReadOnly}
          isTruckRow={isTruckRow}
          value={row.vehicleId}
          vehicle={vehicle}
          vehicles={vehicles}
          onChange={(vehicleId) => onUpdateDispatchSummaryVehicle(row.id, vehicleId)}
        />
        {row.excavator && isTruckRow ? (
          <div style={{ ...dispatchSummaryMutedTextStyle, marginTop: 3 }}>под {row.excavator}</div>
        ) : null}
      </td>
      <td style={dispatchSummaryTdStyle}>
        <div style={dispatchSummaryMutedTextStyle}>{vehicleNumber(vehicle) || "—"}</div>
      </td>
      {isTruckRow ? (
        <td style={dispatchSummaryTdStyle} />
      ) : (
        <td style={dispatchSummaryTdStyle}>
          <select disabled value={dispatchMaterialEmptyValue} style={dispatchSummaryInputStyle} title="Материал не равен местонахождению">
            <option value={dispatchMaterialEmptyValue}>{dispatchMaterialPlaceholder}</option>
          </select>
        </td>
      )}
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
          <div style={dispatchSummaryActionGroupStyle}>
            {onAddDumpTruckToCurrentLink ? (
              <MiniIconButton label="Добавить самосвал под эту погрузочную" onClick={onAddDumpTruckToCurrentLink}>
                <Plus size={14} aria-hidden />
              </MiniIconButton>
            ) : null}
            <MiniIconButton label="Удалить строку сводки" onClick={() => onDeleteDispatchSummaryRow(row.id)}>
              <Trash2 size={14} aria-hidden />
            </MiniIconButton>
          </div>
        ) : null}
      </td>
    </tr>
  );
}
