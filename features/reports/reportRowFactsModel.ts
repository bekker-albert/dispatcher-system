import { delta } from "../../lib/domain/reports/display";
import { reportAnnualFact, reportMonthFact, reportYearFact } from "../../lib/domain/reports/facts";
import type { ReportRow } from "../../lib/domain/reports/types";

export type ReportRowFacts = {
  annualFact: number;
  annualRemaining: number;
  dayDelta: number;
  dayProductivity: number;
  monthDelta: number;
  monthFact: number;
  monthProductivity: number;
  yearDelta: number;
  yearFact: number;
};

export function createReportRowFacts(row: ReportRow): ReportRowFacts {
  const monthFact = reportMonthFact(row);
  const yearFact = reportYearFact(row);
  const annualFact = reportAnnualFact(row);

  return {
    annualFact,
    annualRemaining: delta(row.annualPlan, annualFact),
    dayDelta: delta(row.dayPlan, row.dayFact),
    dayProductivity: row.dayProductivity || row.dayFact,
    monthDelta: delta(row.monthPlan, monthFact),
    monthFact,
    monthProductivity: row.monthProductivity || monthFact,
    yearDelta: delta(row.yearPlan, yearFact),
    yearFact,
  };
}
