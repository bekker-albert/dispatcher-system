import type { Dispatch, SetStateAction } from "react";
import type { DispatchSummaryRow } from "@/lib/domain/dispatch/summary";

export type InitialDispatchSummaryStateSetters = {
  setDispatchSummaryRows: Dispatch<SetStateAction<DispatchSummaryRow[]>>;
};

export function applyInitialDispatchSummaryRows(
  rows: DispatchSummaryRow[] | null,
  setters: InitialDispatchSummaryStateSetters,
) {
  if (rows) {
    setters.setDispatchSummaryRows(rows);
  }
}
