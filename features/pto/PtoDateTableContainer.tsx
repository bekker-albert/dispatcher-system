"use client";

import { PtoDateEditableHeaders } from "@/features/pto/PtoDateEditableHeaders";
import { PtoDateEditableTableBody } from "@/features/pto/PtoDateEditableTableBody";
import { PtoFormulaBar } from "@/features/pto/PtoFormulaBar";
import { PtoDateReadonlyTable } from "@/features/pto/PtoDateReadonlyTable";
import { usePtoDateFormulaController } from "@/features/pto/ptoDateFormulaController";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import { createPtoDateTableViewModel } from "@/features/pto/ptoDateTableViewModel";
import { createPtoDateVirtualRowsViewModel } from "@/features/pto/ptoDateVirtualRowsViewModel";
import { usePtoDateHeaderRenderers } from "@/features/pto/usePtoDateHeaderRenderers";
import { usePtoDateToolbar } from "@/features/pto/usePtoDateToolbar";
import { usePtoDraftRowController } from "@/features/pto/usePtoDraftRowController";
import { usePtoFormulaCellScroller } from "@/features/pto/usePtoFormulaCellScroller";
import {
  ptoDateTableLayoutStyle,
  ptoDateTableScrollStyle,
  ptoPlanTableStyle,
} from "@/features/pto/ptoDateTableStyles";
import { formatPtoFormulaNumber } from "@/lib/domain/pto/formatting";

export function PtoDateTableContainer({
  rows,
  setRows,
  options = {},
  ptoTab,
  ptoAreaFilter,
  ptoPlanYear,
  reportDate,
  ptoYearMonths,
  ptoMonthGroups,
  ptoAreaTabs,
  ptoYearTabs,
  ptoYearDialogOpen,
  ptoYearInput,
  ptoDateEditing,
  ptoColumnWidths,
  ptoRowHeights,
  ptoDateViewport,
  ptoDateOptionMaps,
  ptoDateTableScrollRef,
  ptoPlanImportInputRef,
  draggedPtoRowId,
  ptoDropTarget,
  hoveredPtoAddRowId,
  ptoFormulaCell,
  ptoFormulaDraft,
  ptoInlineEditCell,
  ptoInlineEditInitialDraft,
  ptoSelectionAnchorCell,
  ptoSelectedCellKeys,
  ptoSelectionDraggingRef,
  ptoDraftRowFields,
  editingPtoHeaderKey,
  ptoHeaderDraft,
  setPtoDateEditing,
  setDraggedPtoRowId,
  setPtoDropTarget,
  setPtoFormulaCell,
  setPtoFormulaDraft,
  setPtoInlineEditCell,
  setPtoInlineEditInitialDraft,
  setPtoSelectionAnchorCell,
  setPtoSelectedCellKeys,
  setPtoYearInput,
  setPtoYearDialogOpen,
  setExpandedPtoMonths,
  setHoveredPtoAddRowId,
  setPtoDraftRowFields,
  setPtoPendingFieldFocus,
  setPtoHeaderDraft,
  savePtoLocalState,
  requestPtoDatabaseSave,
  savePtoDatabaseChanges,
  selectPtoArea,
  currentPtoDateExcelMeta,
  exportPtoDateTableToExcel,
  openPtoDateImportFilePicker,
  importPtoDateTableFromExcel,
  selectPtoPlanYear,
  deletePtoYear,
  addPtoYear,
  updatePtoDateViewportFromElement,
  handlePtoDateTableScroll,
  startPtoColumnResize,
  startPtoRowResize,
  addLinkedPtoDateRow,
  removeLinkedPtoDateRow,
  getPtoDropPosition,
  moveLinkedPtoDateRow,
  updatePtoDateRow,
  clearPtoCarryoverOverride,
  updatePtoDateDay,
  updatePtoMonthTotal,
  beginPtoRowTextDraft,
  getPtoRowTextDraft,
  updatePtoRowTextDraft,
  commitPtoRowTextDraft,
  cancelPtoRowTextDraft,
  ptoHeaderLabel,
  startPtoHeaderEdit,
  commitPtoHeaderEdit,
  cancelPtoHeaderEdit,
}: PtoDateTableContainerProps) {
    const {
      carryoverHeader,
      columnWidthByKey,
      displayPtoMonthGroups,
      editableMonthTotal,
      filteredRows,
      getEffectiveCarryover,
      getRowDateTotals,
      rowById,
      showCustomerCode,
      showLocation,
      tableColumns,
      tableMinWidth,
    } = createPtoDateTableViewModel({
      rows,
      options,
      ptoTab,
      ptoAreaFilter,
      ptoPlanYear,
      reportDate,
      ptoYearMonths,
      ptoMonthGroups,
      ptoDateEditing,
      ptoColumnWidths,
    });
    const ptoDateToolbar = usePtoDateToolbar({
      addPtoYear,
      currentPtoDateExcelMeta,
      deletePtoYear,
      exportPtoDateTableToExcel,
      importPtoDateTableFromExcel,
      openPtoDateImportFilePicker,
      ptoAreaFilter,
      ptoAreaTabs,
      ptoDateEditing,
      ptoPlanImportInputRef,
      ptoPlanYear,
      ptoTab,
      ptoYearDialogOpen,
      ptoYearInput,
      ptoYearTabs,
      requestPtoDatabaseSave,
      savePtoDatabaseChanges,
      savePtoLocalState,
      selectPtoArea,
      selectPtoPlanYear,
      setDraggedPtoRowId,
      setPtoDateEditing,
      setPtoDropTarget,
      setPtoFormulaCell,
      setPtoFormulaDraft,
      setPtoInlineEditCell,
      setPtoInlineEditInitialDraft,
      setPtoSelectedCellKeys,
      setPtoSelectionAnchorCell,
      setPtoYearDialogOpen,
      setPtoYearInput,
    });
    const {
      updateDraftField: updatePtoDraftField,
      handleDraftKeyDown: handlePtoDraftKeyDown,
      addRowAfter: addPtoRowAfter,
      addRowFromDraft: addPtoRowFromDraft,
    } = usePtoDraftRowController({
      editing: ptoDateEditing,
      areaFilter: ptoAreaFilter,
      showCustomerCode,
      draftFields: ptoDraftRowFields,
      setDraftFields: setPtoDraftRowFields,
      addLinkedRow: addLinkedPtoDateRow,
      setPendingFieldFocus: setPtoPendingFieldFocus,
    });

    const {
      renderedRows,
      filteredRowHeights,
      rowOffsetAt,
      virtualStartIndex,
      topSpacerHeight,
      bottomSpacerHeight,
    } = createPtoDateVirtualRowsViewModel({
      editing: ptoDateEditing,
      rows: filteredRows,
      rowHeights: ptoRowHeights,
      table: ptoTab,
      viewport: ptoDateViewport,
    });
    const ptoColumnResizeHandler = ptoDateEditing ? startPtoColumnResize : undefined;
    const tableSpacerColSpan = tableColumns.length;
    const scrollFormulaCellIntoView = usePtoFormulaCellScroller({
      filteredRows,
      filteredRowHeights,
      ptoDateEditing,
      ptoDateTableScrollRef,
      rowOffsetAt,
      updatePtoDateViewportFromElement,
    });
    const {
      activeFormulaCell,
      activeFormulaValue,
      formulaCellDomKey,
      formulaCellsByRowId,
      formulaInputDisabled,
      formulaCellActive,
      formulaCellEditing,
      formulaCellSelected,
      handleFormulaCellKeyDown,
      handleFormulaCellMouseDown,
      handleFormulaCellMouseEnter,
      selectFormulaCell,
      selectFormulaRange,
      startInlineFormulaEdit,
      commitInlineFormulaEdit,
      updateFormulaValue,
    } = usePtoDateFormulaController({
      ptoTab,
      ptoPlanYear,
      ptoDateEditing,
      ptoFormulaCell,
      ptoFormulaDraft,
      ptoInlineEditCell,
      ptoInlineEditInitialDraft,
      ptoSelectionAnchorCell,
      ptoSelectedCellKeys,
      ptoSelectionDraggingRef,
      setRows,
      setPtoFormulaCell,
      setPtoFormulaDraft,
      setPtoInlineEditCell,
      setPtoInlineEditInitialDraft,
      setPtoSelectionAnchorCell,
      setPtoSelectedCellKeys,
      requestPtoDatabaseSave,
      updatePtoDateRow,
      clearPtoCarryoverOverride,
      updatePtoDateDay,
      updatePtoMonthTotal,
      carryoverHeader,
      displayPtoMonthGroups,
      editableMonthTotal,
      filteredRows,
      renderedRows,
      rowById,
      getEffectiveCarryover,
      getRowDateTotals,
      scrollFormulaCellIntoView,
    });

    const {
      renderPtoHeaderText,
      renderPtoMonthHeader,
    } = usePtoDateHeaderRenderers({
      cancelPtoHeaderEdit,
      commitPtoHeaderEdit,
      editingPtoHeaderKey,
      ptoDateEditing,
      ptoHeaderDraft,
      ptoHeaderLabel,
      requestPtoDatabaseSave,
      setExpandedPtoMonths,
      setPtoHeaderDraft,
      startPtoHeaderEdit,
    });

    if (!ptoDateEditing) {
      return (
        <PtoDateReadonlyTable
          rows={filteredRows}
          showCustomerCode={showCustomerCode}
          showLocation={showLocation}
          ptoPlanYear={ptoPlanYear}
          ptoTab={ptoTab}
          reportDate={reportDate}
          carryoverHeader={carryoverHeader}
          displayMonthGroups={displayPtoMonthGroups}
          tableColumns={tableColumns}
          tableMinWidth={tableMinWidth}
          columnWidthByKey={columnWidthByKey}
          rowHeights={ptoRowHeights}
          scrollRef={ptoDateTableScrollRef}
          getEffectiveCarryover={getEffectiveCarryover}
          getRowDateTotals={getRowDateTotals}
          headerLabel={ptoHeaderLabel}
          onToggleMonth={(month) => {
            setExpandedPtoMonths((current) => ({ ...current, [month]: !current[month] }));
            requestPtoDatabaseSave();
          }}
          toolbar={ptoDateToolbar}
        />
      );
    }

    return (
      <div style={ptoDateTableLayoutStyle}>
        {ptoDateToolbar}

        {ptoDateEditing ? (
          <PtoFormulaBar
            value={activeFormulaCell ? ptoFormulaDraft : ""}
            disabled={formulaInputDisabled}
            onValueChange={updateFormulaValue}
            onBlur={() => {
              if (activeFormulaCell) setPtoFormulaDraft(formatPtoFormulaNumber(activeFormulaValue));
              requestPtoDatabaseSave();
            }}
          />
        ) : null}

        <div ref={ptoDateTableScrollRef} onScroll={ptoDateEditing ? handlePtoDateTableScroll : undefined} style={ptoDateTableScrollStyle}>
          <table style={{ ...ptoPlanTableStyle, width: tableMinWidth, minWidth: tableMinWidth, marginRight: 40 }}>
            <colgroup>
              {tableColumns.map((column) => (
                <col key={column.key} style={{ width: column.width }} />
              ))}
            </colgroup>
            <PtoDateEditableHeaders
              showCustomerCode={showCustomerCode}
              showLocation={showLocation}
              ptoPlanYear={ptoPlanYear}
              carryoverHeader={carryoverHeader}
              monthGroups={displayPtoMonthGroups}
              columnWidthByKey={columnWidthByKey}
              onResizeStart={ptoColumnResizeHandler}
              renderHeaderText={renderPtoHeaderText}
              renderMonthHeader={renderPtoMonthHeader}
            />
            <PtoDateEditableTableBody
              addRowAfter={addPtoRowAfter}
              addRowFromDraft={addPtoRowFromDraft}
              beginPtoRowTextDraft={beginPtoRowTextDraft}
              bottomSpacerHeight={bottomSpacerHeight}
              cancelPtoRowTextDraft={cancelPtoRowTextDraft}
              carryoverHeader={carryoverHeader}
              commitInlineFormulaEdit={commitInlineFormulaEdit}
              commitPtoRowTextDraft={commitPtoRowTextDraft}
              displayPtoMonthGroups={displayPtoMonthGroups}
              draggedPtoRowId={draggedPtoRowId}
              editableMonthTotal={editableMonthTotal}
              filteredRows={filteredRows}
              formulaCellActive={formulaCellActive}
              formulaCellDomKey={formulaCellDomKey}
              formulaCellEditing={formulaCellEditing}
              formulaCellSelected={formulaCellSelected}
              formulaCellsByRowId={formulaCellsByRowId}
              getEffectiveCarryover={getEffectiveCarryover}
              getPtoDropPosition={getPtoDropPosition}
              getPtoRowTextDraft={getPtoRowTextDraft}
              getRowDateTotals={getRowDateTotals}
              handleDraftKeyDown={handlePtoDraftKeyDown}
              handleFormulaCellKeyDown={handleFormulaCellKeyDown}
              handleFormulaCellMouseDown={handleFormulaCellMouseDown}
              handleFormulaCellMouseEnter={handleFormulaCellMouseEnter}
              hoveredPtoAddRowId={hoveredPtoAddRowId}
              moveLinkedPtoDateRow={moveLinkedPtoDateRow}
              ptoDateEditing={ptoDateEditing}
              ptoDateOptionMaps={ptoDateOptionMaps}
              ptoDraftRowFields={ptoDraftRowFields}
              ptoDropTarget={ptoDropTarget}
              ptoFormulaDraft={ptoFormulaDraft}
              ptoRowHeights={ptoRowHeights}
              ptoSelectionDraggingRef={ptoSelectionDraggingRef}
              ptoTab={ptoTab}
              removeLinkedPtoDateRow={removeLinkedPtoDateRow}
              renderedRows={renderedRows}
              reportDate={reportDate}
              requestPtoDatabaseSave={requestPtoDatabaseSave}
              selectFormulaCell={selectFormulaCell}
              selectFormulaRange={selectFormulaRange}
              setDraggedPtoRowId={setDraggedPtoRowId}
              setHoveredPtoAddRowId={setHoveredPtoAddRowId}
              setPtoDropTarget={setPtoDropTarget}
              setRows={setRows}
              showCustomerCode={showCustomerCode}
              showLocation={showLocation}
              startInlineFormulaEdit={startInlineFormulaEdit}
              startPtoRowResize={startPtoRowResize}
              tableMinWidth={tableMinWidth}
              tableSpacerColSpan={tableSpacerColSpan}
              topSpacerHeight={topSpacerHeight}
              updateDraftField={updatePtoDraftField}
              updateFormulaValue={updateFormulaValue}
              updatePtoDateRow={updatePtoDateRow}
              updatePtoRowTextDraft={updatePtoRowTextDraft}
              virtualStartIndex={virtualStartIndex}
            />
          </table>
        </div>
        <datalist id="pto-area-options">
          {ptoAreaTabs.filter((area) => area !== "Все участки").map((area) => (
            <option key={area} value={`Уч_${area}`} />
          ))}
        </datalist>
      </div>
    );
}
