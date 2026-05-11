"use client";

import { Plus, Trash2 } from "lucide-react";

import { Field } from "@/shared/ui/layout";
import {
  dispatchSummaryButtonStyle,
  dispatchSummaryReadonlyNoteStyle,
  dispatchSummarySecondaryButtonStyle,
  dispatchSummaryToolbarCompactStyle,
  dispatchSummaryToolbarDailyStyle,
  inputStyle,
} from "@/features/dispatch/dispatchSectionStyles";

type DispatchSummaryToolbarProps = {
  areaFilter: string;
  dispatchAreaOptions: string[];
  isDailyDispatchShift: boolean;
  sectionScopeMessage: string;
  onAddDispatchSummaryLink: () => void;
  onAddFilteredVehiclesToDispatchSummary: () => void;
  onDeleteCurrentDispatchShiftRows: () => void;
  onAreaFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  search: string;
};

export function DispatchSummaryToolbar({
  areaFilter,
  dispatchAreaOptions,
  isDailyDispatchShift,
  sectionScopeMessage,
  onAddDispatchSummaryLink,
  onAddFilteredVehiclesToDispatchSummary,
  onDeleteCurrentDispatchShiftRows,
  onAreaFilterChange,
  onSearchChange,
  search,
}: DispatchSummaryToolbarProps) {
  return (
    <div style={isDailyDispatchShift ? dispatchSummaryToolbarDailyStyle : dispatchSummaryToolbarCompactStyle}>
      {isDailyDispatchShift ? (
        <Field label="Поиск">
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Техника, участок, структура, причина..."
            style={{ ...inputStyle, padding: "9px 10px" }}
          />
        </Field>
      ) : null}
      <Field label="Участок">
        <select value={areaFilter} onChange={(event) => onAreaFilterChange(event.target.value)} style={{ ...inputStyle, padding: "9px 10px" }}>
          {dispatchAreaOptions.map((area) => (
            <option key={area}>{area}</option>
          ))}
        </select>
      </Field>
      {sectionScopeMessage ? (
        <div style={dispatchSummaryReadonlyNoteStyle}>{sectionScopeMessage}</div>
      ) : null}
      {isDailyDispatchShift ? (
        <div style={dispatchSummaryReadonlyNoteStyle}>
          Редактирование закрыто: заполняй вкладки Ночь и День, эта вкладка показывает их сумму.
        </div>
      ) : (
        <>
          <button onClick={onAddDispatchSummaryLink} style={dispatchSummaryButtonStyle} type="button">
            <Plus size={14} aria-hidden />
            Добавить звено
          </button>
          <button onClick={onAddFilteredVehiclesToDispatchSummary} style={dispatchSummarySecondaryButtonStyle} type="button">
            Заполнить из расстановки
          </button>
          <button onClick={onDeleteCurrentDispatchShiftRows} style={dispatchSummarySecondaryButtonStyle} type="button">
            <Trash2 size={14} aria-hidden />
            Удалить все строки
          </button>
        </>
      )}
    </div>
  );
}
