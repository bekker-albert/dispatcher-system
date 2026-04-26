"use client";

import type { Dispatch, SetStateAction } from "react";
import { usePtoDateEditingReset } from "@/features/pto/usePtoDateEditingReset";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaModel";
import type { PtoDropTarget } from "@/features/pto/ptoDateInteractionTypes";
import { usePtoDateViewport } from "@/features/pto/usePtoDateViewport";

type UsePtoDateViewportResetOptions = {
  renderedTopTab: string;
  isPtoDateTab: boolean;
  ptoDateEditing: boolean;
  resetKey: string;
  measureKey: string;
  setPtoDateEditing: Dispatch<SetStateAction<boolean>>;
  setDraggedPtoRowId: Dispatch<SetStateAction<string | null>>;
  setPtoDropTarget: Dispatch<SetStateAction<PtoDropTarget | null>>;
  setPtoFormulaCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoInlineEditCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoSelectedCellKeys: Dispatch<SetStateAction<string[]>>;
};

export function usePtoDateViewportReset({
  renderedTopTab,
  isPtoDateTab,
  ptoDateEditing,
  resetKey,
  measureKey,
  setPtoDateEditing,
  setDraggedPtoRowId,
  setPtoDropTarget,
  setPtoFormulaCell,
  setPtoInlineEditCell,
  setPtoSelectedCellKeys,
}: UsePtoDateViewportResetOptions) {
  const isPtoDateSectionOpen = renderedTopTab === "pto" && isPtoDateTab;

  const viewportState = usePtoDateViewport({
    active: isPtoDateSectionOpen && ptoDateEditing,
    resetKey,
    measureKey,
  });

  usePtoDateEditingReset({
    active: isPtoDateSectionOpen,
    setPtoDateEditing,
    setDraggedPtoRowId,
    setPtoDropTarget,
    setPtoFormulaCell,
    setPtoInlineEditCell,
    setPtoSelectedCellKeys,
  });

  return viewportState;
}
