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
  viewport: PtoGridViewport;
};

export function usePtoBodiesVirtualGrid({
  columns,
  rows,
  viewport,
}: PtoBodiesVirtualGridOptions) {
  const { height, scrollLeft, scrollTop, width } = viewport;
  const tableMinWidth = ptoBucketsTableMinWidth(columns.length, bodyTechniqueColumnWidth);
  const virtualRows = useMemo(
    () => createPtoBucketsVirtualRows(rows, { height, scrollTop }),
    [height, rows, scrollTop],
  );
  const virtualColumns = useMemo(
    () => createPtoBucketsVirtualColumns(columns, { scrollLeft, width }, bodyTechniqueColumnWidth),
    [columns, scrollLeft, width],
  );
  const renderedColumnSpan = ptoBucketsRenderedColumnSpan(virtualColumns, 1);

  return {
    renderedColumnSpan,
    tableMinWidth,
    virtualColumns,
    virtualRows,
  };
}
