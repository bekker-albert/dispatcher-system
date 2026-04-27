"use client";

import type { ReportsSectionProps } from "@/features/reports/ReportsSection";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";
import { useAppReportsSectionProps } from "@/features/app/useAppReportsSectionProps";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;
type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;

type UseAppReportsScreenPropsArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
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
    updateReportDayReasonDraft,
    commitReportYearReason,
    cancelReportYearReasonDraft,
    updateReportYearReasonDraft,
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
    updateReportDayReasonDraft,
    commitReportYearReason,
    cancelReportYearReasonDraft,
    updateReportYearReasonDraft,
  });
}
