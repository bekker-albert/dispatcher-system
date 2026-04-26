"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaModel";
import { PtoDateAreaCell } from "@/features/pto/PtoDateAreaCell";
import { PtoDateEditableHeaders } from "@/features/pto/PtoDateEditableHeaders";
import { PtoDateFormulaCells } from "@/features/pto/PtoDateFormulaCells";
import { PtoDateTextCells } from "@/features/pto/PtoDateTextCells";
import { PtoCustomerCodeCell, PtoEditableHeaderText, PtoEditableMonthHeader, PtoFormulaBar, PtoPlanTd, PtoVirtualSpacerRow } from "@/features/pto/PtoDateTableParts";
import { PtoDateDraftRow } from "@/features/pto/PtoDateDraftRow";
import { PtoDateReadonlyTable } from "@/features/pto/PtoDateReadonlyTable";
import { PtoDateToolbarPanel } from "@/features/pto/PtoDateToolbarPanel";
import { usePtoDateFormulaController } from "@/features/pto/ptoDateFormulaController";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import { createPtoDateTableViewModel } from "@/features/pto/ptoDateTableViewModel";
import { createPtoDateVirtualRowsViewModel } from "@/features/pto/ptoDateVirtualRowsViewModel";
import { usePtoDateEditingToggle } from "@/features/pto/usePtoDateEditingToggle";
import { usePtoDraftRowController } from "@/features/pto/usePtoDraftRowController";
import {
  ptoDateTableLayoutStyle,
  ptoDateTableScrollStyle,
  ptoDropIndicatorStyle,
  ptoPlanTableStyle,
} from "@/features/pto/ptoDateTableStyles";
import { ptoAutomatedStatus, ptoRowFieldDomKey, ptoStatusRowBackground } from "@/lib/domain/pto/date-table";
import { formatPtoFormulaNumber } from "@/lib/domain/pto/formatting";
import { ptoDateVirtualDefaultRowHeight, ptoDateVirtualHeaderOffset } from "@/lib/domain/pto/virtualization";
import { cleanAreaName, normalizeLookupValue } from "@/lib/utils/text";

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
    const togglePtoDateEditing = usePtoDateEditingToggle({
      ptoDateEditing,
      setPtoDateEditing,
      setDraggedPtoRowId,
      setPtoDropTarget,
      setPtoFormulaCell,
      setPtoFormulaDraft,
      setPtoInlineEditCell,
      setPtoInlineEditInitialDraft,
      setPtoSelectionAnchorCell,
      setPtoSelectedCellKeys,
      savePtoLocalState,
      requestPtoDatabaseSave,
      savePtoDatabaseChanges,
    });
    const ptoDateToolbar = (
      <PtoDateToolbarPanel
        ptoAreaTabs={ptoAreaTabs}
        ptoAreaFilter={ptoAreaFilter}
        selectPtoArea={selectPtoArea}
        ptoTab={ptoTab}
        ptoDateEditing={ptoDateEditing}
        exportPtoDateTableToExcel={exportPtoDateTableToExcel}
        openPtoDateImportFilePicker={openPtoDateImportFilePicker}
        importPtoDateTableFromExcel={importPtoDateTableFromExcel}
        ptoPlanImportInputRef={ptoPlanImportInputRef}
        ptoYearTabs={ptoYearTabs}
        ptoPlanYear={ptoPlanYear}
        selectPtoPlanYear={selectPtoPlanYear}
        deletePtoYear={deletePtoYear}
        ptoYearDialogOpen={ptoYearDialogOpen}
        ptoYearInput={ptoYearInput}
        setPtoYearInput={setPtoYearInput}
        setPtoYearDialogOpen={setPtoYearDialogOpen}
        addPtoYear={addPtoYear}
        excelLabel={currentPtoDateExcelMeta().label}
        onToggleEditing={togglePtoDateEditing}
      />
    );
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
    const scrollFormulaCellIntoView = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => {
      if (!ptoDateEditing) return;

      const scrollElement = ptoDateTableScrollRef.current;
      const rowIndex = filteredRows.findIndex((row) => row.id === cell.rowId);
      if (!scrollElement || rowIndex < 0) return;

      const rowTop = ptoDateVirtualHeaderOffset + rowOffsetAt(rowIndex);
      const rowBottom = rowTop + (filteredRowHeights[rowIndex] ?? ptoDateVirtualDefaultRowHeight);
      const viewTop = scrollElement.scrollTop;
      const viewBottom = viewTop + scrollElement.clientHeight;

      if (rowTop < viewTop + 24) {
        scrollElement.scrollTop = Math.max(0, rowTop - 24);
      } else if (rowBottom > viewBottom - 24) {
        scrollElement.scrollTop = Math.max(0, rowBottom - scrollElement.clientHeight + 48);
      }

      updatePtoDateViewportFromElement(scrollElement);
    };
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

    const renderPtoHeaderText = (key: string, fallback: string, align: CSSProperties["textAlign"] = "left") => {
      return (
        <PtoEditableHeaderText
          columnKey={key}
          fallback={fallback}
          label={ptoHeaderLabel(key, fallback)}
          align={align}
          editing={editingPtoHeaderKey === key}
          editingEnabled={ptoDateEditing}
          draft={ptoHeaderDraft}
          onDraftChange={setPtoHeaderDraft}
          onStartEdit={startPtoHeaderEdit}
          onCommit={commitPtoHeaderEdit}
          onCancel={cancelPtoHeaderEdit}
        />
      );
    };

    const renderPtoMonthHeader = (month: string, fallback: string, expanded: boolean) => {
      const key = `month-group:${month}`;

      return (
        <PtoEditableMonthHeader
          columnKey={key}
          fallback={fallback}
          label={ptoHeaderLabel(key, fallback)}
          editing={editingPtoHeaderKey === key}
          editingEnabled={ptoDateEditing}
          draft={ptoHeaderDraft}
          expanded={expanded}
          icon={expanded ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
          onDraftChange={setPtoHeaderDraft}
          onStartEdit={startPtoHeaderEdit}
          onCommit={commitPtoHeaderEdit}
          onCancel={cancelPtoHeaderEdit}
          onToggle={() => {
            setExpandedPtoMonths((current) => ({ ...current, [month]: !current[month] }));
            requestPtoDatabaseSave();
          }}
        />
      );
    };

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
                      addPtoRowAfter={addPtoRowAfter}
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
                  onUpdateField={updatePtoDraftField}
                  onKeyDown={handlePtoDraftKeyDown}
                  onAddRow={addPtoRowFromDraft}
                />
              ) : null}
            </tbody>
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
