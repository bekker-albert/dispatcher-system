import { useMemo } from "react";

import {
  createPtoBucketColumnsModel,
  createPtoBucketRowsModel,
  ptoBucketRowsSignature,
  type PtoBucketColumn,
  type PtoBucketRow,
} from "@/lib/domain/pto/buckets";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { PtoBucketRowLookupSource } from "./ptoDateLookupModel";

type UsePtoBucketsViewModelOptions = {
  active: boolean;
  bucketRowSources: PtoBucketRowLookupSource[];
  manualRows: PtoBucketRow[];
  areaFilter: string;
  vehicleRows: VehicleRow[];
};

const emptyPtoBucketRows: PtoBucketRow[] = [];
const emptyPtoBucketColumns: PtoBucketColumn[] = [];
const inactivePtoBucketColumnsModel = {
  columns: emptyPtoBucketColumns,
  signature: "",
};

function useStableBucketRows(rows: PtoBucketRow[], signature: string) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => rows, [signature]);
}

function useStableBucketColumns(rows: PtoBucketColumn[], signature: string) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => rows, [signature]);
}

export function usePtoBucketsViewModel({
  active,
  bucketRowSources,
  manualRows,
  areaFilter,
  vehicleRows,
}: UsePtoBucketsViewModelOptions) {
  const manualRowsSignature = useMemo(() => (
    active ? ptoBucketRowsSignature(manualRows) : ""
  ), [active, manualRows]);
  const stableManualRows = useStableBucketRows(active ? manualRows : emptyPtoBucketRows, manualRowsSignature);

  const ptoBucketRowsModel = useMemo(() => (
    active ? createPtoBucketRowsModel(bucketRowSources, stableManualRows, areaFilter) : { rows: emptyPtoBucketRows, signature: "" }
  ), [active, areaFilter, bucketRowSources, stableManualRows]);

  const ptoBucketRows = useStableBucketRows(ptoBucketRowsModel.rows, ptoBucketRowsModel.signature);

  const ptoBucketColumnsModel = useMemo(() => (
    active ? createPtoBucketColumnsModel(vehicleRows) : inactivePtoBucketColumnsModel
  ), [active, vehicleRows]);
  const ptoBucketColumns = useStableBucketColumns(
    ptoBucketColumnsModel.columns,
    ptoBucketColumnsModel.signature,
  );

  return {
    ptoBucketRows,
    ptoBucketColumns,
  };
}
