import type { KeyboardEvent } from "react";
import { getPtoFormulaCellValue } from "@/features/pto/ptoDateFormulaModel";
import { resolvePtoFormulaMoveTarget } from "@/features/pto/ptoDateFormulaSelectionModel";
import type {
  PtoFormulaCell,
  PtoFormulaCellTemplate,
  PtoFormulaCellWithoutScope,
} from "@/features/pto/ptoDateFormulaTypes";
import type { PtoFormulaValueContext } from "@/features/pto/ptoDateFormulaControllerTypes";
import { focusPtoFormulaCell } from "@/features/pto/ptoFormulaCellFocus";
import { isEditableGridArrowKey } from "@/shared/editable-grid/selection";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type PtoDateFormulaKeyboardHandlersOptions = {
  activeFormulaCell: PtoFormulaCell | null;
  activeInlineEditCell: PtoFormulaCell | null;
  cancelInlineFormulaEdit: () => void;
  clearSelectedFormulaCells: (fallbackCell: PtoFormulaCellWithoutScope) => boolean;
  collapseFormulaSelection: (fallbackCell: PtoFormulaCellWithoutScope) => void;
  commitFormulaCellValue: (cell: PtoFormulaCell, value: string) => { committed: boolean; inlineDatabaseWrite: boolean };
  commitInlineFormulaEdit: () => void;
  filteredRows: PtoPlanRow[];
  formulaCellDomKey: (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => string;
  formulaCellFromTemplate: (rowId: string, template: PtoFormulaCellTemplate) => PtoFormulaCellWithoutScope;
  formulaCellTemplates: PtoFormulaCellTemplate[];
  formulaRowIndexById: Map<string, number>;
  formulaTemplateIndexByKey: Map<string, number>;
  formulaValueContext: PtoFormulaValueContext;
  ptoDateEditing: boolean;
  ptoFormulaDraft: string;
  requestPtoDatabaseSave: () => void;
  scrollFormulaCellIntoView: (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => void;
  selectFormulaCell: (cell: PtoFormulaCellWithoutScope, value: number | undefined) => void;
  setPtoInlineEditCell: (cell: PtoFormulaCell | null) => void;
  setPtoInlineEditInitialDraft: (draft: string) => void;
  startInlineFormulaEdit: (cell: PtoFormulaCellWithoutScope, value: number | undefined, draftOverride?: string) => void;
};

export function createPtoDateFormulaKeyboardHandlers({
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
  formulaRowIndexById,
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
}: PtoDateFormulaKeyboardHandlersOptions) {
  const handleInlineFormulaKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitInlineFormulaEdit();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelInlineFormulaEdit();
    }
  };

  const moveFormulaSelection = (key: string) => {
    if (!ptoDateEditing) return;
    if (!activeFormulaCell || !isEditableGridArrowKey(key)) return;

    const nextCell = resolvePtoFormulaMoveTarget({
      activeCell: activeFormulaCell,
      key,
      rowIndexById: formulaRowIndexById,
      templateIndexByKey: formulaTemplateIndexByKey,
      templates: formulaCellTemplates,
      filteredRows,
      formulaCellFromTemplate,
    });

    if (!nextCell) return;
    selectFormulaCell(nextCell, getPtoFormulaCellValue(nextCell, formulaValueContext));
    focusPtoFormulaCell({ cell: nextCell, formulaCellDomKey, scrollFormulaCellIntoView });
  };

  const handleFormulaCellKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    cell: PtoFormulaCellWithoutScope,
    value: number | undefined,
    isEditing: boolean,
  ) => {
    if (!ptoDateEditing) return;

    if (isEditing) {
      if (isEditableGridArrowKey(event.key)) {
        event.preventDefault();
        if (!activeInlineEditCell) return;

        const result = commitFormulaCellValue(activeInlineEditCell, ptoFormulaDraft);
        if (!result.committed) return;

        setPtoInlineEditCell(null);
        setPtoInlineEditInitialDraft("");
        moveFormulaSelection(event.key);
        if (!result.inlineDatabaseWrite) requestPtoDatabaseSave();
        return;
      }

      handleInlineFormulaKeyDown(event);
      return;
    }

    if (isEditableGridArrowKey(event.key)) {
      event.preventDefault();
      moveFormulaSelection(event.key);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      collapseFormulaSelection(cell);
      return;
    }

    if (cell.editable === false) return;

    if (/^[0-9]$/.test(event.key) || event.key === "-" || event.key === "," || event.key === ".") {
      event.preventDefault();
      startInlineFormulaEdit(cell, value, event.key === "." || event.key === "," ? "0," : event.key);
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      clearSelectedFormulaCells(cell);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      startInlineFormulaEdit(cell, value);
    }
  };

  return { handleFormulaCellKeyDown };
}
