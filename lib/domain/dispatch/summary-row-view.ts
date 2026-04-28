import { dispatchProductivity, dispatchTotalHours } from "./summary-calculation";
import type { DispatchSummaryRow, DispatchSummaryRowView } from "./summary-types";

export function buildDispatchSummaryRowView(row: DispatchSummaryRow): DispatchSummaryRowView {
  const totalHours = dispatchTotalHours(row);
  const delta = row.factVolume - row.planVolume;

  return {
    totalHours,
    productivity: dispatchProductivity(row),
    delta,
    hoursOk: totalHours === 11,
    isBehindPlan: delta < 0,
  };
}
