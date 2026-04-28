import { useMemo } from "react";

import { createPtoBucketColumns, createPtoBucketRows, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import {
  createPtoBucketRowLookupSourceBundle,
  type PtoBucketRowLookupSource,
} from "./ptoDateLookupModel";

type UsePtoBucketsViewModelOptions = {
  active: boolean;
  allPtoDateRows: PtoPlanRow[];
  manualRows: PtoBucketRow[];
  areaFilter: string;
  vehicleRows: VehicleRow[];
};

function useStablePtoBucketRowSources(bundle: { sources: PtoBucketRowLookupSource[]; signature: string }) {
  // The buckets row list is based on area/structure only, not daily numeric values.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => bundle.sources, [bundle.signature]);
}

export function usePtoBucketsViewModel({
  active,
  allPtoDateRows,
  manualRows,
  areaFilter,
  vehicleRows,
}: UsePtoBucketsViewModelOptions) {
  const bucketRowSources = useStablePtoBucketRowSources(
    useMemo(() => (
      active ? createPtoBucketRowLookupSourceBundle(allPtoDateRows) : { sources: [], signature: "" }
    ), [active, allPtoDateRows]),
  );

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
