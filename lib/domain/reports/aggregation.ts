import { uniqueSorted, normalizeLookupValue } from "../../utils/text";
import { reportAnnualFact, reportMonthFact, reportYearFact } from "./facts";
import { normalizeReportRow } from "./row-normalization";
import { aggregateReportReasons } from "./reasons";
import { reportRowDisplayKey, reportRowKey } from "./keys";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "./types";

function reportReasonSummary(rows: ReportRow[], field: "dayReason" | "yearReason") {
  return aggregateReportReasons(rows.map((row) => row[field]).filter(Boolean));
}

export function createReportFactSourceRow(row: ReportRow, sourceRows: ReportRow[]): ReportRow {
  if (sourceRows.length === 0) return row;

  const sum = (selector: (sourceRow: ReportRow) => number) => sourceRows.reduce((total, sourceRow) => total + selector(sourceRow), 0);

  return normalizeReportRow({
    ...row,
    dayFact: sum((sourceRow) => sourceRow.dayFact),
    dayProductivity: sum((sourceRow) => sourceRow.dayProductivity || sourceRow.dayFact),
    dayReason: reportReasonSummary(sourceRows, "dayReason"),
    monthFact: sum(reportMonthFact),
    monthSurveyFact: sum((sourceRow) => sourceRow.monthSurveyFact),
    monthOperFact: sum((sourceRow) => sourceRow.monthOperFact),
    monthProductivity: sum((sourceRow) => sourceRow.monthProductivity || reportMonthFact(sourceRow)),
    yearFact: sum(reportYearFact),
    yearSurveyFact: sum((sourceRow) => sourceRow.yearSurveyFact),
    yearOperFact: sum((sourceRow) => sourceRow.yearOperFact),
    yearReason: reportReasonSummary(sourceRows, "yearReason"),
    annualFact: sum(reportAnnualFact),
  });
}

export function applyReportFactSourceRows(rows: ReportRow[], factSourceRowKeys: Record<string, string[]>) {
  const rowsByKey = new Map(rows.map((row) => [reportRowKey(row), row]));

  return rows.map((row) => {
    const rowKey = reportRowKey(row);
    const sourceRows = (factSourceRowKeys[rowKey] ?? [])
      .map((sourceRowKey) => rowsByKey.get(sourceRowKey))
      .filter((sourceRow): sourceRow is ReportRow => Boolean(sourceRow));

    return createReportFactSourceRow(row, sourceRows);
  });
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
