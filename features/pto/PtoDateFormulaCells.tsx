"use client";

import type {
  PtoDateFormulaCellInteractionProps,
  PtoDateFormulaCellStateProps,
} from "@/features/pto/PtoDateFormulaCellsTypes";
import {
  PtoCarryoverFormulaCell,
  PtoMonthFormulaCells,
  PtoYearFormulaTotalCell,
} from "@/features/pto/PtoDateFormulaCellsParts";
import type { PtoFormulaCellWithoutScope } from "@/features/pto/ptoDateFormulaTypes";
import type { PtoMonthGroupView, PtoRowDateTotals } from "@/features/pto/ptoDateTableModel";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type PtoDateFormulaCellsProps = PtoDateFormulaCellStateProps & PtoDateFormulaCellInteractionProps & {
  row: PtoPlanRow;
  carryoverHeader: string;
  displayMonthGroups: PtoMonthGroupView[];
  editableMonthTotal: boolean;
  effectiveCarryover: number;
  rowDateTotals: PtoRowDateTotals | undefined;
  rowFormulaCells: PtoFormulaCellWithoutScope[];
  rowYearTotalWithCarryover: number;
};

export function PtoDateFormulaCells({
  row,
  carryoverHeader,
  displayMonthGroups,
  editableMonthTotal,
  effectiveCarryover,
  rowDateTotals,
  rowFormulaCells,
  rowYearTotalWithCarryover,
  ptoDateEditing,
  ptoFormulaDraft,
  ptoSelectionDraggingRef,
  formulaCellActive,
  formulaCellEditing,
  formulaCellSelected,
  formulaCellDomKey,
  selectFormulaCell,
  selectFormulaRange,
  startInlineFormulaEdit,
  commitInlineFormulaEdit,
  updateFormulaValue,
  handleFormulaCellMouseDown,
  handleFormulaCellMouseEnter,
  handleFormulaCellKeyDown,
}: PtoDateFormulaCellsProps) {
  const formulaCellStateProps = {
    ptoDateEditing,
    formulaCellActive,
    formulaCellEditing,
    formulaCellSelected,
  };
  const formulaCellInteractionProps = {
    ptoFormulaDraft,
    ptoSelectionDraggingRef,
    formulaCellDomKey,
    selectFormulaCell,
    selectFormulaRange,
    startInlineFormulaEdit,
    commitInlineFormulaEdit,
    updateFormulaValue,
    handleFormulaCellMouseDown,
    handleFormulaCellMouseEnter,
    handleFormulaCellKeyDown,
  };

  return (
    <>
      <PtoCarryoverFormulaCell
        {...formulaCellStateProps}
        {...formulaCellInteractionProps}
        rowId={row.id}
        carryoverHeader={carryoverHeader}
        effectiveCarryover={effectiveCarryover}
        rowFormulaCells={rowFormulaCells}
      />
      <PtoYearFormulaTotalCell rowYearTotalWithCarryover={rowYearTotalWithCarryover} />
      <PtoMonthFormulaCells
        {...formulaCellStateProps}
        {...formulaCellInteractionProps}
        row={row}
        displayMonthGroups={displayMonthGroups}
        editableMonthTotal={editableMonthTotal}
        rowDateTotals={rowDateTotals}
      />
    </>
  );
}
