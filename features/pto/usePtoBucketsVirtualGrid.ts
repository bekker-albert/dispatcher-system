"use client";

import { useMemo } from "react";
import {
  createPtoBucketsVirtualColumns,
  createPtoBucketsVirtualRows,
  ptoBucketsRenderedColumnSpan,
  ptoBucketsTableMinWidth,
} from "@/features/pto/ptoBucketsVirtualGridModel";
import type { PtoGridViewport } from "@/features/pto/usePtoGridViewport";
import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";

type PtoBucketsVirtualGridOptions = {
  rows: PtoBucketRow[];
  columns: PtoBucketColumn[];
  viewport: PtoGridViewport;
};

export function usePtoBucketsVirtualGrid({ rows, columns, viewport }: PtoBucketsVirtualGridOptions) {
  const { height, scrollLeft, scrollTop, width } = viewport;
  const tableMinWidth = ptoBucketsTableMinWidth(columns.length);
  const virtualRows = useMemo(
    () => createPtoBucketsVirtualRows(rows, { height, scrollTop }),
    [height, rows, scrollTop],
  );
  const virtualColumns = useMemo(
    () => createPtoBucketsVirtualColumns(columns, { scrollLeft, width }),
    [columns, scrollLeft, width],
  );
  const renderedColumnSpan = ptoBucketsRenderedColumnSpan(virtualColumns);

  return {
    tableMinWidth,
    virtualRows,
    virtualColumns,
    renderedColumnSpan,
  };
}
