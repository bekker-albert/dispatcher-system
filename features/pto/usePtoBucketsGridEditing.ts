"use client";

import type { KeyboardEvent, MouseEvent, RefObject } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { resolvePtoBucketKeyboardAction } from "@/features/pto/ptoBucketsGridModel";
import { usePtoBucketsCellDraft } from "@/features/pto/usePtoBucketsCellDraft";
import { usePtoBucketsCellNavigation } from "@/features/pto/usePtoBucketsCellNavigation";
import { usePtoBucketsCellSelection } from "@/features/pto/usePtoBucketsCellSelection";
import { ptoBucketSelectionKey, type PtoBucketCell, type PtoBucketColumn, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import { formatBucketNumber } from "@/lib/domain/pto/formatting";

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
  const {
    cancelEdit,
    draft,
    editKey,
    finishEdit,
    handleCellBlur,
    handleCellDraftChange,
    skipNextBlurCommit,
    startDraft,
  } = usePtoBucketsCellDraft({ editingMode, onCommitValue });

  const rowKeys = useMemo(() => (
    editingMode ? rows.map((row) => row.key) : []
  ), [editingMode, rows]);
  const columnKeys = useMemo(() => (
    editingMode ? columns.map((column) => column.key) : []
  ), [columns, editingMode]);
  const {
    activeCell,
    clearSelection,
    selectCell,
    selectedBucketKeys,
    selectedCellKeys,
    selectRange,
    toggleCell,
  } = usePtoBucketsCellSelection({ columnKeys, editingMode, rowKeys });
  const { focusCell, moveCell } = usePtoBucketsCellNavigation({
    columnKeys,
    editingMode,
    rowKeys,
    scrollRef,
    selectCell,
    updateViewport,
  });

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

  const clearCells = useCallback((fallbackCell: PtoBucketCell) => {
    if (!editingMode) return;
    const targetKeys = selectedCellKeys.length ? selectedCellKeys : [ptoBucketSelectionKey(fallbackCell)];
    skipNextBlurCommit(editKey);
    cancelEdit();
    onClearCells(targetKeys);
  }, [cancelEdit, editKey, editingMode, onClearCells, selectedCellKeys, skipNextBlurCommit]);

  const startEdit = useCallback((cell: PtoBucketCell, value: number | undefined, initialDraft?: string) => {
    if (!editingMode) return;
    const cellKey = ptoBucketSelectionKey(cell);
    const nextDraft = initialDraft ?? formatBucketNumber(value);
    selectCell(cell);
    startDraft(cellKey, nextDraft);
    focusCell(cell);
  }, [editingMode, focusCell, selectCell, startDraft]);

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

    const action = resolvePtoBucketKeyboardAction(event.key, isEditing);
    if (action.type === "none") return;

    event.preventDefault();

    if (action.type === "move") {
      if (action.commitEditing) {
        skipNextBlurCommit(cellKey);
        finishEdit(cellKey);
      }

      moveCell(cell, action.rowOffset, action.columnOffset);
      return;
    }

    if (action.type === "commit-edit") {
      skipNextBlurCommit(cellKey);
      finishEdit(cellKey);
      return;
    }

    if (action.type === "start-edit") {
      startEdit(cell, value);
      return;
    }

    if (action.type === "cancel-edit") {
      skipNextBlurCommit(cellKey);
      cancelEdit();
      event.currentTarget.blur();
      return;
    }

    if (action.type === "clear-selection") {
      clearSelection();
      event.currentTarget.blur();
      return;
    }

    if (action.type === "clear-cells") {
      clearCells(cell);
      return;
    }

    if (action.type === "start-edit-with-draft") {
      startEdit(cell, value, action.draft);
    }
  }, [cancelEdit, clearCells, clearSelection, editingMode, finishEdit, moveCell, skipNextBlurCommit, startEdit]);

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
