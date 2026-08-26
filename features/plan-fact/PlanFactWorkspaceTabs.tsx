"use client";

import { Pencil, Settings2 } from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { PtoDateTableKey } from "@/lib/domain/pto/date-table";
import { planFactReportTabLabel } from "@/lib/domain/plan-fact/workspace";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";
import { PlanFactReportManager } from "./PlanFactReportManager";

export type PlanFactWorkspaceTabsProps = {
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
  onMoveReport: (id: string, direction: -1 | 1) => void;
  onDeleteReport: (id: string) => void;
};

const sourceTabs: Array<{ id: PtoDateTableKey; label: string }> = [
  { id: "plan", label: "План" },
  { id: "oper", label: "Опер учет" },
  { id: "survey", label: "Марк замер" },
];

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
  onMoveReport,
  onDeleteReport,
}: PlanFactWorkspaceTabsProps) {
  const [managerOpen, setManagerOpen] = useState(false);
  const visibleReports = reportCustomers.filter((customer) => customer.visible);

  return (
    <div className="no-print" style={shellStyle}>
      <div style={tabsStyle} role="tablist" aria-label="План-факт">
        {sourceTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeSourceTab === tab.id}
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
            role="tab"
            aria-selected={activeReportId === customer.id}
            onClick={() => onSelectReport(customer.id)}
            style={tabButtonStyle(activeReportId === customer.id)}
          >
            {planFactReportTabLabel(customer)}
          </button>
        ))}
      </div>

      <div style={actionsStyle}>
        <button type="button" onClick={() => onEditingChange(!editing)} style={editButtonStyle(editing)}>
          <Pencil size={15} aria-hidden />
          {editing ? "Завершить" : "Редактировать"}
        </button>
        {editing ? (
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setManagerOpen((value) => !value)}
              style={iconButtonStyle(managerOpen)}
              title="Настройка отчетных вкладок"
              aria-expanded={managerOpen}
            >
              <Settings2 size={16} aria-hidden />
            </button>
            {managerOpen ? (
              <PlanFactReportManager
                reportCustomers={reportCustomers}
                onSetReportVisible={onSetReportVisible}
                onRenameReport={onRenameReport}
                onCreateReportCopy={onCreateReportCopy}
                onMoveReport={onMoveReport}
                onDeleteReport={onDeleteReport}
                onClose={() => setManagerOpen(false)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const shellStyle: CSSProperties = {
  position: "relative",
  zIndex: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  minHeight: 46,
  padding: "6px 10px",
  marginBottom: 8,
  border: "1px solid #dce3ec",
  borderRadius: 10,
  background: "#f8fafc",
};

const tabsStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 4, minWidth: 0, overflowX: "auto" };
const actionsStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" };
const dividerStyle: CSSProperties = { width: 1, alignSelf: "stretch", minHeight: 26, background: "#d8e0ea", margin: "0 4px" };

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    minHeight: 32,
    padding: "5px 10px",
    border: active ? "1px solid #2563eb" : "1px solid transparent",
    borderRadius: 8,
    background: active ? "#eff6ff" : "transparent",
    color: active ? "#1d4ed8" : "#334155",
    font: "inherit",
    fontSize: 12,
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
    minHeight: 32,
    padding: "5px 10px",
    border: active ? "1px solid #2563eb" : "1px solid #cbd5e1",
    borderRadius: 8,
    background: active ? "#2563eb" : "#fff",
    color: active ? "#fff" : "#334155",
    font: "inherit",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  };
}

function iconButtonStyle(active: boolean): CSSProperties {
  return {
    width: 32,
    height: 32,
    display: "inline-grid",
    placeItems: "center",
    border: active ? "1px solid #2563eb" : "1px solid #cbd5e1",
    borderRadius: 8,
    background: active ? "#eff6ff" : "#fff",
    color: active ? "#1d4ed8" : "#475569",
    cursor: "pointer",
  };
}
