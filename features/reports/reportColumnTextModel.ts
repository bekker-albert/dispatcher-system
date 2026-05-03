import type { ReportColumnKey } from "../../lib/domain/reports/columns";
import { formatNumber, formatPercent } from "../../lib/domain/reports/display";
import { reportReason } from "../../lib/domain/reports/reasons";
import type { ReportRow } from "../../lib/domain/reports/types";
import { createReportRowFacts, type ReportRowFacts } from "./reportRowFactsModel";

export type ReportColumnTextModel = {
  valuesByKey: Partial<Record<ReportColumnKey, string[]>>;
};

export function createEmptyReportColumnValueLists(columnKeys: readonly ReportColumnKey[]) {
  const valuesByKey: Partial<Record<ReportColumnKey, string[]>> = {};
  columnKeys.forEach((key) => {
    valuesByKey[key] = [];
  });
  return valuesByKey;
}

function reportColumnTextValue(row: ReportRow, key: ReportColumnKey, facts: ReportRowFacts) {
  switch (key) {
    case "area":
      return row.area;
    case "work-name":
      return row.name;
    case "unit":
      return row.unit;
    case "day-plan":
      return formatNumber(row.dayPlan);
    case "day-fact":
      return formatNumber(row.dayFact);
    case "day-delta":
      return formatNumber(facts.dayDelta);
    case "day-productivity":
      return `${formatNumber(facts.dayProductivity)}\n${formatPercent(row.dayFact, row.dayPlan)}`;
    case "day-reason":
      return reportReason(row.dayFact, row.dayPlan, row.dayReason);
    case "month-total-plan":
      return formatNumber(row.monthTotalPlan);
    case "month-plan":
      return formatNumber(row.monthPlan);
    case "month-fact":
      return `${formatNumber(facts.monthFact)}\nмарк ${formatNumber(row.monthSurveyFact)}`;
    case "month-delta":
      return formatNumber(facts.monthDelta);
    case "month-productivity":
      return `${formatNumber(facts.monthProductivity)}\n${formatPercent(facts.monthFact, row.monthPlan)}`;
    case "year-plan":
      return formatNumber(row.yearPlan);
    case "year-fact":
      return `${formatNumber(facts.yearFact)}\nмарк ${formatNumber(row.yearSurveyFact)}`;
    case "year-delta":
      return formatNumber(facts.yearDelta);
    case "year-reason":
      return facts.yearDelta < 0 ? row.yearReason : "";
    case "annual-plan":
      return formatNumber(row.annualPlan);
    case "annual-fact":
      return formatNumber(facts.annualFact);
    case "annual-remaining":
      return formatNumber(facts.annualRemaining);
  }
}

export function createReportColumnTextModel(
  rows: readonly ReportRow[],
  columnKeys: readonly ReportColumnKey[],
  enabled: boolean,
): ReportColumnTextModel {
  const valuesByKey = createEmptyReportColumnValueLists(columnKeys);
  if (!enabled) return { valuesByKey };

  rows.forEach((row) => {
    const facts = createReportRowFacts(row);

    columnKeys.forEach((key) => {
      valuesByKey[key]?.push(reportColumnTextValue(row, key, facts));
    });
  });

  return { valuesByKey };
}
