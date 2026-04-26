import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { PtoMonthGroupView } from "@/features/pto/ptoDateTableModel";

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
  };
}
