import {
  type DispatchSummaryNumberField,
  type DispatchSummaryRow,
  type DispatchSummaryTextField,
} from "@/lib/domain/dispatch/summary";
import {
  dispatchSummaryEmptyStyle,
  dispatchSummaryNumberThStyle,
  dispatchSummaryTableScrollStyle,
  dispatchSummaryTableStyle,
  dispatchSummaryThStyle,
} from "@/features/dispatch/dispatchSectionStyles";
import { DispatchSummaryTableRow } from "@/features/dispatch/DispatchSummaryTableRow";
import type { DispatchVehicleSelectOption } from "@/features/dispatch/dispatchSectionTypes";

type DispatchSummaryTableProps = {
  isDailyDispatchShift: boolean;
  rows: DispatchSummaryRow[];
  vehicleSelectOptions: DispatchVehicleSelectOption[];
  onDeleteDispatchSummaryRow: (rowId: string) => void;
  onUpdateDispatchSummaryNumber: (rowId: string, field: DispatchSummaryNumberField, value: string) => void;
  onUpdateDispatchSummaryText: (rowId: string, field: DispatchSummaryTextField, value: string) => void;
  onUpdateDispatchSummaryVehicle: (rowId: string, vehicleId: string) => void;
};

const dispatchSummaryColumns = [
  190,
  120,
  140,
  230,
  140,
  80,
  80,
  68,
  68,
  68,
  68,
  68,
  82,
  82,
  260,
  230,
  42,
];

const dispatchSummaryHeaders = [
  ["Техника", dispatchSummaryThStyle],
  ["Участок", dispatchSummaryThStyle],
  ["Местонахождение", dispatchSummaryThStyle],
  ["Вид работ", dispatchSummaryThStyle],
  ["Экскаватор", dispatchSummaryThStyle],
  ["План", dispatchSummaryNumberThStyle],
  ["Факт", dispatchSummaryNumberThStyle],
  ["Работа", dispatchSummaryNumberThStyle],
  ["Аренда", dispatchSummaryNumberThStyle],
  ["Ремонт", dispatchSummaryNumberThStyle],
  ["Простой", dispatchSummaryNumberThStyle],
  ["Рейсы", dispatchSummaryNumberThStyle],
  ["Произв.", dispatchSummaryNumberThStyle],
  ["Итого", dispatchSummaryNumberThStyle],
  ["Причина за сутки", dispatchSummaryThStyle],
  ["Комментарий диспетчера", dispatchSummaryThStyle],
  ["", dispatchSummaryThStyle],
] as const;

export function DispatchSummaryTable({
  isDailyDispatchShift,
  rows,
  vehicleSelectOptions,
  onDeleteDispatchSummaryRow,
  onUpdateDispatchSummaryNumber,
  onUpdateDispatchSummaryText,
  onUpdateDispatchSummaryVehicle,
}: DispatchSummaryTableProps) {
  return (
    <div style={dispatchSummaryTableScrollStyle}>
      <table style={dispatchSummaryTableStyle}>
        <colgroup>
          {dispatchSummaryColumns.map((width, index) => (
            <col key={`${width}-${index}`} style={{ width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {dispatchSummaryHeaders.map(([label, style]) => (
              <th key={label || "actions"} style={style}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <DispatchSummaryTableRow
              key={row.id}
              row={row}
              isReadOnly={isDailyDispatchShift}
              vehicleSelectOptions={vehicleSelectOptions}
              onUpdateDispatchSummaryVehicle={onUpdateDispatchSummaryVehicle}
              onUpdateDispatchSummaryText={onUpdateDispatchSummaryText}
              onUpdateDispatchSummaryNumber={onUpdateDispatchSummaryNumber}
              onDeleteDispatchSummaryRow={onDeleteDispatchSummaryRow}
            />
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={17} style={dispatchSummaryEmptyStyle}>
                {isDailyDispatchShift
                  ? "Сутки пока пустые: заполни ночную и дневную смену за выбранную дату."
                  : "По выбранной дате, смене и фильтрам строк пока нет. Добавь строку вручную или заполни из списка техники."}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
