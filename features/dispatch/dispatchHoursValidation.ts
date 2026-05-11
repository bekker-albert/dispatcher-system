import type {
  DispatchSummaryNumberField,
  DispatchSummaryRow,
} from "@/lib/domain/dispatch/summary";

export const dispatchShiftHourLimit = 11;

export const dispatchHourFields: DispatchSummaryNumberField[] = [
  "rentHours",
  "workHours",
  "downtimeHours",
  "repairHours",
];

export function isDispatchHourField(field: DispatchSummaryNumberField) {
  return dispatchHourFields.includes(field);
}

export function parseDispatchIntegerCell(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (!/^\d+$/.test(trimmed)) return null;

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function dispatchRowHourTotal(row: Pick<DispatchSummaryRow, "rentHours" | "workHours" | "downtimeHours" | "repairHours">) {
  return row.rentHours + row.workHours + row.downtimeHours + row.repairHours;
}

export function dispatchRowExceedsHourLimit(row: Pick<DispatchSummaryRow, "rentHours" | "workHours" | "downtimeHours" | "repairHours">) {
  return dispatchRowHourTotal(row) > dispatchShiftHourLimit;
}

export function dispatchRowHasOperationalValues(row: Pick<DispatchSummaryRow, "rentHours" | "workHours" | "downtimeHours" | "repairHours" | "trips">) {
  return dispatchRowHourTotal(row) > 0 || row.trips > 0;
}
