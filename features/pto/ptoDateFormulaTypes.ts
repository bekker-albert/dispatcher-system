import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { PtoRowDateTotals } from "@/features/pto/ptoDateTableModel";

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

export type PtoFormulaCellIdentity = Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">;
export type PtoFormulaTemplateIdentity = Pick<PtoFormulaCell, "kind" | "day" | "month">;

export type PtoFormulaCellValueContext = {
  rowById: Map<string, PtoPlanRow>;
  getEffectiveCarryover: (row: PtoPlanRow) => number;
  getRowDateTotals: (row: PtoPlanRow) => PtoRowDateTotals;
};
