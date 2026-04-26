"use client";

import { Printer } from "lucide-react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { reportFlexibleColumnKeys, type ReportColumnKey } from "@/lib/domain/reports/columns";
import { reportReasonEntryKey, reportYearReasonOverrideKey } from "@/lib/domain/reports/reasons";
import type { ReportRow } from "@/lib/domain/reports/types";
import type { ReportCompletionCard } from "@/lib/domain/reports/completion";
import { delta, formatNumber, formatPercent, formatReportTitleDate, formatReportWorkName } from "@/lib/domain/reports/display";
import { reportAnnualFact, reportMonthFact, reportYearFact } from "@/lib/domain/reports/facts";
import { reportRowDisplayKey } from "@/lib/domain/reports/display";
import { IconButton, TopButton } from "@/shared/ui/buttons";
import { SectionCard } from "@/shared/ui/layout";
import { ReportReasonTextarea } from "./ReportReasonTextarea";
import { ReportCompletionGauge, ReportMetric, ReportTd, ReportTh } from "./ReportTableParts";
import { createReportPrintLayout } from "./reportPrintLayout";
import {
  reportAreaGroupStartRowStyle,
  reportAreaTabsListStyle,
  reportAreaTabsToolbarStyle,
  reportGaugeGridStyle,
  reportPanelStyle,
  reportPrintFirstTitleStyle,
  reportTableScrollStyle,
  reportTableStyle,
  reportTitleStyle,
  reportWorkspaceStyle,
} from "./reportSectionStyles";

type ReportsSectionProps = {
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
  onUpdateReportDayReasonDraft: (rowKey: string, value: string) => void;
  onCommitReportYearReason: (rowKey: string, value: string) => void;
  onCancelReportYearReasonDraft: (rowKey: string, value: string) => void;
  onUpdateReportYearReasonDraft: (rowKey: string, value: string) => void;
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
  onUpdateReportDayReasonDraft,
  onCommitReportYearReason,
  onCancelReportYearReasonDraft,
  onUpdateReportYearReasonDraft,
}: ReportsSectionProps) {
  const {
    reportBodyRowCount,
    reportGroupStartIndexes,
    reportLastPrintPageRows,
    reportPrintFillPaddingMm,
    reportPrintTextColumnWidths,
    reportShouldFillPrintRows,
  } = createReportPrintLayout({
    groups: filteredReportAreaGroups,
    reportDate,
    reportReasons,
    reportHeaderLabel,
  });
  const reportTableInlineStyle = {
    ...reportTableStyle,
    minWidth: 0,
    maxWidth: "100%",
    "--report-print-fill-padding-y": `${reportPrintFillPaddingMm}mm`,
    "--report-print-work-name-width": `${reportPrintTextColumnWidths["work-name"]}px`,
    "--report-print-day-reason-width": `${reportPrintTextColumnWidths["day-reason"]}px`,
    "--report-print-year-reason-width": `${reportPrintTextColumnWidths["year-reason"]}px`,
  } as CSSProperties;
  const showDayProductivity = reportColumnKeys.includes("day-productivity");
  const showMonthProductivity = reportColumnKeys.includes("month-productivity");
  const reportColumnStyle = (key: ReportColumnKey, index: number): CSSProperties => (
    reportFlexibleColumnKeys.has(key)
      ? {}
      : { width: `${reportTableColumnWidths[index]}px` }
  );

  return (
    <>
      <div className="report-screen-toolbar" style={reportAreaTabsToolbarStyle}>
        <div style={reportAreaTabsListStyle}>
          {reportAreaTabs.map((area) => (
            <TopButton
              key={area}
              active={reportArea !== "Все участки" && reportArea === area}
              onClick={() => onSelectReportArea(area)}
              label={area}
            />
          ))}
        </div>
        <IconButton label="Печать отчетности: A3, альбомная ориентация" onClick={onPrintReport}>
          <Printer size={16} aria-hidden />
        </IconButton>
      </div>

      <div className="report-print-area" style={reportWorkspaceStyle}>
        <SectionCard title="" fill>
          <div className="report-print-panel" style={reportPanelStyle}>
            <div className="report-screen-title" style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: "100%" }}>
                <div className="report-print-title" style={reportTitleStyle}>Отчёт {activeReportCustomerLabel} по планово-фактическим показателям за {formatReportTitleDate(reportDate)}</div>
              </div>
            </div>
            <div className="report-print-first-title" style={reportPrintFirstTitleStyle}>
              Отчёт {activeReportCustomerLabel} по планово-фактическим показателям за {formatReportTitleDate(reportDate)}
            </div>

            <div style={reportGaugeGridStyle}>
              {reportCompletionCards.map((card) => (
                <ReportCompletionGauge
                  key={card.title}
                  fact={card.fact}
                  lag={card.lag}
                  monthPlan={card.monthPlan}
                  overPlanPerDay={card.overPlanPerDay}
                  percent={card.percent}
                  plan={card.plan}
                  remainingDays={card.remainingDays}
                  title={card.title}
                />
              ))}
            </div>

            <div className="report-print-table-scroll" style={reportTableScrollStyle}>
              <table className="report-print-table" style={reportTableInlineStyle}>
                <colgroup>
                  {reportColumnKeys.map((key, index) => (
                    <col
                      key={key}
                      className={`report-print-col report-print-col-${key}`}
                      style={reportColumnStyle(key, index)}
                    />
                  ))}
                </colgroup>
                <thead>
                  <tr className="report-screen-header-row">
                    <ReportTh rowSpan={2} columnKey="area" printLabel={reportHeaderLabel("area", "Участок")} width={reportColumnWidthByKey.get("area")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("area", "Участок")}</ReportTh>
                    <ReportTh rowSpan={2} columnKey="work-name" printLabel={reportHeaderLabel("work-name", "Вид работ")} width={reportColumnWidthByKey.get("work-name")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("work-name", "Вид работ")}</ReportTh>
                    <ReportTh rowSpan={2} columnKey="unit" printLabel={reportHeaderLabel("unit", "Ед.")} width={reportColumnWidthByKey.get("unit")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("unit", "Ед.")}</ReportTh>
                    <ReportTh colSpan={showDayProductivity ? 5 : 4} printLabel={reportHeaderLabel("day-group", "Текущая дата")}>{renderReportHeaderText("day-group", "Текущая дата")}</ReportTh>
                    <ReportTh colSpan={showMonthProductivity ? 5 : 4} printLabel={reportHeaderLabel("month-group", "С начала месяца")}>{renderReportHeaderText("month-group", "С начала месяца")}</ReportTh>
                    <ReportTh colSpan={4} printLabel={reportHeaderLabel("year-group", "С начала года")}>{renderReportHeaderText("year-group", "С начала года")}</ReportTh>
                    <ReportTh colSpan={3} printLabel={reportHeaderLabel("annual-group", "Годовой план")}>{renderReportHeaderText("annual-group", "Годовой план")}</ReportTh>
                  </tr>
                  <tr className="report-screen-subheader-row">
                    <ReportTh columnKey="day-plan" printLabel={reportHeaderLabel("day-plan", "План суточный")} width={reportColumnWidthByKey.get("day-plan")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("day-plan", "План суточный")}</ReportTh>
                    <ReportTh columnKey="day-fact" printLabel={reportHeaderLabel("day-fact", "Оперучет")} width={reportColumnWidthByKey.get("day-fact")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("day-fact", "Оперучет")}</ReportTh>
                    <ReportTh columnKey="day-delta" printLabel={reportHeaderLabel("day-delta", "Откл.")} width={reportColumnWidthByKey.get("day-delta")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("day-delta", "Откл.")}</ReportTh>
                    {showDayProductivity ? (
                      <ReportTh columnKey="day-productivity" printLabel={reportHeaderLabel("day-productivity", "Произв. техники")} width={reportColumnWidthByKey.get("day-productivity")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("day-productivity", "Произв. техники")}</ReportTh>
                    ) : null}
                    <ReportTh columnKey="day-reason" printLabel={reportHeaderLabel("day-reason", "Причина за сутки")} width={reportColumnWidthByKey.get("day-reason")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("day-reason", "Причина за сутки")}</ReportTh>
                    <ReportTh columnKey="month-total-plan" printLabel={reportHeaderLabel("month-total-plan", "План на месяц")} width={reportColumnWidthByKey.get("month-total-plan")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("month-total-plan", "План на месяц")}</ReportTh>
                    <ReportTh columnKey="month-plan" printLabel={reportHeaderLabel("month-plan", "План с начала месяца")} width={reportColumnWidthByKey.get("month-plan")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("month-plan", "План с начала месяца")}</ReportTh>
                    <ReportTh columnKey="month-fact" printLabel={reportHeaderLabel("month-fact", "Маркзамер + оперучет")} width={reportColumnWidthByKey.get("month-fact")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("month-fact", "Маркзамер + оперучет")}</ReportTh>
                    <ReportTh columnKey="month-delta" printLabel={reportHeaderLabel("month-delta", "Откл.")} width={reportColumnWidthByKey.get("month-delta")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("month-delta", "Откл.")}</ReportTh>
                    {showMonthProductivity ? (
                      <ReportTh columnKey="month-productivity" printLabel={reportHeaderLabel("month-productivity", "Произв. накоп.")} width={reportColumnWidthByKey.get("month-productivity")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("month-productivity", "Произв. накоп.")}</ReportTh>
                    ) : null}
                    <ReportTh columnKey="year-plan" printLabel={reportHeaderLabel("year-plan", "План с начала года")} width={reportColumnWidthByKey.get("year-plan")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("year-plan", "План с начала года")}</ReportTh>
                    <ReportTh columnKey="year-fact" printLabel={reportHeaderLabel("year-fact", "Маркзамер + недостающий оперучет")} width={reportColumnWidthByKey.get("year-fact")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("year-fact", "Маркзамер + недостающий оперучет")}</ReportTh>
                    <ReportTh columnKey="year-delta" printLabel={reportHeaderLabel("year-delta", "Откл.")} width={reportColumnWidthByKey.get("year-delta")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("year-delta", "Откл.")}</ReportTh>
                    <ReportTh columnKey="year-reason" printLabel={reportHeaderLabel("year-reason", "Причины с накоплением")} width={reportColumnWidthByKey.get("year-reason")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("year-reason", "Причины с накоплением")}</ReportTh>
                    <ReportTh columnKey="annual-plan" printLabel={reportHeaderLabel("annual-plan", "Годовой план")} width={reportColumnWidthByKey.get("annual-plan")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("annual-plan", "Годовой план")}</ReportTh>
                    <ReportTh columnKey="annual-fact" printLabel={reportHeaderLabel("annual-fact", "Факт годового плана")} width={reportColumnWidthByKey.get("annual-fact")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("annual-fact", "Факт годового плана")}</ReportTh>
                    <ReportTh columnKey="annual-remaining" printLabel={reportHeaderLabel("annual-remaining", "Остаток")} width={reportColumnWidthByKey.get("annual-remaining")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("annual-remaining", "Остаток")}</ReportTh>
                  </tr>
                </thead>
                {filteredReportAreaGroups.map((group, groupIndex) => (
                  <tbody key={group.area} className="report-print-area-group">
                    {group.rows.map((row, index) => {
                      const monthFact = reportMonthFact(row);
                      const yearFact = reportYearFact(row);
                      const annualFact = reportAnnualFact(row);
                      const dayDelta = delta(row.dayPlan, row.dayFact);
                      const monthDelta = delta(row.monthPlan, monthFact);
                      const yearDelta = delta(row.yearPlan, yearFact);
                      const annualRemaining = delta(row.annualPlan, annualFact);
                      const rowKey = reportRowDisplayKey(row);
                      const dayReasonKey = reportReasonEntryKey(reportDate, rowKey);
                      const yearReasonKey = reportYearReasonOverrideKey(reportDate, rowKey);
                      const dayReasonText = dayDelta < 0 ? (reportReasons[dayReasonKey] ?? row.dayReason) : "";
                      const yearReasonText = yearDelta < 0 ? (reportReasons[yearReasonKey] ?? row.yearReason) : "";
                      const dayReasonMissing = dayDelta < 0 && dayReasonText.trim() === "";
                      const yearReasonMissing = yearDelta < 0 && yearReasonText.trim() === "";
                      const showAreaCell = index === 0;
                      const rowPrintIndex = (reportGroupStartIndexes[groupIndex] ?? 0) + index;
                      const rowClassName = reportShouldFillPrintRows && rowPrintIndex >= reportBodyRowCount - reportLastPrintPageRows
                        ? "report-print-fill-row"
                        : undefined;

                      return (
                        <tr key={rowKey} className={rowClassName} style={showAreaCell ? reportAreaGroupStartRowStyle : undefined}>
                          {showAreaCell ? (
                            <ReportTd rowSpan={group.rows.length} strong align="center" variant="area">{row.area}</ReportTd>
                          ) : null}
                          <ReportTd strong align="center" variant="work">
                            {formatReportWorkName(row.name)}
                          </ReportTd>
                          <ReportTd align="center">{row.unit}</ReportTd>
                          <ReportTd align="center">{formatNumber(row.dayPlan)}</ReportTd>
                          <ReportTd align="center">{formatNumber(row.dayFact)}</ReportTd>
                          <ReportTd align="center" tone={dayDelta < 0 ? "bad" : "good"}>{formatNumber(dayDelta)}</ReportTd>
                          {showDayProductivity ? (
                            <ReportTd align="center">
                              <ReportMetric value={formatNumber(row.dayProductivity || row.dayFact)} note={formatPercent(row.dayFact, row.dayPlan)} />
                            </ReportTd>
                          ) : null}
                          <ReportTd align="center" tone={dayReasonMissing ? "warn" : undefined} variant="reason">
                            {dayDelta < 0 ? (
                              <div className="report-reason-cell-content">
                                <ReportReasonTextarea
                                  value={dayReasonText}
                                  placeholder="Введите причину"
                                  onCommit={(value) => onCommitReportDayReason(rowKey, value)}
                                  onCancel={(value) => onCancelReportDayReasonDraft(rowKey, value)}
                                  onDraftChange={(value) => onUpdateReportDayReasonDraft(rowKey, value)}
                                />
                              </div>
                            ) : null}
                          </ReportTd>
                          <ReportTd align="center">{formatNumber(row.monthTotalPlan)}</ReportTd>
                          <ReportTd align="center">{formatNumber(row.monthPlan)}</ReportTd>
                          <ReportTd align="center">
                            <ReportMetric value={formatNumber(monthFact)} note={`марк ${formatNumber(row.monthSurveyFact)}`} />
                          </ReportTd>
                          <ReportTd align="center" tone={monthDelta < 0 ? "bad" : "good"}>{formatNumber(monthDelta)}</ReportTd>
                          {showMonthProductivity ? (
                            <ReportTd align="center">
                              <ReportMetric value={formatNumber(row.monthProductivity || monthFact)} note={formatPercent(monthFact, row.monthPlan)} />
                            </ReportTd>
                          ) : null}
                          <ReportTd align="center">{formatNumber(row.yearPlan)}</ReportTd>
                          <ReportTd align="center">
                            <ReportMetric value={formatNumber(yearFact)} note={`марк ${formatNumber(row.yearSurveyFact)}`} />
                          </ReportTd>
                          <ReportTd align="center" tone={yearDelta < 0 ? "bad" : "good"}>{formatNumber(yearDelta)}</ReportTd>
                          <ReportTd align="center" tone={yearReasonMissing ? "warn" : undefined} variant="reason">
                            {yearDelta < 0 ? (
                              <div className="report-reason-cell-content">
                                <ReportReasonTextarea
                                  value={yearReasonText}
                                  placeholder="Введите причину"
                                  onCommit={(value) => onCommitReportYearReason(rowKey, value)}
                                  onCancel={(value) => onCancelReportYearReasonDraft(rowKey, value)}
                                  onDraftChange={(value) => onUpdateReportYearReasonDraft(rowKey, value)}
                                />
                              </div>
                            ) : null}
                          </ReportTd>
                          <ReportTd align="center">{formatNumber(row.annualPlan)}</ReportTd>
                          <ReportTd align="center">{formatNumber(annualFact)}</ReportTd>
                          <ReportTd align="center" tone={annualRemaining < 0 ? "bad" : "good"}>{formatNumber(annualRemaining)}</ReportTd>
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
                <tbody>
                  {filteredReportsCount === 0 && (
                    <tr>
                      <ReportTd colSpan={reportColumnKeys.length}>По выбранному заказчику пока нет настроенных строк.</ReportTd>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
