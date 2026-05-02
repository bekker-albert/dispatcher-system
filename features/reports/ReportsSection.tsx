"use client";

import { useCallback, useMemo, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type { ReportColumnKey } from "@/lib/domain/reports/columns";
import type { ReportCompletionCard } from "@/lib/domain/reports/completion";
import { formatReportTitleDate } from "@/lib/domain/reports/display";
import type { ReportRow } from "@/lib/domain/reports/types";
import { SectionCard } from "@/shared/ui/layout";
import { ReportAreaToolbar } from "./ReportAreaToolbar";
import { ReportCompletionCards } from "./ReportCompletionCards";
import { ReportTableBody } from "./ReportTableBody";
import { ReportTableHeader } from "./ReportTableHeader";
import { createReportBodyLayout, createReportPrintLayout } from "./reportPrintLayout";
import {
  reportPanelStyle,
  reportPrintFirstTitleStyle,
  reportSyncStatusStyle,
  reportTableScrollStyle,
  reportTableStyle,
  reportTitleStyle,
  reportWorkspaceStyle,
} from "./reportSectionStyles";

export type ReportsSectionProps = {
  reportAreaTabs: string[];
  reportArea: string;
  onSelectReportArea: (area: string) => void;
  onPrintReport: () => void;
  activeReportCustomerLabel: string;
  reportDate: string;
  reportCompletionCards: ReportCompletionCard[];
  reportTableColumnWidths: number[];
  reportColumnKeys: readonly ReportColumnKey[];
  reportColumnWidthByKey: Map<ReportColumnKey, number>;
  reportHeaderLabel: (key: string, fallback: string) => string;
  renderReportHeaderText: (key: string, fallback: string) => ReactNode;
  onStartReportColumnResize: (event: MouseEvent<HTMLElement>, key: string, width: number) => void;
  filteredReportAreaGroups: Array<{ area: string; rows: ReportRow[] }>;
  filteredReportsCount: number;
  reportReasons: Record<string, string>;
  onCommitReportDayReason: (rowKey: string, value: string) => void;
  onCancelReportDayReasonDraft: (rowKey: string, value: string) => void;
  onCommitReportYearReason: (rowKey: string, value: string) => void;
  onCancelReportYearReasonDraft: (rowKey: string, value: string) => void;
  databaseSyncMessage?: string;
};

export default function ReportsSection({
  reportAreaTabs,
  reportArea,
  onSelectReportArea,
  onPrintReport,
  activeReportCustomerLabel,
  reportDate,
  reportCompletionCards,
  reportTableColumnWidths,
  reportColumnKeys,
  reportColumnWidthByKey,
  reportHeaderLabel,
  renderReportHeaderText,
  onStartReportColumnResize,
  filteredReportAreaGroups,
  filteredReportsCount,
  reportReasons,
  onCommitReportDayReason,
  onCancelReportDayReasonDraft,
  onCommitReportYearReason,
  onCancelReportYearReasonDraft,
  databaseSyncMessage = "",
}: ReportsSectionProps) {
  const reportPrintLayoutToken = useMemo(() => ({
    filteredReportAreaGroups,
    reportColumnKeys,
    reportDate,
    reportHeaderLabel,
    reportReasons,
  }), [filteredReportAreaGroups, reportColumnKeys, reportDate, reportReasons, reportHeaderLabel]);
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
  }), [filteredReportAreaGroups, reportColumnKeys, reportDate, reportReasons, reportHeaderLabel]);
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

  const {
    reportBodyRowCount,
    reportGroupStartIndexes,
  } = reportBodyLayout;
  const {
    reportLastPrintPageRows,
    reportPrintColumnWidths,
    reportPrintFillPaddingMm,
    reportPrintTextColumnWidths,
    reportShouldFillPrintRows,
  } = preparedReportPrintLayout ?? {
    reportLastPrintPageRows: 0,
    reportPrintColumnWidths: null,
    reportPrintFillPaddingMm: 0,
    reportPrintTextColumnWidths: {
      "work-name": reportColumnWidthByKey.get("work-name") ?? 180,
      "day-reason": reportColumnWidthByKey.get("day-reason") ?? 175,
      "year-reason": reportColumnWidthByKey.get("year-reason") ?? 190,
    },
    reportShouldFillPrintRows: false,
  };
  const reportTableInlineStyle = useMemo(() => ({
    ...reportTableStyle,
    minWidth: 0,
    maxWidth: "100%",
    "--report-print-fill-padding-y": `${reportPrintFillPaddingMm}mm`,
    "--report-print-work-name-width": `${reportPrintTextColumnWidths["work-name"]}px`,
    "--report-print-day-reason-width": `${reportPrintTextColumnWidths["day-reason"]}px`,
    "--report-print-year-reason-width": `${reportPrintTextColumnWidths["year-reason"]}px`,
  } as CSSProperties), [reportPrintFillPaddingMm, reportPrintTextColumnWidths]);
  const showDayProductivity = reportColumnKeys.includes("day-productivity");
  const showMonthProductivity = reportColumnKeys.includes("month-productivity");
  const reportTitle = useMemo(
    () => `Отчёт ${activeReportCustomerLabel} по планово-фактическим показателям за ${formatReportTitleDate(reportDate)}`,
    [activeReportCustomerLabel, reportDate],
  );
  const reportColumnStyles = useMemo(
    () => reportColumnKeys.map((key, index) => ({
      width: `${reportTableColumnWidths[index]}px`,
      "--report-print-column-width": `${reportPrintColumnWidths?.[key] ?? reportTableColumnWidths[index]}px`,
    } as CSSProperties)),
    [reportColumnKeys, reportPrintColumnWidths, reportTableColumnWidths],
  );

  return (
    <>
      <ReportAreaToolbar
        reportAreaTabs={reportAreaTabs}
        reportArea={reportArea}
        onSelectReportArea={onSelectReportArea}
        onPrintReport={handlePrintReport}
      />

      <div className="report-print-area" style={reportWorkspaceStyle}>
        <SectionCard title="" fill>
          <div className="report-print-panel" style={reportPanelStyle}>
            <div className="report-screen-title" style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: "100%" }}>
                <div className="report-print-title" style={reportTitleStyle}>{reportTitle}</div>
                {databaseSyncMessage ? (
                  <div style={reportSyncStatusStyle}>{databaseSyncMessage}</div>
                ) : null}
              </div>
            </div>
            <div className="report-print-first-title" style={reportPrintFirstTitleStyle}>{reportTitle}</div>

            <ReportCompletionCards cards={reportCompletionCards} />

            <div className="report-print-table-scroll" style={reportTableScrollStyle}>
              <table className="report-print-table" style={reportTableInlineStyle}>
                <colgroup>
                  {reportColumnKeys.map((key, index) => (
                    <col
                      key={key}
                      className={`report-print-col report-print-col-${key}`}
                      style={reportColumnStyles[index]}
                    />
                  ))}
                </colgroup>
                <ReportTableHeader
                  reportColumnWidthByKey={reportColumnWidthByKey}
                  reportHeaderLabel={reportHeaderLabel}
                  renderReportHeaderText={renderReportHeaderText}
                  showDayProductivity={showDayProductivity}
                  showMonthProductivity={showMonthProductivity}
                  onStartReportColumnResize={onStartReportColumnResize}
                />
                <ReportTableBody
                  filteredReportAreaGroups={filteredReportAreaGroups}
                  filteredReportsCount={filteredReportsCount}
                  reportBodyRowCount={reportBodyRowCount}
                  reportColumnCount={reportColumnKeys.length}
                  reportDate={reportDate}
                  reportGroupStartIndexes={reportGroupStartIndexes}
                  reportLastPrintPageRows={reportLastPrintPageRows}
                  reportReasons={reportReasons}
                  reportShouldFillPrintRows={reportShouldFillPrintRows}
                  showDayProductivity={showDayProductivity}
                  showMonthProductivity={showMonthProductivity}
                  onCommitReportDayReason={onCommitReportDayReason}
                  onCancelReportDayReasonDraft={onCancelReportDayReasonDraft}
                  onCommitReportYearReason={onCommitReportYearReason}
                  onCancelReportYearReasonDraft={onCancelReportYearReasonDraft}
                />
              </table>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
