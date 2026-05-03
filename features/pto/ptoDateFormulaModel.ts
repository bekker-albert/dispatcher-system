import type { PtoPlanRow } from "../../lib/domain/pto/date-table";
import { editableGridAxisRangeKeys } from "../../shared/editable-grid/selection";
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
  const formulaRowKeys = filteredRows.map((row) => row.id);
  const formulaTemplateKeys = formulaCellTemplates.map(ptoFormulaTemplateKey);
  const formulaCellFromSelectionKey = (key: string): PtoFormulaCellWithoutScope | null => {
    if (!key.startsWith(formulaSelectionScope)) return null;

    const [rowId, kind, value = ""] = key.slice(formulaSelectionScope.length).split(":");
    if (!rowId || !formulaRowIndexById.has(rowId)) return null;

    const template = formulaTemplateByKey.get(`${kind}:${value}`);

    return template ? formulaCellFromTemplate(rowId, template) : null;
  };
  const formulaRangeKeys = (anchor: PtoFormulaCell, target: PtoFormulaCell) => {
    const targetKey = formulaSelectionKey(target);

    return editableGridAxisRangeKeys(
      formulaRowKeys,
      formulaTemplateKeys,
      anchor.rowId,
      ptoFormulaTemplateKey(anchor),
      target.rowId,
      ptoFormulaTemplateKey(target),
      (rowId, templateKey) => {
        const template = formulaTemplateByKey.get(templateKey);
        return template ? formulaSelectionKey(formulaCellFromTemplate(rowId, template)) : targetKey;
      },
      targetKey,
    );
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
