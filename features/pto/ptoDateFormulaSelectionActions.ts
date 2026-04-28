import type { Dispatch, SetStateAction } from "react";
import {
  resolvePtoFormulaAnchor,
  togglePtoFormulaSelectionKeys,
  withPtoFormulaScope,
} from "./ptoDateFormulaSelectionModel";
import type {
  PtoFormulaCell,
  PtoFormulaCellWithoutScope,
} from "./ptoDateFormulaTypes";
import { formatPtoFormulaNumber } from "../../lib/domain/pto/formatting";

type PtoDateFormulaSelectionActionsOptions = {
  activeFormulaCell: PtoFormulaCell | null;
  formulaRangeKeys: (anchor: PtoFormulaCell, target: PtoFormulaCell) => string[];
  formulaSelectionKey: (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => string;
  formulaSelectionScope: string;
  ptoDateEditing: boolean;
  ptoInlineEditInitialDraft: string;
  ptoPlanYear: string;
  ptoSelectionAnchorCell: PtoFormulaCell | null;
  ptoTab: string;
  setPtoFormulaCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoFormulaDraft: Dispatch<SetStateAction<string>>;
  setPtoInlineEditCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoInlineEditInitialDraft: Dispatch<SetStateAction<string>>;
  setPtoSelectedCellKeys: Dispatch<SetStateAction<string[]>>;
  setPtoSelectionAnchorCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
};

export function createPtoDateFormulaSelectionActions({
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
}: PtoDateFormulaSelectionActionsOptions) {
  let inlineEditInitialDraft = ptoInlineEditInitialDraft;

  const selectFormulaCell = (cell: PtoFormulaCellWithoutScope, value: number | undefined) => {
    if (!ptoDateEditing) return;

    const nextCell = withPtoFormulaScope(cell, ptoTab, ptoPlanYear);
    setPtoFormulaCell(nextCell);
    setPtoFormulaDraft(formatPtoFormulaNumber(value));
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoSelectionAnchorCell(nextCell);
    setPtoSelectedCellKeys([formulaSelectionKey(nextCell)]);
  };

  const selectFormulaRange = (cell: PtoFormulaCellWithoutScope, value: number | undefined) => {
    if (!ptoDateEditing) return;

    const targetCell = withPtoFormulaScope(cell, ptoTab, ptoPlanYear);
    const anchorCell = resolvePtoFormulaAnchor(ptoSelectionAnchorCell, ptoTab, ptoPlanYear, targetCell);

    setPtoFormulaCell(targetCell);
    setPtoFormulaDraft(formatPtoFormulaNumber(value));
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoSelectionAnchorCell(anchorCell);
    setPtoSelectedCellKeys(formulaRangeKeys(anchorCell, targetCell));
  };

  const toggleFormulaCell = (cell: PtoFormulaCellWithoutScope, value: number | undefined) => {
    if (!ptoDateEditing) return;

    const targetCell = withPtoFormulaScope(cell, ptoTab, ptoPlanYear);
    const targetKey = formulaSelectionKey(targetCell);

    setPtoFormulaCell(targetCell);
    setPtoFormulaDraft(formatPtoFormulaNumber(value));
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoSelectionAnchorCell(targetCell);
    setPtoSelectedCellKeys((currentKeys) => togglePtoFormulaSelectionKeys(currentKeys, formulaSelectionScope, targetKey));
  };

  const startInlineFormulaEdit = (cell: PtoFormulaCellWithoutScope, value: number | undefined, draftOverride?: string) => {
    if (!ptoDateEditing) return;

    const nextCell = withPtoFormulaScope(cell, ptoTab, ptoPlanYear);
    const draft = draftOverride ?? formatPtoFormulaNumber(value);
    inlineEditInitialDraft = draft;
    setPtoFormulaCell(nextCell);
    setPtoInlineEditCell(nextCell);
    setPtoFormulaDraft(draft);
    setPtoInlineEditInitialDraft(draft);
  };

  const cancelInlineFormulaEdit = () => {
    setPtoFormulaDraft(inlineEditInitialDraft);
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
  };

  const collapseFormulaSelection = (fallbackCell: PtoFormulaCellWithoutScope) => {
    if (!ptoDateEditing) return;

    const nextActiveCell = activeFormulaCell ?? withPtoFormulaScope(fallbackCell, ptoTab, ptoPlanYear);

    setPtoFormulaCell(nextActiveCell);
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoSelectionAnchorCell(nextActiveCell);
    setPtoSelectedCellKeys([formulaSelectionKey(nextActiveCell)]);
  };

  return {
    cancelInlineFormulaEdit,
    collapseFormulaSelection,
    selectFormulaCell,
    selectFormulaRange,
    startInlineFormulaEdit,
    toggleFormulaCell,
  };
}
