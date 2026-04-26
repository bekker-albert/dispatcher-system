"use client";

import { Fragment, type KeyboardEvent, type MouseEvent, type RefObject } from "react";
import { PtoDateFormulaInput } from "@/features/pto/PtoDateFormulaInput";
import { PtoPlanTd, PtoReadonlyNumberCell } from "@/features/pto/PtoDateTableParts";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaModel";
import type { PtoMonthGroupView, PtoRowDateTotals } from "@/features/pto/ptoDateTableModel";
import {
  ptoCompactNumberInputStyle,
  ptoPlanDayInputStyle,
  ptoPlanInputStyle,
  ptoReadonlyTotalStyle,
} from "@/features/pto/ptoDateTableStyles";
import { formatPtoCellNumber, formatPtoFormulaNumber } from "@/lib/domain/pto/formatting";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type PtoFormulaCellWithoutScope = Omit<PtoFormulaCell, "table" | "year">;

type PtoDateFormulaCellsProps = {
  row: PtoPlanRow;
  carryoverHeader: string;
  displayMonthGroups: PtoMonthGroupView[];
  editableMonthTotal: boolean;
  effectiveCarryover: number;
  rowDateTotals: PtoRowDateTotals | undefined;
  rowFormulaCells: PtoFormulaCellWithoutScope[];
  rowYearTotalWithCarryover: number;
  ptoDateEditing: boolean;
  ptoFormulaDraft: string;
  ptoSelectionDraggingRef: RefObject<boolean>;
  formulaCellActive: (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => boolean;
  formulaCellEditing: (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => boolean;
  formulaCellSelected: (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => boolean;
  formulaCellDomKey: (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => string;
  selectFormulaCell: (cell: PtoFormulaCellWithoutScope, value: number | undefined) => void;
  selectFormulaRange: (cell: PtoFormulaCellWithoutScope, value: number | undefined) => void;
  startInlineFormulaEdit: (cell: PtoFormulaCellWithoutScope, value: number | undefined, draftOverride?: string) => void;
  commitInlineFormulaEdit: () => void;
  updateFormulaValue: (value: string) => void;
  handleFormulaCellMouseDown: (
    event: MouseEvent<HTMLElement>,
    cell: PtoFormulaCellWithoutScope,
    value: number | undefined,
    isEditing: boolean,
  ) => void;
  handleFormulaCellMouseEnter: (
    event: MouseEvent<HTMLElement>,
    cell: PtoFormulaCellWithoutScope,
    value: number | undefined,
    isEditing: boolean,
  ) => void;
  handleFormulaCellKeyDown: (
    event: KeyboardEvent<HTMLInputElement>,
    cell: PtoFormulaCellWithoutScope,
    value: number | undefined,
    isEditing: boolean,
  ) => void;
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
  const carryoverCellActive = ptoDateEditing && formulaCellActive(row.id, "carryover");
  const carryoverCellSelected = ptoDateEditing && formulaCellSelected(row.id, "carryover");
  const carryoverCellEditing = ptoDateEditing && formulaCellEditing(row.id, "carryover");
  const carryoverCell = rowFormulaCells.find((cell) => cell.kind === "carryover") ?? {
    rowId: row.id,
    kind: "carryover" as const,
    label: carryoverHeader,
  };

  return (
    <>
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
      <PtoPlanTd align="center">
        <div style={{ fontWeight: 800, textAlign: "center" }} title={formatPtoFormulaNumber(rowYearTotalWithCarryover)}>
          {formatPtoCellNumber(rowYearTotalWithCarryover)}
        </div>
      </PtoPlanTd>
      {displayMonthGroups.map((group) => {
        const monthTotal = rowDateTotals?.monthTotals.get(group.month);
        const monthValue = monthTotal?.hasValue ? monthTotal.value : undefined;
        const monthCellActive = ptoDateEditing && formulaCellActive(row.id, "month", group.month);
        const monthCellSelected = ptoDateEditing && formulaCellSelected(row.id, "month", group.month);
        const monthCellEditing = ptoDateEditing && formulaCellEditing(row.id, "month", group.month);
        const monthCell = {
          rowId: row.id,
          kind: "month" as const,
          month: group.month,
          days: group.days,
          label: group.label,
          editable: editableMonthTotal,
        };

        return (
          <Fragment key={`${row.id}-${group.month}`}>
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
                  onMouseDown={(event) => handleFormulaCellMouseDown(event, { ...monthCell, editable: false }, monthValue, false)}
                  onMouseEnter={(event) => handleFormulaCellMouseEnter(event, { ...monthCell, editable: false }, monthValue, false)}
                  onClick={(event) => {
                    if (event.ctrlKey || event.metaKey) return;

                    if (event.shiftKey) {
                      selectFormulaRange({ ...monthCell, editable: false }, monthValue);
                    } else {
                      selectFormulaCell({ ...monthCell, editable: false }, monthValue);
                    }
                  }}
                  title={formatPtoFormulaNumber(monthValue)}
                  style={ptoReadonlyTotalStyle}
                >
                  {formatPtoCellNumber(monthValue)}
                </button>
              ) : <PtoReadonlyNumberCell value={monthValue} bold />}
            </PtoPlanTd>
            {group.expanded && group.days.map((day) => {
              const dayValue = row.dailyPlans[day];
              const dayCellActive = ptoDateEditing && formulaCellActive(row.id, "day", day);
              const dayCellSelected = ptoDateEditing && formulaCellSelected(row.id, "day", day);
              const dayCellEditing = ptoDateEditing && formulaCellEditing(row.id, "day", day);
              const dayLabel = `${day.slice(8, 10)}.${day.slice(5, 7)}`;
              const dayCell = {
                rowId: row.id,
                kind: "day" as const,
                day,
                label: dayLabel,
              };

              return (
                <PtoPlanTd key={day} active={dayCellActive} selected={dayCellSelected} editing={dayCellEditing} align="center">
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
            })}
          </Fragment>
        );
      })}
    </>
  );
}
