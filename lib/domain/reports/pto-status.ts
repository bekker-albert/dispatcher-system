import { ptoAutomatedStatus, type PtoPlanRow, type PtoStatus } from "../pto/date-table";
import { ptoRowsForReport, reportPtoIndexKey, type ReportPtoIndex } from "./pto-index";
import type { ReportPtoDateStatus, ReportRow } from "./types";

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

  if (hasCurrentData) return "В работе";
  if (hasFuturePlan) return "Запланировано";
  if (hasPreviousData) return "Завершена";
  return "Пусто";
}
