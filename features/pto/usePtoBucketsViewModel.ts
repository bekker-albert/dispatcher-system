import { useMemo } from "react";

import { createPtoBucketColumns, createPtoBucketRows, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { PtoBucketRowLookupSource } from "./ptoDateLookupModel";

type UsePtoBucketsViewModelOptions = {
  active: boolean;
  bucketRowSources: PtoBucketRowLookupSource[];
  manualRows: PtoBucketRow[];
  areaFilter: string;
  vehicleRows: VehicleRow[];
};

export function usePtoBucketsViewModel({
  active,
  bucketRowSources,
  manualRows,
  areaFilter,
  vehicleRows,
}: UsePtoBucketsViewModelOptions) {
  const ptoBucketRows = useMemo(() => {
    if (!active) return [];

    return createPtoBucketRows(bucketRowSources, manualRows, areaFilter);
  }, [active, areaFilter, bucketRowSources, manualRows]);

  const ptoBucketColumns = useMemo(() => {
    if (!active) return [];

    return createPtoBucketColumns(vehicleRows);
  }, [active, vehicleRows]);

  return {
    ptoBucketRows,
    ptoBucketColumns,
  };
}
