"use client";

import { PtoDateFormulaInput } from "@/features/pto/PtoDateFormulaInput";
import { PtoPlanTd, PtoReadonlyNumberCell } from "@/features/pto/PtoDateTableParts";
import type { SharedFormulaCellProps } from "@/features/pto/PtoDateFormulaCellPartTypes";
import type { PtoMonthGroupView } from "@/features/pto/ptoDateTableModel";
import {
  ptoCompactNumberInputStyle,
  ptoPlanDayInputStyle,
  ptoReadonlyTotalStyle,
} from "@/features/pto/ptoDateTableStyles";
import { formatPtoCellNumber, formatPtoFormulaNumber } from "@/lib/domain/pto/formatting";

type PtoMonthTotalFormulaCellProps = SharedFormulaCellProps & {
  rowId: string;
  group: PtoMonthGroupView;
  editableMonthTotal: boolean;
  monthValue: number | undefined;
};

export function PtoMonthTotalFormulaCell({
  rowId,
  group,
  editableMonthTotal,
  monthValue,
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
}: PtoMonthTotalFormulaCellProps) {
  const monthCellActive = ptoDateEditing && formulaCellActive(rowId, "month", group.month);
  const monthCellSelected = ptoDateEditing && formulaCellSelected(rowId, "month", group.month);
  const monthCellEditing = ptoDateEditing && formulaCellEditing(rowId, "month", group.month);
  const monthCell = {
    rowId,
    kind: "month" as const,
    month: group.month,
    days: group.days,
    label: group.label,
    editable: editableMonthTotal,
  };
  const readonlyMonthCell = { ...monthCell, editable: false };

  return (
    <PtoPlanTd active={monthCellActive} selected={monthCellSelected} editing={monthCellEditing} align="center">
      {ptoDateEditing && editableMonthTotal ? (
        <PtoDateFormulaInput
          cell={monthCell}
          value={monthValue}
          editing={monthCellEditing}
          draft={ptoFormulaDraft}
          dataCellKey={formulaCellDomKey(monthCell)}
          placeholder="Месяц"
          style={{ ...ptoPlanDayInputStyle, ...ptoCompactNumberInputStyle, fontWeight: 800 }}
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
      ) : ptoDateEditing ? (
        <button
          type="button"
          onMouseDown={(event) => handleFormulaCellMouseDown(event, readonlyMonthCell, monthValue, false)}
          onMouseEnter={(event) => handleFormulaCellMouseEnter(event, readonlyMonthCell, monthValue, false)}
          onClick={(event) => {
            if (event.ctrlKey || event.metaKey) return;

            if (event.shiftKey) {
              selectFormulaRange(readonlyMonthCell, monthValue);
            } else {
              selectFormulaCell(readonlyMonthCell, monthValue);
            }
          }}
          title={formatPtoFormulaNumber(monthValue)}
          style={ptoReadonlyTotalStyle}
        >
          {formatPtoCellNumber(monthValue)}
        </button>
      ) : <PtoReadonlyNumberCell value={monthValue} bold />}
    </PtoPlanTd>
  );
}
