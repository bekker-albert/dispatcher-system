import { uniqueSorted, normalizeLookupValue } from "../../utils/text";
import { reportAnnualFact, reportMonthFact, reportYearFact } from "./facts";
import { normalizeReportRow } from "./row-normalization";
import { aggregateReportReasons } from "./reasons";
import { reportRowDisplayKey, reportRowKey } from "./keys";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "./types";

function reportReasonSummary(rows: ReportRow[], field: "dayReason" | "yearReason") {
  return aggregateReportReasons(rows.map((row) => row[field]).filter(Boolean));
}

function createLookupRankMap(values: readonly string[], options: { normalize?: boolean } = {}) {
  const { normalize = true } = options;
  const rankMap = new Map<string, number>();

  values.forEach((value, index) => {
    const key = normalize ? normalizeLookupValue(value) : value;
    if (!rankMap.has(key)) rankMap.set(key, index);
  });

  return rankMap;
}

function createReportRowSums(rows: ReportRow[]) {
  return rows.reduce((sums, row) => {
    sums.dayPlan += row.dayPlan;
    sums.dayFact += row.dayFact;
    sums.dayProductivity += row.dayProductivity || row.dayFact;
    sums.monthTotalPlan += row.monthTotalPlan;
    sums.monthPlan += row.monthPlan;
    sums.monthFact += reportMonthFact(row);
    sums.monthSurveyFact += row.monthSurveyFact;
    sums.monthOperFact += row.monthOperFact;
    sums.monthProductivity += row.monthProductivity || reportMonthFact(row);
    sums.yearPlan += row.yearPlan;
    sums.yearFact += reportYearFact(row);
    sums.yearSurveyFact += row.yearSurveyFact;
    sums.yearOperFact += row.yearOperFact;
    sums.annualPlan += row.annualPlan;
    sums.annualFact += reportAnnualFact(row);
    return sums;
  }, {
    dayPlan: 0,
    dayFact: 0,
    dayProductivity: 0,
    monthTotalPlan: 0,
    monthPlan: 0,
    monthFact: 0,
    monthSurveyFact: 0,
    monthOperFact: 0,
    monthProductivity: 0,
    yearPlan: 0,
    yearFact: 0,
    yearSurveyFact: 0,
    yearOperFact: 0,
    annualPlan: 0,
    annualFact: 0,
  });
}

export function createReportFactSourceRow(row: ReportRow, sourceRows: ReportRow[]): ReportRow {
  if (sourceRows.length === 0) return row;
  const sums = createReportRowSums(sourceRows);

  return normalizeReportRow({
    ...row,
    dayFact: sums.dayFact,
    dayProductivity: sums.dayProductivity,
    dayReason: reportReasonSummary(sourceRows, "dayReason"),
    monthFact: sums.monthFact,
    monthSurveyFact: sums.monthSurveyFact,
    monthOperFact: sums.monthOperFact,
    monthProductivity: sums.monthProductivity,
    yearFact: sums.yearFact,
    yearSurveyFact: sums.yearSurveyFact,
    yearOperFact: sums.yearOperFact,
    yearReason: reportReasonSummary(sourceRows, "yearReason"),
    annualFact: sums.annualFact,
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
  const sums = createReportRowSums(rows);
  const planValue = (field: "dayPlan" | "monthTotalPlan" | "monthPlan" | "yearPlan" | "annualPlan") => (
    planSourceRow ? planSourceRow[field] : sums[field]
  );

  return {
    ...normalizeReportRow({
      area,
      name: config.label.trim() || "Итоговая строка",
      unit,
      dayPlan: planValue("dayPlan"),
      dayFact: sums.dayFact,
      dayProductivity: sums.dayProductivity,
      dayReason: reportReasonSummary(rows, "dayReason"),
      monthTotalPlan: planValue("monthTotalPlan"),
      monthPlan: planValue("monthPlan"),
      monthFact: sums.monthFact,
      monthSurveyFact: sums.monthSurveyFact,
      monthOperFact: sums.monthOperFact,
      monthProductivity: sums.monthProductivity,
      yearPlan: planValue("yearPlan"),
      yearFact: sums.yearFact,
      yearSurveyFact: sums.yearSurveyFact,
      yearOperFact: sums.yearOperFact,
      yearReason: reportReasonSummary(rows, "yearReason"),
      annualPlan: planValue("annualPlan"),
      annualFact: sums.annualFact,
    }),
    displayKey: `summary:${config.id}`,
  };
}

export function sortAreaNamesByOrder(areas: string[], order: string[]) {
  const areaOrderRank = createLookupRankMap(order);

  return [...areas].sort((a, b) => {
    const aRank = areaOrderRank.get(normalizeLookupValue(a)) ?? Number.MAX_SAFE_INTEGER;
    const bRank = areaOrderRank.get(normalizeLookupValue(b)) ?? Number.MAX_SAFE_INTEGER;

    return aRank - bRank || a.localeCompare(b, "ru");
  });
}

export function sortReportRowsByAreaOrder(rows: ReportRow[], order: string[], workOrder: Record<string, string[]> = {}) {
  const sortedAreas = sortAreaNamesByOrder(uniqueSorted(rows.map((row) => row.area)), order);
  const areaRank = new Map(sortedAreas.map((area, index) => [normalizeLookupValue(area), index]));
  const workRankByArea = new Map(
    Object.entries(workOrder).map(([area, rowKeys]) => [normalizeLookupValue(area), createLookupRankMap(rowKeys, { normalize: false })]),
  );

  return [...rows].sort((a, b) => {
    const aAreaKey = normalizeLookupValue(a.area);
    const bAreaKey = normalizeLookupValue(b.area);
    const aRank = areaRank.get(aAreaKey) ?? Number.MAX_SAFE_INTEGER;
    const bRank = areaRank.get(bAreaKey) ?? Number.MAX_SAFE_INTEGER;
    const aWorkRank = workRankByArea.get(aAreaKey)?.get(reportRowDisplayKey(a)) ?? Number.MAX_SAFE_INTEGER;
    const bWorkRank = workRankByArea.get(bAreaKey)?.get(reportRowDisplayKey(b)) ?? Number.MAX_SAFE_INTEGER;

    return aRank - bRank || aWorkRank - bWorkRank || a.name.localeCompare(b.name, "ru");
  });
}

export function reportCustomerUsesSummaryRows(_customer?: Pick<ReportCustomerConfig, "id">) {
  void _customer;
  return true;
}
