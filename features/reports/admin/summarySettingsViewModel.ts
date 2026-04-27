import { reportRowKey } from "@/lib/domain/reports/display";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "@/lib/domain/reports/types";
import { normalizeLookupValue } from "@/lib/utils/text";

export function buildAdminReportSummaryRowModel({
  customer,
  summary,
  areaOptions,
  expandedIds,
  rowsForArea,
}: {
  customer: ReportCustomerConfig;
  summary: ReportSummaryRowConfig;
  areaOptions: string[];
  expandedIds: string[];
  rowsForArea: (area: string) => ReportRow[];
}) {
  const hasStoredArea = areaOptions.some((area) => normalizeLookupValue(area) === normalizeLookupValue(summary.area));
  const visibleSummaryArea = hasStoredArea ? summary.area : areaOptions[0] ?? summary.area;
  const summaryAreaRows = rowsForArea(visibleSummaryArea);
  const selectedSummaryRows = summaryAreaRows.filter((row) => summary.rowKeys.includes(reportRowKey(row)));
  const summaryExpanded = expandedIds.includes(summary.id);
  const selectedSummaryLabels = selectedSummaryRows.map((row) => {
    const rowKey = reportRowKey(row);
    return customer.rowLabels[rowKey]?.trim() || row.name;
  });
  const selectedSummaryText = selectedSummaryLabels.length > 0 ? selectedSummaryLabels.join(" + ") : "Строки не выбраны.";
  const selectedPlanRow = summary.planRowKey
    ? summaryAreaRows.find((row) => reportRowKey(row) === summary.planRowKey)
    : undefined;
  const selectedPlanText = selectedPlanRow
    ? customer.rowLabels[reportRowKey(selectedPlanRow)]?.trim() || selectedPlanRow.name
    : "Авто: сумма выбранных строк";

  return {
    hasStoredArea,
    visibleSummaryArea,
    summaryAreaRows,
    selectedSummaryRows,
    summaryExpanded,
    selectedSummaryText,
    selectedPlanRow,
    selectedPlanText,
  };
}
