"use client";

import type { ReportsSectionProps } from "@/features/reports/ReportsSection";
import type { useAppReportsModel } from "@/features/app/useAppReportsModel";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { useAppReportsSectionProps } from "@/features/app/useAppReportsSectionProps";

type AppReportsModel = ReturnType<typeof useAppReportsModel>;
type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;
type AppReportsScreenState = Pick<
  AppStateBundle,
  | "reportArea"
  | "setReportArea"
  | "reportReasons"
  | "reportDate"
>;

type UseAppReportsScreenPropsArgs = {
  appState: AppReportsScreenState;
  models: AppReportsModel;
  runtime: AppRuntimeControllers;
};

export function useAppReportsScreenProps({
  appState,
  models,
  runtime,
}: UseAppReportsScreenPropsArgs): ReportsSectionProps {
  const {
    reportArea,
    setReportArea,
    reportReasons,
    reportDate,
  } = appState;

  const {
    activeReportCustomer,
    reportAreaTabs,
    filteredReports,
    filteredReportAreaGroups,
    visibleReportColumnKeys,
    reportTableColumnWidths,
    reportColumnWidthByKey,
    reportCompletionCards,
  } = models;

  const {
    printReport,
    reportHeaderLabel,
    renderReportHeaderText,
    startReportColumnResize,
    commitReportDayReason,
    cancelReportDayReasonDraft,
    commitReportYearReason,
    cancelReportYearReasonDraft,
  } = runtime;

  return useAppReportsSectionProps({
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
    commitReportYearReason,
    cancelReportYearReasonDraft,
  });
}
