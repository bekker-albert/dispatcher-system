export type PtoVirtualViewport = {
  top: number;
  height: number;
};

export type PtoVirtualRowsOptions = {
  defaultRowHeight?: number;
  headerOffset?: number;
  overscanPx?: number;
  maxRowHeight?: number;
};

export type PtoVirtualRowsResult<T> = {
  renderedRows: T[];
  rowHeights: number[];
  rowOffsets: number[];
  startIndex: number;
  endIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  totalHeight: number;
};

export const ptoDateVirtualDefaultRowHeight = 34;
export const ptoDateVirtualHeaderOffset = 76;
export const ptoDateVirtualOverscanPx = ptoDateVirtualDefaultRowHeight * 10;

export function calculatePtoVirtualRows<T extends { id: string }>(
  rows: T[],
  rowHeightsByKey: Record<string, number>,
  tableKey: string,
  viewport: PtoVirtualViewport,
  options: PtoVirtualRowsOptions = {},
): PtoVirtualRowsResult<T> {
  const defaultRowHeight = options.defaultRowHeight ?? ptoDateVirtualDefaultRowHeight;
  const headerOffset = options.headerOffset ?? ptoDateVirtualHeaderOffset;
  const overscanPx = options.overscanPx ?? ptoDateVirtualOverscanPx;
  const maxRowHeight = options.maxRowHeight ?? 260;
  const rowHeights = rows.map((row) => {
    const customHeight = rowHeightsByKey[`${tableKey}:${row.id}`];
    return Math.max(defaultRowHeight, Math.min(maxRowHeight, Math.round(customHeight ?? defaultRowHeight)));
  });
  const rowOffsets: number[] = [];
  let totalHeight = 0;

  rowHeights.forEach((height) => {
    rowOffsets.push(totalHeight);
    totalHeight += height;
  });

  const rowOffsetAt = (index: number) => rowOffsets[index] ?? totalHeight;
  const windowTop = Math.max(0, viewport.top - headerOffset - overscanPx);
  const windowBottom = Math.max(
    windowTop + overscanPx,
    viewport.top - headerOffset + viewport.height + overscanPx,
  );
  let startIndex = 0;

  while (
    startIndex < rows.length
    && rowOffsets[startIndex] + rowHeights[startIndex] < windowTop
  ) {
    startIndex += 1;
  }

  let endIndex = startIndex;
  while (endIndex < rows.length && rowOffsets[endIndex] < windowBottom) {
    endIndex += 1;
  }

  return {
    renderedRows: rows.slice(startIndex, endIndex),
    rowHeights,
    rowOffsets,
    startIndex,
    endIndex,
    topSpacerHeight: rowOffsetAt(startIndex),
    bottomSpacerHeight: Math.max(0, totalHeight - rowOffsetAt(endIndex)),
    totalHeight,
  };
}
