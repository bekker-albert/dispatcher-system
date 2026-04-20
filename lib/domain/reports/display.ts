import { normalizeLookupValue, uniqueSorted } from "../../utils/text";
import { ptoAutomatedStatus, type PtoPlanRow, type PtoStatus } from "../pto/date-table";
import { ptoRowsForReport, normalizeReportRow, reportPtoIndexKey, type ReportPtoIndex } from "./calculation";
import { reportColumnAutoMaxWidths, reportColumnTextCaps, reportReasonColumnKeys, type ReportColumnKey } from "./columns";
import { reportAnnualFact, reportMonthFact, reportYearFact } from "./facts";
import { aggregateReportReasons } from "./reasons";
import type { ReportCustomerConfig, ReportPtoDateStatus, ReportRow, ReportSummaryRowConfig } from "./types";

const reportIntegerFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const reportFullDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
});
const reportWeekdayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "long" });
const reportCalendarDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function reportRowKey(row: Pick<ReportRow, "area" | "name">) {
  return `${normalizeLookupValue(row.area)}::${normalizeLookupValue(row.name)}`;
}

export function reportRowDisplayKey(row: ReportRow) {
  return row.displayKey ?? reportRowKey(row);
}

export function statusColor(value: number) {
  if (value >= 80) return "#dcfce7";
  if (value >= 50) return "#fef3c7";
  return "#fee2e2";
}

export function statusTextColor(value: number) {
  if (value >= 80) return "#166534";
  if (value >= 50) return "#92400e";
  return "#991b1b";
}

export function delta(plan: number, fact: number) {
  return fact - plan;
}

export function formatNumber(value: number) {
  return reportIntegerFormatter.format(value);
}

export function formatPercent(fact: number, plan: number) {
  if (!plan) return fact ? "100%" : "0%";

  return `${Math.round((fact / plan) * 100)}%`;
}

export function formatReportDate(value: string) {
  return reportFullDateFormatter.format(new Date(`${value}T00:00:00`));
}

export function formatReportTitleDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const weekday = reportWeekdayFormatter.format(date);
  const weekdayAccusative: Record<string, string> = {
    понедельник: "понедельник",
    вторник: "вторник",
    среда: "среду",
    четверг: "четверг",
    пятница: "пятницу",
    суббота: "субботу",
    воскресенье: "воскресенье",
  };
  const calendarDate = reportCalendarDateFormatter.format(date);

  return `${weekdayAccusative[weekday] ?? weekday}, ${calendarDate}`;
}

const reportNoBreakAfterWords = new Set(["в", "во", "на", "с", "со", "к", "ко", "по", "из", "от", "до", "за", "под", "над", "для", "при", "у", "о", "об"]);

export function formatReportWorkName(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  return words.reduce((text, word, index) => {
    if (index === 0) return word;

    const previousWord = words[index - 1].replace(/[.,;:!?()[\]{}"]/g, "").toLowerCase();
    const separator = reportNoBreakAfterWords.has(previousWord) ? "\u00a0" : " ";

    return `${text}${separator}${word}`;
  }, "");
}

function reportTextLength(value: string) {
  return value.replace(/\s+/g, " ").trim().length;
}

function reportLongestWordLength(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}%+-]/gu, "").length)
    .reduce((max, length) => Math.max(max, length), 0);
}

function reportAutoWidthFromChars(chars: number) {
  return Math.round(chars * 5.8 + 22);
}

export function reportAutoColumnWidth(key: ReportColumnKey, header: string, values: string[]) {
  const headerChars = Math.max(3, Math.min(reportLongestWordLength(header), 8));
  const valueCap = reportColumnTextCaps[key];
  const valueChars = values.reduce((max, value) => (
    Math.max(max, Math.min(reportTextLength(value), valueCap))
  ), 0);
  const maxChars = Math.max(headerChars, valueChars);
  const maxWidth = reportColumnAutoMaxWidths[key];

  if (reportReasonColumnKeys.has(key)) {
    const reasonWidth = Math.round(Math.max(reportAutoWidthFromChars(headerChars), 150 + valueChars * 3));
    return Math.min(maxWidth, Math.max(110, reasonWidth));
  }

  return Math.min(maxWidth, Math.max(42, reportAutoWidthFromChars(maxChars)));
}

function reportReasonSummary(rows: ReportRow[], field: "dayReason" | "yearReason") {
  return aggregateReportReasons(rows.map((row) => row[field]).filter(Boolean));
}

export function createReportSummaryRow(config: ReportSummaryRowConfig, rows: ReportRow[]): (ReportRow & { displayKey: string }) | null {
  if (rows.length === 0) return null;

  const rowUnits = uniqueSorted(rows.map((row) => row.unit));
  const rowAreas = uniqueSorted(rows.map((row) => row.area));
  const unit = config.unit.trim() || rowUnits[0] || "";
  const area = config.area.trim() || (rowAreas.length === 1 ? rowAreas[0] : "Итого");
  const sum = (selector: (row: ReportRow) => number) => rows.reduce((total, row) => total + selector(row), 0);

  return {
    ...normalizeReportRow({
      area,
      name: config.label.trim() || "Итоговая строка",
      unit,
      dayPlan: sum((row) => row.dayPlan),
      dayFact: sum((row) => row.dayFact),
      dayProductivity: sum((row) => row.dayProductivity || row.dayFact),
      dayReason: reportReasonSummary(rows, "dayReason"),
      monthTotalPlan: sum((row) => row.monthTotalPlan),
      monthPlan: sum((row) => row.monthPlan),
      monthFact: sum(reportMonthFact),
      monthSurveyFact: sum((row) => row.monthSurveyFact),
      monthOperFact: sum((row) => row.monthOperFact),
      monthProductivity: sum((row) => row.monthProductivity || reportMonthFact(row)),
      yearPlan: sum((row) => row.yearPlan),
      yearFact: sum(reportYearFact),
      yearSurveyFact: sum((row) => row.yearSurveyFact),
      yearOperFact: sum((row) => row.yearOperFact),
      yearReason: reportReasonSummary(rows, "yearReason"),
      annualPlan: sum((row) => row.annualPlan),
      annualFact: sum(reportAnnualFact),
    }),
    displayKey: `summary:${config.id}`,
  };
}

export function sortAreaNamesByOrder(areas: string[], order: string[]) {
  const orderedKeys = order.map(normalizeLookupValue);

  return [...areas].sort((a, b) => {
    const aIndex = orderedKeys.indexOf(normalizeLookupValue(a));
    const bIndex = orderedKeys.indexOf(normalizeLookupValue(b));
    const aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
    const bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;

    return aRank - bRank || a.localeCompare(b, "ru");
  });
}

export function sortReportRowsByAreaOrder(rows: ReportRow[], order: string[], workOrder: Record<string, string[]> = {}) {
  const sortedAreas = sortAreaNamesByOrder(uniqueSorted(rows.map((row) => row.area)), order);
  const areaRank = new Map(sortedAreas.map((area, index) => [normalizeLookupValue(area), index]));

  return [...rows].sort((a, b) => {
    const aAreaKey = normalizeLookupValue(a.area);
    const bAreaKey = normalizeLookupValue(b.area);
    const aRank = areaRank.get(aAreaKey) ?? Number.MAX_SAFE_INTEGER;
    const bRank = areaRank.get(bAreaKey) ?? Number.MAX_SAFE_INTEGER;
    const aWorkOrder = workOrder[aAreaKey] ?? [];
    const bWorkOrder = workOrder[bAreaKey] ?? [];
    const aWorkIndex = aWorkOrder.indexOf(reportRowDisplayKey(a));
    const bWorkIndex = bWorkOrder.indexOf(reportRowDisplayKey(b));
    const aWorkRank = aWorkIndex === -1 ? Number.MAX_SAFE_INTEGER : aWorkIndex;
    const bWorkRank = bWorkIndex === -1 ? Number.MAX_SAFE_INTEGER : bWorkIndex;

    return aRank - bRank || aWorkRank - bWorkRank || a.name.localeCompare(b.name, "ru");
  });
}

export function reportCustomerUsesSummaryRows(customer: Pick<ReportCustomerConfig, "id">) {
  return customer.id !== "aa-mining";
}

function ptoRowsHaveValueOnDate(rows: PtoPlanRow[], report: ReportRow, date: string) {
  return ptoRowsForReport(rows, report).some((row) => (
    typeof row.dailyPlans[date] === "number" && Number.isFinite(row.dailyPlans[date])
  ));
}

function ptoRowsStatusForReport(rows: PtoPlanRow[], report: ReportRow, date: string): PtoStatus {
  const statuses = ptoRowsForReport(rows, report).map((row) => ptoAutomatedStatus(row, date));

  if (statuses.includes("В работе")) return "В работе";
  if (statuses.includes("Запланировано")) return "Запланировано";
  if (statuses.includes("Завершена")) return "Завершена";
  return "Новая";
}

export function reportPtoDateStatus(report: ReportRow, date: string, planRows: PtoPlanRow[], surveyRows: PtoPlanRow[], operRows: PtoPlanRow[]): ReportPtoDateStatus {
  return {
    plan: ptoRowsStatusForReport(planRows, report, date),
    oper: ptoRowsStatusForReport(operRows, report, date),
    survey: ptoRowsStatusForReport(surveyRows, report, date),
    planHasDateValue: ptoRowsHaveValueOnDate(planRows, report, date),
    operHasDateValue: ptoRowsHaveValueOnDate(operRows, report, date),
    surveyHasDateValue: ptoRowsHaveValueOnDate(surveyRows, report, date),
  };
}

function ptoIndexRowsForReport(index: ReportPtoIndex, report: ReportRow) {
  return index.get(reportPtoIndexKey(report.area, report.name))?.rows ?? [];
}

function ptoIndexRowsHaveValueOnDate(index: ReportPtoIndex, report: ReportRow, date: string) {
  return index.get(reportPtoIndexKey(report.area, report.name))?.dailyTotals.has(date) ?? false;
}

function ptoIndexRowsStatusForReport(index: ReportPtoIndex, report: ReportRow, date: string): PtoStatus {
  return ptoRowsStatusForReport(ptoIndexRowsForReport(index, report), report, date);
}

export function reportPtoDateStatusFromIndexes(report: ReportRow, date: string, planIndex: ReportPtoIndex, surveyIndex: ReportPtoIndex, operIndex: ReportPtoIndex): ReportPtoDateStatus {
  return {
    plan: ptoIndexRowsStatusForReport(planIndex, report, date),
    oper: ptoIndexRowsStatusForReport(operIndex, report, date),
    survey: ptoIndexRowsStatusForReport(surveyIndex, report, date),
    planHasDateValue: ptoIndexRowsHaveValueOnDate(planIndex, report, date),
    operHasDateValue: ptoIndexRowsHaveValueOnDate(operIndex, report, date),
    surveyHasDateValue: ptoIndexRowsHaveValueOnDate(surveyIndex, report, date),
  };
}

export function reportPtoDateStatusHasAny(status: ReportPtoDateStatus | undefined) {
  return Boolean(status?.planHasDateValue || status?.operHasDateValue || status?.surveyHasDateValue);
}

export function reportCustomerEffectiveRowKeys(customer: ReportCustomerConfig, autoRowKeys: Set<string>) {
  if (customer.autoShowRows) return new Set(autoRowKeys);

  return new Set(customer.rowKeys);
}
