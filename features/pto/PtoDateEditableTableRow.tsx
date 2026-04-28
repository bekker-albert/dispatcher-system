"use client";

import { memo } from "react";

import { PtoDateAreaCell } from "@/features/pto/PtoDateAreaCell";
import { PtoDateFormulaCells } from "@/features/pto/PtoDateFormulaCells";
import { createPtoDateEditableRowModel } from "@/features/pto/PtoDateEditableRowModel";
import { PtoDateTextCells } from "@/features/pto/PtoDateTextCells";
import { PtoCustomerCodeCell, PtoPlanTd } from "@/features/pto/PtoDateTableParts";
import type { PtoDateEditableTableRowProps } from "@/features/pto/PtoDateEditableTableBodyTypes";
import { ptoRowFieldDomKey } from "@/lib/domain/pto/date-table";

export const PtoDateEditableTableRow = memo(function PtoDateEditableTableRow({
  addRowAfter,
  beginPtoRowTextDraft,
  cancelPtoRowTextDraft,
  carryoverHeader,
  commitInlineFormulaEdit,
  commitPtoRowTextDraft,
  displayPtoMonthGroups,
  draggedPtoRowId,
  editableMonthTotal,
  filteredRows,
  formulaCellActive,
  formulaCellDomKey,
  formulaCellEditing,
  formulaCellSelected,
  formulaCellsByRowId,
  getEffectiveCarryover,
  getPtoDropPosition,
  getPtoRowTextDraft,
  getRowDateTotals,
  handleFormulaCellKeyDown,
  handleFormulaCellMouseDown,
  handleFormulaCellMouseEnter,
  hoveredPtoAddRowId,
  moveLinkedPtoDateRow,
  ptoDateEditing,
  ptoDateOptionMaps,
  ptoDropTarget,
  ptoFormulaDraft,
  ptoRowHeights,
  ptoSelectionDraggingRef,
  ptoTab,
  removeLinkedPtoDateRow,
  reportDate,
  requestPtoDatabaseSave,
  row,
  rowIndex,
  selectFormulaCell,
  selectFormulaRange,
  setDraggedPtoRowId,
  setHoveredPtoAddRowId,
  setPtoDropTarget,
  setRows,
  showCustomerCode,
  showLocation,
  startInlineFormulaEdit,
  startPtoRowResize,
  tableMinWidth,
  updateFormulaValue,
  updatePtoDateRow,
  updatePtoRowTextDraft,
}: PtoDateEditableTableRowProps) {
  const {
    dropLineStyle,
    effectiveCarryover,
    locationListId,
    locationOptions,
    rowDateTotals,
    rowFormulaCells,
    rowHeightKey,
    rowStatus,
    rowStyle,
    rowYearTotalWithCarryover,
    showInlineAddRowButton,
    structureListId,
    structureOptions,
  } = createPtoDateEditableRowModel({
    row,
    rowIndex,
    filteredRowsLength: filteredRows.length,
    showLocation,
    ptoDateEditing,
    ptoDateOptionMaps,
    ptoDropTarget,
    tableMinWidth,
    reportDate,
    getEffectiveCarryover,
    getRowDateTotals,
    formulaCellsByRowId,
    ptoTab,
    ptoRowHeights,
  });

  return (
    <tr
      key={row.id}
      style={rowStyle}
      onDragOver={(event) => {
        if (!ptoDateEditing) return;
        event.preventDefault();
        if (!draggedPtoRowId || draggedPtoRowId === row.id) {
          setPtoDropTarget(null);
          return;
        }

        const position = getPtoDropPosition(event);
        setPtoDropTarget((current) =>
          current?.rowId === row.id && current.position === position
            ? current
            : { rowId: row.id, position },
        );
      }}
      onDragLeave={(event) => {
        if (!ptoDateEditing) return;
        const nextTarget = event.relatedTarget as Node | null;
        if (nextTarget && event.currentTarget.contains(nextTarget)) return;

        setPtoDropTarget((current) => (current?.rowId === row.id ? null : current));
      }}
      onDrop={(event) => {
        if (!ptoDateEditing) return;
        event.preventDefault();
        if (draggedPtoRowId && draggedPtoRowId !== row.id) {
          const position = ptoDropTarget?.rowId === row.id ? ptoDropTarget.position : getPtoDropPosition(event);
          moveLinkedPtoDateRow(draggedPtoRowId, row.id, filteredRows, position);
        }
        setDraggedPtoRowId(null);
        setPtoDropTarget(null);
      }}
    >
      {showCustomerCode ? (
        <PtoPlanTd align="center">
          <PtoCustomerCodeCell
            editing={ptoDateEditing}
            value={row.customerCode}
            dataFieldKey={ptoRowFieldDomKey(row.id, "customerCode")}
            onChange={(value) => {
              updatePtoDateRow(setRows, row.id, "customerCode", value);
              requestPtoDatabaseSave();
            }}
          />
        </PtoPlanTd>
      ) : null}
      <PtoDateAreaCell
        row={row}
        ptoDateEditing={ptoDateEditing}
        dropLineStyle={dropLineStyle}
        tableMinWidth={tableMinWidth}
        rowHeightKey={rowHeightKey}
        showInlineAddRowButton={showInlineAddRowButton}
        hoveredPtoAddRowId={hoveredPtoAddRowId}
        setRows={setRows}
        setDraggedPtoRowId={setDraggedPtoRowId}
        setHoveredPtoAddRowId={setHoveredPtoAddRowId}
        setPtoDropTarget={setPtoDropTarget}
        removeLinkedPtoDateRow={removeLinkedPtoDateRow}
        startPtoRowResize={startPtoRowResize}
        addPtoRowAfter={addRowAfter}
        beginPtoRowTextDraft={beginPtoRowTextDraft}
        getPtoRowTextDraft={getPtoRowTextDraft}
        updatePtoRowTextDraft={updatePtoRowTextDraft}
        commitPtoRowTextDraft={commitPtoRowTextDraft}
        cancelPtoRowTextDraft={cancelPtoRowTextDraft}
      />
      <PtoDateTextCells
        row={row}
        ptoDateEditing={ptoDateEditing}
        showLocation={showLocation}
        locationListId={locationListId}
        structureListId={structureListId}
        locationOptions={locationOptions}
        structureOptions={structureOptions}
        rowStatus={rowStatus}
        setRows={setRows}
        requestPtoDatabaseSave={requestPtoDatabaseSave}
        updatePtoDateRow={updatePtoDateRow}
        beginPtoRowTextDraft={beginPtoRowTextDraft}
        getPtoRowTextDraft={getPtoRowTextDraft}
        updatePtoRowTextDraft={updatePtoRowTextDraft}
        commitPtoRowTextDraft={commitPtoRowTextDraft}
        cancelPtoRowTextDraft={cancelPtoRowTextDraft}
      />
      <PtoDateFormulaCells
        row={row}
        carryoverHeader={carryoverHeader}
        displayMonthGroups={displayPtoMonthGroups}
        editableMonthTotal={editableMonthTotal}
        effectiveCarryover={effectiveCarryover}
        rowDateTotals={rowDateTotals}
        rowFormulaCells={rowFormulaCells}
        rowYearTotalWithCarryover={rowYearTotalWithCarryover}
        ptoDateEditing={ptoDateEditing}
        ptoFormulaDraft={ptoFormulaDraft}
        ptoSelectionDraggingRef={ptoSelectionDraggingRef}
        formulaCellActive={formulaCellActive}
        formulaCellEditing={formulaCellEditing}
        formulaCellSelected={formulaCellSelected}
        formulaCellDomKey={formulaCellDomKey}
        selectFormulaCell={selectFormulaCell}
        selectFormulaRange={selectFormulaRange}
        startInlineFormulaEdit={startInlineFormulaEdit}
        commitInlineFormulaEdit={commitInlineFormulaEdit}
        updateFormulaValue={updateFormulaValue}
        handleFormulaCellMouseDown={handleFormulaCellMouseDown}
        handleFormulaCellMouseEnter={handleFormulaCellMouseEnter}
        handleFormulaCellKeyDown={handleFormulaCellKeyDown}
      />
    </tr>
  );
});
