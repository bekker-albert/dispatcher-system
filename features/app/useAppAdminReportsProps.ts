"use client";

import type { AdminReportSettingsSectionProps } from "@/features/reports/admin/AdminReportSettingsSection";

type UseAppAdminReportsPropsOptions = {
  reportCustomers: AdminReportSettingsSectionProps["customers"];
  activeAdminReportCustomer: AdminReportSettingsSectionProps["activeCustomer"];
  visibleAdminReportCustomerSettingsTab: AdminReportSettingsSectionProps["settingsTab"];
  activeAdminReportSelectedCount: number;
  activeAdminReportUsesSummaryRows: boolean;
  activeAdminReportAreaOptions: string[];
  activeAdminReportSummaryAreaOptions: string[];
  adminReportWorkOrderGroups: AdminReportSettingsSectionProps["workOrderGroups"];
  activeAdminReportBaseRows: AdminReportSettingsSectionProps["baseRows"];
  activeAdminReportRowsByKey: AdminReportSettingsSectionProps["rowsByKey"];
  activeAdminReportVisibleRowKeys: AdminReportSettingsSectionProps["visibleRowKeys"];
  derivedReportRowsByKey: AdminReportSettingsSectionProps["derivedRowsByKey"];
  editingReportFactSourceRow: AdminReportSettingsSectionProps["editingFactSourceRow"];
  editingReportFactSourceOptions: AdminReportSettingsSectionProps["editingFactSourceOptions"];
  activeAdminReportRowLabelEntries: AdminReportSettingsSectionProps["rowLabelEntries"];
  editingReportRowLabelKeys: string[];
  expandedReportSummaryIds: string[];
  reportRowsForSummaryArea: AdminReportSettingsSectionProps["rowsForArea"];
  setAdminReportCustomerId: AdminReportSettingsSectionProps["onSelectCustomer"];
  addReportCustomer: AdminReportSettingsSectionProps["onAddCustomer"];
  deleteReportCustomer: AdminReportSettingsSectionProps["onDeleteCustomer"];
  updateReportCustomer: AdminReportSettingsSectionProps["onUpdateCustomer"];
  setAdminReportCustomerSettingsTab: AdminReportSettingsSectionProps["onSetSettingsTab"];
  moveReportAreaOrder: AdminReportSettingsSectionProps["onMoveArea"];
  moveReportWorkOrder: AdminReportSettingsSectionProps["onMoveWork"];
  toggleReportCustomerRow: AdminReportSettingsSectionProps["onToggleCustomerRow"];
  setEditingReportFactSourceRowKey: AdminReportSettingsSectionProps["onEditFactSource"];
  setReportCustomerFactSourceMode: AdminReportSettingsSectionProps["onSetFactSourceMode"];
  toggleReportCustomerFactSourceRowKey: AdminReportSettingsSectionProps["onToggleFactSourceRow"];
  addReportCustomerRowLabel: AdminReportSettingsSectionProps["onAddRowLabel"];
  changeReportCustomerRowLabelSource: AdminReportSettingsSectionProps["onChangeRowLabelSource"];
  updateReportCustomerRowLabel: AdminReportSettingsSectionProps["onUpdateRowLabel"];
  startReportRowLabelEdit: AdminReportSettingsSectionProps["onStartRowLabelEdit"];
  finishReportRowLabelEdit: AdminReportSettingsSectionProps["onFinishRowLabelEdit"];
  removeReportCustomerRowLabel: AdminReportSettingsSectionProps["onRemoveRowLabel"];
  addReportSummaryRow: AdminReportSettingsSectionProps["onAddSummaryRow"];
  updateReportSummaryRow: AdminReportSettingsSectionProps["onUpdateSummaryRow"];
  toggleReportSummaryRowKey: AdminReportSettingsSectionProps["onToggleSummaryRow"];
  startReportSummaryEdit: AdminReportSettingsSectionProps["onStartSummaryEdit"];
  finishReportSummaryEdit: AdminReportSettingsSectionProps["onFinishSummaryEdit"];
  removeReportSummaryRow: AdminReportSettingsSectionProps["onRemoveSummaryRow"];
};

export function useAppAdminReportsProps({
  reportCustomers,
  activeAdminReportCustomer,
  visibleAdminReportCustomerSettingsTab,
  activeAdminReportSelectedCount,
  activeAdminReportUsesSummaryRows,
  activeAdminReportAreaOptions,
  activeAdminReportSummaryAreaOptions,
  adminReportWorkOrderGroups,
  activeAdminReportBaseRows,
  activeAdminReportRowsByKey,
  activeAdminReportVisibleRowKeys,
  derivedReportRowsByKey,
  editingReportFactSourceRow,
  editingReportFactSourceOptions,
  activeAdminReportRowLabelEntries,
  editingReportRowLabelKeys,
  expandedReportSummaryIds,
  reportRowsForSummaryArea,
  setAdminReportCustomerId,
  addReportCustomer,
  deleteReportCustomer,
  updateReportCustomer,
  setAdminReportCustomerSettingsTab,
  moveReportAreaOrder,
  moveReportWorkOrder,
  toggleReportCustomerRow,
  setEditingReportFactSourceRowKey,
  setReportCustomerFactSourceMode,
  toggleReportCustomerFactSourceRowKey,
  addReportCustomerRowLabel,
  changeReportCustomerRowLabelSource,
  updateReportCustomerRowLabel,
  startReportRowLabelEdit,
  finishReportRowLabelEdit,
  removeReportCustomerRowLabel,
  addReportSummaryRow,
  updateReportSummaryRow,
  toggleReportSummaryRowKey,
  startReportSummaryEdit,
  finishReportSummaryEdit,
  removeReportSummaryRow,
}: UseAppAdminReportsPropsOptions): AdminReportSettingsSectionProps {
  return {
    customers: reportCustomers,
    activeCustomer: activeAdminReportCustomer,
    settingsTab: visibleAdminReportCustomerSettingsTab,
    selectedCount: activeAdminReportSelectedCount,
    usesSummaryRows: activeAdminReportUsesSummaryRows,
    areaOptions: activeAdminReportAreaOptions,
    summaryAreaOptions: activeAdminReportSummaryAreaOptions,
    workOrderGroups: adminReportWorkOrderGroups,
    baseRows: activeAdminReportBaseRows,
    rowsByKey: activeAdminReportRowsByKey,
    visibleRowKeys: activeAdminReportVisibleRowKeys,
    derivedRowsByKey: derivedReportRowsByKey,
    editingFactSourceRow: editingReportFactSourceRow,
    editingFactSourceOptions: editingReportFactSourceOptions,
    rowLabelEntries: activeAdminReportRowLabelEntries,
    editingRowLabelKeys: editingReportRowLabelKeys,
    expandedSummaryIds: expandedReportSummaryIds,
    rowsForArea: reportRowsForSummaryArea,
    onSelectCustomer: setAdminReportCustomerId,
    onAddCustomer: addReportCustomer,
    onDeleteCustomer: deleteReportCustomer,
    onUpdateCustomer: updateReportCustomer,
    onSetSettingsTab: setAdminReportCustomerSettingsTab,
    onMoveArea: moveReportAreaOrder,
    onMoveWork: moveReportWorkOrder,
    onToggleCustomerRow: toggleReportCustomerRow,
    onEditFactSource: setEditingReportFactSourceRowKey,
    onSetFactSourceMode: setReportCustomerFactSourceMode,
    onToggleFactSourceRow: toggleReportCustomerFactSourceRowKey,
    onAddRowLabel: addReportCustomerRowLabel,
    onChangeRowLabelSource: changeReportCustomerRowLabelSource,
    onUpdateRowLabel: updateReportCustomerRowLabel,
    onStartRowLabelEdit: startReportRowLabelEdit,
    onFinishRowLabelEdit: finishReportRowLabelEdit,
    onRemoveRowLabel: removeReportCustomerRowLabel,
    onAddSummaryRow: addReportSummaryRow,
    onUpdateSummaryRow: updateReportSummaryRow,
    onToggleSummaryRow: toggleReportSummaryRowKey,
    onStartSummaryEdit: startReportSummaryEdit,
    onFinishSummaryEdit: finishReportSummaryEdit,
    onRemoveSummaryRow: removeReportSummaryRow,
  };
}
