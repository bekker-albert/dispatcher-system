"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaTypes";
import type { PtoDropTarget } from "@/features/pto/ptoDateInteractionTypes";

type PtoDateEditingResetOptions = {
  active: boolean;
  setPtoDateEditing: Dispatch<SetStateAction<boolean>>;
  setDraggedPtoRowId: Dispatch<SetStateAction<string | null>>;
  setPtoDropTarget: Dispatch<SetStateAction<PtoDropTarget | null>>;
  setPtoFormulaCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoInlineEditCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoSelectedCellKeys: Dispatch<SetStateAction<string[]>>;
};

export function usePtoDateEditingReset({
  active,
  setPtoDateEditing,
  setDraggedPtoRowId,
  setPtoDropTarget,
  setPtoFormulaCell,
  setPtoInlineEditCell,
  setPtoSelectedCellKeys,
}: PtoDateEditingResetOptions) {
  useEffect(() => {
    if (active) return;

    setPtoDateEditing(false);
    setDraggedPtoRowId(null);
    setPtoDropTarget(null);
    setPtoFormulaCell(null);
    setPtoInlineEditCell(null);
    setPtoSelectedCellKeys([]);
  }, [
    active,
    setDraggedPtoRowId,
    setPtoDateEditing,
    setPtoDropTarget,
    setPtoFormulaCell,
    setPtoInlineEditCell,
    setPtoSelectedCellKeys,
  ]);
}
