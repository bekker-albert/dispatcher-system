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
import { MiniIconButton } from "@/shared/ui/buttons";
import { Pill } from "@/shared/ui/layout";
import {
  dispatchSummaryActionTdStyle,
  dispatchSummaryBadRowStyle,
  dispatchSummaryInputStyle,
  dispatchSummaryNumberInputStyle,
  dispatchSummaryReadonlyNumberStyle,
  dispatchSummaryTdNumberStyle,
  dispatchSummaryTdStyle,
  dispatchSummaryTextareaStyle,
} from "@/features/dispatch/dispatchSectionStyles";
import type { DispatchVehicleSelectOption } from "@/features/dispatch/dispatchSectionTypes";

export type DispatchSummaryTableRowProps = {
  row: DispatchSummaryRow;
  isReadOnly: boolean;
  vehicleSelectOptions: DispatchVehicleSelectOption[];
  onUpdateDispatchSummaryVehicle: (rowId: string, vehicleId: string) => void;
  onUpdateDispatchSummaryText: (rowId: string, field: DispatchSummaryTextField, value: string) => void;
  onUpdateDispatchSummaryNumber: (rowId: string, field: DispatchSummaryNumberField, value: string) => void;
  onDeleteDispatchSummaryRow: (rowId: string) => void;
};

export function DispatchSummaryTableRow({
  row,
  isReadOnly,
  vehicleSelectOptions,
  onUpdateDispatchSummaryVehicle,
  onUpdateDispatchSummaryText,
  onUpdateDispatchSummaryNumber,
  onDeleteDispatchSummaryRow,
}: DispatchSummaryTableRowProps) {
  const rowView = buildDispatchSummaryRowView(row);
  const totalHoursText = formatPtoCellNumber(rowView.totalHours);
  const productivityText = formatPtoCellNumber(rowView.productivity);
  const hoursPillBg = rowView.hoursOk ? "#dcfce7" : "#fee2e2";
  const hoursPillColor = rowView.hoursOk ? "#166534" : "#991b1b";

  const handleVehicleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onUpdateDispatchSummaryVehicle(row.id, event.target.value);
  };
  const handleTextChange = (field: DispatchSummaryTextField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdateDispatchSummaryText(row.id, field, event.target.value);
  };
  const handleNumberChange = (field: DispatchSummaryNumberField) => (event: ChangeEvent<HTMLInputElement>) => {
    onUpdateDispatchSummaryNumber(row.id, field, event.target.value);
  };

  return (
    <tr style={rowView.isBehindPlan ? dispatchSummaryBadRowStyle : undefined}>
      <td style={dispatchSummaryTdStyle}>
        <select disabled={isReadOnly} value={row.vehicleId ?? ""} onChange={handleVehicleChange} style={dispatchSummaryInputStyle}>
          <option value="">Вручную</option>
          {vehicleSelectOptions.map((vehicle) => (
            <option key={vehicle.value} value={vehicle.value}>{vehicle.label}</option>
          ))}
        </select>
        {!row.vehicleId ? (
          <input readOnly={isReadOnly} value={row.vehicleName} onChange={handleTextChange("vehicleName")} placeholder="Название техники" style={{ ...dispatchSummaryInputStyle, marginTop: 4 }} />
        ) : null}
      </td>
      <td style={dispatchSummaryTdStyle}>
        <input readOnly={isReadOnly} list="dispatch-area-options" value={row.area} onChange={handleTextChange("area")} style={dispatchSummaryInputStyle} />
      </td>
      <td style={dispatchSummaryTdStyle}>
        <input readOnly={isReadOnly} list="dispatch-location-options" value={row.location} onChange={handleTextChange("location")} style={dispatchSummaryInputStyle} />
      </td>
      <td style={dispatchSummaryTdStyle}>
        <textarea readOnly={isReadOnly} value={row.workType} onChange={handleTextChange("workType")} placeholder="Вид работ" style={dispatchSummaryTextareaStyle} />
      </td>
      <td style={dispatchSummaryTdStyle}>
        <input readOnly={isReadOnly} list="dispatch-excavator-options" value={row.excavator} onChange={handleTextChange("excavator")} style={dispatchSummaryInputStyle} />
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="decimal" value={dispatchNumberInputValue(row.planVolume)} onChange={handleNumberChange("planVolume")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="decimal" value={dispatchNumberInputValue(row.factVolume)} onChange={handleNumberChange("factVolume")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="decimal" value={dispatchNumberInputValue(row.workHours)} onChange={handleNumberChange("workHours")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="decimal" value={dispatchNumberInputValue(row.rentHours)} onChange={handleNumberChange("rentHours")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="decimal" value={dispatchNumberInputValue(row.repairHours)} onChange={handleNumberChange("repairHours")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="decimal" value={dispatchNumberInputValue(row.downtimeHours)} onChange={handleNumberChange("downtimeHours")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryTdNumberStyle}>
        <input readOnly={isReadOnly} inputMode="numeric" value={dispatchNumberInputValue(row.trips)} onChange={handleNumberChange("trips")} style={dispatchSummaryNumberInputStyle} />
      </td>
      <td style={dispatchSummaryReadonlyNumberStyle}>{productivityText}</td>
      <td style={dispatchSummaryReadonlyNumberStyle}>
        <Pill bg={hoursPillBg} color={hoursPillColor}>
          {totalHoursText}
        </Pill>
      </td>
      <td style={dispatchSummaryTdStyle}>
        <textarea readOnly={isReadOnly} value={row.reason} onChange={handleTextChange("reason")} placeholder="Например: Простой ДСК (5 ч.)" style={dispatchSummaryTextareaStyle} />
      </td>
      <td style={dispatchSummaryTdStyle}>
        <textarea readOnly={isReadOnly} value={row.comment} onChange={handleTextChange("comment")} placeholder="Комментарий смены" style={dispatchSummaryTextareaStyle} />
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
