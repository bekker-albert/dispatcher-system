import { useMemo } from "react";

import {
  createPtoBucketColumnsModel,
  createPtoBucketRows,
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

function ptoBucketManualRowsSignature(rows: readonly PtoBucketRow[]) {
  return rows.map((row) => [row.key, row.area, row.structure, row.source ?? ""].join("\u001f")).join("\u001e");
}

function useStableManualRows(rows: PtoBucketRow[], signature: string) {
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
    active ? ptoBucketManualRowsSignature(manualRows) : ""
  ), [active, manualRows]);
  const stableManualRows = useStableManualRows(active ? manualRows : emptyPtoBucketRows, manualRowsSignature);

  const ptoBucketRows = useMemo(() => {
    if (!active) return [];

    return createPtoBucketRows(bucketRowSources, stableManualRows, areaFilter);
  }, [active, areaFilter, bucketRowSources, stableManualRows]);

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
