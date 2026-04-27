"use client";

import { PtoDateAreaCell } from "@/features/pto/PtoDateAreaCell";
import { PtoDateDraftRow } from "@/features/pto/PtoDateDraftRow";
import { PtoDateFormulaCells } from "@/features/pto/PtoDateFormulaCells";
import { PtoDateTextCells } from "@/features/pto/PtoDateTextCells";
import { PtoCustomerCodeCell, PtoPlanTd, PtoVirtualSpacerRow } from "@/features/pto/PtoDateTableParts";
import type { usePtoDateFormulaController } from "@/features/pto/ptoDateFormulaController";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import type { createPtoDateTableViewModel } from "@/features/pto/ptoDateTableViewModel";
import type { createPtoDateVirtualRowsViewModel } from "@/features/pto/ptoDateVirtualRowsViewModel";
import type { usePtoDraftRowController } from "@/features/pto/usePtoDraftRowController";
import { ptoDropIndicatorStyle } from "@/features/pto/ptoDateTableStyles";
import { ptoAutomatedStatus, ptoRowFieldDomKey, ptoStatusRowBackground } from "@/lib/domain/pto/date-table";
import { cleanAreaName, normalizeLookupValue } from "@/lib/utils/text";

type PtoDateTableViewModel = ReturnType<typeof createPtoDateTableViewModel>;
type PtoDateVirtualRowsViewModel = ReturnType<typeof createPtoDateVirtualRowsViewModel>;
type PtoDateFormulaController = ReturnType<typeof usePtoDateFormulaController>;
type PtoDraftRowController = ReturnType<typeof usePtoDraftRowController>;

type PtoDateEditableTableBodyProps = Pick<
  PtoDateTableContainerProps,
  | "beginPtoRowTextDraft"
  | "cancelPtoRowTextDraft"
  | "commitPtoRowTextDraft"
  | "draggedPtoRowId"
  | "getPtoDropPosition"
  | "getPtoRowTextDraft"
  | "hoveredPtoAddRowId"
  | "moveLinkedPtoDateRow"
  | "ptoDateEditing"
  | "ptoDateOptionMaps"
  | "ptoDraftRowFields"
  | "ptoDropTarget"
  | "ptoFormulaDraft"
  | "ptoRowHeights"
  | "ptoSelectionDraggingRef"
  | "ptoTab"
  | "removeLinkedPtoDateRow"
  | "reportDate"
  | "requestPtoDatabaseSave"
  | "setDraggedPtoRowId"
  | "setHoveredPtoAddRowId"
  | "setPtoDropTarget"
  | "setRows"
  | "startPtoRowResize"
  | "updatePtoDateRow"
  | "updatePtoRowTextDraft"
> & Pick<
  PtoDateTableViewModel,
  | "carryoverHeader"
  | "displayPtoMonthGroups"
  | "editableMonthTotal"
  | "filteredRows"
  | "getEffectiveCarryover"
  | "getRowDateTotals"
  | "showCustomerCode"
  | "showLocation"
  | "tableMinWidth"
> & Pick<
  PtoDateVirtualRowsViewModel,
  | "bottomSpacerHeight"
  | "renderedRows"
  | "topSpacerHeight"
  | "virtualStartIndex"
> & Pick<
  PtoDraftRowController,
  | "addRowAfter"
  | "addRowFromDraft"
  | "handleDraftKeyDown"
  | "updateDraftField"
> & Pick<
  PtoDateFormulaController,
  | "commitInlineFormulaEdit"
  | "formulaCellActive"
  | "formulaCellDomKey"
  | "formulaCellEditing"
  | "formulaCellSelected"
  | "formulaCellsByRowId"
  | "handleFormulaCellKeyDown"
  | "handleFormulaCellMouseDown"
  | "handleFormulaCellMouseEnter"
  | "selectFormulaCell"
  | "selectFormulaRange"
  | "startInlineFormulaEdit"
  | "updateFormulaValue"
> & {
  tableSpacerColSpan: number;
};

export function PtoDateEditableTableBody({
  addRowAfter,
  addRowFromDraft,
  beginPtoRowTextDraft,
  bottomSpacerHeight,
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
  handleDraftKeyDown,
  handleFormulaCellKeyDown,
  handleFormulaCellMouseDown,
  handleFormulaCellMouseEnter,
  hoveredPtoAddRowId,
  moveLinkedPtoDateRow,
  ptoDateEditing,
  ptoDateOptionMaps,
  ptoDraftRowFields,
  ptoDropTarget,
  ptoFormulaDraft,
  ptoRowHeights,
  ptoSelectionDraggingRef,
  ptoTab,
  removeLinkedPtoDateRow,
  renderedRows,
  reportDate,
  requestPtoDatabaseSave,
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
  tableSpacerColSpan,
  topSpacerHeight,
  updateDraftField,
  updateFormulaValue,
  updatePtoDateRow,
  updatePtoRowTextDraft,
  virtualStartIndex,
}: PtoDateEditableTableBodyProps) {
  return (
    <tbody>
      <PtoVirtualSpacerRow height={topSpacerHeight} colSpan={tableSpacerColSpan} />
      {renderedRows.map((row, renderedRowIndex) => {
        const rowIndex = virtualStartIndex + renderedRowIndex;
        const rowAreaFilter = cleanAreaName(row.area) || "Все участки";
        const rowAreaKey = rowAreaFilter === "Все участки" ? ptoDateOptionMaps.allAreasKey : normalizeLookupValue(rowAreaFilter);
        const rowLocationKey = normalizeLookupValue(row.location);
        const locationOptions = showLocation
          ? ptoDateOptionMaps.locationsByArea.get(rowAreaKey) ?? []
          : [];
        const structureOptions = showLocation && rowLocationKey
          ? ptoDateOptionMaps.structuresByAreaLocation.get(`${rowAreaKey}:${rowLocationKey}`) ?? []
          : ptoDateOptionMaps.structuresByArea.get(rowAreaKey) ?? [];
        const locationListId = `pto-location-${row.id}`;
        const structureListId = `pto-structure-${row.id}`;
        const isDropTarget = ptoDropTarget?.rowId === row.id;
        const dropLineStyle = ptoDateEditing && isDropTarget
          ? {
              ...ptoDropIndicatorStyle,
              width: tableMinWidth,
              ...(ptoDropTarget.position === "before" ? { top: -2 } : { bottom: -2 }),
            }
          : null;
        const showInlineAddRowButton = ptoDateEditing && rowIndex < filteredRows.length - 1;
        const rowStatus = ptoAutomatedStatus(row, reportDate);
        const effectiveCarryover = getEffectiveCarryover(row);
        const rowDateTotals = getRowDateTotals(row);
        const rowYearTotalWithCarryover = Math.round(((rowDateTotals?.yearDailyTotal ?? 0) + effectiveCarryover) * 1000000) / 1000000;
        const rowFormulaCells = formulaCellsByRowId.get(row.id) ?? [];
        const rowHeightKey = `${ptoTab}:${row.id}`;
        const rowHeight = ptoRowHeights[rowHeightKey];

        return (
          <tr
            key={row.id}
            style={{ background: ptoStatusRowBackground(rowStatus), ...(rowHeight ? { height: rowHeight } : null) }}
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
      })}
      <PtoVirtualSpacerRow height={bottomSpacerHeight} colSpan={tableSpacerColSpan} />
      {ptoDateEditing ? (
        <PtoDateDraftRow
          showCustomerCode={showCustomerCode}
          showLocation={showLocation}
          fields={ptoDraftRowFields}
          monthGroups={displayPtoMonthGroups}
          onUpdateField={updateDraftField}
          onKeyDown={handleDraftKeyDown}
          onAddRow={addRowFromDraft}
        />
      ) : null}
    </tbody>
  );
}
