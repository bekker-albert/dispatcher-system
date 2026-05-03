import { memo, useMemo } from "react";
import type { ReportRow } from "@/lib/domain/reports/types";
import { ReportReasonTextarea } from "./ReportReasonTextarea";
import { ReportMetric, ReportTd } from "./ReportTableParts";
import { createReportTableBodyGroups, type ReportAreaGroup } from "./reportTableBodyModel";
import { createReportRowDisplayViewModel } from "./reportRowDisplayViewModel";
import { reportAreaGroupStartRowStyle } from "./reportSectionStyles";

type ReportTableBodyProps = {
  filteredReportAreaGroups: ReportAreaGroup[];
  filteredReportsCount: number;
  reportBodyRowCount: number;
  reportColumnCount: number;
  reportDate: string;
  reportGroupStartIndexes: readonly number[];
  reportLastPrintPageRows: number;
  reportReasons: Record<string, string>;
  reportShouldFillPrintRows: boolean;
  showDayProductivity: boolean;
  showMonthProductivity: boolean;
  onCommitReportDayReason: (rowKey: string, value: string) => void;
  onCancelReportDayReasonDraft: (rowKey: string, value: string) => void;
  onCommitReportYearReason: (rowKey: string, value: string) => void;
  onCancelReportYearReasonDraft: (rowKey: string, value: string) => void;
};

type ReportTableBodyRowProps = {
  dayReasonText?: string;
  groupRowCount: number;
  reportBodyRowCount: number;
  reportDate: string;
  reportLastPrintPageRows: number;
  reportShouldFillPrintRows: boolean;
  row: ReportRow;
  rowKey: string;
  rowIndexInGroup: number;
  rowPrintIndex: number;
  showDayProductivity: boolean;
  showMonthProductivity: boolean;
  yearReasonText?: string;
  onCommitReportDayReason: (rowKey: string, value: string) => void;
  onCancelReportDayReasonDraft: (rowKey: string, value: string) => void;
  onCommitReportYearReason: (rowKey: string, value: string) => void;
  onCancelReportYearReasonDraft: (rowKey: string, value: string) => void;
};

const emptyReportReasons: Record<string, string> = {};

const ReportTableBodyRow = memo(function ReportTableBodyRow({
  dayReasonText,
  groupRowCount,
  reportBodyRowCount,
  reportDate,
  reportLastPrintPageRows,
  reportShouldFillPrintRows,
  row,
  rowKey,
  rowIndexInGroup,
  rowPrintIndex,
  showDayProductivity,
  showMonthProductivity,
  yearReasonText,
  onCommitReportDayReason,
  onCancelReportDayReasonDraft,
  onCommitReportYearReason,
  onCancelReportYearReasonDraft,
}: ReportTableBodyRowProps) {
  const rowView = createReportRowDisplayViewModel({
    dayReasonText,
    groupRowCount,
    reportBodyRowCount,
    reportDate,
    reportLastPrintPageRows,
    reportReasons: emptyReportReasons,
    reportShouldFillPrintRows,
    row,
    rowKey,
    rowIndexInGroup,
    rowPrintIndex,
    yearReasonText,
  });

  return (
    <tr className={rowView.rowClassName} style={rowView.showAreaCell ? reportAreaGroupStartRowStyle : undefined}>
      {rowView.showAreaCell ? (
        <ReportTd rowSpan={rowView.areaRowSpan} strong align="center" variant="area">{rowView.area}</ReportTd>
      ) : null}
      <ReportTd strong align="center" variant="work">
        {rowView.workName}
      </ReportTd>
      <ReportTd align="center">{rowView.unit}</ReportTd>
      <ReportTd align="center">{rowView.dayPlan}</ReportTd>
      <ReportTd align="center">{rowView.dayFact}</ReportTd>
      <ReportTd align="center" tone={rowView.dayDelta.tone}>{rowView.dayDelta.text}</ReportTd>
      {showDayProductivity ? (
        <ReportTd align="center">
          <ReportMetric value={rowView.dayProductivity.value} note={rowView.dayProductivity.note} />
        </ReportTd>
      ) : null}
      <ReportTd align="center" tone={rowView.dayReason.tone} variant="reason">
        {rowView.dayReason.showEditor ? (
          <div className="report-reason-cell-content">
            <ReportReasonTextarea
              value={rowView.dayReason.text}
              placeholder="Введите причину"
              onCommit={(value) => onCommitReportDayReason(rowView.rowKey, value)}
              onCancel={(value) => onCancelReportDayReasonDraft(rowView.rowKey, value)}
            />
          </div>
        ) : null}
      </ReportTd>
      <ReportTd align="center">{rowView.monthTotalPlan}</ReportTd>
      <ReportTd align="center">{rowView.monthPlan}</ReportTd>
      <ReportTd align="center">
        <ReportMetric value={rowView.monthFact.value} note={rowView.monthFact.note} />
      </ReportTd>
      <ReportTd align="center" tone={rowView.monthDelta.tone}>{rowView.monthDelta.text}</ReportTd>
      {showMonthProductivity ? (
        <ReportTd align="center">
          <ReportMetric value={rowView.monthProductivity.value} note={rowView.monthProductivity.note} />
        </ReportTd>
      ) : null}
      <ReportTd align="center">{rowView.yearPlan}</ReportTd>
      <ReportTd align="center">
        <ReportMetric value={rowView.yearFact.value} note={rowView.yearFact.note} />
      </ReportTd>
      <ReportTd align="center" tone={rowView.yearDelta.tone}>{rowView.yearDelta.text}</ReportTd>
      <ReportTd align="center" tone={rowView.yearReason.tone} variant="reason">
        {rowView.yearReason.showEditor ? (
          <div className="report-reason-cell-content">
            <ReportReasonTextarea
              value={rowView.yearReason.text}
              placeholder="Введите причину"
              onCommit={(value) => onCommitReportYearReason(rowView.rowKey, value)}
              onCancel={(value) => onCancelReportYearReasonDraft(rowView.rowKey, value)}
            />
          </div>
        ) : null}
      </ReportTd>
      <ReportTd align="center">{rowView.annualPlan}</ReportTd>
      <ReportTd align="center">{rowView.annualFact}</ReportTd>
      <ReportTd align="center" tone={rowView.annualRemaining.tone}>{rowView.annualRemaining.text}</ReportTd>
    </tr>
  );
});

export function ReportTableBody({
  filteredReportAreaGroups,
  filteredReportsCount,
  reportBodyRowCount,
  reportColumnCount,
  reportDate,
  reportGroupStartIndexes,
  reportLastPrintPageRows,
  reportReasons,
  reportShouldFillPrintRows,
  showDayProductivity,
  showMonthProductivity,
  onCommitReportDayReason,
  onCancelReportDayReasonDraft,
  onCommitReportYearReason,
  onCancelReportYearReasonDraft,
}: ReportTableBodyProps) {
  const bodyGroups = useMemo(() => createReportTableBodyGroups({
    filteredReportAreaGroups,
    reportDate,
    reportGroupStartIndexes,
    reportReasons,
  }), [filteredReportAreaGroups, reportDate, reportGroupStartIndexes, reportReasons]);

  return (
    <>
      {bodyGroups.map((group) => (
        <tbody key={group.area} className="report-print-area-group">
          {group.rows.map((rowDescriptor) => (
            <ReportTableBodyRow
              key={rowDescriptor.rowKey}
              dayReasonText={rowDescriptor.dayReasonText}
              groupRowCount={rowDescriptor.groupRowCount}
              reportBodyRowCount={reportBodyRowCount}
              reportDate={reportDate}
              reportLastPrintPageRows={reportLastPrintPageRows}
              reportShouldFillPrintRows={reportShouldFillPrintRows}
              row={rowDescriptor.row}
              rowKey={rowDescriptor.rowKey}
              rowIndexInGroup={rowDescriptor.rowIndexInGroup}
              rowPrintIndex={rowDescriptor.rowPrintIndex}
              showDayProductivity={showDayProductivity}
              showMonthProductivity={showMonthProductivity}
              yearReasonText={rowDescriptor.yearReasonText}
              onCommitReportDayReason={onCommitReportDayReason}
              onCancelReportDayReasonDraft={onCancelReportDayReasonDraft}
              onCommitReportYearReason={onCommitReportYearReason}
              onCancelReportYearReasonDraft={onCancelReportYearReasonDraft}
            />
          ))}
        </tbody>
      ))}
      <tbody>
        {filteredReportsCount === 0 && (
          <tr>
            <ReportTd colSpan={reportColumnCount}>По выбранному заказчику пока нет настроенных строк.</ReportTd>
          </tr>
        )}
      </tbody>
    </>
  );
}
