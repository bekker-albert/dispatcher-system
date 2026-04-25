import { normalizeLookupValue, uniqueSorted } from "../../utils/text";
import { normalizePtoCustomerCode, ptoAutomatedStatus, type PtoPlanRow, type PtoStatus } from "../pto/date-table";
import { ptoRowsForReport, normalizeReportRow, reportPtoIndexKey, type ReportPtoIndex } from "./calculation";
import { reportColumnAutoMaxWidths, reportColumnAutoMinWidths, reportColumnTextCaps, reportCompactColumnKeys, reportNumericColumnKeys, reportNumericColumnSizing, reportReasonColumnKeys, type ReportColumnKey, type ReportNumericColumnSizing } from "./columns";
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

export function reportRowKey(row: Pick<ReportRow, "area" | "name"> & Partial<Pick<ReportRow, "customerCode">>) {
  const baseKey = `${normalizeLookupValue(row.area)}::${normalizeLookupValue(row.name)}`;
  const customerCode = normalizePtoCustomerCode(row.customerCode);

  return customerCode ? `${baseKey}::${normalizeLookupValue(customerCode)}` : baseKey;
}

export function reportRowCustomerCode(row: Partial<Pick<ReportRow, "customerCode">>) {
  return normalizePtoCustomerCode(row.customerCode) || "AAM";
}

export function reportRowBasePtoKey(row: Pick<ReportRow, "area" | "name">) {
  return `${normalizeLookupValue(row.area)}::${normalizeLookupValue(row.name)}`;
}

export function reportRowMatchesCustomer(row: ReportRow, customer: ReportCustomerConfig) {
  const rowCode = reportRowCustomerCode(row);
  const customerCode = normalizePtoCustomerCode(customer.ptoCode) || "AAM";

  if (customerCode === "AAM") return rowCode === "AAM";

  return rowCode === customerCode || rowCode === "AAM";
}

export function reportRowsForCustomer(rows: ReportRow[], customer: ReportCustomerConfig) {
  const customerCode = normalizePtoCustomerCode(customer.ptoCode) || "AAM";
  const matchingRows = rows.filter((row) => reportRowMatchesCustomer(row, customer));

  if (customerCode === "AAM") return matchingRows;

  const assignedRowKeys = new Set(
    rows
      .filter((row) => reportRowCustomerCode(row) === customerCode)
      .map(reportRowBasePtoKey),
  );

  return matchingRows.filter((row) => {
    if (reportRowCustomerCode(row) !== "AAM") return true;

    return !assignedRowKeys.has(reportRowBasePtoKey(row));
  });
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

function reportCompactAutoWidthFromChars(chars: number) {
  return Math.round(chars * 5.2 + 16);
}

function reportCompactValueLength(value: string) {
  const compactedNumbers = value.replace(/(\d)[\s\u00a0]+(?=\d)/g, "$1");
  return Math.max(
    reportLongestWordLength(compactedNumbers),
    Math.min(reportTextLength(compactedNumbers), 4),
  );
}

function reportNumericLineWidth(value: string, sizing: ReportNumericColumnSizing) {
  return [...value].reduce((width, char) => {
    if (/\d/.test(char)) return width + sizing.digitPx;
    if (char === " " || char === "\u00a0" || char === "\u202f") return width + sizing.groupSpacePx;
    if (char === "-" || char === "+") return width + sizing.signPx;
    if (char === "%") return width + sizing.percentPx;
    if (char === "." || char === "," || char === ":") return width + sizing.groupSpacePx;
    return width + sizing.labelPx;
  }, sizing.paddingPx);
}

function reportNumericValueWidth(value: string, sizing: ReportNumericColumnSizing) {
  const lines = value
    .replace(/\u00a0/g, " ")
    .replace(/\u202f/g, " ")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return sizing.paddingPx;
  return Math.ceil(lines.reduce((max, line) => Math.max(max, reportNumericLineWidth(line, sizing)), 0));
}

function reportNumericHeaderWidth(header: string, sizing: ReportNumericColumnSizing) {
  const headerChars = Math.max(2, Math.min(reportLongestWordLength(header), sizing.headerChars));
  return Math.ceil(headerChars * sizing.digitPx + sizing.paddingPx);
}

export function reportAutoColumnWidth(key: ReportColumnKey, header: string, values: string[]) {
  const minWidth = reportColumnAutoMinWidths[key] ?? 42;
  const maxWidth = reportColumnAutoMaxWidths[key];

  if (reportNumericColumnKeys.has(key)) {
    const sizing = reportNumericColumnSizing[key];
    if (!sizing) return minWidth;

    const valueWidth = values.reduce((max, value) => Math.max(max, reportNumericValueWidth(value, sizing)), 0);
    return Math.min(maxWidth, Math.max(minWidth, reportNumericHeaderWidth(header, sizing), valueWidth));
  }

  if (reportCompactColumnKeys.has(key)) {
    const headerChars = Math.max(2, Math.min(reportLongestWordLength(header), key === "area" ? 8 : key === "unit" ? 3 : 5));
    const valueChars = values.reduce((max, value) => (
      Math.max(max, Math.min(reportCompactValueLength(value), key === "area" ? 14 : 8))
    ), 0);
    return Math.min(maxWidth, Math.max(minWidth, reportCompactAutoWidthFromChars(Math.max(headerChars, valueChars))));
  }

  const headerChars = Math.max(3, Math.min(reportLongestWordLength(header), 8));
  const valueCap = reportColumnTextCaps[key];
  const valueChars = values.reduce((max, value) => (
    Math.max(max, Math.min(reportTextLength(value), valueCap))
  ), 0);
  const maxChars = Math.max(headerChars, valueChars);

  if (reportReasonColumnKeys.has(key)) {
    const reasonWidth = Math.round(Math.max(reportAutoWidthFromChars(headerChars), 150 + valueChars * 3));
    return Math.min(maxWidth, Math.max(minWidth, reasonWidth));
  }

  return Math.min(maxWidth, Math.max(minWidth, reportAutoWidthFromChars(maxChars)));
}

function reportReasonSummary(rows: ReportRow[], field: "dayReason" | "yearReason") {
  return aggregateReportReasons(rows.map((row) => row[field]).filter(Boolean));
}

export function createReportSummaryRow(config: ReportSummaryRowConfig, rows: ReportRow[], planSourceRow?: ReportRow): (ReportRow & { displayKey: string }) | null {
  if (rows.length === 0) return null;

  const rowUnits = uniqueSorted(rows.map((row) => row.unit));
  const rowAreas = uniqueSorted(rows.map((row) => row.area));
  const unit = config.unit.trim() || planSourceRow?.unit || rowUnits[0] || "";
  const area = config.area.trim() || (rowAreas.length === 1 ? rowAreas[0] : "Итого");
  const sum = (selector: (row: ReportRow) => number) => rows.reduce((total, row) => total + selector(row), 0);
  const planValue = (field: "dayPlan" | "monthTotalPlan" | "monthPlan" | "yearPlan" | "annualPlan") => (
    planSourceRow ? planSourceRow[field] : sum((row) => row[field])
  );

  return {
    ...normalizeReportRow({
      area,
      name: config.label.trim() || "Итоговая строка",
      unit,
      dayPlan: planValue("dayPlan"),
      dayFact: sum((row) => row.dayFact),
      dayProductivity: sum((row) => row.dayProductivity || row.dayFact),
      dayReason: reportReasonSummary(rows, "dayReason"),
      monthTotalPlan: planValue("monthTotalPlan"),
      monthPlan: planValue("monthPlan"),
      monthFact: sum(reportMonthFact),
      monthSurveyFact: sum((row) => row.monthSurveyFact),
      monthOperFact: sum((row) => row.monthOperFact),
      monthProductivity: sum((row) => row.monthProductivity || reportMonthFact(row)),
      yearPlan: planValue("yearPlan"),
      yearFact: sum(reportYearFact),
      yearSurveyFact: sum((row) => row.yearSurveyFact),
      yearOperFact: sum((row) => row.yearOperFact),
      yearReason: reportReasonSummary(rows, "yearReason"),
      annualPlan: planValue("annualPlan"),
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

export function reportCustomerUsesSummaryRows(_customer?: Pick<ReportCustomerConfig, "id">) {
  void _customer;
  return true;
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

function ptoIndexRowsForReport(index: ReportPtoIndex, report: ReportRow, includeCustomerCode = true) {
  return index.get(reportPtoIndexKey(report.area, report.name, includeCustomerCode ? report.customerCode : ""))?.rows ?? [];
}

function ptoIndexRowsHaveValueOnDate(index: ReportPtoIndex, report: ReportRow, date: string, includeCustomerCode = true) {
  return index.get(reportPtoIndexKey(report.area, report.name, includeCustomerCode ? report.customerCode : ""))?.dailyTotals.has(date) ?? false;
}

function ptoIndexRowsStatusForReport(index: ReportPtoIndex, report: ReportRow, date: string, includeCustomerCode = true): PtoStatus {
  return ptoRowsStatusForReport(ptoIndexRowsForReport(index, report, includeCustomerCode), report, date);
}

export function reportPtoDateStatusFromIndexes(report: ReportRow, date: string, planIndex: ReportPtoIndex, surveyIndex: ReportPtoIndex, operIndex: ReportPtoIndex): ReportPtoDateStatus {
  return {
    plan: ptoIndexRowsStatusForReport(planIndex, report, date),
    oper: ptoIndexRowsStatusForReport(operIndex, report, date, false),
    survey: ptoIndexRowsStatusForReport(surveyIndex, report, date, false),
    planHasDateValue: ptoIndexRowsHaveValueOnDate(planIndex, report, date),
    operHasDateValue: ptoIndexRowsHaveValueOnDate(operIndex, report, date, false),
    surveyHasDateValue: ptoIndexRowsHaveValueOnDate(surveyIndex, report, date, false),
  };
}

export function reportPtoDateStatusHasAny(status: ReportPtoDateStatus | undefined) {
  return Boolean(status?.planHasDateValue || status?.operHasDateValue || status?.surveyHasDateValue);
}

function reportNumericValueExists(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value !== 0;
}

type ReportAutoStatusSource = Pick<ReportRow, "dayPlan" | "dayFact" | "monthTotalPlan" | "monthPlan" | "monthFact">
  & Partial<Pick<ReportRow, "yearPlan" | "yearFact" | "annualPlan">>;

export function reportRowHasAutoShowData(row: ReportAutoStatusSource) {
  return reportNumericValueExists(row.dayPlan)
    || reportNumericValueExists(row.dayFact)
    || reportNumericValueExists(row.monthPlan)
    || reportNumericValueExists(row.monthFact);
}

export function reportRowAutoStatus(row: ReportAutoStatusSource): PtoStatus {
  const hasCurrentData = reportNumericValueExists(row.dayPlan)
    || reportNumericValueExists(row.dayFact)
    || reportNumericValueExists(row.monthPlan)
    || reportNumericValueExists(row.monthFact);
  const hasFuturePlan = reportNumericValueExists(row.monthTotalPlan - row.monthPlan)
    || reportNumericValueExists((row.annualPlan ?? 0) - (row.yearPlan ?? 0));
  const hasPreviousData = reportNumericValueExists(row.yearPlan)
    || reportNumericValueExists(row.yearFact);

  if (hasCurrentData) return "\u0412 \u0440\u0430\u0431\u043e\u0442\u0435";
  if (hasFuturePlan) return "\u0417\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u043e";
  if (hasPreviousData) return "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430";
  return "\u041f\u0443\u0441\u0442\u043e";
}

export function reportCustomerEffectiveRowKeys(customer: ReportCustomerConfig, autoRowKeys: Set<string>) {
  if (customer.autoShowRows) {
    const hiddenRowKeys = new Set(customer.hiddenRowKeys);
    return new Set(Array.from(autoRowKeys).filter((key) => !hiddenRowKeys.has(key)));
  }

  return new Set(customer.rowKeys);
}
