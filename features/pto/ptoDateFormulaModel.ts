import type { PtoPlanRow } from "../../lib/domain/pto/date-table";
import type { PtoMonthGroupView } from "./ptoDateTableModel";
import { ptoFormulaCellKey, ptoFormulaTemplateKey } from "./ptoDateFormulaKeys";
import type {
  PtoFormulaCell,
  PtoFormulaCellIdentity,
  PtoFormulaCellTemplate,
  PtoFormulaCellValueContext,
  PtoFormulaCellWithoutScope,
} from "./ptoDateFormulaTypes";

type PtoDateFormulaModelOptions = {
  table: string;
  year: string;
  renderedRows: PtoPlanRow[];
  filteredRows: PtoPlanRow[];
  displayMonthGroups: PtoMonthGroupView[];
  editableMonthTotal: boolean;
  carryoverHeader: string;
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

function ptoFormulaCellFromParts(
  rowId: string,
  kind: PtoFormulaCell["kind"],
  key?: string,
): PtoFormulaCellIdentity {
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
  const formulaCellDomKey = (cell: PtoFormulaCellIdentity) => (
    `${table}:${year}:${ptoFormulaCellKey(cell)}`
  );
  const formulaSelectionKey = formulaCellDomKey;
  const formulaCellsByRowId = new Map(formulaCellRows.map((formulaRow) => [formulaRow.row.id, formulaRow.cells] as const));
  const formulaSelectionScope = `${table}:${year}:`;
  const formulaTemplateIndexByKey = new Map(formulaCellTemplates.map((cell, index) => [ptoFormulaTemplateKey(cell), index] as const));
  const formulaTemplateByKey = new Map(formulaCellTemplates.map((cell) => [ptoFormulaTemplateKey(cell), cell] as const));
  const formulaRowIndexById = new Map(filteredRows.map((row, index) => [row.id, index] as const));
  const formulaCellFromSelectionKey = (key: string): PtoFormulaCellWithoutScope | null => {
    if (!key.startsWith(formulaSelectionScope)) return null;

    const [rowId, kind, value = ""] = key.slice(formulaSelectionScope.length).split(":");
    if (!rowId || !formulaRowIndexById.has(rowId)) return null;

    const template = formulaTemplateByKey.get(`${kind}:${value}`);

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

  return {
    formulaCellRows,
    formulaCellKey: ptoFormulaCellKey,
    formulaCellDomKey,
    formulaSelectionKey,
    formulaCellsByRowId,
    formulaSelectionScope,
    formulaCellTemplates,
    formulaTemplateKey: ptoFormulaTemplateKey,
    formulaTemplateIndexByKey,
    formulaTemplateByKey,
    formulaRowIndexById,
    formulaCellFromTemplate,
    formulaCellFromSelectionKey,
    formulaRangeKeys,
  };
}

export function createPtoDateFormulaSelectionModel({
  formulaSelectionKey,
  formulaSelectionScope,
  selectedCellKeys,
}: {
  formulaSelectionKey: (cell: PtoFormulaCellIdentity) => string;
  formulaSelectionScope: string;
  selectedCellKeys: string[];
}) {
  const selectedFormulaCellKeys = new Set(selectedCellKeys.filter((key) => key.startsWith(formulaSelectionScope)));
  const formulaCellSelected = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => (
    selectedFormulaCellKeys.has(formulaSelectionKey(ptoFormulaCellFromParts(rowId, kind, key)))
  );

  return {
    selectedFormulaCellKeys,
    formulaCellSelected,
  };
}

export function getPtoFormulaCellValue(
  cell: PtoFormulaCellIdentity,
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
