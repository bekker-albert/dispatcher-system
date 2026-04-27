import type { PtoPlanRow } from "./date-table-types";

export function ptoMonthTotal(row: PtoPlanRow, month: string) {
  const total = Object.entries(row.dailyPlans).reduce((sum, [date, value]) => (
    date.startsWith(month) ? sum + value : sum
  ), 0);

  return Math.round(total * 1000000) / 1000000;
}

export function ptoYearTotal(row: PtoPlanRow, year: string) {
  const total = Object.entries(row.dailyPlans).reduce((sum, [date, value]) => (
    date.startsWith(year) ? sum + value : sum
  ), 0);

  return Math.round(total * 1000000) / 1000000;
}
