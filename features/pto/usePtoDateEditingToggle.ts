"use client";

import { useCallback } from "react";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";

type UsePtoDateEditingToggleOptions = Pick<
  PtoDateTableContainerProps,
  | "ptoDateEditing"
  | "setPtoDateEditing"
  | "setDraggedPtoRowId"
  | "setPtoDropTarget"
  | "setPtoFormulaCell"
  | "setPtoFormulaDraft"
  | "setPtoInlineEditCell"
  | "setPtoInlineEditInitialDraft"
  | "setPtoSelectionAnchorCell"
  | "setPtoSelectedCellKeys"
  | "savePtoLocalState"
  | "savePtoDatabaseChanges"
>;

export function usePtoDateEditingToggle({
  ptoDateEditing,
  setPtoDateEditing,
  setDraggedPtoRowId,
  setPtoDropTarget,
  setPtoFormulaCell,
  setPtoFormulaDraft,
  setPtoInlineEditCell,
  setPtoInlineEditInitialDraft,
  setPtoSelectionAnchorCell,
  setPtoSelectedCellKeys,
  savePtoLocalState,
  savePtoDatabaseChanges,
}: UsePtoDateEditingToggleOptions) {
  return useCallback(() => {
    const nextEditing = !ptoDateEditing;
    setPtoDateEditing(nextEditing);
    setDraggedPtoRowId(null);
    setPtoDropTarget(null);
    setPtoFormulaCell(null);
    setPtoFormulaDraft("");
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoSelectionAnchorCell(null);
    setPtoSelectedCellKeys([]);
    if (!nextEditing) {
      savePtoLocalState();
      window.setTimeout(() => {
        void savePtoDatabaseChanges("manual");
      }, 0);
    }
  }, [
    ptoDateEditing,
    savePtoDatabaseChanges,
    savePtoLocalState,
    setDraggedPtoRowId,
    setPtoDateEditing,
    setPtoDropTarget,
    setPtoFormulaCell,
    setPtoFormulaDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoSelectedCellKeys,
    setPtoSelectionAnchorCell,
  ]);
}
