import type { ReportRow } from "./types";

export function reportMonthFact(row: ReportRow) {
  const combined = row.monthSurveyFact + row.monthOperFact;
  return combined || row.monthFact;
}

export function reportYearFact(row: ReportRow) {
  const combined = row.yearSurveyFact + row.yearOperFact;
  return combined || row.yearFact;
}

export function reportAnnualFact(row: ReportRow) {
  return row.annualFact || reportYearFact(row);
}
