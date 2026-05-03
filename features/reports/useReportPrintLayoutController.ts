"use client";

import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import type { ReportColumnKey } from "@/lib/domain/reports/columns";
import type { ReportRow } from "@/lib/domain/reports/types";
import { createReportBodyLayout, createReportPrintLayout } from "./reportPrintLayout";

type ReportPrintLayoutControllerOptions = {
  filteredReportAreaGroups: Array<{ area: string; rows: ReportRow[] }>;
  reportColumnKeys: readonly ReportColumnKey[];
  reportColumnWidthByKey: Map<ReportColumnKey, number>;
  reportDate: string;
  reportReasons: Record<string, string>;
  reportHeaderLabel: (key: string, fallback: string) => string;
  onPrintReport: () => void;
};

export function useReportPrintLayoutController({
  filteredReportAreaGroups,
  reportColumnKeys,
  reportColumnWidthByKey,
  reportDate,
  reportReasons,
  reportHeaderLabel,
  onPrintReport,
}: ReportPrintLayoutControllerOptions) {
  const reportPrintLayoutToken = useMemo(() => ({
    filteredReportAreaGroups,
    reportColumnKeys,
    reportDate,
    reportHeaderLabel,
    reportReasons,
  }), [filteredReportAreaGroups, reportColumnKeys, reportDate, reportHeaderLabel, reportReasons]);
  const [preparedReportPrintState, setPreparedReportPrintState] = useState<{
    layout: ReturnType<typeof createReportPrintLayout>;
    token: object;
  } | null>(null);
  const reportBodyLayout = useMemo(() => createReportBodyLayout(filteredReportAreaGroups), [filteredReportAreaGroups]);
  const buildReportPrintLayout = useCallback(() => createReportPrintLayout({
    columnKeys: reportColumnKeys,
    groups: filteredReportAreaGroups,
    reportDate,
    reportReasons,
    reportHeaderLabel,
  }), [filteredReportAreaGroups, reportColumnKeys, reportDate, reportHeaderLabel, reportReasons]);
  const handlePrintReport = useCallback(() => {
    flushSync(() => setPreparedReportPrintState({
      layout: buildReportPrintLayout(),
      token: reportPrintLayoutToken,
    }));
    window.requestAnimationFrame(onPrintReport);
  }, [buildReportPrintLayout, onPrintReport, reportPrintLayoutToken]);
  const preparedReportPrintLayout = preparedReportPrintState?.token === reportPrintLayoutToken
    ? preparedReportPrintState.layout
    : null;
  const fallbackReportPrintTextColumnWidths = useMemo(() => ({
    "work-name": reportColumnWidthByKey.get("work-name") ?? 180,
    "day-reason": reportColumnWidthByKey.get("day-reason") ?? 175,
    "year-reason": reportColumnWidthByKey.get("year-reason") ?? 190,
  }), [reportColumnWidthByKey]);

  return {
    handlePrintReport,
    reportBodyRowCount: reportBodyLayout.reportBodyRowCount,
    reportGroupStartIndexes: reportBodyLayout.reportGroupStartIndexes,
    reportLastPrintPageRows: preparedReportPrintLayout?.reportLastPrintPageRows ?? 0,
    reportPrintColumnWidths: preparedReportPrintLayout?.reportPrintColumnWidths ?? null,
    reportPrintFillPaddingMm: preparedReportPrintLayout?.reportPrintFillPaddingMm ?? 0,
    reportPrintTextColumnWidths: preparedReportPrintLayout?.reportPrintTextColumnWidths ?? fallbackReportPrintTextColumnWidths,
    reportShouldFillPrintRows: preparedReportPrintLayout?.reportShouldFillPrintRows ?? false,
  };
}
