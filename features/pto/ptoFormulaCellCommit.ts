import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaTypes";
import type { PtoRowsSetter } from "@/features/pto/ptoDateTableTypes";
import { parseDecimalInput } from "@/lib/domain/pto/formatting";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type CommitPtoFormulaCellValueOptions = {
  ptoDateEditing: boolean;
  cell: PtoFormulaCell;
  value: string;
  setRows: PtoRowsSetter;
  ptoPlanYear: string;
  clearPtoCarryoverOverride: (setRows: PtoRowsSetter, id: string, year: string) => void;
  updatePtoDateRow: (setRows: PtoRowsSetter, id: string, field: keyof Omit<PtoPlanRow, "id" | "dailyPlans">, value: string) => void;
  updatePtoDateDay: (setRows: PtoRowsSetter, id: string, day: string, value: string) => void;
  updatePtoMonthTotal: (setRows: PtoRowsSetter, id: string, days: string[], value: string) => void;
};

export function commitPtoFormulaCellValue({
  ptoDateEditing,
  cell,
  value,
  setRows,
  ptoPlanYear,
  clearPtoCarryoverOverride,
  updatePtoDateRow,
  updatePtoDateDay,
  updatePtoMonthTotal,
}: CommitPtoFormulaCellValueOptions) {
  if (!ptoDateEditing) return false;
  if (cell.editable === false) return false;
  if (value.trim() !== "" && parseDecimalInput(value) === null) return false;

  if (cell.kind === "carryover") {
    if (value.trim() === "") {
      clearPtoCarryoverOverride(setRows, cell.rowId, ptoPlanYear);
      return true;
    }

    updatePtoDateRow(setRows, cell.rowId, "carryover", value);
    return true;
  }

  if (cell.kind === "month" && cell.days) {
    updatePtoMonthTotal(setRows, cell.rowId, cell.days, value);
    return true;
  }

  if (cell.kind === "day" && cell.day) {
    updatePtoDateDay(setRows, cell.rowId, cell.day, value);
    return true;
  }

  return false;
}
