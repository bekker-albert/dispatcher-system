"use client";

import { useCallback, type RefObject } from "react";

import {
  bucketFrozenWidth,
  bucketRowHeight,
  bucketValueColumnWidth,
} from "@/features/pto/ptoBucketsConfig";
import { resolvePtoBucketCellByOffset } from "@/features/pto/ptoBucketsGridModel";
import { ptoBucketSelectionKey, type PtoBucketCell } from "@/lib/domain/pto/buckets";

type UsePtoBucketsCellNavigationOptions = {
  columnKeys: string[];
  editingMode: boolean;
  frozenWidth?: number;
  rowKeys: string[];
  scrollRef: RefObject<HTMLDivElement | null>;
  selectCell: (cell: PtoBucketCell) => void;
  updateViewport: () => void;
};

export function usePtoBucketsCellNavigation({
  columnKeys,
  editingMode,
  frozenWidth = bucketFrozenWidth,
  rowKeys,
  scrollRef,
  selectCell,
  updateViewport,
}: UsePtoBucketsCellNavigationOptions) {
  const focusCell = useCallback((cell: PtoBucketCell) => {
    const cellKey = ptoBucketSelectionKey(cell);
    window.setTimeout(() => {
      document.getElementById(`pto-bucket-cell-${cellKey}`)?.focus();
    }, 0);
  }, []);

  const scrollCellIntoView = useCallback((rowIndex: number, columnIndex: number) => {
    const element = scrollRef.current;
    if (!element) return;

    const rowTop = rowIndex * bucketRowHeight;
    const rowBottom = rowTop + bucketRowHeight;
    const columnLeft = frozenWidth + columnIndex * bucketValueColumnWidth;
    const columnRight = columnLeft + bucketValueColumnWidth;
    const viewportBottom = element.scrollTop + element.clientHeight;
    const viewportRight = element.scrollLeft + element.clientWidth;

    if (rowTop < element.scrollTop) {
      element.scrollTop = rowTop;
    } else if (rowBottom > viewportBottom) {
      element.scrollTop = rowBottom - element.clientHeight;
    }

    if (columnLeft < element.scrollLeft) {
      element.scrollLeft = columnLeft;
    } else if (columnRight > viewportRight) {
      element.scrollLeft = columnRight - element.clientWidth;
    }

    updateViewport();
  }, [frozenWidth, scrollRef, updateViewport]);

  const moveCell = useCallback((cell: PtoBucketCell, rowOffset: number, columnOffset: number) => {
    if (!editingMode || rowKeys.length === 0 || columnKeys.length === 0) return;

    const nextTarget = resolvePtoBucketCellByOffset(rowKeys, columnKeys, cell, rowOffset, columnOffset);
    if (!nextTarget) return;

    scrollCellIntoView(nextTarget.rowIndex, nextTarget.columnIndex);
    selectCell(nextTarget.cell);
    focusCell(nextTarget.cell);
  }, [columnKeys, editingMode, focusCell, rowKeys, scrollCellIntoView, selectCell]);

  return { focusCell, moveCell };
}
