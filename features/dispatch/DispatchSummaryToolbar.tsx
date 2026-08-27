"use client";

import { Plus } from "lucide-react";

import { Field } from "@/shared/ui/layout";
import {
  dispatchSummaryReadonlyNoteStyle,
  dispatchSummaryToolbarDailyStyle,
  inputStyle,
} from "@/features/dispatch/dispatchSectionStyles";

export const dispatchSummaryCategoryTabs = [
  "Производственная",
  "Спецтехника",
  "Вспомогательная",
  "Легковая/Пассажирская",
  "Простои",
  "Ремонты",
] as const;

export type DispatchSummaryCategoryTab = typeof dispatchSummaryCategoryTabs[number];

type DispatchSummaryToolbarProps = {
  areaFilter: string;
  dispatchAreaOptions: string[];
  isDailyDispatchShift: boolean;
  activeCategoryTab: DispatchSummaryCategoryTab;
  onActiveCategoryTabChange: (tab: DispatchSummaryCategoryTab) => void;
  sectionScopeMessage: string;
  onAddDispatchSummaryLink: () => void;
  onAreaFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  search: string;
};

export function DispatchSummaryToolbar({
  areaFilter,
  dispatchAreaOptions,
  isDailyDispatchShift,
  activeCategoryTab,
  onActiveCategoryTabChange,
  sectionScopeMessage,
  onAddDispatchSummaryLink,
  onAreaFilterChange,
  onSearchChange,
  search,
}: DispatchSummaryToolbarProps) {
  if (isDailyDispatchShift) {
    return (
      <div style={dispatchSummaryToolbarDailyStyle}>
        <Field label="Поиск">
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Техника, участок, структура, причина..."
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
        {sectionScopeMessage ? (
          <div style={dispatchSummaryReadonlyNoteStyle}>{sectionScopeMessage}</div>
        ) : null}
        <div style={dispatchSummaryReadonlyNoteStyle}>
          Редактирование закрыто: заполняй вкладки Ночь и День, эта вкладка показывает их сумму.
        </div>
      </div>
    );
  }

  return (
    <div style={categoryToolbarStyle}>
      <div role="tablist" aria-label="Разделы сменной сводки" style={categoryTabsStyle}>
        {dispatchSummaryCategoryTabs.map((tab) => {
          const active = tab === activeCategoryTab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onActiveCategoryTabChange(tab)}
              style={{
                ...categoryTabStyle,
                ...(active ? categoryTabActiveStyle : null),
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onAddDispatchSummaryLink}
        style={categoryAddButtonStyle}
        aria-label="Добавить строку"
        title="Добавить строку"
      >
        <Plus size={18} aria-hidden />
      </button>
    </div>
  );
}

const categoryToolbarStyle = {
  display: "flex",
  alignItems: "stretch",
  gap: 6,
  marginBottom: 8,
  width: "100%",
} as const;

const categoryTabsStyle = {
  display: "flex",
  alignItems: "stretch",
  gap: 4,
  flex: 1,
  minWidth: 0,
  overflowX: "auto",
} as const;

const categoryTabStyle = {
  appearance: "none",
  border: "1px solid #cbd5e1",
  borderRadius: 7,
  background: "#f8fafc",
  color: "#334155",
  padding: "7px 12px",
  minHeight: 34,
  whiteSpace: "nowrap",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.2,
  cursor: "pointer",
} as const;

const categoryTabActiveStyle = {
  borderColor: "#0f172a",
  background: "#0f172a",
  color: "#ffffff",
} as const;

const categoryAddButtonStyle = {
  appearance: "none",
  width: 36,
  minWidth: 36,
  height: 34,
  alignSelf: "center",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #0f172a",
  borderRadius: 7,
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
} as const;
