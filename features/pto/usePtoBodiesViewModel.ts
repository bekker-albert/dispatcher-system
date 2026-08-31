"use client";

import { useMemo } from "react";

import {
  createPtoBodyAreaTabs,
  createPtoBodyColumns,
  createPtoBodyRows,
  defaultPtoBodyMaterialSources,
  type PtoBodyMaterialSource,
  type PtoBodyColumn,
} from "@/lib/domain/pto/bodies";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type UsePtoBodiesViewModelOptions = {
  active: boolean;
  bodyAreas?: readonly string[];
  bodyMaterialSources?: readonly PtoBodyMaterialSource[];
  areaFilter: string;
  vehicleRows: VehicleRow[];
};

const emptyBodyRows: PtoBucketRow[] = [];
const emptyBodyColumns: PtoBodyColumn[] = [];
const emptyBodyAreaTabs: string[] = [];

export function usePtoBodiesViewModel({
  active,
  bodyAreas = [],
  bodyMaterialSources = defaultPtoBodyMaterialSources,
  areaFilter,
  vehicleRows,
}: UsePtoBodiesViewModelOptions) {
  const ptoBodyRows = useMemo(() => (
    active ? createPtoBodyRows(vehicleRows) : emptyBodyRows
  ), [active, vehicleRows]);

  const ptoBodyColumns = useMemo(() => (
    active ? createPtoBodyColumns(bodyMaterialSources, areaFilter) : emptyBodyColumns
  ), [active, areaFilter, bodyMaterialSources]);

  const ptoBodyAreaTabs = useMemo(() => (
    active ? createPtoBodyAreaTabs(bodyAreas) : emptyBodyAreaTabs
  ), [active, bodyAreas]);

  return {
    ptoBodyRows,
    ptoBodyColumns,
    ptoBodyAreaTabs,
  };
}
