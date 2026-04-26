import type { KeyboardEvent, MouseEvent } from "react";
import {
  createPtoDateFormulaModel,
  getPtoFormulaCellValue,
  ptoFormulaCellMatches,
  resolvePtoFormulaActiveAfterClear,
  resolvePtoFormulaAnchor,
  resolvePtoFormulaMoveTarget,
  selectedPtoFormulaCells,
  togglePtoFormulaSelectionKeys,
  withPtoFormulaScope,
  type PtoFormulaCell,
} from "@/features/pto/ptoDateFormulaModel";
import type { PtoMonthGroupView, PtoRowDateTotals } from "@/features/pto/ptoDateTableModel";
import type { PtoDateTableContainerProps, PtoRowsSetter } from "@/features/pto/ptoDateTableTypes";
import { formatPtoFormulaNumber, parseDecimalInput, parseDecimalValue } from "@/lib/domain/pto/formatting";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import { isEditableGridArrowKey } from "@/shared/editable-grid/selection";

type PtoDateFormulaControllerOptions = Pick<
  PtoDateTableContainerProps,
  | "ptoTab"
  | "ptoPlanYear"
  | "ptoDateEditing"
  | "ptoFormulaCell"
  | "ptoFormulaDraft"
  | "ptoInlineEditCell"
  | "ptoInlineEditInitialDraft"
  | "ptoSelectionAnchorCell"
  | "ptoSelectedCellKeys"
  | "ptoSelectionDraggingRef"
  | "setRows"
  | "setPtoFormulaCell"
  | "setPtoFormulaDraft"
  | "setPtoInlineEditCell"
  | "setPtoInlineEditInitialDraft"
  | "setPtoSelectionAnchorCell"
  | "setPtoSelectedCellKeys"
  | "requestPtoDatabaseSave"
  | "updatePtoDateRow"
  | "clearPtoCarryoverOverride"
  | "updatePtoDateDay"
  | "updatePtoMonthTotal"
> & {
  carryoverHeader: string;
  displayPtoMonthGroups: PtoMonthGroupView[];
  editableMonthTotal: boolean;
  filteredRows: PtoPlanRow[];
  renderedRows: PtoPlanRow[];
  rowById: Map<string, PtoPlanRow>;
  getEffectiveCarryover: (row: PtoPlanRow) => number;
  getRowDateTotals: (row: PtoPlanRow) => PtoRowDateTotals;
  scrollFormulaCellIntoView: (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => void;
};

type PtoFormulaCellWithoutScope = Omit<PtoFormulaCell, "table" | "year">;

function createFormulaValueContext({
  rowById,
  getEffectiveCarryover,
  getRowDateTotals,
}: Pick<PtoDateFormulaControllerOptions, "rowById" | "getEffectiveCarryover" | "getRowDateTotals">) {
  return { rowById, getEffectiveCarryover, getRowDateTotals };
}

const noopFormulaCellHandler = () => undefined;

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
  if (!ptoDateEditing) {
    return {
      activeFormulaCell: null,
      activeFormulaValue: undefined,
      formulaCellActive: () => false,
      formulaCellDomKey: () => "",
      formulaCellEditing: () => false,
      formulaCellSelected: () => false,
      formulaCellsByRowId: new Map<string, PtoFormulaCellWithoutScope[]>(),
      formulaInputDisabled: true,
      handleFormulaCellKeyDown: noopFormulaCellHandler,
      handleFormulaCellMouseDown: noopFormulaCellHandler,
      handleFormulaCellMouseEnter: noopFormulaCellHandler,
      selectFormulaCell: noopFormulaCellHandler,
      selectFormulaRange: noopFormulaCellHandler,
      startInlineFormulaEdit: noopFormulaCellHandler,
      commitInlineFormulaEdit: noopFormulaCellHandler,
      updateFormulaValue: noopFormulaCellHandler,
    };
  }

  const activeFormulaCell = ptoFormulaCell?.table === ptoTab && ptoFormulaCell.year === ptoPlanYear ? ptoFormulaCell : null;
  const activeInlineEditCell = ptoInlineEditCell?.table === ptoTab && ptoInlineEditCell.year === ptoPlanYear ? ptoInlineEditCell : null;
  const activeFormulaRow = activeFormulaCell ? rowById.get(activeFormulaCell.rowId) : undefined;
  const formulaValueContext = createFormulaValueContext({ rowById, getEffectiveCarryover, getRowDateTotals });
  const activeFormulaValue = activeFormulaCell
    ? getPtoFormulaCellValue(activeFormulaCell, formulaValueContext)
    : undefined;
  const formulaInputDisabled = !ptoDateEditing || !activeFormulaCell || !activeFormulaRow || activeFormulaCell.editable === false;
  const {
    formulaCellDomKey,
    formulaSelectionKey,
    formulaCellsByRowId,
    formulaSelectionScope,
    selectedFormulaCellKeys,
    formulaCellTemplates,
    formulaTemplateIndexByKey,
    formulaRowIndexById,
    formulaCellFromTemplate,
    formulaCellFromSelectionKey,
    formulaRangeKeys,
    formulaCellSelected,
  } = createPtoDateFormulaModel({
    table: ptoTab,
    year: ptoPlanYear,
    renderedRows,
    filteredRows,
    displayMonthGroups: displayPtoMonthGroups,
    editableMonthTotal,
    carryoverHeader,
    selectedCellKeys: ptoSelectedCellKeys,
  });

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
    setPtoFormulaCell(nextCell);
    setPtoInlineEditCell(nextCell);
    setPtoFormulaDraft(draft);
    setPtoInlineEditInitialDraft(draft);
  };

  const cancelInlineFormulaEdit = () => {
    setPtoFormulaDraft(ptoInlineEditInitialDraft);
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
  };

  const formulaCellActive = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => (
    ptoFormulaCellMatches(activeFormulaCell, ptoTab, ptoPlanYear, rowId, kind, key)
  );
  const formulaCellEditing = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => (
    ptoFormulaCellMatches(activeInlineEditCell, ptoTab, ptoPlanYear, rowId, kind, key)
  );
  const focusFormulaCell = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => {
    const focusTarget = () => {
      const target = document.querySelector<HTMLInputElement>(`[data-pto-cell-key="${formulaCellDomKey(cell)}"]`);
      if (!target) return false;

      target.focus();
      return true;
    };

    window.requestAnimationFrame(() => {
      const focused = focusTarget();
      if (focused) return;

      scrollFormulaCellIntoView(cell);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(focusTarget);
      });
    });
  };


  const commitFormulaCellValue = (cell: PtoFormulaCell, value: string) => {
    if (!ptoDateEditing) return false;
    if (cell.editable === false) return false;
    if (value.trim() !== "" && parseDecimalInput(value) === null) return false;

    if (cell.kind === "carryover") {
      if (value.trim() === "") {
        clearPtoCarryoverOverride(setRows as PtoRowsSetter, cell.rowId, ptoPlanYear);
        return true;
      }

      updatePtoDateRow(setRows as PtoRowsSetter, cell.rowId, "carryover", value);
      return true;
    }

    if (cell.kind === "month" && cell.days) {
      updatePtoMonthTotal(setRows as PtoRowsSetter, cell.rowId, cell.days, value);
      return true;
    }

    if (cell.kind === "day" && cell.day) {
      updatePtoDateDay(setRows as PtoRowsSetter, cell.rowId, cell.day, value);
      return true;
    }

    return false;
  };

  const clearSelectedFormulaCells = (fallbackCell: PtoFormulaCellWithoutScope) => {
    const cellsToClear = selectedPtoFormulaCells(selectedFormulaCellKeys, formulaCellFromSelectionKey);
    const targetCells = cellsToClear.length ? cellsToClear : [fallbackCell];
    let committed = false;

    targetCells.forEach((targetCell) => {
      committed = commitFormulaCellValue({ ...targetCell, table: ptoTab, year: ptoPlanYear }, "") || committed;
    });

    if (!committed) return false;

    const nextActiveCell = resolvePtoFormulaActiveAfterClear(activeFormulaCell, targetCells, ptoTab, ptoPlanYear);

    setPtoFormulaCell(nextActiveCell);
    setPtoFormulaDraft("");
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoSelectionAnchorCell(nextActiveCell);
    setPtoSelectedCellKeys(targetCells.map((targetCell) => formulaSelectionKey(targetCell)));
    requestPtoDatabaseSave();
    return true;
  };

  const collapseFormulaSelection = (fallbackCell: PtoFormulaCellWithoutScope) => {
    const nextActiveCell = activeFormulaCell ?? withPtoFormulaScope(fallbackCell, ptoTab, ptoPlanYear);

    setPtoFormulaCell(nextActiveCell);
    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoSelectionAnchorCell(nextActiveCell);
    setPtoSelectedCellKeys([formulaSelectionKey(nextActiveCell)]);
  };

  const commitInlineFormulaEdit = () => {
    if (!activeInlineEditCell) return;
    const committed = commitFormulaCellValue(activeInlineEditCell, ptoFormulaDraft);
    if (!committed) return;

    setPtoInlineEditCell(null);
    setPtoInlineEditInitialDraft("");
    setPtoFormulaDraft(ptoFormulaDraft.trim() ? formatPtoFormulaNumber(parseDecimalValue(ptoFormulaDraft)) : "");
    requestPtoDatabaseSave();
  };

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

  const updateFormulaValue = (value: string) => {
    if (!ptoDateEditing) return;

    setPtoFormulaDraft(value);
    if (activeInlineEditCell) return;
    if (!activeFormulaCell || !activeFormulaRow || activeFormulaCell.editable === false) return;
    commitFormulaCellValue(activeFormulaCell, value);
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
    focusFormulaCell(nextCell);
  };

  const handleFormulaCellKeyDown = (event: KeyboardEvent<HTMLInputElement>, cell: PtoFormulaCellWithoutScope, value: number | undefined, isEditing: boolean) => {
    if (!ptoDateEditing) return;

    if (isEditing) {
      if (isEditableGridArrowKey(event.key)) {
        event.preventDefault();
        if (!activeInlineEditCell) return;

        const committed = commitFormulaCellValue(activeInlineEditCell, ptoFormulaDraft);
        if (!committed) return;

        setPtoInlineEditCell(null);
        setPtoInlineEditInitialDraft("");
        moveFormulaSelection(event.key);
        requestPtoDatabaseSave();
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

  const handleFormulaCellMouseDown = (event: MouseEvent<HTMLElement>, cell: PtoFormulaCellWithoutScope, value: number | undefined, isEditing: boolean) => {
    if (!ptoDateEditing) return;
    if (event.button !== 0 || isEditing) return;

    ptoSelectionDraggingRef.current = true;
    if (event.ctrlKey || event.metaKey) {
      toggleFormulaCell(cell, value);
    } else if (event.shiftKey) {
      selectFormulaRange(cell, value);
    } else {
      selectFormulaCell(cell, value);
    }
  };

  const handleFormulaCellMouseEnter = (event: MouseEvent<HTMLElement>, cell: PtoFormulaCellWithoutScope, value: number | undefined, isEditing: boolean) => {
    if (!ptoDateEditing) return;
    if (!ptoSelectionDraggingRef.current || event.buttons !== 1 || event.ctrlKey || event.metaKey || isEditing) return;
    selectFormulaRange(cell, value);
  };

  return {
    activeFormulaCell,
    activeFormulaValue,
    formulaCellActive,
    formulaCellDomKey,
    formulaCellEditing,
    formulaCellSelected,
    formulaCellsByRowId,
    formulaInputDisabled,
    handleFormulaCellKeyDown,
    handleFormulaCellMouseDown,
    handleFormulaCellMouseEnter,
    selectFormulaCell,
    selectFormulaRange,
    startInlineFormulaEdit,
    commitInlineFormulaEdit,
    updateFormulaValue,
  };
}
