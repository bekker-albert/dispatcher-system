import { useMemo } from "react";

import { defaultReportColumnWidths, reportColumnAutoMinWidths, reportColumnHeaderFallbacks, reportColumnKeys, type ReportColumnKey } from "@/lib/domain/reports/columns";
import { createReportCompletionCards } from "@/lib/domain/reports/completion";
import { reportAutoColumnWidth } from "@/lib/domain/reports/display";
import type { ReportRow } from "@/lib/domain/reports/types";
import { normalizeLookupValue } from "@/lib/utils/text";
import { createReportColumnTextModel } from "./reportColumnTextModel";

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
  const visibleReportColumnKeys = useMemo(() => (
    normalizeLookupValue(reportArea) === normalizeLookupValue("Все участки")
      ? reportColumnKeys.filter((key) => key !== "day-productivity" && key !== "month-productivity")
      : reportColumnKeys
  ), [reportArea]);

  const reportColumnTextModel = useMemo(() => (
    createReportColumnTextModel(filteredReports, visibleReportColumnKeys, needsDerivedReportRows)
  ), [filteredReports, needsDerivedReportRows, visibleReportColumnKeys]);

  const autoReportColumnWidths = useMemo(() => (
    Object.fromEntries(visibleReportColumnKeys.map((key) => {
      const defaultIndex = reportColumnKeys.indexOf(key);
      if (!needsDerivedReportRows) return [key, defaultReportColumnWidths[defaultIndex] ?? 80];

      const header = reportHeaderLabels[key]?.trim() || reportColumnHeaderFallbacks[key];
      const values = reportColumnTextModel.valuesByKey[key] ?? [];
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
    visibleReportColumnKeys,
    autoReportColumnWidths,
    reportTableColumnWidths,
    reportColumnWidthByKey,
    reportCompletionCards,
  };
}
