"use client";

import { useMemo } from "react";
import {
  bucketFrozenWidth,
  bucketOverscanColumns,
  bucketOverscanRows,
  bucketRowHeight,
  bucketValueColumnWidth,
} from "@/features/pto/ptoBucketsConfig";
import type { PtoGridViewport } from "@/features/pto/usePtoGridViewport";
import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";

type PtoBucketsVirtualGridOptions = {
  rows: PtoBucketRow[];
  columns: PtoBucketColumn[];
  viewport: PtoGridViewport;
};

export function usePtoBucketsVirtualGrid({ rows, columns, viewport }: PtoBucketsVirtualGridOptions) {
  const tableMinWidth = bucketFrozenWidth + Math.max(1, columns.length) * bucketValueColumnWidth;

  const virtualRows = useMemo(() => {
    const start = Math.max(0, Math.floor(viewport.scrollTop / bucketRowHeight) - bucketOverscanRows);
    const visibleCount = Math.ceil(viewport.height / bucketRowHeight) + bucketOverscanRows * 2;
    const end = Math.min(rows.length, start + visibleCount);

    return {
      rows: rows.slice(start, end),
      topSpacerHeight: start * bucketRowHeight,
      bottomSpacerHeight: Math.max(0, rows.length - end) * bucketRowHeight,
    };
  }, [rows, viewport.height, viewport.scrollTop]);

  const virtualColumns = useMemo(() => {
    if (columns.length === 0) {
      return {
        columns: [] as PtoBucketColumn[],
        leftSpacerWidth: 0,
        rightSpacerWidth: 0,
      };
    }

    const valueViewportLeft = Math.max(0, viewport.scrollLeft - bucketFrozenWidth);
    const valueViewportRight = Math.max(0, viewport.scrollLeft + viewport.width - bucketFrozenWidth);
    const start = Math.max(0, Math.floor(valueViewportLeft / bucketValueColumnWidth) - bucketOverscanColumns);
    const end = Math.min(
      columns.length,
      Math.max(start + 1, Math.ceil(valueViewportRight / bucketValueColumnWidth) + bucketOverscanColumns),
    );

    return {
      columns: columns.slice(start, end),
      leftSpacerWidth: start * bucketValueColumnWidth,
      rightSpacerWidth: Math.max(0, columns.length - end) * bucketValueColumnWidth,
    };
  }, [columns, viewport.scrollLeft, viewport.width]);

  const renderedColumnSpan = 2
    + virtualColumns.columns.length
    + (virtualColumns.leftSpacerWidth > 0 ? 1 : 0)
    + (virtualColumns.rightSpacerWidth > 0 ? 1 : 0);

  return {
    tableMinWidth,
    virtualRows,
    virtualColumns,
    renderedColumnSpan,
  };
}
