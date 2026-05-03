import {
  applyReportFactSourceRows,
  applyReportCustomerRowLabel,
  createReportSummaryRow,
  reportCustomerEffectiveRowKeys,
  reportCustomerUsesSummaryRows,
  reportRowHasAutoShowData,
  reportRowKey,
  reportRowsForCustomer,
  sortAreaNamesByOrder,
  sortReportRowsByAreaOrder,
} from "../../lib/domain/reports/display";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "../../lib/domain/reports/types";
import { normalizeLookupValue, uniqueSorted } from "../../lib/utils/text";

export const reportAllAreasTab = "Все участки";
export const reportSummaryAreaLabel = "Итого";

export type ReportAreaGroup = {
  area: string;
  normalizedArea: string;
  rows: ReportRow[];
};

function addSummarySourceRowKeys(keys: Set<string>, summary: ReportSummaryRowConfig) {
  summary.rowKeys.forEach((key) => keys.add(key));
  const planRowKey = summary.planRowKey?.trim();
  if (planRowKey) keys.add(planRowKey);
}

function createSummaryRows(customer: ReportCustomerConfig, rowsByKey: Map<string, ReportRow>) {
  if (!reportCustomerUsesSummaryRows(customer)) return [];

  const summaryRows: ReportRow[] = [];
  customer.summaryRows.forEach((summary) => {
    const sourceRows = summary.rowKeys
      .map((key) => rowsByKey.get(key))
      .filter((row): row is ReportRow => Boolean(row));
    const planSourceRow = summary.planRowKey ? rowsByKey.get(summary.planRowKey) : undefined;
    const summaryRow = createReportSummaryRow(summary, sourceRows, planSourceRow);
    if (summaryRow) summaryRows.push(summaryRow);
  });

  return summaryRows;
}

export function createCustomerReportRows(
  derivedReportRows: readonly ReportRow[],
  customer: ReportCustomerConfig,
  enabled: boolean,
) {
  if (!enabled) return [];

  const rawCustomerRows = reportRowsForCustomer([...derivedReportRows], customer);
  const customerRows = applyReportFactSourceRows(rawCustomerRows, customer.factSourceRowKeys);
  const customerAutoRowKeys = new Set(customerRows.filter(reportRowHasAutoShowData).map(reportRowKey));
  const visibleRowKeys = reportCustomerEffectiveRowKeys(customer, customerAutoRowKeys);
  const summarySourceRowKeys = new Set<string>();
  customer.summaryRows.forEach((summary) => addSummarySourceRowKeys(summarySourceRowKeys, summary));

  const selectedRows: ReportRow[] = [];
  const rowsByKey = new Map<string, ReportRow>();
  customerRows.forEach((row) => {
    const rowKey = reportRowKey(row);
    rowsByKey.set(rowKey, row);
    if (!visibleRowKeys.has(rowKey) || summarySourceRowKeys.has(rowKey)) return;

    selectedRows.push(applyReportCustomerRowLabel(row, customer));
  });

  return sortReportRowsByAreaOrder(
    [...selectedRows, ...createSummaryRows(customer, rowsByKey)],
    customer.areaOrder,
    customer.workOrder,
  );
}

export function createReportAreaGroups(rows: readonly ReportRow[]) {
  const groups: ReportAreaGroup[] = [];
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

export function createReportAreaTabs(
  groups: readonly ReportAreaGroup[],
  areaOrder: readonly string[],
  enabled: boolean,
) {
  if (!enabled) return [reportAllAreasTab];

  const areaNames = groups
    .filter((group) => group.normalizedArea !== normalizeLookupValue(reportSummaryAreaLabel))
    .map((group) => group.area);

  return [
    reportAllAreasTab,
    ...sortAreaNamesByOrder(uniqueSorted(areaNames), [...areaOrder]),
  ];
}

export function filterReportAreaGroups(
  groups: readonly ReportAreaGroup[],
  reportArea: string,
  enabled: boolean,
): ReportAreaGroup[] {
  if (!enabled) return [];
  if (reportArea === reportAllAreasTab) return [...groups];

  const normalizedReportArea = normalizeLookupValue(reportArea);
  return groups.filter((group) => group.normalizedArea === normalizedReportArea);
}

export function flattenReportAreaGroups(groups: readonly ReportAreaGroup[]) {
  if (groups.length === 0) return [];
  if (groups.length === 1) return groups[0].rows;

  const rows: ReportRow[] = [];
  groups.forEach((group) => rows.push(...group.rows));
  return rows;
}
