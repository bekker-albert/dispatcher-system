import type { Dispatch, KeyboardEvent, MouseEvent, RefObject, SetStateAction } from "react";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { PtoMonthGroupView, PtoRowDateTotals } from "@/features/pto/ptoDateTableModel";
import type { PtoRowsSetter } from "@/features/pto/ptoDateTableTypes";
import type {
  PtoFormulaCell,
  PtoFormulaCellIdentity,
  PtoFormulaCellWithoutScope,
} from "@/features/pto/ptoDateFormulaTypes";

type PtoFormulaDateRowField = keyof Omit<PtoPlanRow, "id" | "dailyPlans">;

export type PtoDateFormulaControllerOptions = {
  ptoTab: string;
  ptoPlanYear: string;
  ptoDateEditing: boolean;
  ptoFormulaCell: PtoFormulaCell | null;
  ptoFormulaDraft: string;
  ptoInlineEditCell: PtoFormulaCell | null;
  ptoInlineEditInitialDraft: string;
  ptoSelectionAnchorCell: PtoFormulaCell | null;
  ptoSelectedCellKeys: string[];
  ptoSelectionDraggingRef: RefObject<boolean>;
  setRows: PtoRowsSetter;
  setPtoFormulaCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoFormulaDraft: Dispatch<SetStateAction<string>>;
  setPtoInlineEditCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoInlineEditInitialDraft: Dispatch<SetStateAction<string>>;
  setPtoSelectionAnchorCell: Dispatch<SetStateAction<PtoFormulaCell | null>>;
  setPtoSelectedCellKeys: Dispatch<SetStateAction<string[]>>;
  requestPtoDatabaseSave: () => void;
  updatePtoDateRow: (setRows: PtoRowsSetter, id: string, field: PtoFormulaDateRowField, value: string) => void;
  clearPtoCarryoverOverride: (setRows: PtoRowsSetter, id: string, year: string) => void;
  updatePtoDateDay: (setRows: PtoRowsSetter, id: string, day: string, value: string) => void;
  updatePtoMonthTotal: (setRows: PtoRowsSetter, id: string, days: string[], value: string) => void;
  carryoverHeader: string;
  displayPtoMonthGroups: PtoMonthGroupView[];
  editableMonthTotal: boolean;
  filteredRows: PtoPlanRow[];
  renderedRows: PtoPlanRow[];
  rowById: Map<string, PtoPlanRow>;
  getEffectiveCarryover: (row: PtoPlanRow) => number;
  getRowDateTotals: (row: PtoPlanRow) => PtoRowDateTotals;
  scrollFormulaCellIntoView: (cell: PtoFormulaCellIdentity) => void;
};

export type PtoFormulaValueContext = Pick<
  PtoDateFormulaControllerOptions,
  "rowById" | "getEffectiveCarryover" | "getRowDateTotals"
>;

export type PtoFormulaCellKeyHandler = (
  event: KeyboardEvent<HTMLInputElement>,
  cell: PtoFormulaCellWithoutScope,
  value: number | undefined,
  isEditing: boolean,
) => void;

export type PtoFormulaCellPointerHandler = (
  event: MouseEvent<HTMLElement>,
  cell: PtoFormulaCellWithoutScope,
  value: number | undefined,
  isEditing: boolean,
) => void;
