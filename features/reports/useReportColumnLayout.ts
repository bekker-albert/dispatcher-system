import { useCallback, useMemo } from "react";

import { defaultReportColumnWidths, reportColumnHeaderFallbacks, reportColumnKeys, reportCompactColumnKeys, type ReportColumnKey } from "@/lib/domain/reports/columns";
import { createReportCompletionCards } from "@/lib/domain/reports/completion";
import { delta, formatNumber, formatPercent, reportAutoColumnWidth } from "@/lib/domain/reports/display";
import { reportAnnualFact, reportMonthFact, reportYearFact } from "@/lib/domain/reports/facts";
import { reportReason } from "@/lib/domain/reports/reasons";
import type { ReportRow } from "@/lib/domain/reports/types";
import { normalizeLookupValue } from "@/lib/utils/text";

type UseReportColumnLayoutOptions = {
  filteredReports: ReportRow[];
  needsDerivedReportRows: boolean;
  reportArea: string;
  reportDate: string;
  reportHeaderLabels: Record<string, string>;
  reportColumnWidths: Record<string, number>;
};

export function useReportColumnLayout({
  filteredReports,
  needsDerivedReportRows,
  reportArea,
  reportDate,
  reportHeaderLabels,
  reportColumnWidths,
}: UseReportColumnLayoutOptions) {
  const reportColumnTextValue = useCallback((key: ReportColumnKey, row: ReportRow) => {
    const monthFact = reportMonthFact(row);
    const yearFact = reportYearFact(row);
    const annualFact = reportAnnualFact(row);

    switch (key) {
      case "area":
        return row.area;
      case "work-name":
        return row.name;
      case "unit":
        return row.unit;
      case "day-plan":
        return formatNumber(row.dayPlan);
      case "day-fact":
        return formatNumber(row.dayFact);
      case "day-delta":
        return formatNumber(delta(row.dayPlan, row.dayFact));
      case "day-productivity":
        return `${formatNumber(row.dayProductivity || row.dayFact)}\n${formatPercent(row.dayFact, row.dayPlan)}`;
      case "day-reason":
        return reportReason(row.dayFact, row.dayPlan, row.dayReason);
      case "month-total-plan":
        return formatNumber(row.monthTotalPlan);
      case "month-plan":
        return formatNumber(row.monthPlan);
      case "month-fact":
        return `${formatNumber(monthFact)}\nмарк ${formatNumber(row.monthSurveyFact)}`;
      case "month-delta":
        return formatNumber(delta(row.monthPlan, monthFact));
      case "month-productivity":
        return `${formatNumber(row.monthProductivity || monthFact)}\n${formatPercent(monthFact, row.monthPlan)}`;
      case "year-plan":
        return formatNumber(row.yearPlan);
      case "year-fact":
        return `${formatNumber(yearFact)}\nмарк ${formatNumber(row.yearSurveyFact)}`;
      case "year-delta":
        return formatNumber(delta(row.yearPlan, yearFact));
      case "year-reason":
        return delta(row.yearPlan, yearFact) < 0 ? row.yearReason : "";
      case "annual-plan":
        return formatNumber(row.annualPlan);
      case "annual-fact":
        return formatNumber(annualFact);
      case "annual-remaining":
        return formatNumber(delta(row.annualPlan, annualFact));
      default:
        return "";
    }
  }, []);

  const visibleReportColumnKeys = useMemo(() => (
    normalizeLookupValue(reportArea) === normalizeLookupValue("Все участки")
      ? reportColumnKeys.filter((key) => key !== "day-productivity" && key !== "month-productivity")
      : reportColumnKeys
  ), [reportArea]);

  const autoReportColumnWidths = useMemo(() => (
    Object.fromEntries(visibleReportColumnKeys.map((key) => {
      const defaultIndex = reportColumnKeys.indexOf(key);
      if (!needsDerivedReportRows) return [key, defaultReportColumnWidths[defaultIndex] ?? 80];

      const header = reportHeaderLabels[key]?.trim() || reportColumnHeaderFallbacks[key];
      const values = filteredReports.map((row) => reportColumnTextValue(key, row));
      return [key, reportAutoColumnWidth(key, header, values)];
    })) as Record<ReportColumnKey, number>
  ), [filteredReports, needsDerivedReportRows, reportColumnTextValue, reportHeaderLabels, visibleReportColumnKeys]);

  const reportTableColumnWidths = useMemo(() => (
    visibleReportColumnKeys.map((key) => {
      const defaultIndex = reportColumnKeys.indexOf(key);
      const autoWidth = autoReportColumnWidths[key] ?? defaultReportColumnWidths[defaultIndex] ?? 80;
      if (reportCompactColumnKeys.has(key)) return autoWidth;

      return Math.min(520, Math.max(autoWidth, Math.round(reportColumnWidths[key] ?? 0)));
    })
  ), [autoReportColumnWidths, reportColumnWidths, visibleReportColumnKeys]);

  const reportColumnWidthByKey = useMemo(() => (
    new Map(visibleReportColumnKeys.map((key, index) => [key, reportTableColumnWidths[index]]))
  ), [reportTableColumnWidths, visibleReportColumnKeys]);

  const reportCompletionCards = useMemo(() => createReportCompletionCards({
    rows: filteredReports,
    needsDerivedReportRows,
    reportArea,
    reportDate,
  }), [filteredReports, needsDerivedReportRows, reportArea, reportDate]);

  return {
    reportColumnTextValue,
    visibleReportColumnKeys,
    autoReportColumnWidths,
    reportTableColumnWidths,
    reportColumnWidthByKey,
    reportCompletionCards,
  };
}
