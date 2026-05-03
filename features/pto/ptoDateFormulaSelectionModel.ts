import type { PtoPlanRow } from "../../lib/domain/pto/date-table";
import {
  editableGridArrowOffset,
  editableGridAxisCellByOffset,
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
  templateIndexByKey,
  templates,
  filteredRows,
  formulaCellFromTemplate,
}: ResolvePtoFormulaMoveTargetOptions) {
  if (!activeCell || templates.length === 0) return null;

  const offset = editableGridArrowOffset(key);
  const target = editableGridAxisCellByOffset(
    filteredRows.map((row) => row.id),
    templates.map(ptoFormulaTemplateKey),
    activeCell.rowId,
    ptoFormulaTemplateKey(activeCell),
    offset.rowOffset,
    offset.columnOffset,
    (rowId, templateKey) => {
      const templateIndex = templateIndexByKey.get(templateKey);
      const template = templateIndex === undefined ? undefined : templates[templateIndex];
      return template ? formulaCellFromTemplate(rowId, template) : null;
    },
  );

  return target?.cell ?? null;
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
