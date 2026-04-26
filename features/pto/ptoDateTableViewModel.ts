import { createPtoDateTableModel, createPtoEffectiveCarryoverGetter, createPtoRowDateTotalsGetter } from "@/features/pto/ptoDateTableModel";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import { previousPtoYearLabel, ptoAreaMatches, ptoRowHasYear } from "@/lib/domain/pto/date-table";

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
  const filteredRows = rows.filter((row) => ptoAreaMatches(row.area, ptoAreaFilter) && ptoRowHasYear(row, ptoPlanYear));
  const rowById = new Map(rows.map((row) => [row.id, row] as const));
  const getRowDateTotals = createPtoRowDateTotalsGetter(ptoPlanYear);
  const getEffectiveCarryover = createPtoEffectiveCarryoverGetter(rows, ptoPlanYear);
  const carryoverHeader = `Остатки ${previousPtoYearLabel(ptoPlanYear)}`;
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
