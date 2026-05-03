import { useCallback, useMemo } from "react";

import { defaultReportCustomers } from "@/lib/domain/reports/defaults";
import {
  applyReportCustomerRowLabel,
  createReportSummaryRow,
  reportCustomerEffectiveRowKeys,
  reportCustomerUsesSummaryRows,
  reportRowHasAutoShowData,
  reportRowKey,
  reportRowsForCustomer,
  sortAreaNamesByOrder,
  sortReportRowsByAreaOrder,
} from "@/lib/domain/reports/display";
import type { AdminReportCustomerSettingsTab } from "@/lib/domain/admin/navigation";
import type { ReportCustomerConfig, ReportRow } from "@/lib/domain/reports/types";
import { normalizeLookupValue, uniqueSorted } from "@/lib/utils/text";

type UseAdminReportSettingsViewModelOptions = {
  needsAdminReportRows: boolean;
  needsAdminReportAutoRows: boolean;
  reportCustomers: ReportCustomerConfig[];
  adminReportCustomerId: string;
  adminReportCustomerSettingsTab: AdminReportCustomerSettingsTab;
  reportBaseRows: ReportRow[];
  derivedReportRows: ReportRow[];
  reportAreaOrder: string[];
  reportWorkOrder: Record<string, string[]>;
  editingReportFactSourceRowKey: string | null;
};

function createReportRowsByNormalizedArea(rows: ReportRow[]) {
  const rowsByArea = new Map<string, ReportRow[]>();

  rows.forEach((row) => {
    const areaKey = normalizeLookupValue(row.area);
    const areaRows = rowsByArea.get(areaKey);

    if (areaRows) {
      areaRows.push(row);
    } else {
      rowsByArea.set(areaKey, [row]);
    }
  });

  return rowsByArea;
}

export function useAdminReportSettingsViewModel({
  needsAdminReportRows,
  needsAdminReportAutoRows,
  reportCustomers,
  adminReportCustomerId,
  adminReportCustomerSettingsTab,
  reportBaseRows,
  derivedReportRows,
  reportAreaOrder,
  reportWorkOrder,
  editingReportFactSourceRowKey,
}: UseAdminReportSettingsViewModelOptions) {
  const activeAdminReportCustomer = useMemo(() => (
    reportCustomers.find((customer) => customer.id === adminReportCustomerId)
    ?? reportCustomers[0]
    ?? defaultReportCustomers[0]
  ), [adminReportCustomerId, reportCustomers]);

  const adminReportBaseRows = useMemo(() => (
    needsAdminReportRows ? sortReportRowsByAreaOrder(reportBaseRows, reportAreaOrder, reportWorkOrder) : []
  ), [needsAdminReportRows, reportAreaOrder, reportBaseRows, reportWorkOrder]);

  const derivedReportRowsByKey = useMemo(() => (
    needsAdminReportAutoRows
      ? new Map(derivedReportRows.map((row) => [reportRowKey(row), row]))
      : new Map<string, ReportRow>()
  ), [derivedReportRows, needsAdminReportAutoRows]);

  const reportAutoRowKeysForCustomer = useCallback((customer: ReportCustomerConfig) => (
    !needsAdminReportAutoRows ? new Set<string>() :
    new Set(
      reportRowsForCustomer(derivedReportRows, customer)
        .filter(reportRowHasAutoShowData)
        .map(reportRowKey),
    )
  ), [derivedReportRows, needsAdminReportAutoRows]);

  const activeAdminReportBaseRows = useMemo(() => (
    needsAdminReportRows
      ? sortReportRowsByAreaOrder(
          reportRowsForCustomer(adminReportBaseRows, activeAdminReportCustomer),
          activeAdminReportCustomer.areaOrder,
          activeAdminReportCustomer.workOrder,
        )
      : []
  ), [activeAdminReportCustomer, adminReportBaseRows, needsAdminReportRows]);

  const activeAdminAutoReportRowKeys = useMemo(() => (
    needsAdminReportAutoRows ? reportAutoRowKeysForCustomer(activeAdminReportCustomer) : new Set<string>()
  ), [activeAdminReportCustomer, needsAdminReportAutoRows, reportAutoRowKeysForCustomer]);

  const activeAdminReportVisibleRowKeys = useMemo(() => {
    if (!needsAdminReportRows) return new Set<string>();
    if (activeAdminReportCustomer.autoShowRows && !needsAdminReportAutoRows) {
      return new Set(
        activeAdminReportBaseRows
          .map(reportRowKey)
          .filter((rowKey) => !activeAdminReportCustomer.hiddenRowKeys.includes(rowKey)),
      );
    }

    return reportCustomerEffectiveRowKeys(activeAdminReportCustomer, activeAdminAutoReportRowKeys);
  }, [
    activeAdminAutoReportRowKeys,
    activeAdminReportBaseRows,
    activeAdminReportCustomer,
    needsAdminReportAutoRows,
    needsAdminReportRows,
  ]);

  const activeAdminReportSummarySourceRowKeys = useMemo(() => (
    needsAdminReportRows
      ? new Set(
          activeAdminReportCustomer.summaryRows.flatMap((summary) => [
            ...summary.rowKeys,
            ...(summary.planRowKey?.trim() ? [summary.planRowKey] : []),
          ]),
        )
      : new Set<string>()
  ), [activeAdminReportCustomer.summaryRows, needsAdminReportRows]);

  const activeAdminReportVisibleRows = useMemo(() => {
    if (!needsAdminReportRows) return [];

    return activeAdminReportBaseRows.filter((row) => {
      const rowKey = reportRowKey(row);
      return activeAdminReportVisibleRowKeys.has(rowKey) && !activeAdminReportSummarySourceRowKeys.has(rowKey);
    });
  }, [activeAdminReportBaseRows, activeAdminReportSummarySourceRowKeys, activeAdminReportVisibleRowKeys, needsAdminReportRows]);

  const activeAdminReportOrderRows = useMemo(() => {
    if (!needsAdminReportRows) return [];

    const rowsByKey = new Map(activeAdminReportBaseRows.map((row) => [reportRowKey(row), row]));
    const summaryRows = reportCustomerUsesSummaryRows(activeAdminReportCustomer)
      ? activeAdminReportCustomer.summaryRows.flatMap((summary) => {
          const sourceRows = summary.rowKeys
            .map((key) => rowsByKey.get(key))
            .filter((row): row is ReportRow => Boolean(row));
          const planSourceRow = summary.planRowKey ? rowsByKey.get(summary.planRowKey) : undefined;
          const summaryRow = createReportSummaryRow(summary, sourceRows, planSourceRow);
          return summaryRow ? [summaryRow] : [];
        })
      : [];

    return sortReportRowsByAreaOrder(
      [...activeAdminReportVisibleRows, ...summaryRows].map((row) => applyReportCustomerRowLabel(row, activeAdminReportCustomer)),
      activeAdminReportCustomer.areaOrder,
      activeAdminReportCustomer.workOrder,
    );
  }, [activeAdminReportBaseRows, activeAdminReportCustomer, activeAdminReportVisibleRows, needsAdminReportRows]);

  const activeAdminReportAreaOptions = useMemo(() => (
    needsAdminReportRows
      ? sortAreaNamesByOrder(
          uniqueSorted(activeAdminReportOrderRows.map((row) => row.area).filter((area) => normalizeLookupValue(area) !== normalizeLookupValue("Итого"))),
          activeAdminReportCustomer.areaOrder,
        )
      : []
  ), [activeAdminReportCustomer.areaOrder, activeAdminReportOrderRows, needsAdminReportRows]);

  const activeAdminReportSummaryAreaOptions = useMemo(() => (
    needsAdminReportRows
      ? sortAreaNamesByOrder(
          uniqueSorted(activeAdminReportBaseRows.map((row) => row.area).filter((area) => normalizeLookupValue(area) !== normalizeLookupValue("Итого"))),
          activeAdminReportCustomer.areaOrder,
        )
      : []
  ), [activeAdminReportBaseRows, activeAdminReportCustomer.areaOrder, needsAdminReportRows]);

  const activeAdminReportRowsByKey = useMemo(() => (
    needsAdminReportRows
      ? new Map(activeAdminReportBaseRows.map((row) => [reportRowKey(row), row]))
      : new Map<string, ReportRow>()
  ), [activeAdminReportBaseRows, needsAdminReportRows]);

  const editingReportFactSourceRow = useMemo(() => (
    needsAdminReportRows && editingReportFactSourceRowKey
      ? activeAdminReportRowsByKey.get(editingReportFactSourceRowKey) ?? null
      : null
  ), [activeAdminReportRowsByKey, editingReportFactSourceRowKey, needsAdminReportRows]);

  const editingReportFactSourceOptions = useMemo(() => {
    if (!editingReportFactSourceRow) return [];

    const areaKey = normalizeLookupValue(editingReportFactSourceRow.area);
    return activeAdminReportBaseRows.filter((row) => normalizeLookupValue(row.area) === areaKey);
  }, [activeAdminReportBaseRows, editingReportFactSourceRow]);

  const adminReportWorkOrderGroups = useMemo(() => {
    if (!needsAdminReportRows) return [];

    const activeAdminReportOrderRowsByArea = createReportRowsByNormalizedArea(activeAdminReportOrderRows);

    return activeAdminReportAreaOptions.map((area) => ({
      area,
      rows: sortReportRowsByAreaOrder(
        activeAdminReportOrderRowsByArea.get(normalizeLookupValue(area)) ?? [],
        [area],
        activeAdminReportCustomer.workOrder,
      ),
    }));
  }, [activeAdminReportAreaOptions, activeAdminReportCustomer.workOrder, activeAdminReportOrderRows, needsAdminReportRows]);

  const activeAdminReportSelectedCount = useMemo(() => (
    needsAdminReportRows ? activeAdminReportVisibleRows.length : 0
  ), [activeAdminReportVisibleRows, needsAdminReportRows]);

  const activeAdminReportRowLabelEntries = useMemo(() => (
    needsAdminReportRows
      ? Object.entries(activeAdminReportCustomer.rowLabels).flatMap(([rowKey, label]) => {
          const row = activeAdminReportRowsByKey.get(rowKey);
          return row ? [{ rowKey, label, row }] : [];
        })
      : []
  ), [activeAdminReportCustomer, activeAdminReportRowsByKey, needsAdminReportRows]);

  const activeAdminReportUsesSummaryRows = reportCustomerUsesSummaryRows(activeAdminReportCustomer);
  const visibleAdminReportCustomerSettingsTab: AdminReportCustomerSettingsTab = activeAdminReportUsesSummaryRows || adminReportCustomerSettingsTab !== "summary"
    ? adminReportCustomerSettingsTab
    : "display";

  return {
    activeAdminReportCustomer,
    adminReportBaseRows,
    derivedReportRowsByKey,
    reportAutoRowKeysForCustomer,
    activeAdminReportBaseRows,
    activeAdminReportVisibleRowKeys,
    activeAdminReportOrderRows,
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
  };
}
