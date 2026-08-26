"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { isBuiltInPlanFactReport, planFactReportTabLabel } from "@/lib/domain/plan-fact/workspace";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";

type PlanFactReportManagerProps = {
  reportCustomers: ReportCustomerConfig[];
  onSetReportVisible: (id: string, visible: boolean) => void;
  onRenameReport: (id: string, label: string) => void;
  onCreateReportCopy: (templateId: string, label: string) => void;
  onMoveReport: (id: string, direction: -1 | 1) => void;
  onDeleteReport: (id: string) => void;
  onClose: () => void;
};

export function PlanFactReportManager({
  reportCustomers,
  onSetReportVisible,
  onRenameReport,
  onCreateReportCopy,
  onMoveReport,
  onDeleteReport,
  onClose,
}: PlanFactReportManagerProps) {
  const templates = useMemo(
    () => reportCustomers.filter((customer) => isBuiltInPlanFactReport(customer.id)),
    [reportCustomers],
  );
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? reportCustomers[0]?.id ?? "");
  const [newLabel, setNewLabel] = useState("");

  const createReport = () => {
    if (!templateId || !newLabel.trim()) return;
    onCreateReportCopy(templateId, newLabel.trim());
    setNewLabel("");
  };

  return (
    <div style={panelStyle} role="dialog" aria-label="Настройка отчетных вкладок">
      <div style={panelHeaderStyle}>
        <strong>Отчетные вкладки</strong>
        <button type="button" onClick={onClose} style={plainButtonStyle}>Закрыть</button>
      </div>

      <div style={createGridStyle}>
        <label style={fieldStyle}>
          <span style={labelStyle}>Шаблон</span>
          <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} style={inputStyle}>
            {templates.map((customer) => (
              <option key={customer.id} value={customer.id}>{planFactReportTabLabel(customer)}</option>
            ))}
          </select>
        </label>
        <label style={fieldStyle}>
          <span style={labelStyle}>Название новой вкладки</span>
          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") createReport();
            }}
            style={inputStyle}
            placeholder="Например, Заказчик 4"
          />
        </label>
        <button type="button" onClick={createReport} disabled={!templateId || !newLabel.trim()} style={primaryButtonStyle}>
          Создать
        </button>
      </div>

      <div style={listStyle}>
        {reportCustomers.map((customer, index) => {
          const builtIn = isBuiltInPlanFactReport(customer.id);
          return (
            <div key={customer.id} style={rowStyle}>
              <button
                type="button"
                onClick={() => onSetReportVisible(customer.id, !customer.visible)}
                style={iconButtonStyle}
                title={customer.visible ? "Скрыть вкладку" : "Показать вкладку"}
              >
                {customer.visible ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
              </button>
              <input
                defaultValue={planFactReportTabLabel(customer)}
                onBlur={(event) => onRenameReport(customer.id, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                style={rowInputStyle}
                aria-label={`Название вкладки ${planFactReportTabLabel(customer)}`}
              />
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onMoveReport(customer.id, -1)}
                style={iconButtonStyle}
                title="Переместить влево"
              >
                <ArrowUp size={15} aria-hidden />
              </button>
              <button
                type="button"
                disabled={index === reportCustomers.length - 1}
                onClick={() => onMoveReport(customer.id, 1)}
                style={iconButtonStyle}
                title="Переместить вправо"
              >
                <ArrowDown size={15} aria-hidden />
              </button>
              <button
                type="button"
                disabled={builtIn}
                onClick={() => onDeleteReport(customer.id)}
                style={iconButtonStyle}
                title={builtIn ? "Системную вкладку удалить нельзя" : "Удалить вкладку"}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const panelStyle: CSSProperties = {
  position: "absolute",
  zIndex: 30,
  top: "calc(100% + 8px)",
  right: 0,
  width: "min(720px, calc(100vw - 48px))",
  padding: 14,
  border: "1px solid #d7dee8",
  borderRadius: 12,
  background: "#fff",
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.16)",
  display: "grid",
  gap: 12,
};

const panelHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const createGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "160px minmax(180px, 1fr) auto", gap: 8, alignItems: "end" };
const fieldStyle: CSSProperties = { display: "grid", gap: 4 };
const labelStyle: CSSProperties = { fontSize: 11, color: "#64748b" };
const inputStyle: CSSProperties = { minHeight: 34, border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 9px", font: "inherit", background: "#fff" };
const listStyle: CSSProperties = { display: "grid", gap: 6, maxHeight: 360, overflow: "auto" };
const rowStyle: CSSProperties = { display: "grid", gridTemplateColumns: "34px minmax(160px, 1fr) 34px 34px 34px", gap: 6, alignItems: "center" };
const rowInputStyle: CSSProperties = { ...inputStyle, width: "100%", minWidth: 0 };
const iconButtonStyle: CSSProperties = { width: 34, height: 34, display: "inline-grid", placeItems: "center", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", cursor: "pointer" };
const plainButtonStyle: CSSProperties = { border: 0, background: "transparent", cursor: "pointer", color: "#475569", font: "inherit" };
const primaryButtonStyle: CSSProperties = { minHeight: 34, border: "1px solid #1d4ed8", borderRadius: 8, padding: "6px 12px", background: "#2563eb", color: "white", cursor: "pointer", font: "inherit", fontWeight: 600 };
