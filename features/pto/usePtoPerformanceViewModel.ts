"use client";

import { useMemo } from "react";

import {
  createPtoPerformanceRows,
  ptoPerformanceEditableColumns,
  type PtoPerformanceColumn,
  type PtoPerformanceRow,
} from "@/lib/domain/pto/performance";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type UsePtoPerformanceViewModelOptions = {
  active: boolean;
  areaFilter: string;
  sourceRows: PtoPlanRow[];
};

const emptyPerformanceRows: PtoPerformanceRow[] = [];
const emptyPerformanceColumns: PtoPerformanceColumn[] = [];

export function usePtoPerformanceViewModel({
  active,
  areaFilter,
  sourceRows,
}: UsePtoPerformanceViewModelOptions) {
  const ptoPerformanceRows = useMemo(() => (
    active ? createPtoPerformanceRows(sourceRows, areaFilter) : emptyPerformanceRows
  ), [active, areaFilter, sourceRows]);

  const ptoPerformanceColumns = active ? ptoPerformanceEditableColumns : emptyPerformanceColumns;

  return {
    ptoPerformanceRows,
    ptoPerformanceColumns,
  };
}
