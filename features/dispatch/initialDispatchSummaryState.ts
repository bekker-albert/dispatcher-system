import { createDefaultDispatchSummaryRows, normalizeDispatchSummaryRows, type DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type InitialDispatchSummaryStateOptions = {
  savedDispatchSummaryRows: unknown;
  preferredReportDate: string;
  seedVehicleRows: VehicleRow[] | null;
};

export function buildInitialDispatchSummaryRows({
  savedDispatchSummaryRows,
  preferredReportDate,
  seedVehicleRows,
}: InitialDispatchSummaryStateOptions): DispatchSummaryRow[] | null {
  const parsedDispatchSummaryRows = normalizeDispatchSummaryRows(savedDispatchSummaryRows, preferredReportDate);

  if (parsedDispatchSummaryRows) {
    const hasEditableDispatchRows = parsedDispatchSummaryRows.some((row) => row.shift === "night" || row.shift === "day");
    return hasEditableDispatchRows
      ? parsedDispatchSummaryRows
      : parsedDispatchSummaryRows.map((row) => (row.shift === "daily" ? { ...row, shift: "night" } : row));
  }

  return seedVehicleRows ? createDefaultDispatchSummaryRows(seedVehicleRows, preferredReportDate) : null;
}
