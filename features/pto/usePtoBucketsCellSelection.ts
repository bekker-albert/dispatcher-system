"use client";

import { useCallback, useMemo, useState } from "react";

import {
  emptyPtoBucketSelectedKeys,
  ptoBucketCellRangeKeys,
} from "@/features/pto/ptoBucketsGridModel";
import { ptoBucketSelectionKey, type PtoBucketCell } from "@/lib/domain/pto/buckets";
import { toggleEditableGridSelectionKey } from "@/shared/editable-grid/selection";

type UsePtoBucketsCellSelectionOptions = {
  columnKeys: string[];
  editingMode: boolean;
  rowKeys: string[];
};

export function usePtoBucketsCellSelection({
  columnKeys,
  editingMode,
  rowKeys,
}: UsePtoBucketsCellSelectionOptions) {
  const [activeCell, setActiveCell] = useState<PtoBucketCell | null>(null);
  const [selectionAnchorCell, setSelectionAnchorCell] = useState<PtoBucketCell | null>(null);
  const [selectedCellKeys, setSelectedCellKeys] = useState<string[]>([]);

  const selectedBucketKeys = useMemo(
    () => (selectedCellKeys.length === 0 ? emptyPtoBucketSelectedKeys : new Set(selectedCellKeys)),
    [selectedCellKeys],
  );

  const clearSelection = useCallback(() => {
    setActiveCell(null);
    setSelectionAnchorCell(null);
    setSelectedCellKeys((current) => (current.length === 0 ? current : []));
  }, []);

  const selectCell = useCallback((cell: PtoBucketCell) => {
    if (!editingMode) return;
    setActiveCell(cell);
    setSelectionAnchorCell(cell);
    setSelectedCellKeys([ptoBucketSelectionKey(cell)]);
  }, [editingMode]);

  const toggleCell = useCallback((cell: PtoBucketCell) => {
    if (!editingMode) return;
    const cellKey = ptoBucketSelectionKey(cell);
    setActiveCell(cell);
    setSelectionAnchorCell(cell);
    setSelectedCellKeys((current) => toggleEditableGridSelectionKey(current, cellKey));
  }, [editingMode]);

  const selectRange = useCallback((cell: PtoBucketCell) => {
    if (!editingMode) return;

    const anchorCell = selectionAnchorCell ?? activeCell ?? cell;
    setActiveCell(cell);
    setSelectionAnchorCell(anchorCell);
    setSelectedCellKeys(ptoBucketCellRangeKeys(rowKeys, columnKeys, anchorCell, cell));
  }, [activeCell, columnKeys, editingMode, rowKeys, selectionAnchorCell]);

  return {
    activeCell,
    clearSelection,
    selectCell,
    selectedBucketKeys,
    selectedCellKeys,
    selectRange,
    toggleCell,
  };
}
