import { useMemo } from "react";

import { defaultReportCustomers } from "@/lib/domain/reports/defaults";
import {
  applyReportFactSourceRows,
  createReportSummaryRow,
  reportCustomerEffectiveRowKeys,
  reportCustomerUsesSummaryRows,
  reportRowHasAutoShowData,
  reportRowKey,
  reportRowsForCustomer,
  sortAreaNamesByOrder,
  sortReportRowsByAreaOrder,
} from "@/lib/domain/reports/display";
import type { ReportCustomerConfig, ReportRow } from "@/lib/domain/reports/types";
import { normalizeLookupValue, uniqueSorted } from "@/lib/utils/text";

type UseCustomerReportViewModelOptions = {
  needsDerivedReportRows: boolean;
  reportCustomers: ReportCustomerConfig[];
  reportCustomerId: string;
  derivedReportRows: ReportRow[];
  reportArea: string;
};

const reportAllAreasTab = "Все участки";
const reportSummaryAreaLabel = "Итого";

function createReportAreaGroups(rows: ReportRow[]) {
  const groups: Array<{ area: string; normalizedArea: string; rows: ReportRow[] }> = [];
  let index = 0;

  while (index < rows.length) {
    const area = rows[index].area;
    const normalizedArea = normalizeLookupValue(area);
    let nextIndex = index + 1;

    while (nextIndex < rows.length && normalizeLookupValue(rows[nextIndex].area) === normalizedArea) {
      nextIndex += 1;
    }

    groups.push({
      area,
      normalizedArea,
      rows: rows.slice(index, nextIndex),
    });

    index = nextIndex;
  }

  return groups;
}

export function useCustomerReportViewModel({
  needsDerivedReportRows,
  reportCustomers,
  reportCustomerId,
  derivedReportRows,
  reportArea,
}: UseCustomerReportViewModelOptions) {
  const activeReportCustomer = useMemo(() => (
    reportCustomers.find((customer) => customer.id === reportCustomerId)
    ?? reportCustomers.find((customer) => customer.visible)
    ?? reportCustomers[0]
    ?? defaultReportCustomers[0]
  ), [reportCustomerId, reportCustomers]);

  const customerReportRows = useMemo(() => {
    if (!needsDerivedReportRows) return [];

    const rawCustomerRows = reportRowsForCustomer(derivedReportRows, activeReportCustomer);
    const customerRows = applyReportFactSourceRows(rawCustomerRows, activeReportCustomer.factSourceRowKeys);
    const customerAutoRowKeys = new Set(customerRows.filter(reportRowHasAutoShowData).map(reportRowKey));
    const visibleRowKeys = reportCustomerEffectiveRowKeys(activeReportCustomer, customerAutoRowKeys);
    const summarySourceRowKeys = new Set(
      activeReportCustomer.summaryRows.flatMap((summary) => [
        ...summary.rowKeys,
        ...(summary.planRowKey?.trim() ? [summary.planRowKey] : []),
      ]),
    );
    const selectedRows = customerRows
      .filter((row) => {
        const rowKey = reportRowKey(row);
        return visibleRowKeys.has(rowKey) && !summarySourceRowKeys.has(rowKey);
      })
      .map((row) => {
        const rowKey = reportRowKey(row);
        const customerLabel = activeReportCustomer.rowLabels[rowKey]?.trim();

        return customerLabel ? { ...row, name: customerLabel, displayKey: rowKey } : row;
      });
    const rowsByKey = new Map(customerRows.map((row) => [reportRowKey(row), row]));
    const summaryRows = reportCustomerUsesSummaryRows(activeReportCustomer)
      ? activeReportCustomer.summaryRows.flatMap((summary) => {
          const sourceRows = summary.rowKeys
            .map((key) => rowsByKey.get(key))
            .filter((row): row is ReportRow => Boolean(row));
          const planSourceRow = summary.planRowKey ? rowsByKey.get(summary.planRowKey) : undefined;
          const summaryRow = createReportSummaryRow(summary, sourceRows, planSourceRow);
          return summaryRow ? [summaryRow] : [];
        })
      : [];

    return sortReportRowsByAreaOrder([...selectedRows, ...summaryRows], activeReportCustomer.areaOrder, activeReportCustomer.workOrder);
  }, [activeReportCustomer, derivedReportRows, needsDerivedReportRows]);

  const customerReportAreaGroups = useMemo(() => createReportAreaGroups(customerReportRows), [customerReportRows]);

  const reportAreaTabs = useMemo(() => [
    reportAllAreasTab,
    ...(
      needsDerivedReportRows
        ? sortAreaNamesByOrder(
            uniqueSorted(customerReportAreaGroups
              .filter((group) => group.normalizedArea !== normalizeLookupValue(reportSummaryAreaLabel))
              .map((group) => group.area)),
            activeReportCustomer.areaOrder,
          )
        : []
    ),
  ], [activeReportCustomer.areaOrder, customerReportAreaGroups, needsDerivedReportRows]);

  const filteredReportAreaGroups = useMemo(() => {
    if (!needsDerivedReportRows) return [];
    if (reportArea === reportAllAreasTab) return customerReportAreaGroups;

    const normalizedReportArea = normalizeLookupValue(reportArea);
    return customerReportAreaGroups.filter((group) => group.normalizedArea === normalizedReportArea);
  }, [customerReportAreaGroups, needsDerivedReportRows, reportArea]);

  const filteredReports = useMemo(() => (
    filteredReportAreaGroups.flatMap((group) => group.rows)
  ), [filteredReportAreaGroups]);

  return {
    activeReportCustomer,
    customerReportRows,
    reportAreaTabs,
    filteredReports,
    filteredReportAreaGroups,
  };
}
