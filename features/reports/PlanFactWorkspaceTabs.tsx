"use client";

import { Eye, EyeOff, Pencil, Plus, Settings2 } from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";
import type { PtoDateTableKey } from "@/lib/domain/pto/date-table";

type PlanFactWorkspaceTabsProps = {
  activeSourceTab: PtoDateTableKey | null;
  activeReportId: string | null;
  reportCustomers: ReportCustomerConfig[];
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onSelectSourceTab: (tab: PtoDateTableKey) => void;
  onSelectReport: (id: string) => void;
  onSetReportVisible: (id: string, visible: boolean) => void;
  onRenameReport: (id: string, label: string) => void;
  onCreateReportCopy: (templateId: string, label: string) => void;
};

const sourceTabs: Array<{ id: PtoDateTableKey; label: string }> = [
  { id: "plan", label: "План" },
  { id: "oper", label: "Опер учет" },
  { id: "survey", label: "Марк замер" },
];

const builtInReportInfo: Record<string, { short: string; defaultLabel: string }> = {
  "aa-mining": { short: "ААМ", defaultLabel: "ТОО AA Mining" },
  "ak-altynalmas": { short: "АА", defaultLabel: "АО АК Алтыналмас" },
  "aa-engineering": { short: "ААЕ", defaultLabel: "ТОО AA Engineering" },
};

function reportTabLabel(customer: ReportCustomerConfig) {
  const builtIn = builtInReportInfo[customer.id];
  if (!builtIn) return customer.label;
  return customer.label === builtIn.defaultLabel ? builtIn.short : customer.label;
}

export function PlanFactWorkspaceTabs({
  activeSourceTab,
  activeReportId,
  reportCustomers,
  editing,
  onEditingChange,
  onSelectSourceTab,
  onSelectReport,
  onSetReportVisible,
  onRenameReport,
  onCreateReportCopy,
}: PlanFactWorkspaceTabsProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleReports = reportCustomers.filter((customer) => customer.visible);

  const createReport = () => {
    const builtInTemplates = reportCustomers.filter((customer) => builtInReportInfo[customer.id]);
    const fallbackTemplate = builtInTemplates[0] ?? reportCustomers[0];
    if (!fallbackTemplate) return;

    const templateAnswer = window.prompt("Шаблон новой вкладки: ААМ, АА или ААЕ", reportTabLabel(fallbackTemplate));
    if (!templateAnswer?.trim()) return;
    const normalized = templateAnswer.trim().toUpperCase();
    const template = builtInTemplates.find((customer) => reportTabLabel(customer).toUpperCase() === normalized)
      ?? fallbackTemplate;

    const label = window.prompt("Название новой отчетной вкладки", `${reportTabLabel(template)} копия`);
    if (!label?.trim()) return;
    onCreateReportCopy(template.id, label.trim());
    setMenuOpen(false);
  };

  const renameReport = (customer: ReportCustomerConfig) => {
    const label = window.prompt("Новое название вкладки", reportTabLabel(customer));
    if (!label?.trim()) return;
    onRenameReport(customer.id, label.trim());
  };

  return (
    <div className="no-print" style={shellStyle}>
      <div style={tabsStyle}>
        {sourceTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectSourceTab(tab.id)}
            style={tabButtonStyle(activeSourceTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <span style={dividerStyle} aria-hidden />
        {visibleReports.map((customer) => (
          <button
            key={customer.id}
            type="button"
            onClick={() => onSelectReport(customer.id)}
            style={tabButtonStyle(activeReportId === customer.id)}
          >
            {reportTabLabel(customer)}
          </button>
        ))}
        {editing ? (
          <button type="button" onClick={createReport} style={iconButtonStyle} title="Добавить отчетную вкладку">
            <Plus size={16} aria-hidden />
          </button>
        ) : null}
      </div>

      <div style={actionsStyle}>
        <button
          type="button"
          onClick={() => onEditingChange(!editing)}
          style={editButtonStyle(editing)}
        >
          <Pencil size={15} aria-hidden />
          {editing ? "Завершить редактирование" : "Редактировать"}
        </button>
        {editing ? (
          <div style={menuAnchorStyle}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              style={iconButtonStyle}
              title="Настройки вкладок"
            >
              <Settings2 size={16} aria-hidden />
            </button>
            {menuOpen ? (
              <div style={menuStyle}>
                <div style={menuTitleStyle}>Вкладки отчетов</div>
                {reportCustomers.map((customer) => (
                  <div key={customer.id} style={menuRowStyle}>
                    <button
                      type="button"
                      onClick={() => onSetReportVisible(customer.id, !customer.visible)}
                      style={menuIconStyle}
                      title={customer.visible ? "Скрыть вкладку" : "Показать вкладку"}
                    >
                      {customer.visible ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectReport(customer.id)}
                      style={menuLabelStyle}
                    >
                      {reportTabLabel(customer)}
                    </button>
                    <button
                      type="button"
                      onClick={() => renameReport(customer)}
                      style={menuIconStyle}
                      title="Переименовать"
                    >
                      <Pencil size={14} aria-hidden />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={createReport} style={menuAddStyle}>
                  <Plus size={15} aria-hidden /> Добавить отчет
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const shellStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
  padding: "8px 10px",
  border: "1px solid #d7dee8",
  borderRadius: 8,
  background: "#ffffff",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  position: "relative",
  zIndex: 20,
};

const tabsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  minWidth: 0,
  overflowX: "auto",
};

const actionsStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 };
const dividerStyle: CSSProperties = { width: 1, height: 24, background: "#d7dee8", margin: "0 4px" };
const menuAnchorStyle: CSSProperties = { position: "relative" };

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    border: `1px solid ${active ? "#2563eb" : "#d7dee8"}`,
    borderRadius: 6,
    background: active ? "#2563eb" : "#ffffff",
    color: active ? "#ffffff" : "#344054",
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: active ? 700 : 600,
    whiteSpace: "nowrap",
    cursor: "pointer",
  };
}

function editButtonStyle(active: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: `1px solid ${active ? "#93c5fd" : "#d7dee8"}`,
    borderRadius: 6,
    background: active ? "#eff6ff" : "#ffffff",
    color: active ? "#1d4ed8" : "#344054",
    padding: "7px 10px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

const iconButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #d7dee8",
  borderRadius: 6,
  background: "#ffffff",
  color: "#344054",
  cursor: "pointer",
};

const menuStyle: CSSProperties = {
  position: "absolute",
  right: 0,
  top: 40,
  width: 280,
  padding: 10,
  border: "1px solid #d7dee8",
  borderRadius: 8,
  background: "#ffffff",
  boxShadow: "0 14px 34px rgba(15,23,42,0.16)",
};

const menuTitleStyle: CSSProperties = { padding: "2px 4px 8px", fontWeight: 800, color: "#344054" };
const menuRowStyle: CSSProperties = { display: "grid", gridTemplateColumns: "28px 1fr 28px", gap: 4, alignItems: "center", padding: "3px 0" };
const menuIconStyle: CSSProperties = { width: 28, height: 28, border: "none", borderRadius: 5, background: "transparent", display: "grid", placeItems: "center", color: "#667085", cursor: "pointer" };
const menuLabelStyle: CSSProperties = { minWidth: 0, border: "none", background: "transparent", textAlign: "left", color: "#344054", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const menuAddStyle: CSSProperties = { width: "100%", marginTop: 8, padding: "8px 10px", border: "1px dashed #93c5fd", borderRadius: 6, background: "#eff6ff", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", fontWeight: 700 };
