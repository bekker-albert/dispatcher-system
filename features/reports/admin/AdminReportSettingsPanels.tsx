"use client";

import dynamic from "next/dynamic";
import { AdminReportSettingsTabs } from "./AdminReportSettingsTabs";
import type { AdminReportSettingsSectionProps } from "./AdminReportSettingsTypes";

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

type AdminReportSettingsPanelsProps = Pick<
  AdminReportSettingsSectionProps,
  | "activeCustomer"
  | "settingsTab"
  | "usesSummaryRows"
  | "areaOptions"
  | "summaryAreaOptions"
  | "workOrderGroups"
  | "baseRows"
  | "rowsByKey"
  | "visibleRowKeys"
  | "derivedRowsByKey"
  | "editingFactSourceRow"
  | "editingFactSourceOptions"
  | "rowLabelEntries"
  | "editingRowLabelKeys"
  | "expandedSummaryIds"
  | "rowsForArea"
  | "onSetSettingsTab"
  | "onMoveArea"
  | "onMoveWork"
  | "onToggleCustomerRow"
  | "onEditFactSource"
  | "onSetFactSourceMode"
  | "onToggleFactSourceRow"
  | "onAddRowLabel"
  | "onChangeRowLabelSource"
  | "onUpdateRowLabel"
  | "onStartRowLabelEdit"
  | "onFinishRowLabelEdit"
  | "onRemoveRowLabel"
  | "onAddSummaryRow"
  | "onUpdateSummaryRow"
  | "onToggleSummaryRow"
  | "onStartSummaryEdit"
  | "onFinishSummaryEdit"
  | "onRemoveSummaryRow"
>;

export function AdminReportSettingsPanels({
  activeCustomer,
  settingsTab,
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
}: AdminReportSettingsPanelsProps) {
  return (
    <>
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
    </>
  );
}
