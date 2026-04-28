import { getPtoFormulaCellValue } from "@/features/pto/ptoDateFormulaModel";
import type { PtoDateFormulaControllerOptions, PtoFormulaValueContext } from "@/features/pto/ptoDateFormulaControllerTypes";

export function createPtoDateFormulaValueContext({
  rowById,
  getEffectiveCarryover,
  getRowDateTotals,
}: PtoFormulaValueContext) {
  return { rowById, getEffectiveCarryover, getRowDateTotals };
}

export function createPtoDateFormulaActiveState({
  ptoTab,
  ptoPlanYear,
  ptoDateEditing,
  ptoFormulaCell,
  ptoInlineEditCell,
  rowById,
  getEffectiveCarryover,
  getRowDateTotals,
}: Pick<
  PtoDateFormulaControllerOptions,
  | "ptoTab"
  | "ptoPlanYear"
  | "ptoDateEditing"
  | "ptoFormulaCell"
  | "ptoInlineEditCell"
  | "rowById"
  | "getEffectiveCarryover"
  | "getRowDateTotals"
>) {
  const activeFormulaCell = ptoFormulaCell?.table === ptoTab && ptoFormulaCell.year === ptoPlanYear ? ptoFormulaCell : null;
  const activeInlineEditCell = ptoInlineEditCell?.table === ptoTab && ptoInlineEditCell.year === ptoPlanYear ? ptoInlineEditCell : null;
  const activeFormulaRow = activeFormulaCell ? rowById.get(activeFormulaCell.rowId) : undefined;
  const formulaValueContext = createPtoDateFormulaValueContext({ rowById, getEffectiveCarryover, getRowDateTotals });
  const activeFormulaValue = activeFormulaCell
    ? getPtoFormulaCellValue(activeFormulaCell, formulaValueContext)
    : undefined;
  const formulaInputDisabled = !ptoDateEditing || !activeFormulaCell || !activeFormulaRow || activeFormulaCell.editable === false;

  return {
    activeFormulaCell,
    activeFormulaRow,
    activeFormulaValue,
    activeInlineEditCell,
    formulaInputDisabled,
    formulaValueContext,
  };
}
