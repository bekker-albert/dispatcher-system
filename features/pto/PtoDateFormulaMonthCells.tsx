"use client";

import { Fragment } from "react";
import { PtoDayFormulaCell } from "@/features/pto/PtoDateFormulaDayCell";
import { PtoMonthTotalFormulaCell } from "@/features/pto/PtoDateFormulaMonthTotalCell";
import type { SharedFormulaCellProps } from "@/features/pto/PtoDateFormulaCellPartTypes";
import type { PtoMonthGroupView, PtoRowDateTotals } from "@/features/pto/ptoDateTableModel";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type PtoMonthFormulaCellsProps = SharedFormulaCellProps & {
  row: PtoPlanRow;
  displayMonthGroups: PtoMonthGroupView[];
  editableMonthTotal: boolean;
  rowDateTotals: PtoRowDateTotals | undefined;
};

export function PtoMonthFormulaCells({
  row,
  displayMonthGroups,
  editableMonthTotal,
  rowDateTotals,
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
}: PtoMonthFormulaCellsProps) {
  const sharedProps = {
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
  };

  return (
    <>
      {displayMonthGroups.map((group) => {
        const monthTotal = rowDateTotals?.monthTotals.get(group.month);
        const monthValue = monthTotal?.hasValue ? monthTotal.value : undefined;

        return (
          <Fragment key={`${row.id}-${group.month}`}>
            <PtoMonthTotalFormulaCell
              {...sharedProps}
              rowId={row.id}
              group={group}
              editableMonthTotal={editableMonthTotal}
              monthValue={monthValue}
            />
            {group.expanded && group.days.map((day) => (
              <PtoDayFormulaCell
                {...sharedProps}
                key={day}
                rowId={row.id}
                day={day}
                dayValue={row.dailyPlans[day]}
              />
            ))}
          </Fragment>
        );
      })}
    </>
  );
}
