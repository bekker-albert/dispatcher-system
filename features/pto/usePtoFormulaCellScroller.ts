"use client";

import { useCallback } from "react";

import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaModel";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import { ptoDateVirtualDefaultRowHeight, ptoDateVirtualHeaderOffset } from "@/lib/domain/pto/virtualization";

type UsePtoFormulaCellScrollerOptions = Pick<
  PtoDateTableContainerProps,
  | "ptoDateEditing"
  | "ptoDateTableScrollRef"
  | "updatePtoDateViewportFromElement"
> & {
  filteredRows: PtoDateTableContainerProps["rows"];
  filteredRowHeights: number[];
  rowOffsetAt: (index: number) => number;
};

export function usePtoFormulaCellScroller({
  filteredRows,
  filteredRowHeights,
  ptoDateEditing,
  ptoDateTableScrollRef,
  rowOffsetAt,
  updatePtoDateViewportFromElement,
}: UsePtoFormulaCellScrollerOptions) {
  return useCallback((cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => {
    if (!ptoDateEditing) return;

    const scrollElement = ptoDateTableScrollRef.current;
    const rowIndex = filteredRows.findIndex((row) => row.id === cell.rowId);
    if (!scrollElement || rowIndex < 0) return;

    const rowTop = ptoDateVirtualHeaderOffset + rowOffsetAt(rowIndex);
    const rowBottom = rowTop + (filteredRowHeights[rowIndex] ?? ptoDateVirtualDefaultRowHeight);
    const viewTop = scrollElement.scrollTop;
    const viewBottom = viewTop + scrollElement.clientHeight;

    if (rowTop < viewTop + 24) {
      scrollElement.scrollTop = Math.max(0, rowTop - 24);
    } else if (rowBottom > viewBottom - 24) {
      scrollElement.scrollTop = Math.max(0, rowBottom - scrollElement.clientHeight + 48);
    }

    updatePtoDateViewportFromElement(scrollElement);
  }, [
    filteredRows,
    filteredRowHeights,
    ptoDateEditing,
    ptoDateTableScrollRef,
    rowOffsetAt,
    updatePtoDateViewportFromElement,
  ]);
}
