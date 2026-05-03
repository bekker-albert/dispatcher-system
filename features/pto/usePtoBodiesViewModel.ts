"use client";

import { useMemo } from "react";

import {
  createPtoBodyColumns,
  createPtoBodyRows,
  type PtoBodyMaterialSource,
  type PtoBodyColumn,
} from "@/lib/domain/pto/bodies";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type UsePtoBodiesViewModelOptions = {
  active: boolean;
  bodyMaterialSources?: PtoBodyMaterialSource[];
  areaFilter: string;
  vehicleRows: VehicleRow[];
};

const emptyBodyRows: PtoBucketRow[] = [];
const emptyBodyColumns: PtoBodyColumn[] = [];
const emptyBodyMaterialSources: PtoBodyMaterialSource[] = [];

export function usePtoBodiesViewModel({
  active,
  bodyMaterialSources = emptyBodyMaterialSources,
  areaFilter,
  vehicleRows,
}: UsePtoBodiesViewModelOptions) {
  const ptoBodyRows = useMemo(() => (
    active ? createPtoBodyRows(vehicleRows) : emptyBodyRows
  ), [active, vehicleRows]);

  const ptoBodyColumns = useMemo(() => (
    active ? createPtoBodyColumns(bodyMaterialSources, areaFilter) : emptyBodyColumns
  ), [active, areaFilter, bodyMaterialSources]);

  return {
    ptoBodyRows,
    ptoBodyColumns,
  };
}
