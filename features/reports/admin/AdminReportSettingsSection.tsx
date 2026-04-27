"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type { AdminReportCustomerSettingsTab } from "@/lib/domain/admin/navigation";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "@/lib/domain/reports/types";
import { AdminReportCustomerSummary } from "./AdminReportCustomerSummary";
import { AdminReportCustomerTabs } from "./AdminReportCustomerTabs";
import { AdminReportSettingsTabs } from "./AdminReportSettingsTabs";

const AdminReportDisplaySettings = dynamic(() => import("./AdminReportDisplaySettings"), {
  ssr: false,
});
const AdminReportOrderSettings = dynamic(() => import("./AdminReportOrderSettings"), {
  ssr: false,
});
const AdminReportRenameSettings = dynamic(() => import("./AdminReportRenameSettings"), {
  ssr: false,
});
const AdminReportSummarySettings = dynamic(() => import("./AdminReportSummarySettings"), {
  ssr: false,
});

export type AdminReportWorkOrderGroup = {
  area: string;
  rows: ReportRow[];
};

export type AdminReportRowLabelEntry = {
  rowKey: string;
  label: string;
  row: ReportRow;
};

export type SummaryUpdateField = Exclude<keyof ReportSummaryRowConfig, "id" | "rowKeys">;

export type AdminReportSettingsSectionProps = {
  customers: ReportCustomerConfig[];
  activeCustomer: ReportCustomerConfig;
  settingsTab: AdminReportCustomerSettingsTab;
  selectedCount: number;
  usesSummaryRows: boolean;
  areaOptions: string[];
  summaryAreaOptions: string[];
  workOrderGroups: AdminReportWorkOrderGroup[];
  baseRows: ReportRow[];
  rowsByKey: Map<string, ReportRow>;
  visibleRowKeys: Set<string>;
  derivedRowsByKey: Map<string, ReportRow>;
  editingFactSourceRow: ReportRow | null;
  editingFactSourceOptions: ReportRow[];
  rowLabelEntries: AdminReportRowLabelEntry[];
  editingRowLabelKeys: string[];
  expandedSummaryIds: string[];
  rowsForArea: (area: string) => ReportRow[];
  onSelectCustomer: (customerId: string) => void;
  onAddCustomer: () => void;
  onDeleteCustomer: (customerId: string) => void;
  onUpdateCustomer: (customerId: string, patch: Partial<Pick<ReportCustomerConfig, "label" | "ptoCode" | "visible" | "autoShowRows">>) => void;
  onSetSettingsTab: (tab: AdminReportCustomerSettingsTab) => void;
  onMoveArea: (area: string, direction: -1 | 1) => void;
  onMoveWork: (area: string, rowKey: string, direction: -1 | 1) => void;
  onToggleCustomerRow: (customerId: string, rowKey: string) => void;
  onEditFactSource: (rowKey: string | null) => void;
  onSetFactSourceMode: (customerId: string, targetRowKey: string, enabled: boolean) => void;
  onToggleFactSourceRow: (customerId: string, targetRowKey: string, sourceRowKey: string) => void;
  onAddRowLabel: (customerId: string) => void;
  onChangeRowLabelSource: (customerId: string, currentRowKey: string, nextRowKey: string) => void;
  onUpdateRowLabel: (customerId: string, rowKey: string, value: string, fallback: string) => void;
  onStartRowLabelEdit: (rowKey: string) => void;
  onFinishRowLabelEdit: (rowKey: string) => void;
  onRemoveRowLabel: (customerId: string, rowKey: string) => void;
  onAddSummaryRow: (customerId: string) => void;
  onUpdateSummaryRow: (customerId: string, summaryId: string, field: SummaryUpdateField, value: string) => void;
  onToggleSummaryRow: (customerId: string, summaryId: string, rowKey: string) => void;
  onStartSummaryEdit: (summaryId: string) => void;
  onFinishSummaryEdit: (summaryId: string) => void;
  onRemoveSummaryRow: (customerId: string, summaryId: string) => void;
};

export default function AdminReportSettingsSection({
  customers,
  activeCustomer,
  settingsTab,
  selectedCount,
  usesSummaryRows,
  areaOptions,
  summaryAreaOptions,
  workOrderGroups,
  baseRows,
  rowsByKey,
  visibleRowKeys,
  derivedRowsByKey,
  editingFactSourceRow,
  editingFactSourceOptions,
  rowLabelEntries,
  editingRowLabelKeys,
  expandedSummaryIds,
  rowsForArea,
  onSelectCustomer,
  onAddCustomer,
  onDeleteCustomer,
  onUpdateCustomer,
  onSetSettingsTab,
  onMoveArea,
  onMoveWork,
  onToggleCustomerRow,
  onEditFactSource,
  onSetFactSourceMode,
  onToggleFactSourceRow,
  onAddRowLabel,
  onChangeRowLabelSource,
  onUpdateRowLabel,
  onStartRowLabelEdit,
  onFinishRowLabelEdit,
  onRemoveRowLabel,
  onAddSummaryRow,
  onUpdateSummaryRow,
  onToggleSummaryRow,
  onStartSummaryEdit,
  onFinishSummaryEdit,
  onRemoveSummaryRow,
}: AdminReportSettingsSectionProps) {
  return (
    <div style={sectionWrapStyle}>
      <div style={sectionHeaderStyle}>
        <div style={{ fontWeight: 700 }}>Настройка отчетности</div>
      </div>

      <AdminReportCustomerTabs
        customers={customers}
        activeCustomerId={activeCustomer.id}
        onSelectCustomer={onSelectCustomer}
        onAddCustomer={onAddCustomer}
        onDeleteCustomer={onDeleteCustomer}
      />

      <div style={customerCardStyle}>
        <AdminReportCustomerSummary
          activeCustomer={activeCustomer}
          selectedCount={selectedCount}
          usesSummaryRows={usesSummaryRows}
          onUpdateCustomer={onUpdateCustomer}
        />

        <div style={customerBodyStyle}>
          <AdminReportSettingsTabs
            settingsTab={settingsTab}
            usesSummaryRows={usesSummaryRows}
            onSetSettingsTab={onSetSettingsTab}
          />

          {settingsTab === "order" ? (
            <AdminReportOrderSettings
              areaOptions={areaOptions}
              workOrderGroups={workOrderGroups}
              onMoveArea={onMoveArea}
              onMoveWork={onMoveWork}
            />
          ) : null}

          {settingsTab === "display" ? (
            <AdminReportDisplaySettings
              customer={activeCustomer}
              rows={baseRows}
              rowsByKey={rowsByKey}
              visibleRowKeys={visibleRowKeys}
              derivedRowsByKey={derivedRowsByKey}
              editingFactSourceRow={editingFactSourceRow}
              editingFactSourceOptions={editingFactSourceOptions}
              onToggleRow={onToggleCustomerRow}
              onEditFactSource={onEditFactSource}
              onSetFactSourceMode={onSetFactSourceMode}
              onToggleFactSourceRow={onToggleFactSourceRow}
            />
          ) : null}

          {settingsTab === "rename" ? (
            <AdminReportRenameSettings
              customer={activeCustomer}
              entries={rowLabelEntries}
              areaOptions={areaOptions}
              editingRowKeys={editingRowLabelKeys}
              rowsForArea={rowsForArea}
              onAdd={onAddRowLabel}
              onChangeSource={onChangeRowLabelSource}
              onUpdateLabel={onUpdateRowLabel}
              onStartEdit={onStartRowLabelEdit}
              onFinishEdit={onFinishRowLabelEdit}
              onRemove={onRemoveRowLabel}
            />
          ) : null}

          {settingsTab === "summary" && usesSummaryRows ? (
            <AdminReportSummarySettings
              customer={activeCustomer}
              areaOptions={summaryAreaOptions}
              expandedIds={expandedSummaryIds}
              rowsForArea={rowsForArea}
              onAdd={onAddSummaryRow}
              onUpdate={onUpdateSummaryRow}
              onToggleRow={onToggleSummaryRow}
              onStartEdit={onStartSummaryEdit}
              onFinishEdit={onFinishSummaryEdit}
              onRemove={onRemoveSummaryRow}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

const sectionWrapStyle: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gap: 12,
  alignItems: "start",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 8,
  flexWrap: "wrap",
};

const customerCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
  display: "grid",
  gap: 0,
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  overflow: "hidden",
};

const customerBodyStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  justifyItems: "start",
  padding: 10,
  borderTop: "1px solid #e2e8f0",
  width: "100%",
  boxSizing: "border-box",
  overflowX: "auto",
};
