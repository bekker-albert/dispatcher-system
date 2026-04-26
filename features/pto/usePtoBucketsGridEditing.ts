"use client";

import type { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  bucketFrozenWidth,
  bucketRowHeight,
  bucketValueColumnWidth,
} from "@/features/pto/ptoBucketsConfig";
import { ptoBucketCellKey, ptoBucketSelectionKey, type PtoBucketCell, type PtoBucketColumn, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import { formatBucketNumber } from "@/lib/domain/pto/formatting";
import { toggleEditableGridSelectionKey } from "@/shared/editable-grid/selection";

type UsePtoBucketsGridEditingOptions = {
  rows: PtoBucketRow[];
  columns: PtoBucketColumn[];
  defaultDraftArea: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  updateViewport: () => void;
  onCommitValue: (cellKey: string, draft: string) => void;
  onClearCells: (cellKeys: string[]) => void;
  onAddManualRow: (area: string, structure: string) => boolean;
};

export function usePtoBucketsGridEditing({
  rows,
  columns,
  defaultDraftArea,
  scrollRef,
  updateViewport,
  onCommitValue,
  onClearCells,
  onAddManualRow,
}: UsePtoBucketsGridEditingOptions) {
  const [editingMode, setEditingMode] = useState(false);
  const [draftRow, setDraftRow] = useState(() => ({ area: defaultDraftArea, structure: "" }));
  const [editKey, setEditKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [activeCell, setActiveCell] = useState<PtoBucketCell | null>(null);
  const [selectionAnchorCell, setSelectionAnchorCell] = useState<PtoBucketCell | null>(null);
  const [selectedCellKeys, setSelectedCellKeys] = useState<string[]>([]);
  const skipBlurCommitRef = useRef<string | null>(null);
  const draftRef = useRef("");

  const rowKeys = useMemo(() => rows.map((row) => row.key), [rows]);
  const columnKeys = useMemo(() => columns.map((column) => column.key), [columns]);
  const rowIndexByKey = useMemo(() => new Map(rowKeys.map((key, index) => [key, index] as const)), [rowKeys]);
  const columnIndexByKey = useMemo(() => new Map(columnKeys.map((key, index) => [key, index] as const)), [columnKeys]);
  const selectedBucketKeys = useMemo(() => new Set(selectedCellKeys), [selectedCellKeys]);

  const clearSelection = useCallback(() => {
    setActiveCell(null);
    setSelectionAnchorCell(null);
    setSelectedCellKeys([]);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditKey(null);
    draftRef.current = "";
    setDraft("");
  }, []);

  const clearEditingState = useCallback(() => {
    cancelEdit();
    clearSelection();
  }, [cancelEdit, clearSelection]);

  useEffect(() => {
    if (!editingMode) return undefined;

    const clearSelectionsOnOutsideClick = (event: globalThis.MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-pto-bucket-cell], [data-pto-bucket-draft-input]")) return;
      clearEditingState();
    };

    window.addEventListener("mousedown", clearSelectionsOnOutsideClick);
    return () => window.removeEventListener("mousedown", clearSelectionsOnOutsideClick);
  }, [clearEditingState, editingMode]);

  const toggleEditingMode = useCallback(() => {
    setEditingMode((current) => !current);
    clearEditingState();
  }, [clearEditingState]);

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
    const columnLeft = bucketFrozenWidth + columnIndex * bucketValueColumnWidth;
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
  }, [scrollRef, updateViewport]);

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
    const anchorRowIndex = rowIndexByKey.get(anchorCell.rowKey);
    const anchorColumnIndex = columnIndexByKey.get(anchorCell.equipmentKey);
    const targetRowIndex = rowIndexByKey.get(cell.rowKey);
    const targetColumnIndex = columnIndexByKey.get(cell.equipmentKey);

    if (
      anchorRowIndex === undefined
      || anchorColumnIndex === undefined
      || targetRowIndex === undefined
      || targetColumnIndex === undefined
    ) {
      selectCell(cell);
      return;
    }

    const rowStart = Math.min(anchorRowIndex, targetRowIndex);
    const rowEnd = Math.max(anchorRowIndex, targetRowIndex);
    const columnStart = Math.min(anchorColumnIndex, targetColumnIndex);
    const columnEnd = Math.max(anchorColumnIndex, targetColumnIndex);
    const nextKeys: string[] = [];

    for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex += 1) {
      for (let columnIndex = columnStart; columnIndex <= columnEnd; columnIndex += 1) {
        nextKeys.push(ptoBucketCellKey(rowKeys[rowIndex], columnKeys[columnIndex]));
      }
    }

    setActiveCell(cell);
    setSelectionAnchorCell(anchorCell);
    setSelectedCellKeys(nextKeys);
  }, [activeCell, columnIndexByKey, columnKeys, editingMode, rowIndexByKey, rowKeys, selectCell, selectionAnchorCell]);

  const finishEdit = useCallback((cellKey: string, draftValue: string) => {
    if (!editingMode) return;
    onCommitValue(cellKey, draftValue);
    setEditKey((current) => (current === cellKey ? null : current));
    draftRef.current = "";
    setDraft("");
  }, [editingMode, onCommitValue]);

  const moveCell = useCallback((cell: PtoBucketCell, rowOffset: number, columnOffset: number) => {
    if (!editingMode || rowKeys.length === 0 || columnKeys.length === 0) return;

    const rowIndex = rowIndexByKey.get(cell.rowKey);
    const columnIndex = columnIndexByKey.get(cell.equipmentKey);
    if (rowIndex === undefined || columnIndex === undefined) return;

    const nextRowIndex = Math.min(Math.max(rowIndex + rowOffset, 0), rowKeys.length - 1);
    const nextColumnIndex = Math.min(Math.max(columnIndex + columnOffset, 0), columnKeys.length - 1);
    const nextCell = {
      rowKey: rowKeys[nextRowIndex] ?? cell.rowKey,
      equipmentKey: columnKeys[nextColumnIndex] ?? cell.equipmentKey,
    };

    scrollCellIntoView(nextRowIndex, nextColumnIndex);
    selectCell(nextCell);
    focusCell(nextCell);
  }, [columnIndexByKey, columnKeys, editingMode, focusCell, rowIndexByKey, rowKeys, scrollCellIntoView, selectCell]);

  const clearCells = useCallback((fallbackCell: PtoBucketCell) => {
    if (!editingMode) return;
    const targetKeys = selectedCellKeys.length ? selectedCellKeys : [ptoBucketSelectionKey(fallbackCell)];
    skipBlurCommitRef.current = editKey;
    cancelEdit();
    onClearCells(targetKeys);
  }, [cancelEdit, editKey, editingMode, onClearCells, selectedCellKeys]);

  const startEdit = useCallback((cell: PtoBucketCell, value: number | undefined, initialDraft?: string) => {
    if (!editingMode) return;
    const cellKey = ptoBucketSelectionKey(cell);
    const nextDraft = initialDraft ?? formatBucketNumber(value);
    selectCell(cell);
    setEditKey(cellKey);
    draftRef.current = nextDraft;
    setDraft(nextDraft);
    focusCell(cell);
  }, [editingMode, focusCell, selectCell]);

  const handleCellMouseDown = useCallback((event: MouseEvent<HTMLElement>, cell: PtoBucketCell) => {
    if (!editingMode || event.button !== 0) return;

    if (event.shiftKey) {
      selectRange(cell);
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      toggleCell(cell);
      return;
    }

    selectCell(cell);
  }, [editingMode, selectCell, selectRange, toggleCell]);

  const handleCellKeyDown = useCallback((
    event: KeyboardEvent<HTMLElement>,
    cell: PtoBucketCell,
    value: number | undefined,
    cellKey: string,
    isEditing: boolean,
  ) => {
    if (!editingMode) return;

    const arrowMove: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    if (event.key in arrowMove) {
      event.preventDefault();
      if (isEditing) {
        skipBlurCommitRef.current = cellKey;
        finishEdit(cellKey, draftRef.current);
      }

      const [rowOffset, columnOffset] = arrowMove[event.key];
      moveCell(cell, rowOffset, columnOffset);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (isEditing) {
        skipBlurCommitRef.current = cellKey;
        finishEdit(cellKey, draftRef.current);
      } else {
        startEdit(cell, value);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (isEditing) {
        skipBlurCommitRef.current = cellKey;
        cancelEdit();
      } else {
        clearSelection();
      }
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      clearCells(cell);
      return;
    }

    if (!isEditing && /^[0-9.,-]$/.test(event.key)) {
      event.preventDefault();
      startEdit(cell, value, event.key);
    }
  }, [cancelEdit, clearCells, clearSelection, editingMode, finishEdit, moveCell, startEdit]);

  const handleCellDraftChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    draftRef.current = event.target.value;
  }, []);

  const handleCellBlur = useCallback((cellKey: string) => {
    if (skipBlurCommitRef.current === cellKey) {
      skipBlurCommitRef.current = null;
      return;
    }

    finishEdit(cellKey, draftRef.current);
  }, [finishEdit]);

  const addManualRow = useCallback(() => {
    if (!editingMode) return;
    const created = onAddManualRow(draftRow.area, draftRow.structure);
    if (!created) return;
    setDraftRow({ area: defaultDraftArea, structure: "" });
  }, [defaultDraftArea, draftRow.area, draftRow.structure, editingMode, onAddManualRow]);

  const setDraftRowArea = useCallback((area: string) => {
    setDraftRow((current) => ({ ...current, area }));
  }, []);

  const setDraftRowStructure = useCallback((structure: string) => {
    setDraftRow((current) => ({ ...current, structure }));
  }, []);

  return {
    activeCell,
    addManualRow,
    draft,
    draftRow,
    editKey,
    editingMode,
    handleCellBlur,
    handleCellDraftChange,
    handleCellKeyDown,
    handleCellMouseDown,
    selectCell,
    selectedBucketKeys,
    setDraftRowArea,
    setDraftRowStructure,
    startEdit,
    toggleEditingMode,
  };
}
