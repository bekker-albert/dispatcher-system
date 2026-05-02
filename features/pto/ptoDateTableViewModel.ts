import { createPtoDateTableModel, createPtoEffectiveCarryoverGetter, createPtoRowDateTotalsGetter } from "@/features/pto/ptoDateTableModel";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import { previousPtoYearLabel, ptoAreaMatches, ptoRowHasYear, type PtoPlanRow } from "@/lib/domain/pto/date-table";

const emptyPtoRowById = new Map<string, PtoPlanRow>();
const ptoCarryoverHeaderLabel = "\u041e\u0441\u0442\u0430\u0442\u043a\u0438";

type PtoDateTableViewModelOptions = Pick<
  PtoDateTableContainerProps,
  | "rows"
  | "options"
  | "ptoTab"
  | "ptoAreaFilter"
  | "ptoPlanYear"
  | "reportDate"
  | "ptoYearMonths"
  | "ptoMonthGroups"
  | "ptoDateEditing"
  | "ptoColumnWidths"
>;

export function createPtoDateFilteredRows(
  rows: PtoPlanRow[],
  ptoAreaFilter: string,
  ptoPlanYear: string,
) {
  return rows.filter((row) => ptoAreaMatches(row.area, ptoAreaFilter) && ptoRowHasYear(row, ptoPlanYear));
}

export function createPtoDateRowById(rows: PtoPlanRow[], ptoDateEditing: boolean) {
  return ptoDateEditing ? new Map(rows.map((row) => [row.id, row] as const)) : emptyPtoRowById;
}

export function createPtoCarryoverHeader(ptoPlanYear: string) {
  return `${ptoCarryoverHeaderLabel} ${previousPtoYearLabel(ptoPlanYear)}`;
}

export function createPtoDateTableViewModel({
  rows,
  options = {},
  ptoTab,
  ptoAreaFilter,
  ptoPlanYear,
  reportDate,
  ptoYearMonths,
  ptoMonthGroups,
  ptoDateEditing,
  ptoColumnWidths,
}: PtoDateTableViewModelOptions) {
  const showLocation = options.showLocation !== false;
  const showCustomerCode = ptoTab === "plan";
  const editableMonthTotal = options.editableMonthTotal === true;
  const filteredRows = createPtoDateFilteredRows(rows, ptoAreaFilter, ptoPlanYear);
  const rowById = createPtoDateRowById(rows, ptoDateEditing);
  const getRowDateTotals = createPtoRowDateTotalsGetter(ptoPlanYear);
  const getEffectiveCarryover = createPtoEffectiveCarryoverGetter(rows, ptoPlanYear);
  const carryoverHeader = createPtoCarryoverHeader(ptoPlanYear);
  const {
    displayPtoMonthGroups,
    tableColumns,
    tableMinWidth,
    columnWidthByKey,
  } = createPtoDateTableModel({
    showCustomerCode,
    showLocation,
    planYear: ptoPlanYear,
    reportDate,
    yearMonths: ptoYearMonths,
    monthGroups: ptoMonthGroups,
    editing: ptoDateEditing,
    columnWidths: ptoColumnWidths,
  });

  return {
    carryoverHeader,
    columnWidthByKey,
    displayPtoMonthGroups,
    editableMonthTotal,
    filteredRows,
    getEffectiveCarryover,
    getRowDateTotals,
    rowById,
    showCustomerCode,
    showLocation,
    tableColumns,
    tableMinWidth,
  };
}
