"use client";

import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { reportRowKey } from "@/lib/domain/reports/display";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "@/lib/domain/reports/types";
import { IconButton, MiniIconButton } from "@/shared/ui/buttons";
import { buildAdminReportSummaryRowModel } from "./summarySettingsViewModel";

type SummaryUpdateField = Exclude<keyof ReportSummaryRowConfig, "id" | "rowKeys">;

type AdminReportSummarySettingsProps = {
  customer: ReportCustomerConfig;
  areaOptions: string[];
  expandedIds: string[];
  rowsForArea: (area: string) => ReportRow[];
  onAdd: (customerId: string) => void;
  onUpdate: (customerId: string, summaryId: string, field: SummaryUpdateField, value: string) => void;
  onToggleRow: (customerId: string, summaryId: string, rowKey: string) => void;
  onStartEdit: (summaryId: string) => void;
  onFinishEdit: (summaryId: string) => void;
  onRemove: (customerId: string, summaryId: string) => void;
};

export default function AdminReportSummarySettings({
  customer,
  areaOptions,
  expandedIds,
  rowsForArea,
  onAdd,
  onUpdate,
  onToggleRow,
  onStartEdit,
  onFinishEdit,
  onRemove,
}: AdminReportSummarySettingsProps) {
  return (
    <div style={summaryColumnStyle}>
      <div style={sectionHeaderStyle}>
        <IconButton label="Добавить итоговую строку" onClick={() => onAdd(customer.id)}>
          <Plus size={16} aria-hidden />
        </IconButton>
      </div>

      {customer.summaryRows.length === 0 && (
        <div style={emptyTextStyle}>Итоговых строк пока нет.</div>
      )}

      {customer.summaryRows.length > 0 ? (
        <div style={summaryListHeaderStyle}>
          <span>Участок</span>
          <span>Название итоговой строки</span>
          <span>Ед.</span>
          <span />
          <span />
        </div>
      ) : null}

      {customer.summaryRows.map((summary) => {
        const {
          hasStoredArea,
          visibleSummaryArea,
          summaryAreaRows,
          selectedSummaryRows,
          summaryExpanded,
          selectedSummaryText,
          selectedPlanRow,
          selectedPlanText,
        } = buildAdminReportSummaryRowModel({
          customer,
          summary,
          areaOptions,
          expandedIds,
          rowsForArea,
        });
        return (
          <div key={summary.id} style={summaryCardStyle}>
            <div style={summaryFormStyle}>
              {summaryExpanded ? (
                <>
                  <select value={visibleSummaryArea} onChange={(event) => onUpdate(customer.id, summary.id, "area", event.target.value)} style={summaryCompactInputStyle} aria-label="Участок итоговой строки">
                    {areaOptions.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                    {!hasStoredArea && summary.area ? <option value={summary.area}>{summary.area}</option> : null}
                  </select>
                  <input value={summary.label} onChange={(event) => onUpdate(customer.id, summary.id, "label", event.target.value)} style={summaryCompactInputStyle} aria-label="Название итоговой строки" />
                  <select value={summary.unit} onChange={(event) => onUpdate(customer.id, summary.id, "unit", event.target.value)} style={summaryCompactInputStyle} aria-label="Единица измерения итоговой строки">
                    <option value="">Авто</option>
                    <option value="м2">м2</option>
                    <option value="м3">м3</option>
                    <option value="тн">тн</option>
                  </select>
                </>
              ) : (
                <>
                  <span style={summaryValueStyle}>{visibleSummaryArea || "-"}</span>
                  <span style={summaryValueStyle}>{summary.label || "Без названия"}</span>
                  <span style={{ ...summaryValueStyle, textAlign: "right" }}>{summary.unit || "Авто"}</span>
                </>
              )}
              <MiniIconButton label={summaryExpanded ? "Сохранить суммирование" : "Редактировать суммирование"} onClick={() => (summaryExpanded ? onFinishEdit(summary.id) : onStartEdit(summary.id))}>
                {summaryExpanded ? <Check size={13} aria-hidden /> : <Pencil size={13} aria-hidden />}
              </MiniIconButton>
              <MiniIconButton label="Удалить итоговую строку" onClick={() => onRemove(customer.id, summary.id)}>
                <Trash2 size={16} aria-hidden />
              </MiniIconButton>
            </div>
            <div style={summaryNoteStyle} title={selectedPlanText}>План из ПТО: {selectedPlanText}</div>
            <div style={summaryNoteStyle} title={selectedSummaryText}>Строки в сумме: {selectedSummaryText}</div>

            {summaryExpanded ? (
              <div style={summarySelectionPanelStyle}>
                <div style={summaryPlanPickerStyle}>
                  <span style={summaryRowsHeaderStyle}>План из ПТО</span>
                  <select
                    value={selectedPlanRow ? summary.planRowKey ?? "" : ""}
                    onChange={(event) => onUpdate(customer.id, summary.id, "planRowKey", event.target.value)}
                    style={summaryCompactInputStyle}
                    aria-label="План из ПТО для итоговой строки"
                  >
                    <option value="">Авто: сумма выбранных строк</option>
                    {summaryAreaRows.map((row) => {
                      const rowKey = reportRowKey(row);
                      const customerRowLabel = customer.rowLabels[rowKey]?.trim() || row.name;
                      return <option key={`${summary.id}-plan-${rowKey}`} value={rowKey}>{customerRowLabel}</option>;
                    })}
                  </select>
                </div>
                <div style={summaryRowsHeaderStyle}>Выберите виды работ для суммирования: {selectedSummaryRows.length} из {summaryAreaRows.length}</div>
                <div style={summaryRowsGridStyle}>
                  {summaryAreaRows.length === 0 ? (
                    <div style={emptyTextStyle}>В выбранном участке строк пока нет.</div>
                  ) : (
                    summaryAreaRows.map((row) => {
                      const rowKey = reportRowKey(row);
                      const customerRowLabel = customer.rowLabels[rowKey]?.trim() || row.name;
                      return (
                        <label key={`${summary.id}-${rowKey}`} style={summaryRowOptionStyle}>
                          <input type="checkbox" checked={summary.rowKeys.includes(rowKey)} onChange={() => onToggleRow(customer.id, summary.id, rowKey)} />
                          <span style={summaryRowNameStyle}>{customerRowLabel}</span>
                          <span style={summaryRowUnitStyle}>{row.unit}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 8,
  flexWrap: "wrap",
};

const summaryColumnStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  alignContent: "start",
  minWidth: 420,
  maxWidth: 720,
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: 8,
};

const summaryListHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "90px minmax(170px, 1fr) minmax(50px, auto) 22px 22px",
  gap: 6,
  alignItems: "center",
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.15,
  padding: "0 2px",
};

const summaryCardStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 6,
};

const summaryFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "90px minmax(170px, 1fr) minmax(50px, auto) 22px 22px",
  gap: 6,
  alignItems: "center",
};

const summaryCompactInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.2,
  outline: "none",
  padding: "5px 6px",
};

const summaryValueStyle: CSSProperties = {
  minWidth: 0,
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const summaryNoteStyle: CSSProperties = {
  minWidth: 0,
  color: "#64748b",
  fontSize: 11,
  fontWeight: 600,
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const summarySelectionPanelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  borderTop: "1px solid #e2e8f0",
  paddingTop: 6,
};

const summaryPlanPickerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "92px minmax(0, 1fr)",
  gap: 6,
  alignItems: "center",
};

const summaryRowsHeaderStyle: CSSProperties = {
  color: "#475569",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.2,
};

const summaryRowsGridStyle: CSSProperties = {
  display: "grid",
  gap: 5,
  maxHeight: 180,
  overflowY: "auto",
  paddingRight: 2,
};

const summaryRowOptionStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "16px minmax(0, 1fr) minmax(34px, auto)",
  alignItems: "center",
  gap: 6,
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  background: "#ffffff",
  padding: "5px 6px",
  color: "#0f172a",
  fontSize: 11,
  fontWeight: 400,
};

const summaryRowNameStyle: CSSProperties = {
  minWidth: 0,
  fontSize: 11,
  fontWeight: 400,
  lineHeight: 1.18,
  overflowWrap: "normal",
  wordBreak: "normal",
};

const summaryRowUnitStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 400,
  justifySelf: "end",
  textAlign: "right",
  whiteSpace: "nowrap",
};

const emptyTextStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
};
