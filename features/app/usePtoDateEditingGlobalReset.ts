"use client";

import { usePtoDateEditingReset } from "@/features/pto/usePtoDateEditingReset";
import type { AppPtoModels } from "@/features/app/appPtoScreenPropsTypes";
import type { AppStateBundle } from "@/features/app/AppStateBundle";

type UsePtoDateEditingGlobalResetOptions = {
  appState: AppStateBundle;
  models: AppPtoModels;
};

export function usePtoDateEditingGlobalReset({
  appState,
  models,
}: UsePtoDateEditingGlobalResetOptions) {
  usePtoDateEditingReset({
    active: models.renderedTopTab === "pto" && models.isPtoDateTab,
    setPtoDateEditing: appState.setPtoDateEditing,
    setDraggedPtoRowId: appState.setDraggedPtoRowId,
    setPtoDropTarget: appState.setPtoDropTarget,
    setPtoFormulaCell: appState.setPtoFormulaCell,
    setPtoInlineEditCell: appState.setPtoInlineEditCell,
    setPtoSelectedCellKeys: appState.setPtoSelectedCellKeys,
  });
}
