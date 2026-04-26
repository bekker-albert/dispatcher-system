"use client";

import type { ReportsSectionProps } from "@/features/reports/ReportsSection";
import type { ReportCompletionCard } from "@/lib/domain/reports/completion";
import type { ReportColumnKey } from "@/lib/domain/reports/columns";
import type { ReportRow } from "@/lib/domain/reports/types";

type UseAppReportsSectionPropsOptions = {
  reportAreaTabs: string[];
  reportArea: string;
  setReportArea: (area: string) => void;
  printReport: () => void;
  activeReportCustomer: { label: string };
  reportDate: string;
  reportCompletionCards: ReportCompletionCard[];
  reportTableColumnWidths: number[];
  visibleReportColumnKeys: readonly ReportColumnKey[];
  reportColumnWidthByKey: Map<ReportColumnKey, number>;
  reportHeaderLabel: ReportsSectionProps["reportHeaderLabel"];
  renderReportHeaderText: ReportsSectionProps["renderReportHeaderText"];
  startReportColumnResize: ReportsSectionProps["onStartReportColumnResize"];
  filteredReportAreaGroups: ReportsSectionProps["filteredReportAreaGroups"];
  filteredReports: ReportRow[];
  reportReasons: Record<string, string>;
  commitReportDayReason: (rowKey: string, value: string) => void;
  cancelReportDayReasonDraft: (rowKey: string, value: string) => void;
  updateReportDayReasonDraft: (rowKey: string, value: string) => void;
  commitReportYearReason: (rowKey: string, value: string) => void;
  cancelReportYearReasonDraft: (rowKey: string, value: string) => void;
  updateReportYearReasonDraft: (rowKey: string, value: string) => void;
};

export function useAppReportsSectionProps({
  reportAreaTabs,
  reportArea,
  setReportArea,
  printReport,
  activeReportCustomer,
  reportDate,
  reportCompletionCards,
  reportTableColumnWidths,
  visibleReportColumnKeys,
  reportColumnWidthByKey,
  reportHeaderLabel,
  renderReportHeaderText,
  startReportColumnResize,
  filteredReportAreaGroups,
  filteredReports,
  reportReasons,
  commitReportDayReason,
  cancelReportDayReasonDraft,
  updateReportDayReasonDraft,
  commitReportYearReason,
  cancelReportYearReasonDraft,
  updateReportYearReasonDraft,
}: UseAppReportsSectionPropsOptions): ReportsSectionProps {
  return {
    reportAreaTabs,
    reportArea,
    onSelectReportArea: setReportArea,
    onPrintReport: printReport,
    activeReportCustomerLabel: activeReportCustomer.label,
    reportDate,
    reportCompletionCards,
    reportTableColumnWidths,
    reportColumnKeys: visibleReportColumnKeys,
    reportColumnWidthByKey,
    reportHeaderLabel,
    renderReportHeaderText,
    onStartReportColumnResize: startReportColumnResize,
    filteredReportAreaGroups,
    filteredReportsCount: filteredReports.length,
    reportReasons,
    onCommitReportDayReason: commitReportDayReason,
    onCancelReportDayReasonDraft: cancelReportDayReasonDraft,
    onUpdateReportDayReasonDraft: updateReportDayReasonDraft,
    onCommitReportYearReason: commitReportYearReason,
    onCancelReportYearReasonDraft: cancelReportYearReasonDraft,
    onUpdateReportYearReasonDraft: updateReportYearReasonDraft,
  };
}
