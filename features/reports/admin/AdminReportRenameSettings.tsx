"use client";

import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { reportRowKey } from "@/lib/domain/reports/display";
import type { ReportCustomerConfig, ReportRow } from "@/lib/domain/reports/types";
import { normalizeLookupValue } from "@/lib/utils/text";
import { IconButton, MiniIconButton } from "@/shared/ui/buttons";
import { repairAdminReportText } from "./adminReportText";

type AdminReportRowLabelEntry = {
  rowKey: string;
  label: string;
  row: ReportRow;
};

type AdminReportRenameSettingsProps = {
  customer: ReportCustomerConfig;
  entries: AdminReportRowLabelEntry[];
  areaOptions: string[];
  editingRowKeys: string[];
  rowsForArea: (area: string) => ReportRow[];
  onAdd: (customerId: string) => void;
  onChangeSource: (customerId: string, currentRowKey: string, nextRowKey: string) => void;
  onUpdateLabel: (customerId: string, rowKey: string, value: string, fallback: string) => void;
  onStartEdit: (rowKey: string) => void;
  onFinishEdit: (rowKey: string) => void;
  onRemove: (customerId: string, rowKey: string) => void;
};

export default function AdminReportRenameSettings({
  customer,
  entries,
  areaOptions,
  editingRowKeys,
  rowsForArea,
  onAdd,
  onChangeSource,
  onUpdateLabel,
  onStartEdit,
  onFinishEdit,
  onRemove,
}: AdminReportRenameSettingsProps) {
  return (
    <div style={rowsColumnStyle}>
      <div style={renamePanelStyle}>
        <div style={sectionHeaderStyle}>
          <IconButton label="Добавить переименование строки" onClick={() => onAdd(customer.id)}>
            <Plus size={16} aria-hidden />
          </IconButton>
        </div>

        {entries.length === 0 ? (
          <div style={emptyTextStyle}>Переименований пока нет.</div>
        ) : (
          <div style={renameListStyle}>
            <div style={renameHeaderStyle}>
              <span>Участок</span>
              <span>Вид работ</span>
              <span>Название для заказчика</span>
              <span />
              <span />
            </div>
            {entries.map(({ rowKey, label, row }) => {
              const hasStoredArea = areaOptions.some((area) => normalizeLookupValue(area) === normalizeLookupValue(row.area));
              const visibleArea = hasStoredArea ? row.area : areaOptions[0] ?? row.area;
              const areaRows = rowsForArea(visibleArea);
              const hasStoredRow = areaRows.some((areaRow) => reportRowKey(areaRow) === rowKey);
              const isEditing = editingRowKeys.includes(rowKey);
              const visibleAreaLabel = repairAdminReportText(visibleArea);
              const rowNameLabel = repairAdminReportText(row.name);
              const labelText = repairAdminReportText(label);

              return (
                <div key={`${customer.id}-rename-${rowKey}`} style={renameRowStyle}>
                  {isEditing ? (
                    <>
                      <select
                        value={visibleArea}
                        onChange={(event) => {
                          const nextRow = rowsForArea(event.target.value)[0];
                          if (nextRow) onChangeSource(customer.id, rowKey, reportRowKey(nextRow));
                        }}
                        style={renameInputStyle}
                        aria-label="Участок строки для заказчика"
                      >
                        {areaOptions.map((area) => (
                          <option key={area} value={area}>{repairAdminReportText(area)}</option>
                        ))}
                        {!hasStoredArea && row.area ? <option value={row.area}>{repairAdminReportText(row.area)}</option> : null}
                      </select>
                      <select
                        value={hasStoredRow ? rowKey : ""}
                        onChange={(event) => onChangeSource(customer.id, rowKey, event.target.value)}
                        style={renameInputStyle}
                        aria-label="Вид работ для заказчика"
                      >
                        {!hasStoredRow ? <option value="">{rowNameLabel}</option> : null}
                        {areaRows.map((areaRow) => {
                          const areaRowKey = reportRowKey(areaRow);
                          return <option key={areaRowKey} value={areaRowKey}>{repairAdminReportText(areaRow.name)}</option>;
                        })}
                      </select>
                      <input
                        value={labelText}
                        onChange={(event) => onUpdateLabel(customer.id, rowKey, event.target.value, rowNameLabel)}
                        placeholder={rowNameLabel}
                        style={renameInputStyle}
                        title={`Связка с ПТО: ${rowNameLabel}`}
                      />
                    </>
                  ) : (
                    <>
                      <span style={summaryValueStyle}>{visibleAreaLabel || "-"}</span>
                      <span style={summaryValueStyle} title={rowNameLabel}>{rowNameLabel}</span>
                      <span style={summaryValueStyle} title={labelText || rowNameLabel}>{labelText || rowNameLabel}</span>
                    </>
                  )}
                  <MiniIconButton label={isEditing ? "Сохранить переименование строки" : "Редактировать переименование строки"} onClick={() => (isEditing ? onFinishEdit(rowKey) : onStartEdit(rowKey))}>
                    {isEditing ? <Check size={13} aria-hidden /> : <Pencil size={13} aria-hidden />}
                  </MiniIconButton>
                  <MiniIconButton label="Удалить переименование строки" onClick={() => onRemove(customer.id, rowKey)}>
                    <Trash2 size={14} aria-hidden />
                  </MiniIconButton>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const rowsColumnStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  justifyItems: "start",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 8,
  flexWrap: "wrap",
};

const renamePanelStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  width: "100%",
  maxWidth: 720,
  boxSizing: "border-box",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: 8,
};

const renameListStyle: CSSProperties = {
  display: "grid",
  gap: 6,
};

const renameHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "112px minmax(180px, 1fr) minmax(190px, 1fr) 22px 22px",
  gap: 6,
  alignItems: "center",
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.15,
  padding: "0 2px",
};

const renameRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "112px minmax(180px, 1fr) minmax(190px, 1fr) 22px 22px",
  gap: 6,
  alignItems: "center",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 6,
};

const renameInputStyle: CSSProperties = {
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

const emptyTextStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  fontWeight: 700,
};
