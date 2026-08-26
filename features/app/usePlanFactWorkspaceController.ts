"use client";

import { useCallback } from "react";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { isPtoDateTableKey, type PtoDateTableKey } from "@/lib/domain/pto/date-table";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";
import { createId } from "@/lib/utils/id";

function cloneReportCustomer(template: ReportCustomerConfig, label: string): ReportCustomerConfig {
  return {
    ...template,
    id: `custom-report-${createId()}`,
    label,
    visible: true,
    rowKeys: [...template.rowKeys],
    hiddenRowKeys: [...template.hiddenRowKeys],
    rowLabels: { ...template.rowLabels },
    factSourceRowKeys: Object.fromEntries(
      Object.entries(template.factSourceRowKeys).map(([key, values]) => [key, [...values]]),
    ),
    summaryRows: template.summaryRows.map((row) => ({ ...row, rowKeys: [...row.rowKeys] })),
    areaOrder: [...template.areaOrder],
    workOrder: Object.fromEntries(
      Object.entries(template.workOrder).map(([key, values]) => [key, [...values]]),
    ),
  };
}

export function usePlanFactWorkspaceController(appState: AppStateBundle) {
  const activeSourceTab = appState.topTab === "pto" && isPtoDateTableKey(appState.ptoTab)
    ? appState.ptoTab
    : null;
  const activeReportId = appState.topTab === "reports" ? appState.reportCustomerId : null;

  const onSelectSourceTab = useCallback((tab: PtoDateTableKey) => {
    appState.setTopTab("pto");
    appState.setPtoTab(tab);
    if (appState.planFactEditing) appState.setPtoDateEditing(true);
  }, [appState]);

  const onSelectReport = useCallback((id: string) => {
    appState.setReportCustomerId(id);
    appState.setTopTab("reports");
  }, [appState]);

  const onEditingChange = useCallback((editing: boolean) => {
    appState.setPlanFactEditing(editing);
    if (appState.topTab === "pto" && isPtoDateTableKey(appState.ptoTab)) {
      appState.setPtoDateEditing(editing);
    }
    if (!editing) {
      appState.setEditingReportHeaderKey(null);
      appState.setReportHeaderDraft("");
    }
  }, [appState]);

  const onSetReportVisible = useCallback((id: string, visible: boolean) => {
    appState.setReportCustomers((current) => {
      const next = current.map((customer) => customer.id === id ? { ...customer, visible } : customer);
      if (!visible && appState.reportCustomerId === id) {
        const fallback = next.find((customer) => customer.visible && customer.id !== id);
        if (fallback) appState.setReportCustomerId(fallback.id);
      }
      return next;
    });
  }, [appState]);

  const onRenameReport = useCallback((id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    appState.setReportCustomers((current) => (
      current.map((customer) => customer.id === id ? { ...customer, label: trimmed } : customer)
    ));
  }, [appState]);

  const onCreateReportCopy = useCallback((templateId: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const template = appState.reportCustomers.find((customer) => customer.id === templateId)
      ?? appState.reportCustomers[0];
    if (!template) return;

    const copy = cloneReportCustomer(template, trimmed);
    appState.setReportCustomers((current) => [...current, copy]);
    appState.setReportCustomerId(copy.id);
    appState.setTopTab("reports");
  }, [appState]);

  return {
    activeSourceTab,
    activeReportId,
    reportCustomers: appState.reportCustomers,
    editing: appState.planFactEditing,
    onEditingChange,
    onSelectSourceTab,
    onSelectReport,
    onSetReportVisible,
    onRenameReport,
    onCreateReportCopy,
  };
}
