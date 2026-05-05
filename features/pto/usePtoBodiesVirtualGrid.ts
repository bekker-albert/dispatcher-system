"use client";

import { useMemo } from "react";

import { bodyTechniqueColumnWidth } from "@/features/pto/ptoBodiesConfig";
import {
  createPtoBucketsVirtualColumns,
  createPtoBucketsVirtualRows,
  ptoBucketsRenderedColumnSpan,
  ptoBucketsTableMinWidth,
} from "@/features/pto/ptoBucketsVirtualGridModel";
import type { PtoGridViewport } from "@/features/pto/usePtoGridViewport";
import type { PtoBodyColumn } from "@/lib/domain/pto/bodies";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";

type PtoBodiesVirtualGridOptions = {
  columns: PtoBodyColumn[];
  rows: PtoBucketRow[];
  suspendVirtualization?: boolean;
  viewport: PtoGridViewport;
};

export function usePtoBodiesVirtualGrid({
  columns,
  rows,
  suspendVirtualization = false,
  viewport,
}: PtoBodiesVirtualGridOptions) {
  const { height, scrollLeft, scrollTop, width } = viewport;
  const tableMinWidth = ptoBucketsTableMinWidth(columns.length, bodyTechniqueColumnWidth);
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
        : createPtoBucketsVirtualColumns(columns, { scrollLeft, width }, bodyTechniqueColumnWidth)
    ),
    [columns, scrollLeft, suspendVirtualization, width],
  );
  const renderedColumnSpan = ptoBucketsRenderedColumnSpan(virtualColumns, 1);

  return {
    renderedColumnSpan,
    tableMinWidth,
    virtualColumns,
    virtualRows,
  };
}
