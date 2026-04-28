import { useMemo } from "react";

import { defaultReportColumnWidths, reportColumnAutoMinWidths, reportColumnHeaderFallbacks, reportColumnKeys, type ReportColumnKey } from "@/lib/domain/reports/columns";
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

function createEmptyReportColumnValueLists() {
  const valuesByKey = {} as Record<ReportColumnKey, string[]>;
  reportColumnKeys.forEach((key) => {
    valuesByKey[key] = [];
  });
  return valuesByKey;
}

export function useReportColumnLayout({
  filteredReports,
  needsDerivedReportRows,
  reportArea,
  reportDate,
  reportHeaderLabels,
  reportColumnWidths,
}: UseReportColumnLayoutOptions) {
  const reportColumnTextModel = useMemo(() => {
    const valuesByKey = createEmptyReportColumnValueLists();
    if (!needsDerivedReportRows) return { rows: [], valuesByKey };

    const rows = filteredReports.map((row) => {
      const monthFact = reportMonthFact(row);
      const yearFact = reportYearFact(row);
      const annualFact = reportAnnualFact(row);

      const textRow = {
        "area": row.area,
        "work-name": row.name,
        "unit": row.unit,
        "day-plan": formatNumber(row.dayPlan),
        "day-fact": formatNumber(row.dayFact),
        "day-delta": formatNumber(delta(row.dayPlan, row.dayFact)),
        "day-productivity": `${formatNumber(row.dayProductivity || row.dayFact)}\n${formatPercent(row.dayFact, row.dayPlan)}`,
        "day-reason": reportReason(row.dayFact, row.dayPlan, row.dayReason),
        "month-total-plan": formatNumber(row.monthTotalPlan),
        "month-plan": formatNumber(row.monthPlan),
        "month-fact": `${formatNumber(monthFact)}\nмарк ${formatNumber(row.monthSurveyFact)}`,
        "month-delta": formatNumber(delta(row.monthPlan, monthFact)),
        "month-productivity": `${formatNumber(row.monthProductivity || monthFact)}\n${formatPercent(monthFact, row.monthPlan)}`,
        "year-plan": formatNumber(row.yearPlan),
        "year-fact": `${formatNumber(yearFact)}\nмарк ${formatNumber(row.yearSurveyFact)}`,
        "year-delta": formatNumber(delta(row.yearPlan, yearFact)),
        "year-reason": delta(row.yearPlan, yearFact) < 0 ? row.yearReason : "",
        "annual-plan": formatNumber(row.annualPlan),
        "annual-fact": formatNumber(annualFact),
        "annual-remaining": formatNumber(delta(row.annualPlan, annualFact)),
      } satisfies Record<ReportColumnKey, string>;

      reportColumnKeys.forEach((key) => {
        valuesByKey[key].push(textRow[key]);
      });

      return textRow;
    });

    return { rows, valuesByKey };
  }, [filteredReports, needsDerivedReportRows]);

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
      const values = reportColumnTextModel.valuesByKey[key];
      return [key, reportAutoColumnWidth(key, header, values)];
    })) as Record<ReportColumnKey, number>
  ), [needsDerivedReportRows, reportColumnTextModel, reportHeaderLabels, visibleReportColumnKeys]);

  const reportTableColumnWidths = useMemo(() => (
    visibleReportColumnKeys.map((key) => {
      const defaultIndex = reportColumnKeys.indexOf(key);
      const autoWidth = autoReportColumnWidths[key] ?? defaultReportColumnWidths[defaultIndex] ?? 80;
      const manualWidth = Math.round(reportColumnWidths[key] ?? 0);

      if (manualWidth > 0) {
        return Math.min(520, Math.max(reportColumnAutoMinWidths[key], manualWidth));
      }

      return autoWidth;
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
    reportColumnTextRows: reportColumnTextModel.rows,
    visibleReportColumnKeys,
    autoReportColumnWidths,
    reportTableColumnWidths,
    reportColumnWidthByKey,
    reportCompletionCards,
  };
}
