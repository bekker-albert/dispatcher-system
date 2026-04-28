import {
  resolvePtoFormulaActiveAfterClear,
  selectedPtoFormulaCells,
} from "@/features/pto/ptoDateFormulaSelectionModel";
import type {
  PtoFormulaCell,
  PtoFormulaCellWithoutScope,
} from "@/features/pto/ptoDateFormulaTypes";
import { commitPtoFormulaCellValue } from "@/features/pto/ptoFormulaCellCommit";
import type { PtoDateFormulaControllerOptions } from "@/features/pto/ptoDateFormulaControllerTypes";
import type { PtoRowsSetter } from "@/features/pto/ptoDateTableTypes";
import { formatPtoFormulaNumber, parseDecimalValue } from "@/lib/domain/pto/formatting";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type PtoDateFormulaValueActionsOptions = Pick<
  PtoDateFormulaControllerOptions,
  | "ptoDateEditing"
  | "ptoPlanYear"
  | "ptoTab"
  | "ptoFormulaDraft"
  | "setRows"
  | "setPtoFormulaCell"
  | "setPtoFormulaDraft"
  | "setPtoInlineEditCell"
  | "setPtoInlineEditInitialDraft"
  | "setPtoSelectionAnchorCell"
  | "setPtoSelectedCellKeys"
  | "requestPtoDatabaseSave"
  | "clearPtoCarryoverOverride"
  | "updatePtoDateRow"
  | "updatePtoDateDay"
  | "updatePtoMonthTotal"
> & {
  activeFormulaCell: PtoFormulaCell | null;
  activeFormulaRow: PtoPlanRow | undefined;
  activeInlineEditCell: PtoFormulaCell | null;
  formulaCellFromSelectionKey: (key: string) => PtoFormulaCellWithoutScope | null;
  formulaSelectionKey: (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => string;
  selectedFormulaCellKeys: Set<string>;
};

export function createPtoDateFormulaValueActions({
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
}: PtoDateFormulaValueActionsOptions) {
  const commitFormulaCellValue = (cell: PtoFormulaCell, value: string) => {
    const committed = commitPtoFormulaCellValue({
      ptoDateEditing,
      cell,
      value,
      setRows: setRows as PtoRowsSetter,
      ptoPlanYear,
      clearPtoCarryoverOverride,
      updatePtoDateRow,
      updatePtoDateDay,
      updatePtoMonthTotal,
    });
    const inlineDatabaseWrite = cell.kind === "day" || cell.kind === "month";
    return { committed, inlineDatabaseWrite };
  };

  const clearSelectedFormulaCells = (fallbackCell: PtoFormulaCellWithoutScope) => {
    const cellsToClear = selectedPtoFormulaCells(selectedFormulaCellKeys, formulaCellFromSelectionKey);
    const targetCells = cellsToClear.length ? cellsToClear : [fallbackCell];
    let committed = false;
    let needsSnapshotSave = false;

    targetCells.forEach((targetCell) => {
      const result = commitFormulaCellValue({ ...targetCell, table: ptoTab, year: ptoPlanYear }, "");
      committed = result.committed || committed;
      needsSnapshotSave = (!result.inlineDatabaseWrite && result.committed) || needsSnapshotSave;
    });

    if (!committed) return false;

    const nextActiveCell = resolvePtoFormulaActiveAfterClear(activeFormulaCell, targetCells, ptoTab, ptoPlanYear);

    setPtoFormulaCell(nextActiveCell);
    setPtoFormulaDraft("");
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoSelectionAnchorCell(nextActiveCell);
    setPtoSelectedCellKeys(targetCells.map((targetCell) => formulaSelectionKey(targetCell)));
    if (needsSnapshotSave) requestPtoDatabaseSave();
    return true;
  };

  const commitInlineFormulaEdit = () => {
    if (!activeInlineEditCell) return;
    const result = commitFormulaCellValue(activeInlineEditCell, ptoFormulaDraft);
    if (!result.committed) return;

    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoFormulaDraft(ptoFormulaDraft.trim() ? formatPtoFormulaNumber(parseDecimalValue(ptoFormulaDraft)) : "");
    if (!result.inlineDatabaseWrite) requestPtoDatabaseSave();
  };

  const commitFormulaBarEdit = () => {
    if (!activeFormulaCell) return;

    if (!activeFormulaRow || activeFormulaCell.editable === false) {
      setPtoFormulaDraft(formatPtoFormulaNumber(undefined));
      return;
    }

    const result = commitFormulaCellValue(activeFormulaCell, ptoFormulaDraft);
    setPtoFormulaDraft(ptoFormulaDraft.trim() ? formatPtoFormulaNumber(parseDecimalValue(ptoFormulaDraft)) : "");

    if (result.committed && !result.inlineDatabaseWrite) {
      requestPtoDatabaseSave();
    }
  };

  const updateFormulaDraft = (value: string) => {
    if (!ptoDateEditing) return;
    setPtoFormulaDraft(value);
  };

  const updateFormulaValue = (value: string) => {
    if (!ptoDateEditing) return;

    setPtoFormulaDraft(value);
    if (activeInlineEditCell) return;
    if (!activeFormulaCell || !activeFormulaRow || activeFormulaCell.editable === false) return;
    commitFormulaCellValue(activeFormulaCell, value);
  };

  return {
    clearSelectedFormulaCells,
    commitFormulaCellValue,
    commitFormulaBarEdit,
    commitInlineFormulaEdit,
    updateFormulaDraft,
    updateFormulaValue,
  };
}
