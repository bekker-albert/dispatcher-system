"use client";

import { useMemo } from "react";

import {
  createPtoBucketsVirtualColumns,
  createPtoBucketsVirtualRows,
  ptoBucketsRenderedColumnSpan,
} from "@/features/pto/ptoBucketsVirtualGridModel";
import {
  performanceFrozenColumnCount,
  performanceFrozenWidth,
  ptoPerformanceTableMinWidth,
} from "@/features/pto/ptoPerformanceConfig";
import type { PtoGridViewport } from "@/features/pto/usePtoGridViewport";
import type { PtoPerformanceColumn, PtoPerformanceRow } from "@/lib/domain/pto/performance";

type PtoPerformanceVirtualGridOptions = {
  columns: PtoPerformanceColumn[];
  rows: PtoPerformanceRow[];
  suspendVirtualization?: boolean;
  viewport: PtoGridViewport;
};

export function usePtoPerformanceVirtualGrid({
  columns,
  rows,
  suspendVirtualization = false,
  viewport,
}: PtoPerformanceVirtualGridOptions) {
  const { height, scrollLeft, scrollTop, width } = viewport;
  const tableMinWidth = ptoPerformanceTableMinWidth(columns.length);
  const virtualRows = useMemo(
    () => (
      suspendVirtualization
        ? { rows, topSpacerHeight: 0, bottomSpacerHeight: 0 }
        : createPtoBucketsVirtualRows(rows, { height, scrollTop })
    ),
    [height, rows, scrollTop, suspendVirtualization],
  );
  const virtualColumns = useMemo(
    () => (
      suspendVirtualization
        ? { columns, leftSpacerWidth: 0, rightSpacerWidth: 0 }
        : createPtoBucketsVirtualColumns(columns, { scrollLeft, width }, performanceFrozenWidth)
    ),
    [columns, scrollLeft, suspendVirtualization, width],
  );
  const renderedColumnSpan = ptoBucketsRenderedColumnSpan(virtualColumns, performanceFrozenColumnCount) + 1;

  return {
    renderedColumnSpan,
    tableMinWidth,
    virtualColumns,
    virtualRows,
  };
}
