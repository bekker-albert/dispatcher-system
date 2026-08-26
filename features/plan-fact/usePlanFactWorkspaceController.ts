"use client";

import { useCallback, useEffect } from "react";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { isPtoDateTableKey, type PtoDateTableKey } from "@/lib/domain/pto/date-table";
import {
  clonePlanFactReportCustomer,
  firstVisiblePlanFactReport,
  isBuiltInPlanFactReport,
  movePlanFactReportCustomer,
} from "@/lib/domain/plan-fact/workspace";
import { createId } from "@/lib/utils/id";

export function usePlanFactWorkspaceController(appState: AppStateBundle) {
  const activeSourceTab = appState.topTab === "pto" && isPtoDateTableKey(appState.ptoTab)
    ? appState.ptoTab
    : null;
  const activeReportId = appState.topTab === "reports" ? appState.reportCustomerId : null;

  useEffect(() => {
    if (!activeSourceTab) return;
    if (appState.ptoDateEditing === appState.planFactEditing) return;
    appState.setPlanFactEditing(appState.ptoDateEditing);
  }, [activeSourceTab, appState]);

  const onSelectSourceTab = useCallback((tab: PtoDateTableKey) => {
    appState.setTopTab("pto");
    appState.setPtoTab(tab);
    appState.setPtoDateEditing(appState.planFactEditing);
  }, [appState]);

  const onSelectReport = useCallback((id: string) => {
    appState.setPtoDateEditing(false);
    appState.setReportCustomerId(id);
    appState.setTopTab("reports");
  }, [appState]);

  const onEditingChange = useCallback((editing: boolean) => {
    appState.setPlanFactEditing(editing);
    appState.setPtoDateEditing(editing && appState.topTab === "pto" && isPtoDateTableKey(appState.ptoTab));
    if (!editing) {
      appState.setEditingReportHeaderKey(null);
      appState.setReportHeaderDraft("");
    }
  }, [appState]);

  const selectFallbackAfterReportRemoval = useCallback((nextCustomers: typeof appState.reportCustomers, removedId: string) => {
    const fallback = firstVisiblePlanFactReport(nextCustomers, removedId);
    if (fallback) {
      appState.setReportCustomerId(fallback.id);
      return;
    }
    appState.setTopTab("pto");
    appState.setPtoTab("plan");
  }, [appState]);

  const onSetReportVisible = useCallback((id: string, visible: boolean) => {
    appState.setReportCustomers((current) => {
      const next = current.map((customer) => customer.id === id ? { ...customer, visible } : customer);
      if (!visible && appState.reportCustomerId === id) selectFallbackAfterReportRemoval(next, id);
      return next;
    });
  }, [appState, selectFallbackAfterReportRemoval]);

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

    const copy = clonePlanFactReportCustomer(template, {
      id: `custom-report-${createId()}`,
      label: trimmed,
    });
    appState.setReportCustomers((current) => [...current, copy]);
    appState.setReportCustomerId(copy.id);
    appState.setPtoDateEditing(false);
    appState.setTopTab("reports");
  }, [appState]);

  const onMoveReport = useCallback((id: string, direction: -1 | 1) => {
    appState.setReportCustomers((current) => movePlanFactReportCustomer(current, id, direction));
  }, [appState]);

  const onDeleteReport = useCallback((id: string) => {
    if (isBuiltInPlanFactReport(id)) return;
    appState.setReportCustomers((current) => {
      const next = current.filter((customer) => customer.id !== id);
      if (appState.reportCustomerId === id) selectFallbackAfterReportRemoval(next, id);
      return next;
    });
  }, [appState, selectFallbackAfterReportRemoval]);

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
    onMoveReport,
    onDeleteReport,
  };
}
