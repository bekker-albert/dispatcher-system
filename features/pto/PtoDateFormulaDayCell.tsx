"use client";

import { PtoDateFormulaInput } from "@/features/pto/PtoDateFormulaInput";
import { PtoPlanTd, PtoReadonlyNumberCell } from "@/features/pto/PtoDateTableParts";
import type { SharedFormulaCellProps } from "@/features/pto/PtoDateFormulaCellPartTypes";
import {
  ptoCompactNumberInputStyle,
  ptoPlanDayInputStyle,
} from "@/features/pto/ptoDateTableStyles";

type PtoDayFormulaCellProps = SharedFormulaCellProps & {
  rowId: string;
  day: string;
  dayValue: number | undefined;
};

export function PtoDayFormulaCell({
  rowId,
  day,
  dayValue,
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
}: PtoDayFormulaCellProps) {
  const dayCellActive = ptoDateEditing && formulaCellActive(rowId, "day", day);
  const dayCellSelected = ptoDateEditing && formulaCellSelected(rowId, "day", day);
  const dayCellEditing = ptoDateEditing && formulaCellEditing(rowId, "day", day);
  const dayLabel = `${day.slice(8, 10)}.${day.slice(5, 7)}`;
  const dayCell = {
    rowId,
    kind: "day" as const,
    day,
    label: dayLabel,
  };

  return (
    <PtoPlanTd active={dayCellActive} selected={dayCellSelected} editing={dayCellEditing} align="center">
      {ptoDateEditing ? (
        <PtoDateFormulaInput
          cell={dayCell}
          value={dayValue}
          editing={dayCellEditing}
          draft={ptoFormulaDraft}
          dataCellKey={formulaCellDomKey(dayCell)}
          style={{ ...ptoPlanDayInputStyle, ...ptoCompactNumberInputStyle }}
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
      ) : <PtoReadonlyNumberCell value={dayValue} />}
    </PtoPlanTd>
  );
}
