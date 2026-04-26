import { useMemo } from "react";

import { createPtoBucketColumns, createPtoBucketRows, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type UsePtoBucketsViewModelOptions = {
  active: boolean;
  allPtoDateRows: PtoPlanRow[];
  manualRows: PtoBucketRow[];
  areaFilter: string;
  vehicleRows: VehicleRow[];
};

export function usePtoBucketsViewModel({
  active,
  allPtoDateRows,
  manualRows,
  areaFilter,
  vehicleRows,
}: UsePtoBucketsViewModelOptions) {
  const ptoBucketRows = useMemo(() => {
    if (!active) return [];

    return createPtoBucketRows(allPtoDateRows, manualRows, areaFilter);
  }, [active, allPtoDateRows, areaFilter, manualRows]);

  const ptoBucketColumns = useMemo(() => {
    if (!active) return [];

    return createPtoBucketColumns(vehicleRows);
  }, [active, vehicleRows]);

  return {
    ptoBucketRows,
    ptoBucketColumns,
  };
}
