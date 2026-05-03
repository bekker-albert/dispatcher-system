import { useMemo } from "react";

import {
  createPtoDateFormulaModel,
  createPtoDateFormulaSelectionModel,
  ptoFormulaCellMatches,
} from "@/features/pto/ptoDateFormulaModel";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaTypes";
import { createPtoDateFormulaActiveState } from "@/features/pto/ptoDateFormulaActiveState";
import * as inactiveFormulaController from "@/features/pto/ptoDateFormulaInactiveController";
import { createPtoDateFormulaKeyboardHandlers } from "@/features/pto/ptoDateFormulaKeyboardHandlers";
import { createPtoDateFormulaPointerHandlers } from "@/features/pto/ptoDateFormulaPointerHandlers";
import { createPtoDateFormulaSelectionActions } from "@/features/pto/ptoDateFormulaSelectionActions";
import { createPtoDateFormulaValueActions } from "@/features/pto/ptoDateFormulaValueActions";
import type { PtoDateFormulaControllerOptions } from "@/features/pto/ptoDateFormulaControllerTypes";

export function usePtoDateFormulaController({
  ptoTab,
  ptoPlanYear,
  ptoDateEditing,
  ptoFormulaCell,
  ptoFormulaDraft,
  ptoInlineEditCell,
  ptoInlineEditInitialDraft,
  ptoSelectionAnchorCell,
  ptoSelectedCellKeys,
  ptoSelectionDraggingRef,
  setRows,
  setPtoFormulaCell,
  setPtoFormulaDraft,
  setPtoInlineEditCell,
  setPtoInlineEditInitialDraft,
  setPtoSelectionAnchorCell,
  setPtoSelectedCellKeys,
  requestPtoDatabaseSave,
  updatePtoDateRow,
  clearPtoCarryoverOverride,
  updatePtoDateDay,
  updatePtoMonthTotal,
  carryoverHeader,
  displayPtoMonthGroups,
  editableMonthTotal,
  filteredRows,
  renderedRows,
  rowById,
  getEffectiveCarryover,
  getRowDateTotals,
  scrollFormulaCellIntoView,
}: PtoDateFormulaControllerOptions) {
  const formulaModel = useMemo(() => {
    if (!ptoDateEditing) return null;

    return createPtoDateFormulaModel({
      table: ptoTab,
      year: ptoPlanYear,
      renderedRows,
      filteredRows,
      displayMonthGroups: displayPtoMonthGroups,
      editableMonthTotal,
      carryoverHeader,
    });
  }, [
    carryoverHeader,
    displayPtoMonthGroups,
    editableMonthTotal,
    filteredRows,
    ptoDateEditing,
    ptoPlanYear,
    ptoTab,
    renderedRows,
  ]);
  const formulaSelectionModel = useMemo(() => (
    formulaModel
      ? createPtoDateFormulaSelectionModel({
          formulaSelectionKey: formulaModel.formulaSelectionKey,
          formulaSelectionScope: formulaModel.formulaSelectionScope,
          selectedCellKeys: ptoSelectedCellKeys,
        })
      : {
          selectedFormulaCellKeys: new Set<string>(),
          formulaCellSelected: () => false,
        }
  ), [formulaModel, ptoSelectedCellKeys]);

  if (!ptoDateEditing || !formulaModel) {
    return inactiveFormulaController.createInactivePtoDateFormulaController();
  }

  const {
    activeFormulaCell,
    activeFormulaRow,
    activeFormulaValue,
    activeInlineEditCell,
    formulaInputDisabled,
    formulaValueContext,
  } = createPtoDateFormulaActiveState({
    ptoTab,
    ptoPlanYear,
    ptoDateEditing,
    ptoFormulaCell,
    ptoInlineEditCell,
    rowById,
    getEffectiveCarryover,
    getRowDateTotals,
  });

  const {
    formulaCellDomKey,
    formulaSelectionKey,
    formulaCellsByRowId,
    formulaSelectionScope,
    formulaCellTemplates,
    formulaTemplateIndexByKey,
    formulaCellFromTemplate,
    formulaCellFromSelectionKey,
    formulaRangeKeys,
  } = formulaModel;
  const {
    selectedFormulaCellKeys,
    formulaCellSelected,
  } = formulaSelectionModel;

  const {
    cancelInlineFormulaEdit,
    collapseFormulaSelection,
    selectFormulaCell,
    selectFormulaRange,
    startInlineFormulaEdit,
    toggleFormulaCell,
  } = createPtoDateFormulaSelectionActions({
    activeFormulaCell,
    formulaRangeKeys,
    formulaSelectionKey,
    formulaSelectionScope,
    ptoDateEditing,
    ptoInlineEditInitialDraft,
    ptoPlanYear,
    ptoSelectionAnchorCell,
    ptoTab,
    setPtoFormulaCell,
    setPtoFormulaDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoSelectedCellKeys,
    setPtoSelectionAnchorCell,
  });

  const formulaCellActive = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => (
    ptoFormulaCellMatches(activeFormulaCell, ptoTab, ptoPlanYear, rowId, kind, key)
  );
  const formulaCellEditing = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => (
    ptoFormulaCellMatches(activeInlineEditCell, ptoTab, ptoPlanYear, rowId, kind, key)
  );
  const formulaRowEditing = (rowId: string) => activeInlineEditCell?.rowId === rowId;

  const {
    clearSelectedFormulaCells,
    commitFormulaBarEdit,
    commitFormulaCellValue,
    commitInlineFormulaEdit,
    updateFormulaDraft,
    updateFormulaValue,
  } = createPtoDateFormulaValueActions({
    ptoDateEditing,
    ptoPlanYear,
    ptoTab,
    ptoFormulaDraft,
    setRows,
    setPtoFormulaCell,
    setPtoFormulaDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoSelectionAnchorCell,
    setPtoSelectedCellKeys,
    requestPtoDatabaseSave,
    clearPtoCarryoverOverride,
    updatePtoDateRow,
    updatePtoDateDay,
    updatePtoMonthTotal,
    activeFormulaCell,
    activeFormulaRow,
    activeInlineEditCell,
    formulaCellFromSelectionKey,
    formulaSelectionKey,
    selectedFormulaCellKeys,
  });

  const { handleFormulaCellKeyDown } = createPtoDateFormulaKeyboardHandlers({
    activeFormulaCell,
    activeInlineEditCell,
    cancelInlineFormulaEdit,
    clearSelectedFormulaCells,
    collapseFormulaSelection,
    commitFormulaCellValue,
    commitInlineFormulaEdit,
    filteredRows,
    formulaCellDomKey,
    formulaCellFromTemplate,
    formulaCellTemplates,
    formulaTemplateIndexByKey,
    formulaValueContext,
    ptoDateEditing,
    ptoFormulaDraft,
    requestPtoDatabaseSave,
    scrollFormulaCellIntoView,
    selectFormulaCell,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    startInlineFormulaEdit,
  });

  const {
    handleFormulaCellMouseDown,
    handleFormulaCellMouseEnter,
  } = createPtoDateFormulaPointerHandlers({
    ptoDateEditing,
    ptoSelectionDraggingRef,
    selectFormulaCell,
    selectFormulaRange,
    toggleFormulaCell,
  });

  return {
    activeFormulaCell,
    activeFormulaValue,
    formulaCellActive,
    formulaCellDomKey,
    formulaCellEditing,
    formulaRowEditing,
    formulaCellSelected,
    formulaCellsByRowId,
    formulaInputDisabled,
    handleFormulaCellKeyDown,
    handleFormulaCellMouseDown,
    handleFormulaCellMouseEnter,
    selectFormulaCell,
    selectFormulaRange,
    startInlineFormulaEdit,
    commitFormulaBarEdit,
    commitInlineFormulaEdit,
    updateFormulaDraft,
    updateFormulaValue,
  };
}
