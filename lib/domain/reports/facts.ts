import type { ReportRow } from "./types";

export function reportMonthFact(row: ReportRow) {
  return row.monthFact;
}

export function reportYearFact(row: ReportRow) {
  return row.yearFact;
}

export function reportAnnualFact(row: ReportRow) {
  return row.annualFact;
}
