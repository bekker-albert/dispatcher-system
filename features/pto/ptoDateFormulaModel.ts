import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { PtoMonthGroupView, PtoRowDateTotals } from "@/features/pto/ptoDateTableModel";
import { editableGridArrowOffset, toggleEditableGridSelectionKey, type EditableGridArrowKey } from "@/shared/editable-grid/selection";

export type PtoFormulaCell = {
  table: string;
  year: string;
  rowId: string;
  kind: "carryover" | "month" | "day";
  label: string;
  day?: string;
  month?: string;
  days?: string[];
  editable?: boolean;
};

export type PtoFormulaCellWithoutScope = Omit<PtoFormulaCell, "table" | "year">;
export type PtoFormulaCellTemplate = Omit<PtoFormulaCell, "table" | "year" | "rowId">;

type PtoDateFormulaModelOptions = {
  table: string;
  year: string;
  renderedRows: PtoPlanRow[];
  filteredRows: PtoPlanRow[];
  displayMonthGroups: PtoMonthGroupView[];
  editableMonthTotal: boolean;
  carryoverHeader: string;
  selectedCellKeys: string[];
};

type PtoFormulaCellValueContext = {
  rowById: Map<string, PtoPlanRow>;
  getEffectiveCarryover: (row: PtoPlanRow) => number;
  getRowDateTotals: (row: PtoPlanRow) => PtoRowDateTotals;
};

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

function createPtoFormulaCellTemplates(
  displayMonthGroups: PtoMonthGroupView[],
  editableMonthTotal: boolean,
  carryoverHeader: string,
): PtoFormulaCellTemplate[] {
  return [
    { kind: "carryover", label: carryoverHeader },
    ...displayMonthGroups.flatMap((group) => [
      ...(editableMonthTotal
        ? [{
            kind: "month" as const,
            month: group.month,
            days: group.days,
            label: group.label,
            editable: true,
          }]
        : []),
      ...(group.expanded
        ? group.days.map((day) => ({
            kind: "day" as const,
            day,
            label: `${day.slice(8, 10)}.${day.slice(5, 7)}`,
          }))
        : []),
    ]),
  ];
}

export function ptoFormulaCellKey(cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) {
  return `${cell.rowId}:${cell.kind}:${cell.month ?? cell.day ?? ""}`;
}

export function ptoFormulaTemplateKey(cell: Pick<PtoFormulaCell, "kind" | "day" | "month">) {
  return `${cell.kind}:${cell.month ?? cell.day ?? ""}`;
}

function ptoFormulaCellFromParts(
  rowId: string,
  kind: PtoFormulaCell["kind"],
  key?: string,
): Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month"> {
  return {
    rowId,
    kind,
    ...(kind === "month" ? { month: key } : kind === "day" ? { day: key } : {}),
  };
}

export function createPtoDateFormulaModel({
  table,
  year,
  renderedRows,
  filteredRows,
  displayMonthGroups,
  editableMonthTotal,
  carryoverHeader,
  selectedCellKeys,
}: PtoDateFormulaModelOptions) {
  const formulaCellTemplates = createPtoFormulaCellTemplates(displayMonthGroups, editableMonthTotal, carryoverHeader);
  const formulaCellFromTemplate = (
    rowId: string,
    template: PtoFormulaCellTemplate,
  ): PtoFormulaCellWithoutScope => ({ rowId, ...template });
  const formulaCellRows = renderedRows.map((row) => ({
    row,
    cells: formulaCellTemplates.map((template) => formulaCellFromTemplate(row.id, template)),
  }));
  const formulaCellDomKey = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => (
    `${table}:${year}:${ptoFormulaCellKey(cell)}`
  );
  const formulaSelectionKey = formulaCellDomKey;
  const formulaCellsByRowId = new Map(formulaCellRows.map((formulaRow) => [formulaRow.row.id, formulaRow.cells] as const));
  const formulaSelectionScope = `${table}:${year}:`;
  const selectedFormulaCellKeys = new Set(selectedCellKeys.filter((key) => key.startsWith(formulaSelectionScope)));
  const formulaTemplateIndexByKey = new Map(formulaCellTemplates.map((cell, index) => [ptoFormulaTemplateKey(cell), index] as const));
  const formulaRowIndexById = new Map(filteredRows.map((row, index) => [row.id, index] as const));
  const formulaCellFromSelectionKey = (key: string): PtoFormulaCellWithoutScope | null => {
    if (!key.startsWith(formulaSelectionScope)) return null;

    const [rowId, kind, value = ""] = key.slice(formulaSelectionScope.length).split(":");
    if (!rowId || !formulaRowIndexById.has(rowId)) return null;

    const template = formulaCellTemplates.find((cell) => (
      cell.kind === kind
        && (kind === "month" ? cell.month === value : kind === "day" ? cell.day === value : value === "")
    ));

    return template ? formulaCellFromTemplate(rowId, template) : null;
  };
  const formulaRangeKeys = (anchor: PtoFormulaCell, target: PtoFormulaCell) => {
    const anchorRowIndex = formulaRowIndexById.get(anchor.rowId);
    const targetRowIndex = formulaRowIndexById.get(target.rowId);
    const anchorColumnIndex = formulaTemplateIndexByKey.get(ptoFormulaTemplateKey(anchor));
    const targetColumnIndex = formulaTemplateIndexByKey.get(ptoFormulaTemplateKey(target));

    if (
      anchorRowIndex === undefined
      || targetRowIndex === undefined
      || anchorColumnIndex === undefined
      || targetColumnIndex === undefined
    ) {
      return [formulaSelectionKey(target)];
    }

    const rowStart = Math.min(anchorRowIndex, targetRowIndex);
    const rowEnd = Math.max(anchorRowIndex, targetRowIndex);
    const columnStart = Math.min(anchorColumnIndex, targetColumnIndex);
    const columnEnd = Math.max(anchorColumnIndex, targetColumnIndex);
    const keys: string[] = [];

    for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex += 1) {
      const row = filteredRows[rowIndex];
      if (!row) continue;

      for (let columnIndex = columnStart; columnIndex <= columnEnd; columnIndex += 1) {
        const template = formulaCellTemplates[columnIndex];
        if (template) keys.push(formulaSelectionKey(formulaCellFromTemplate(row.id, template)));
      }
    }

    return keys.length ? keys : [formulaSelectionKey(target)];
  };
  const formulaCellSelected = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => (
    selectedFormulaCellKeys.has(formulaSelectionKey(ptoFormulaCellFromParts(rowId, kind, key)))
  );

  return {
    formulaCellRows,
    formulaCellKey: ptoFormulaCellKey,
    formulaCellDomKey,
    formulaSelectionKey,
    formulaCellsByRowId,
    formulaSelectionScope,
    selectedFormulaCellKeys,
    formulaCellTemplates,
    formulaTemplateKey: ptoFormulaTemplateKey,
    formulaTemplateIndexByKey,
    formulaRowIndexById,
    formulaCellFromTemplate,
    formulaCellFromSelectionKey,
    formulaRangeKeys,
    formulaCellSelected,
  };
}

export function getPtoFormulaCellValue(
  cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">,
  { rowById, getEffectiveCarryover, getRowDateTotals }: PtoFormulaCellValueContext,
) {
  const row = rowById.get(cell.rowId);
  if (!row) return undefined;

  if (cell.kind === "carryover") return getEffectiveCarryover(row);
  if (cell.kind === "month" && cell.month) return getRowDateTotals(row).monthTotals.get(cell.month)?.value;
  if (cell.kind === "day" && cell.day) return row.dailyPlans[cell.day];
  return undefined;
}

export function ptoFormulaCellMatches(
  cell: PtoFormulaCell | null,
  table: string,
  year: string,
  rowId: string,
  kind: PtoFormulaCell["kind"],
  key?: string,
) {
  if (!cell) return false;

  return cell.rowId === rowId
    && cell.kind === kind
    && cell.table === table
    && cell.year === year
    && (kind === "month" ? cell.month === key : kind === "day" ? cell.day === key : true);
}

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
