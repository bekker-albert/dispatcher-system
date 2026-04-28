"use client";

import { AdminReportCustomerSummary } from "./AdminReportCustomerSummary";
import { AdminReportCustomerTabs } from "./AdminReportCustomerTabs";
import { AdminReportSettingsPanels } from "./AdminReportSettingsPanels";
import { customerBodyStyle, customerCardStyle, sectionHeaderStyle, sectionWrapStyle } from "./AdminReportSettingsStyles";
import type { AdminReportSettingsSectionProps } from "./AdminReportSettingsTypes";

export type { AdminReportRowLabelEntry, AdminReportSettingsSectionProps, AdminReportWorkOrderGroup, SummaryUpdateField } from "./AdminReportSettingsTypes";

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
          <AdminReportSettingsPanels
            activeCustomer={activeCustomer}
            settingsTab={settingsTab}
            usesSummaryRows={usesSummaryRows}
            areaOptions={areaOptions}
            summaryAreaOptions={summaryAreaOptions}
            workOrderGroups={workOrderGroups}
            baseRows={baseRows}
            rowsByKey={rowsByKey}
            visibleRowKeys={visibleRowKeys}
            derivedRowsByKey={derivedRowsByKey}
            editingFactSourceRow={editingFactSourceRow}
            editingFactSourceOptions={editingFactSourceOptions}
            rowLabelEntries={rowLabelEntries}
            editingRowLabelKeys={editingRowLabelKeys}
            expandedSummaryIds={expandedSummaryIds}
            rowsForArea={rowsForArea}
            onSetSettingsTab={onSetSettingsTab}
            onMoveArea={onMoveArea}
            onMoveWork={onMoveWork}
            onToggleCustomerRow={onToggleCustomerRow}
            onEditFactSource={onEditFactSource}
            onSetFactSourceMode={onSetFactSourceMode}
            onToggleFactSourceRow={onToggleFactSourceRow}
            onAddRowLabel={onAddRowLabel}
            onChangeRowLabelSource={onChangeRowLabelSource}
            onUpdateRowLabel={onUpdateRowLabel}
            onStartRowLabelEdit={onStartRowLabelEdit}
            onFinishRowLabelEdit={onFinishRowLabelEdit}
            onRemoveRowLabel={onRemoveRowLabel}
            onAddSummaryRow={onAddSummaryRow}
            onUpdateSummaryRow={onUpdateSummaryRow}
            onToggleSummaryRow={onToggleSummaryRow}
            onStartSummaryEdit={onStartSummaryEdit}
            onFinishSummaryEdit={onFinishSummaryEdit}
            onRemoveSummaryRow={onRemoveSummaryRow}
          />
        </div>
      </div>
    </div>
  );
}
