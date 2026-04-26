"use client";

import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Fragment, type CSSProperties } from "react";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaModel";
import { PtoDateEditableHeaders } from "@/features/pto/PtoDateEditableHeaders";
import { PtoDateEditableTextCell } from "@/features/pto/PtoDateEditableTextCell";
import { PtoDateFormulaInput } from "@/features/pto/PtoDateFormulaInput";
import { PtoCustomerCodeCell, PtoEditableHeaderText, PtoEditableMonthHeader, PtoFormulaBar, PtoPlanTd, PtoReadonlyNumberCell, PtoStatusCell, PtoUnitCell, PtoVirtualSpacerRow } from "@/features/pto/PtoDateTableParts";
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
  dragHandleDotStyle,
  dragHandleDotsStyle,
  dragHandleStyle,
  ptoAreaCellStyle,
  ptoCompactNumberInputStyle,
  ptoDateTableLayoutStyle,
  ptoDateTableScrollStyle,
  ptoDropIndicatorStyle,
  ptoInlineAddRowButtonHoverStyle,
  ptoInlineAddRowButtonStyle,
  ptoPlanDayInputStyle,
  ptoPlanInputStyle,
  ptoPlanTableStyle,
  ptoReadonlyTotalStyle,
  ptoRowDeleteButtonStyle,
  ptoRowResizeHandleStyle,
  ptoRowToolsStyle,
} from "@/features/pto/ptoDateTableStyles";
import { ptoAutomatedStatus, ptoRowFieldDomKey, ptoStatusRowBackground } from "@/lib/domain/pto/date-table";
import { formatPtoCellNumber, formatPtoFormulaNumber } from "@/lib/domain/pto/formatting";
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
                const carryoverCellActive = ptoDateEditing && formulaCellActive(row.id, "carryover");
                const carryoverCellSelected = ptoDateEditing && formulaCellSelected(row.id, "carryover");
                const carryoverCellEditing = ptoDateEditing && formulaCellEditing(row.id, "carryover");
                const rowStatus = ptoAutomatedStatus(row, reportDate);
                const effectiveCarryover = getEffectiveCarryover(row);
                const rowDateTotals = getRowDateTotals(row);
                const rowYearTotalWithCarryover = Math.round(((rowDateTotals?.yearDailyTotal ?? 0) + effectiveCarryover) * 1000000) / 1000000;
                const rowFormulaCells = formulaCellsByRowId.get(row.id) ?? [];
                const carryoverCell = rowFormulaCells.find((cell) => cell.kind === "carryover") ?? { rowId: row.id, kind: "carryover" as const, label: carryoverHeader };
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
                    <PtoPlanTd>
                      {dropLineStyle ? <span style={dropLineStyle} /> : null}
                      {ptoDateEditing ? (
                        <button
                        type="button"
                        onClick={() => removeLinkedPtoDateRow(row)}
                        style={{ ...ptoRowDeleteButtonStyle, left: tableMinWidth + 8 }}
                        title={`Удалить строку: ${row.structure || "ПТО"}`}
                        aria-label={`Удалить строку: ${row.structure || "ПТО"}`}
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      ) : null}
                      {ptoDateEditing ? (
                        <span
                          onMouseDown={(event) => startPtoRowResize(event, rowHeightKey)}
                          style={ptoRowResizeHandleStyle}
                          title="Потяни вниз или вверх, чтобы изменить высоту строки"
                          aria-hidden
                        />
                      ) : null}
                      {showInlineAddRowButton ? (
                        <button
                          type="button"
                          onClick={() => addPtoRowAfter(row)}
                          onMouseEnter={() => setHoveredPtoAddRowId(row.id)}
                          onMouseLeave={() => setHoveredPtoAddRowId((current) => (current === row.id ? null : current))}
                          style={{
                            ...ptoInlineAddRowButtonStyle,
                            ...(hoveredPtoAddRowId === row.id ? ptoInlineAddRowButtonHoverStyle : null),
                          }}
                          title="Добавить строку ниже"
                          aria-label="Добавить строку ниже"
                        >
                          +
                        </button>
                      ) : null}
                      <div style={ptoAreaCellStyle}>
                        {ptoDateEditing ? (
                          <div style={ptoRowToolsStyle}>
                          <button
                            type="button"
                            draggable
                            onDragStart={() => {
                              setDraggedPtoRowId(row.id);
                              setPtoDropTarget(null);
                            }}
                            onDragEnd={() => {
                              setDraggedPtoRowId(null);
                              setPtoDropTarget(null);
                            }}
                            style={dragHandleStyle}
                            title="Перетащи строку"
                            aria-label="Перетащи строку"
                          >
                            <span style={dragHandleDotsStyle} aria-hidden>
                              <span style={dragHandleDotStyle} />
                              <span style={dragHandleDotStyle} />
                              <span style={dragHandleDotStyle} />
                            </span>
                          </button>
                          </div>
                        ) : null}
                        <PtoDateEditableTextCell
                          editing={ptoDateEditing}
                          value={row.area}
                          draftValue={getPtoRowTextDraft(row, "area")}
                          dataFieldKey={ptoRowFieldDomKey(row.id, "area")}
                          listId="pto-area-options"
                          placeholder="Уч_Аксу"
                          onBeginDraft={() => beginPtoRowTextDraft(row, "area")}
                          onUpdateDraft={(value) => updatePtoRowTextDraft(row.id, "area", value)}
                          onCommitDraft={() => commitPtoRowTextDraft(setRows, row, "area")}
                          onCancelDraft={() => cancelPtoRowTextDraft(row.id, "area")}
                        />
                      </div>
                    </PtoPlanTd>
                    {showLocation ? (
                      <PtoPlanTd>
                        <PtoDateEditableTextCell
                          editing={ptoDateEditing}
                          value={row.location}
                          draftValue={getPtoRowTextDraft(row, "location")}
                          dataFieldKey={ptoRowFieldDomKey(row.id, "location")}
                          listId={locationListId}
                          options={locationOptions}
                          placeholder="Карьер"
                          onBeginDraft={() => beginPtoRowTextDraft(row, "location")}
                          onUpdateDraft={(value) => updatePtoRowTextDraft(row.id, "location", value)}
                          onCommitDraft={() => commitPtoRowTextDraft(setRows, row, "location")}
                          onCancelDraft={() => cancelPtoRowTextDraft(row.id, "location")}
                        />
                      </PtoPlanTd>
                    ) : null}
                    <PtoPlanTd>
                      <PtoDateEditableTextCell
                        editing={ptoDateEditing}
                        value={row.structure}
                        draftValue={getPtoRowTextDraft(row, "structure")}
                        dataFieldKey={ptoRowFieldDomKey(row.id, "structure")}
                        listId={structureListId}
                        options={structureOptions}
                        placeholder="Вид работ"
                        onBeginDraft={() => beginPtoRowTextDraft(row, "structure")}
                        onUpdateDraft={(value) => updatePtoRowTextDraft(row.id, "structure", value)}
                        onCommitDraft={() => commitPtoRowTextDraft(setRows, row, "structure")}
                        onCancelDraft={() => cancelPtoRowTextDraft(row.id, "structure")}
                      />
                    </PtoPlanTd>
                    <PtoPlanTd align="center">
                      <PtoUnitCell
                        editing={ptoDateEditing}
                        value={row.unit}
                        dataFieldKey={ptoRowFieldDomKey(row.id, "unit")}
                        onChange={(value) => {
                          updatePtoDateRow(setRows, row.id, "unit", value);
                          requestPtoDatabaseSave();
                        }}
                      />
                    </PtoPlanTd>
                    <PtoPlanTd align="center">
                      <PtoStatusCell status={rowStatus} />
                    </PtoPlanTd>
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
                      <div style={{ fontWeight: 800, textAlign: "center" }} title={formatPtoFormulaNumber(rowYearTotalWithCarryover)}>{formatPtoCellNumber(rowYearTotalWithCarryover)}</div>
                    </PtoPlanTd>
                    {displayPtoMonthGroups.map((group) => {
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
                                  if (event.ctrlKey || event.metaKey) {
                                    return;
                                  }

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
