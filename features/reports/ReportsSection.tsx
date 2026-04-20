"use client";

import { Printer } from "lucide-react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { ReportColumnKey } from "@/lib/domain/reports/columns";
import { reportReasonEntryKey } from "@/lib/domain/reports/reasons";
import type { ReportRow } from "@/lib/domain/reports/types";
import { delta, formatNumber, formatPercent, formatReportTitleDate, formatReportWorkName } from "@/lib/domain/reports/display";
import { reportAnnualFact, reportMonthFact, reportYearFact } from "@/lib/domain/reports/facts";
import { reportRowDisplayKey } from "@/lib/domain/reports/display";
import { IconButton, TopButton } from "@/shared/ui/buttons";
import { SectionCard } from "@/shared/ui/layout";
import { ReportReasonTextarea } from "./ReportReasonTextarea";
import { ReportCompletionGauge, ReportMetric, ReportTd, ReportTh } from "./ReportTableParts";

type ReportCompletionCard = {
  title: string;
  percent: number;
  fact: number;
  plan: number;
  monthPlan: number;
  lag: number;
  overPlanPerDay: number;
  remainingDays: number;
};

type ReportsSectionProps = {
  reportAreaTabs: string[];
  reportArea: string;
  onSelectReportArea: (area: string) => void;
  onPrintReport: () => void;
  activeReportCustomerLabel: string;
  reportDate: string;
  reportCompletionCards: ReportCompletionCard[];
  reportTableMinWidth: number;
  reportTableColumnWidths: number[];
  reportColumnKeys: readonly ReportColumnKey[];
  reportColumnWidthByKey: Map<ReportColumnKey, number>;
  renderReportHeaderText: (key: string, fallback: string) => ReactNode;
  onStartReportColumnResize: (event: MouseEvent<HTMLElement>, key: string, width: number) => void;
  filteredReportAreaGroups: Array<{ area: string; rows: ReportRow[] }>;
  filteredReportsCount: number;
  reportReasons: Record<string, string>;
  onCommitReportDayReason: (rowKey: string, value: string) => void;
  onUpdateReportDayReasonDraft: (rowKey: string, value: string) => void;
  onCommitReportYearReason: (rowKey: string, value: string) => void;
};

export default function ReportsSection({
  reportAreaTabs,
  reportArea,
  onSelectReportArea,
  onPrintReport,
  activeReportCustomerLabel,
  reportDate,
  reportCompletionCards,
  reportTableMinWidth,
  reportTableColumnWidths,
  reportColumnKeys,
  reportColumnWidthByKey,
  renderReportHeaderText,
  onStartReportColumnResize,
  filteredReportAreaGroups,
  filteredReportsCount,
  reportReasons,
  onCommitReportDayReason,
  onUpdateReportDayReasonDraft,
  onCommitReportYearReason,
}: ReportsSectionProps) {
  return (
    <>
      <div style={reportAreaTabsToolbarStyle}>
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
            <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: "100%" }}>
                <div className="report-print-title" style={reportTitleStyle}>Отчёт {activeReportCustomerLabel} по планово-фактическим показателям за {formatReportTitleDate(reportDate)}</div>
              </div>
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
              <table className="report-print-table" style={{ ...reportTableStyle, minWidth: reportTableMinWidth }}>
                <colgroup>
                  {reportColumnKeys.map((key, index) => (
                    <col key={key} style={{ width: reportTableColumnWidths[index] }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <ReportTh rowSpan={2} columnKey="area" width={reportColumnWidthByKey.get("area")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("area", "Участок")}</ReportTh>
                    <ReportTh rowSpan={2} columnKey="work-name" width={reportColumnWidthByKey.get("work-name")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("work-name", "Вид работ")}</ReportTh>
                    <ReportTh rowSpan={2} columnKey="unit" width={reportColumnWidthByKey.get("unit")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("unit", "Ед.")}</ReportTh>
                    <ReportTh colSpan={5}>{renderReportHeaderText("day-group", "Текущая дата")}</ReportTh>
                    <ReportTh colSpan={5}>{renderReportHeaderText("month-group", "С начала месяца")}</ReportTh>
                    <ReportTh colSpan={4}>{renderReportHeaderText("year-group", "С начала года")}</ReportTh>
                    <ReportTh colSpan={3}>{renderReportHeaderText("annual-group", "Годовой план")}</ReportTh>
                  </tr>
                  <tr>
                    <ReportTh columnKey="day-plan" width={reportColumnWidthByKey.get("day-plan")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("day-plan", "План суточный")}</ReportTh>
                    <ReportTh columnKey="day-fact" width={reportColumnWidthByKey.get("day-fact")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("day-fact", "Оперучет")}</ReportTh>
                    <ReportTh columnKey="day-delta" width={reportColumnWidthByKey.get("day-delta")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("day-delta", "Откл.")}</ReportTh>
                    <ReportTh columnKey="day-productivity" width={reportColumnWidthByKey.get("day-productivity")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("day-productivity", "Произв. техники")}</ReportTh>
                    <ReportTh columnKey="day-reason" width={reportColumnWidthByKey.get("day-reason")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("day-reason", "Причина за сутки")}</ReportTh>
                    <ReportTh columnKey="month-total-plan" width={reportColumnWidthByKey.get("month-total-plan")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("month-total-plan", "План на месяц")}</ReportTh>
                    <ReportTh columnKey="month-plan" width={reportColumnWidthByKey.get("month-plan")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("month-plan", "План с начала месяца")}</ReportTh>
                    <ReportTh columnKey="month-fact" width={reportColumnWidthByKey.get("month-fact")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("month-fact", "Маркзамер + оперучет")}</ReportTh>
                    <ReportTh columnKey="month-delta" width={reportColumnWidthByKey.get("month-delta")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("month-delta", "Откл.")}</ReportTh>
                    <ReportTh columnKey="month-productivity" width={reportColumnWidthByKey.get("month-productivity")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("month-productivity", "Произв. накоп.")}</ReportTh>
                    <ReportTh columnKey="year-plan" width={reportColumnWidthByKey.get("year-plan")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("year-plan", "План с начала года")}</ReportTh>
                    <ReportTh columnKey="year-fact" width={reportColumnWidthByKey.get("year-fact")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("year-fact", "Маркзамер + недостающий оперучет")}</ReportTh>
                    <ReportTh columnKey="year-delta" width={reportColumnWidthByKey.get("year-delta")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("year-delta", "Откл.")}</ReportTh>
                    <ReportTh columnKey="year-reason" width={reportColumnWidthByKey.get("year-reason")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("year-reason", "Причины с накоплением")}</ReportTh>
                    <ReportTh columnKey="annual-plan" width={reportColumnWidthByKey.get("annual-plan")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("annual-plan", "Годовой план")}</ReportTh>
                    <ReportTh columnKey="annual-fact" width={reportColumnWidthByKey.get("annual-fact")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("annual-fact", "Факт годового плана")}</ReportTh>
                    <ReportTh columnKey="annual-remaining" width={reportColumnWidthByKey.get("annual-remaining")} onResizeStart={onStartReportColumnResize}>{renderReportHeaderText("annual-remaining", "Остаток")}</ReportTh>
                  </tr>
                </thead>
                {filteredReportAreaGroups.map((group) => (
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
                      const dayReasonText = dayDelta < 0 ? (reportReasons[dayReasonKey] ?? row.dayReason) : "";
                      const yearReasonText = yearDelta < 0 ? row.yearReason : "";
                      const showAreaCell = index === 0;

                      return (
                        <tr key={rowKey} style={showAreaCell ? reportAreaGroupStartRowStyle : undefined}>
                          {showAreaCell ? (
                            <ReportTd rowSpan={group.rows.length} strong align="center" variant="area">{row.area}</ReportTd>
                          ) : null}
                          <ReportTd strong variant="work">
                            {formatReportWorkName(row.name)}
                          </ReportTd>
                          <ReportTd>{row.unit}</ReportTd>
                          <ReportTd align="center">{formatNumber(row.dayPlan)}</ReportTd>
                          <ReportTd align="center">{formatNumber(row.dayFact)}</ReportTd>
                          <ReportTd align="center" tone={dayDelta < 0 ? "bad" : "good"}>{formatNumber(dayDelta)}</ReportTd>
                          <ReportTd align="center">
                            <ReportMetric value={formatNumber(row.dayProductivity || row.dayFact)} note={formatPercent(row.dayFact, row.dayPlan)} />
                          </ReportTd>
                          <ReportTd align="center" tone={dayDelta < 0 ? "warn" : undefined}>
                            {dayDelta < 0 ? (
                              <ReportReasonTextarea
                                value={dayReasonText}
                                placeholder="Введите причину"
                                onCommit={(value) => onCommitReportDayReason(rowKey, value)}
                                onDraftChange={(value) => onUpdateReportDayReasonDraft(rowKey, value)}
                              />
                            ) : null}
                          </ReportTd>
                          <ReportTd align="center">{formatNumber(row.monthTotalPlan)}</ReportTd>
                          <ReportTd align="center">{formatNumber(row.monthPlan)}</ReportTd>
                          <ReportTd align="center">
                            <ReportMetric value={formatNumber(monthFact)} note={`марк ${formatNumber(row.monthSurveyFact)} + опер ${formatNumber(row.monthOperFact)}`} />
                          </ReportTd>
                          <ReportTd align="center" tone={monthDelta < 0 ? "bad" : "good"}>{formatNumber(monthDelta)}</ReportTd>
                          <ReportTd align="center">
                            <ReportMetric value={formatNumber(row.monthProductivity || monthFact)} note={formatPercent(monthFact, row.monthPlan)} />
                          </ReportTd>
                          <ReportTd align="center">{formatNumber(row.yearPlan)}</ReportTd>
                          <ReportTd align="center">
                            <ReportMetric value={formatNumber(yearFact)} note={`марк ${formatNumber(row.yearSurveyFact)} + опер ${formatNumber(row.yearOperFact)}`} />
                          </ReportTd>
                          <ReportTd align="center" tone={yearDelta < 0 ? "bad" : "good"}>{formatNumber(yearDelta)}</ReportTd>
                          <ReportTd align="center" tone={yearDelta < 0 ? "warn" : undefined}>
                            {yearDelta < 0 ? (
                              <ReportReasonTextarea
                                value={yearReasonText}
                                placeholder="Введите причину"
                                onCommit={(value) => onCommitReportYearReason(rowKey, value)}
                              />
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
                      <ReportTd colSpan={20}>По выбранному заказчику пока нет настроенных строк.</ReportTd>
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

const reportTableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1768,
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
  background: "#ffffff",
};

const reportTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  width: "100%",
};

const reportAreaTabsToolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 12,
};

const reportAreaTabsListStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 6,
  minWidth: 0,
};

const reportWorkspaceStyle: CSSProperties = {
  height: "calc(100dvh - 232px)",
  minHeight: 320,
  display: "grid",
  gridTemplateRows: "minmax(0, 1fr)",
};

const reportPanelStyle: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  gap: 8,
};

const reportTableScrollStyle: CSSProperties = {
  overflow: "auto",
  minHeight: 0,
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
};

const reportGaugeGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 10,
  marginBottom: 4,
};

const reportAreaGroupStartRowStyle: CSSProperties = {
  borderTop: "2px solid #334155",
};
