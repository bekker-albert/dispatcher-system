"use client";

import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type { AdminReportCustomerSettingsTab } from "@/lib/domain/admin/navigation";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "@/lib/domain/reports/types";
import { IconButton, TopButton } from "@/shared/ui/buttons";

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

      <div style={customerTabsStyle}>
        {customers.map((customer) => (
          <TopButton
            key={customer.id}
            active={activeCustomer.id === customer.id}
            onClick={() => onSelectCustomer(customer.id)}
            label={customer.label}
            showDelete={activeCustomer.id === customer.id && customers.length > 1}
            deleteLabel={`Удалить заказчика ${customer.label}`}
            onDelete={() => onDeleteCustomer(customer.id)}
          />
        ))}
        <IconButton label="Добавить заказчика" onClick={onAddCustomer}>
          <Plus size={16} aria-hidden />
        </IconButton>
      </div>

      <div style={customerCardStyle}>
        <div style={customerSummaryStyle}>
          <input
            aria-label="Заказчик"
            value={activeCustomer.label}
            onChange={(event) => onUpdateCustomer(activeCustomer.id, { label: event.target.value })}
            style={customerNameInputStyle}
          />
          <input
            aria-label="Сокращение заказчика для ПТО"
            value={activeCustomer.ptoCode}
            onChange={(event) => onUpdateCustomer(activeCustomer.id, { ptoCode: event.target.value })}
            style={{ ...customerNameInputStyle, textAlign: "center" }}
            title="Этот код используется в столбце Заказчик во вкладке ПТО - План"
          />
          <div style={customerMetaStyle}>
            Код ПТО: {activeCustomer.ptoCode || "не задан"} · {selectedCount} строк{usesSummaryRows ? ` · ${activeCustomer.summaryRows.length} итоговых` : ""}
          </div>
          <label style={visibleToggleStyle}>
            <input type="checkbox" checked={activeCustomer.visible} onChange={(event) => onUpdateCustomer(activeCustomer.id, { visible: event.target.checked })} />
            Показывать вкладку
          </label>
          <label style={visibleToggleStyle}>
            <input type="checkbox" checked={activeCustomer.autoShowRows} onChange={(event) => onUpdateCustomer(activeCustomer.id, { autoShowRows: event.target.checked })} />
            Автоматический показ строк
          </label>
        </div>

        <div style={customerBodyStyle}>
          <div style={settingsTabsStyle}>
            <AdminReportSettingsButton active={settingsTab === "order"} onClick={() => onSetSettingsTab("order")} label="Порядок" />
            <AdminReportSettingsButton active={settingsTab === "display"} onClick={() => onSetSettingsTab("display")} label="Отображение" />
            <AdminReportSettingsButton active={settingsTab === "rename"} onClick={() => onSetSettingsTab("rename")} label="Переименование строк" />
            <AdminReportSettingsButton
              active={settingsTab === "summary"}
              disabled={!usesSummaryRows}
              onClick={() => onSetSettingsTab("summary")}
              label="Итоговые строки"
            />
          </div>

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

function AdminReportSettingsButton({ active, onClick, label, disabled = false }: { active: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        if (disabled) return;
        onClick();
        event.currentTarget.blur();
      }}
      style={{
        ...settingsTabStyle,
        ...(active ? settingsTabActiveStyle : null),
        ...(disabled ? settingsTabDisabledStyle : null),
      }}
    >
      {label}
    </button>
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

const customerTabsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 6,
  flexWrap: "wrap",
  maxWidth: "100%",
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

const customerSummaryStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 300px) 72px auto auto auto",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  background: "#ffffff",
};

const customerNameInputStyle: CSSProperties = {
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.25,
  outline: "none",
  padding: "7px 9px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const customerMetaStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  whiteSpace: "nowrap",
};

const visibleToggleStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const settingsTabsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
  width: "100%",
  maxWidth: "100%",
};

const settingsTabStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  outline: "none",
  padding: "6px 9px",
  userSelect: "none",
};

const settingsTabActiveStyle: CSSProperties = {
  borderColor: "#0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

const settingsTabDisabledStyle: CSSProperties = {
  cursor: "not-allowed",
  opacity: 0.45,
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
