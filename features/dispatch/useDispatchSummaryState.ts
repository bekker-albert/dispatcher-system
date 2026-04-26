"use client";

import { useState } from "react";
import { createDefaultDispatchSummaryRows, type DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import { defaultReportDate } from "@/lib/domain/pto/defaults";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

export function useDispatchSummaryState(defaultVehicles: VehicleRow[]) {
  const [dispatchSummaryRows, setDispatchSummaryRows] = useState<DispatchSummaryRow[]>(
    () => createDefaultDispatchSummaryRows(defaultVehicles, defaultReportDate),
  );
  const [dispatchVehicleToAddId, setDispatchVehicleToAddId] = useState("");

  return {
    dispatchSummaryRows,
    setDispatchSummaryRows,
    dispatchVehicleToAddId,
    setDispatchVehicleToAddId,
  };
}
