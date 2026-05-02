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

function ptoBucketManualRowsSignature(rows: readonly PtoBucketRow[]) {
  return rows.map((row) => [row.key, row.area, row.structure, row.source ?? ""].join("\u001f")).join("\u001e");
}

function ptoBucketVehicleColumnsSignature(rows: readonly VehicleRow[]) {
  return rows.map((row) => [
    row.id,
    row.visible === false ? "0" : "1",
    row.vehicleType,
    row.brand,
    row.model,
    row.name,
  ].join("\u001f")).join("\u001e");
}

function useStableManualRows(rows: PtoBucketRow[], signature: string) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => rows, [signature]);
}

function useStableVehicleRows(rows: VehicleRow[], signature: string) {
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
  const manualRowsSignature = useMemo(() => ptoBucketManualRowsSignature(manualRows), [manualRows]);
  const vehicleColumnsSignature = useMemo(() => ptoBucketVehicleColumnsSignature(vehicleRows), [vehicleRows]);
  const stableManualRows = useStableManualRows(manualRows, manualRowsSignature);
  const stableVehicleRows = useStableVehicleRows(vehicleRows, vehicleColumnsSignature);

  const ptoBucketRows = useMemo(() => {
    if (!active) return [];

    return createPtoBucketRows(bucketRowSources, stableManualRows, areaFilter);
  }, [active, areaFilter, bucketRowSources, stableManualRows]);

  const ptoBucketColumns = useMemo(() => {
    if (!active) return [];

    return createPtoBucketColumns(stableVehicleRows);
  }, [active, stableVehicleRows]);

  return {
    ptoBucketRows,
    ptoBucketColumns,
  };
}
