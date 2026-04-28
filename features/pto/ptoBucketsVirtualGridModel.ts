import {
  bucketFrozenWidth,
  bucketOverscanColumns,
  bucketOverscanRows,
  bucketRowHeight,
  bucketValueColumnWidth,
} from "./ptoBucketsConfig";
import type { PtoGridViewport } from "./usePtoGridViewport";

export type PtoBucketsVirtualRows<T> = {
  rows: T[];
  topSpacerHeight: number;
  bottomSpacerHeight: number;
};

export type PtoBucketsVirtualColumns<T> = {
  columns: T[];
  leftSpacerWidth: number;
  rightSpacerWidth: number;
};

export function ptoBucketsTableMinWidth(columnCount: number) {
  return bucketFrozenWidth + Math.max(1, columnCount) * bucketValueColumnWidth;
}

export function createPtoBucketsVirtualRows<T>(rows: T[], viewport: Pick<PtoGridViewport, "height" | "scrollTop">): PtoBucketsVirtualRows<T> {
  const start = Math.max(0, Math.floor(viewport.scrollTop / bucketRowHeight) - bucketOverscanRows);
  const visibleCount = Math.ceil(viewport.height / bucketRowHeight) + bucketOverscanRows * 2;
  const end = Math.min(rows.length, start + visibleCount);

  return {
    rows: rows.slice(start, end),
    topSpacerHeight: start * bucketRowHeight,
    bottomSpacerHeight: Math.max(0, rows.length - end) * bucketRowHeight,
  };
}

export function createPtoBucketsVirtualColumns<T>(
  columns: T[],
  viewport: Pick<PtoGridViewport, "scrollLeft" | "width">,
): PtoBucketsVirtualColumns<T> {
  if (columns.length === 0) {
    return {
      columns: [],
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
}

export function ptoBucketsRenderedColumnSpan<T>(virtualColumns: PtoBucketsVirtualColumns<T>) {
  return 2
    + virtualColumns.columns.length
    + (virtualColumns.leftSpacerWidth > 0 ? 1 : 0)
    + (virtualColumns.rightSpacerWidth > 0 ? 1 : 0);
}
