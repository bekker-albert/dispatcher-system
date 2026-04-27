import type { PtoPlanRow, PtoStatus } from "./date-table-types";

export function ptoAutomatedStatus(row: PtoPlanRow, selectedDate: string): PtoStatus {
  const month = selectedDate.slice(0, 7);
  const filledDates = Object.entries(row.dailyPlans)
    .filter(([, value]) => Number.isFinite(value))
    .map(([date]) => date)
    .sort();

  if (filledDates.length === 0) return "\u041d\u043e\u0432\u0430\u044f";
  if (filledDates.some((date) => date.startsWith(month) && date <= selectedDate)) return "\u0412 \u0440\u0430\u0431\u043e\u0442\u0435";
  if (filledDates.some((date) => date > selectedDate)) return "\u0417\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u043e";
  return "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430";
}

export function ptoStatusRowBackground(status: PtoStatus) {
  if (status === "\u041d\u043e\u0432\u0430\u044f") return "#f8fafc";
  if (status === "\u0412 \u0440\u0430\u0431\u043e\u0442\u0435") return "#f0fdf4";
  if (status === "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430") return "#fff1f2";
  return "#eff6ff";
}
