"use client";

import type { useAppAdminReportEditors } from "@/features/app/useAppAdminReportEditors";
import { useAppAdminReportsProps } from "@/features/app/useAppAdminReportsProps";
import type { useAppReportsModel } from "@/features/app/useAppReportsModel";
import type { AppStateBundle } from "@/features/app/AppStateBundle";

type AppReportsModel = ReturnType<typeof useAppReportsModel>;
type AppAdminReportEditors = ReturnType<typeof useAppAdminReportEditors>;

type UseAppAdminReportsScreenPropsArgs = {
  appState: AppStateBundle;
  models: AppReportsModel;
  adminReportEditors: AppAdminReportEditors;
};

export function useAppAdminReportsScreenProps({
  appState,
  models,
  adminReportEditors,
}: UseAppAdminReportsScreenPropsArgs): ReturnType<typeof useAppAdminReportsProps> {
  const {
    setAdminReportCustomerId,
    setAdminReportCustomerSettingsTab,
    editingReportRowLabelKeys,
    expandedReportSummaryIds,
    setEditingReportFactSourceRowKey,
    reportCustomers,
  } = appState;

  const {
    activeAdminReportCustomer,
    derivedReportRowsByKey,
    activeAdminReportBaseRows,
    activeAdminReportVisibleRowKeys,
    activeAdminReportAreaOptions,
    activeAdminReportSummaryAreaOptions,
    activeAdminReportRowsByKey,
    editingReportFactSourceRow,
    editingReportFactSourceOptions,
    adminReportWorkOrderGroups,
    activeAdminReportSelectedCount,
    activeAdminReportRowLabelEntries,
    activeAdminReportUsesSummaryRows,
    visibleAdminReportCustomerSettingsTab,
  } = models;

  const {
    updateReportCustomer,
    addReportCustomer,
    deleteReportCustomer,
    moveReportAreaOrder,
    moveReportWorkOrder,
    toggleReportCustomerRow,
    updateReportCustomerRowLabel,
    addReportCustomerRowLabel,
    changeReportCustomerRowLabelSource,
    removeReportCustomerRowLabel,
    startReportRowLabelEdit,
    finishReportRowLabelEdit,
    setReportCustomerFactSourceMode,
    toggleReportCustomerFactSourceRowKey,
    reportRowsForSummaryArea,
    addReportSummaryRow,
    startReportSummaryEdit,
    finishReportSummaryEdit,
    updateReportSummaryRow,
    toggleReportSummaryRowKey,
    removeReportSummaryRow,
  } = adminReportEditors;

  return useAppAdminReportsProps({
    reportCustomers,
    activeAdminReportCustomer,
    visibleAdminReportCustomerSettingsTab,
    canToggleAutoShowRows: visibleAdminReportCustomerSettingsTab === "display",
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
  });
}
