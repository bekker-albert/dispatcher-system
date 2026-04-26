import { reportMonthFact } from "./facts";
import type { ReportRow } from "./types";

export type ReportCompletionCard = {
  title: string;
  percent: number;
  fact: number;
  plan: number;
  monthPlan: number;
  lag: number;
  overPlanPerDay: number;
  remainingDays: number;
};

type CreateReportCompletionCardsOptions = {
  rows: ReportRow[];
  needsDerivedReportRows: boolean;
  reportArea: string;
  reportDate: string;
  allAreasLabel?: string;
};

export function createReportCompletionCards({
  rows,
  needsDerivedReportRows,
  reportArea,
  reportDate,
  allAreasLabel = "Все участки",
}: CreateReportCompletionCardsOptions): ReportCompletionCard[] {
  if (!needsDerivedReportRows) return [];
  if (reportArea === allAreasLabel) return [];

  const monthLastDay = new Date(Number(reportDate.slice(0, 4)), Number(reportDate.slice(5, 7)), 0).getDate();
  const plan = rows.reduce((sum, row) => sum + row.monthPlan, 0);
  const monthPlan = rows.reduce((sum, row) => sum + row.monthTotalPlan, 0);
  const fact = rows.reduce((sum, row) => sum + reportMonthFact(row), 0);
  const percent = plan ? Math.round((fact / plan) * 100) : fact ? 100 : 0;
  const lag = Math.max(plan - fact, 0);
  const remainingDays = Math.max(monthLastDay - Number(reportDate.slice(8, 10)), 0);
  const overPlanPerDay = remainingDays ? Math.ceil(lag / remainingDays) : lag;

  return [{
    fact,
    lag,
    monthPlan,
    overPlanPerDay,
    percent,
    plan,
    remainingDays,
    title: reportArea,
  }];
}
