import type { PtoPlanRow } from "../../lib/domain/pto/date-table";
import {
  editableGridArrowOffset,
  toggleEditableGridSelectionKey,
  type EditableGridArrowKey,
} from "../../shared/editable-grid/selection";
import { ptoFormulaCellKey, ptoFormulaTemplateKey } from "./ptoDateFormulaKeys";
import type {
  PtoFormulaCell,
  PtoFormulaCellTemplate,
  PtoFormulaCellWithoutScope,
} from "./ptoDateFormulaTypes";

type PtoFormulaCellFromSelectionKey = (key: string) => PtoFormulaCellWithoutScope | null;

type ResolvePtoFormulaMoveTargetOptions = {
  activeCell: PtoFormulaCell | null;
  key: EditableGridArrowKey;
  rowIndexById: Map<string, number>;
  templateIndexByKey: Map<string, number>;
  templates: PtoFormulaCellTemplate[];
  filteredRows: PtoPlanRow[];
  formulaCellFromTemplate: (rowId: string, template: PtoFormulaCellTemplate) => PtoFormulaCellWithoutScope;
};

export function withPtoFormulaScope(
  cell: PtoFormulaCellWithoutScope,
  table: string,
  year: string,
): PtoFormulaCell {
  return { ...cell, table, year };
}

export function resolvePtoFormulaAnchor(
  anchorCell: PtoFormulaCell | null,
  table: string,
  year: string,
  targetCell: PtoFormulaCell,
) {
  return anchorCell?.table === table && anchorCell.year === year ? anchorCell : targetCell;
}

export function togglePtoFormulaSelectionKeys(currentKeys: string[], selectionScope: string, targetKey: string) {
  const scopedKeys = currentKeys.filter((key) => key.startsWith(selectionScope));
  return toggleEditableGridSelectionKey(scopedKeys, targetKey);
}

export function selectedPtoFormulaCells(
  selectedKeys: Set<string>,
  formulaCellFromSelectionKey: PtoFormulaCellFromSelectionKey,
) {
  return Array.from(selectedKeys)
    .map((key) => formulaCellFromSelectionKey(key))
    .filter((formulaCell): formulaCell is PtoFormulaCellWithoutScope => formulaCell !== null);
}

export function resolvePtoFormulaMoveTarget({
  activeCell,
  key,
  rowIndexById,
  templateIndexByKey,
  templates,
  filteredRows,
  formulaCellFromTemplate,
}: ResolvePtoFormulaMoveTargetOptions) {
  if (!activeCell || templates.length === 0) return null;

  const offset = editableGridArrowOffset(key);
  const currentRowIndex = rowIndexById.get(activeCell.rowId);
  const currentColumnIndex = templateIndexByKey.get(ptoFormulaTemplateKey(activeCell));
  if (currentRowIndex === undefined || currentColumnIndex === undefined) return null;

  const nextRowIndex = Math.min(filteredRows.length - 1, Math.max(0, currentRowIndex + offset.rowOffset));
  const nextColumnIndex = Math.min(templates.length - 1, Math.max(0, currentColumnIndex + offset.columnOffset));
  const nextRow = filteredRows[nextRowIndex];
  const nextTemplate = templates[nextColumnIndex];

  return nextRow && nextTemplate ? formulaCellFromTemplate(nextRow.id, nextTemplate) : null;
}

export function resolvePtoFormulaActiveAfterClear(
  activeCell: PtoFormulaCell | null,
  targetCells: PtoFormulaCellWithoutScope[],
  table: string,
  year: string,
) {
  return activeCell && targetCells.some((targetCell) => ptoFormulaCellKey(targetCell) === ptoFormulaCellKey(activeCell))
    ? activeCell
    : withPtoFormulaScope(targetCells[0], table, year);
}
