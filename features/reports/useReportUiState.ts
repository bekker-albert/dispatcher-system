"use client";

import { useState } from "react";
import { defaultAreaShiftCutoffs, type AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import type { AdminReportCustomerSettingsTab } from "@/lib/domain/admin/navigation";
import { defaultReportCustomerId, defaultReportCustomers } from "@/lib/domain/reports/defaults";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";

export function useReportUiState() {
  const [reportArea, setReportArea] = useState("Все участки");
  const [reportCustomerId, setReportCustomerId] = useState(defaultReportCustomerId);
  const [adminReportCustomerId, setAdminReportCustomerId] = useState(defaultReportCustomerId);
  const [adminReportCustomerSettingsTab, setAdminReportCustomerSettingsTab] =
    useState<AdminReportCustomerSettingsTab>("display");
  const [editingReportRowLabelKeys, setEditingReportRowLabelKeys] = useState<string[]>([]);
  const [expandedReportSummaryIds, setExpandedReportSummaryIds] = useState<string[]>([]);
  const [editingReportFactSourceRowKey, setEditingReportFactSourceRowKey] = useState<string | null>(null);
  const [reportCustomers, setReportCustomers] = useState<ReportCustomerConfig[]>(defaultReportCustomers);
  const [reportAreaOrder, setReportAreaOrder] = useState<string[]>([]);
  const [reportWorkOrder, setReportWorkOrder] = useState<Record<string, string[]>>({});
  const [reportHeaderLabels, setReportHeaderLabels] = useState<Record<string, string>>({});
  const [reportColumnWidths, setReportColumnWidths] = useState<Record<string, number>>({});
  const [reportReasons, setReportReasons] = useState<Record<string, string>>({});
  const [editingReportHeaderKey, setEditingReportHeaderKey] = useState<string | null>(null);
  const [reportHeaderDraft, setReportHeaderDraft] = useState("");
  const [areaShiftCutoffs, setAreaShiftCutoffs] = useState<AreaShiftCutoffMap>(defaultAreaShiftCutoffs);

  return {
    reportArea,
    setReportArea,
    reportCustomerId,
    setReportCustomerId,
    adminReportCustomerId,
    setAdminReportCustomerId,
    adminReportCustomerSettingsTab,
    setAdminReportCustomerSettingsTab,
    editingReportRowLabelKeys,
    setEditingReportRowLabelKeys,
    expandedReportSummaryIds,
    setExpandedReportSummaryIds,
    editingReportFactSourceRowKey,
    setEditingReportFactSourceRowKey,
    reportCustomers,
    setReportCustomers,
    reportAreaOrder,
    setReportAreaOrder,
    reportWorkOrder,
    setReportWorkOrder,
    reportHeaderLabels,
    setReportHeaderLabels,
    reportColumnWidths,
    setReportColumnWidths,
    reportReasons,
    setReportReasons,
    editingReportHeaderKey,
    setEditingReportHeaderKey,
    reportHeaderDraft,
    setReportHeaderDraft,
    areaShiftCutoffs,
    setAreaShiftCutoffs,
  };
}
