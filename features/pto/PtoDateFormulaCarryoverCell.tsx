"use client";

import { PtoDateFormulaInput } from "@/features/pto/PtoDateFormulaInput";
import { PtoPlanTd, PtoReadonlyNumberCell } from "@/features/pto/PtoDateTableParts";
import type { SharedFormulaCellProps } from "@/features/pto/PtoDateFormulaCellPartTypes";
import type { PtoFormulaCellWithoutScope } from "@/features/pto/ptoDateFormulaTypes";
import {
  ptoCompactNumberInputStyle,
  ptoPlanInputStyle,
} from "@/features/pto/ptoDateTableStyles";

type PtoCarryoverFormulaCellProps = SharedFormulaCellProps & {
  rowId: string;
  carryoverHeader: string;
  effectiveCarryover: number;
  rowFormulaCells: PtoFormulaCellWithoutScope[];
};

export function PtoCarryoverFormulaCell({
  rowId,
  carryoverHeader,
  effectiveCarryover,
  rowFormulaCells,
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
}: PtoCarryoverFormulaCellProps) {
  const carryoverCellActive = ptoDateEditing && formulaCellActive(rowId, "carryover");
  const carryoverCellSelected = ptoDateEditing && formulaCellSelected(rowId, "carryover");
  const carryoverCellEditing = ptoDateEditing && formulaCellEditing(rowId, "carryover");
  const carryoverCell = rowFormulaCells.find((cell) => cell.kind === "carryover") ?? {
    rowId,
    kind: "carryover" as const,
    label: carryoverHeader,
  };

  return (
    <PtoPlanTd active={carryoverCellActive} selected={carryoverCellSelected} editing={carryoverCellEditing} align="center">
      {ptoDateEditing ? (
        <PtoDateFormulaInput
          cell={carryoverCell}
          value={effectiveCarryover}
          editing={carryoverCellEditing}
          draft={ptoFormulaDraft}
          dataCellKey={formulaCellDomKey(carryoverCell)}
          style={{ ...ptoPlanInputStyle, ...ptoCompactNumberInputStyle }}
          shouldSkipFocusSelection={() => ptoSelectionDraggingRef.current}
          onSelectCell={selectFormulaCell}
          onSelectRange={selectFormulaRange}
          onStartEdit={startInlineFormulaEdit}
          onDraftChange={updateFormulaValue}
          onCommitEdit={commitInlineFormulaEdit}
          onMouseDown={handleFormulaCellMouseDown}
          onMouseEnter={handleFormulaCellMouseEnter}
          onKeyDown={handleFormulaCellKeyDown}
        />
      ) : <PtoReadonlyNumberCell value={effectiveCarryover} />}
    </PtoPlanTd>
  );
}
