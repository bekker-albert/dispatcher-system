"use client";

import { Check, Pencil, Trash2 } from "lucide-react";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PtoToolbarButton, PtoToolbarIconButton } from "@/features/pto/PtoToolbarButtons";
import { ptoBucketCellKey, ptoBucketSelectionKey, type PtoBucketCell, type PtoBucketColumn, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import { formatBucketNumber } from "@/lib/domain/pto/formatting";
import { toggleEditableGridSelectionKey } from "@/shared/editable-grid/selection";

type PtoBucketsSectionProps = {
  ptoAreaTabs: string[];
  ptoAreaFilter: string;
  onSelectArea: (area: string) => void;
  rows: PtoBucketRow[];
  columns: PtoBucketColumn[];
  values: Record<string, number>;
  onCommitValue: (cellKey: string, draft: string) => void;
  onClearCells: (cellKeys: string[]) => void;
  onAddManualRow: (area: string, structure: string) => boolean;
  onDeleteManualRow: (row: PtoBucketRow) => void;
};

const allAreasLabel = "Все участки";
const bucketAreaColumnWidth = 150;
const bucketStructureColumnWidth = 320;
const bucketValueColumnWidth = 120;
const bucketFrozenWidth = bucketAreaColumnWidth + bucketStructureColumnWidth;
const bucketRowHeight = 34;
const bucketOverscanRows = 8;
const bucketOverscanColumns = 5;

export default function PtoBucketsSection({
  ptoAreaTabs,
  ptoAreaFilter,
  onSelectArea,
  rows,
  columns,
  values,
  onCommitValue,
  onClearCells,
  onAddManualRow,
  onDeleteManualRow,
}: PtoBucketsSectionProps) {
  const defaultDraftArea = ptoAreaFilter === allAreasLabel ? "" : ptoAreaFilter;
  const [editingMode, setEditingMode] = useState(false);
  const [draftRow, setDraftRow] = useState(() => ({ area: defaultDraftArea, structure: "" }));
  const [editKey, setEditKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [activeCell, setActiveCell] = useState<PtoBucketCell | null>(null);
  const [selectionAnchorCell, setSelectionAnchorCell] = useState<PtoBucketCell | null>(null);
  const [selectedCellKeys, setSelectedCellKeys] = useState<string[]>([]);
  const [viewport, setViewport] = useState({ scrollTop: 0, scrollLeft: 0, height: 520, width: 900 });
  const skipBlurCommitRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);

  const rowKeys = useMemo(() => rows.map((row) => row.key), [rows]);
  const columnKeys = useMemo(() => columns.map((column) => column.key), [columns]);
  const rowIndexByKey = useMemo(() => new Map(rowKeys.map((key, index) => [key, index] as const)), [rowKeys]);
  const columnIndexByKey = useMemo(() => new Map(columnKeys.map((key, index) => [key, index] as const)), [columnKeys]);
  const selectedBucketKeys = useMemo(() => new Set(selectedCellKeys), [selectedCellKeys]);
  const tableMinWidth = bucketFrozenWidth + Math.max(1, columns.length) * bucketValueColumnWidth;

  const virtualRows = useMemo(() => {
    const start = Math.max(0, Math.floor(viewport.scrollTop / bucketRowHeight) - bucketOverscanRows);
    const visibleCount = Math.ceil(viewport.height / bucketRowHeight) + bucketOverscanRows * 2;
    const end = Math.min(rows.length, start + visibleCount);

    return {
      rows: rows.slice(start, end),
      topSpacerHeight: start * bucketRowHeight,
      bottomSpacerHeight: Math.max(0, rows.length - end) * bucketRowHeight,
    };
  }, [rows, viewport.height, viewport.scrollTop]);

  const virtualColumns = useMemo(() => {
    if (columns.length === 0) {
      return {
        columns: [] as PtoBucketColumn[],
        leftSpacerWidth: 0,
        rightSpacerWidth: 0,
      };
    }

    const valueViewportLeft = Math.max(0, viewport.scrollLeft - bucketFrozenWidth);
    const valueViewportRight = Math.max(0, viewport.scrollLeft + viewport.width - bucketFrozenWidth);
    const start = Math.max(0, Math.floor(valueViewportLeft / bucketValueColumnWidth) - bucketOverscanColumns);
    const end = Math.min(
      columns.length,
      Math.max(start + 1, Math.ceil(valueViewportRight / bucketValueColumnWidth) + bucketOverscanColumns),
    );

    return {
      columns: columns.slice(start, end),
      leftSpacerWidth: start * bucketValueColumnWidth,
      rightSpacerWidth: Math.max(0, columns.length - end) * bucketValueColumnWidth,
    };
  }, [columns, viewport.scrollLeft, viewport.width]);

  const renderedColumnSpan = 2
    + virtualColumns.columns.length
    + (virtualColumns.leftSpacerWidth > 0 ? 1 : 0)
    + (virtualColumns.rightSpacerWidth > 0 ? 1 : 0);

  const clearSelection = useCallback(() => {
    setActiveCell(null);
    setSelectionAnchorCell(null);
    setSelectedCellKeys([]);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditKey(null);
    setDraft("");
  }, []);

  const clearEditingState = useCallback(() => {
    cancelEdit();
    clearSelection();
  }, [cancelEdit, clearSelection]);

  const updateViewport = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const next = {
      scrollTop: element.scrollTop,
      scrollLeft: element.scrollLeft,
      height: element.clientHeight || 520,
      width: element.clientWidth || 900,
    };

    setViewport((current) => (
      current.scrollTop === next.scrollTop
      && current.scrollLeft === next.scrollLeft
      && current.height === next.height
      && current.width === next.width
        ? current
        : next
    ));
  }, []);

  const scheduleViewportUpdate = useCallback(() => {
    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      updateViewport();
    });
  }, [updateViewport]);

  useEffect(() => {
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => {
      window.removeEventListener("resize", updateViewport);
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [updateViewport]);

  useEffect(() => {
    if (!editingMode) return undefined;

    const clearSelectionsOnOutsideClick = (event: globalThis.MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-pto-bucket-cell], [data-pto-bucket-draft-input]")) return;
      clearEditingState();
    };

    window.addEventListener("mousedown", clearSelectionsOnOutsideClick);
    return () => window.removeEventListener("mousedown", clearSelectionsOnOutsideClick);
  }, [clearEditingState, editingMode]);

  const toggleEditingMode = useCallback(() => {
    setEditingMode((current) => !current);
    clearEditingState();
  }, [clearEditingState]);

  const focusCell = useCallback((cell: PtoBucketCell) => {
    const cellKey = ptoBucketSelectionKey(cell);
    window.setTimeout(() => {
      document.getElementById(`pto-bucket-cell-${cellKey}`)?.focus();
    }, 0);
  }, []);

  const scrollCellIntoView = useCallback((rowIndex: number, columnIndex: number) => {
    const element = scrollRef.current;
    if (!element) return;

    const rowTop = rowIndex * bucketRowHeight;
    const rowBottom = rowTop + bucketRowHeight;
    const columnLeft = bucketFrozenWidth + columnIndex * bucketValueColumnWidth;
    const columnRight = columnLeft + bucketValueColumnWidth;
    const viewportBottom = element.scrollTop + element.clientHeight;
    const viewportRight = element.scrollLeft + element.clientWidth;

    if (rowTop < element.scrollTop) {
      element.scrollTop = rowTop;
    } else if (rowBottom > viewportBottom) {
      element.scrollTop = rowBottom - element.clientHeight;
    }

    if (columnLeft < element.scrollLeft) {
      element.scrollLeft = columnLeft;
    } else if (columnRight > viewportRight) {
      element.scrollLeft = columnRight - element.clientWidth;
    }

    updateViewport();
  }, [updateViewport]);

  const selectCell = useCallback((cell: PtoBucketCell) => {
    if (!editingMode) return;
    setActiveCell(cell);
    setSelectionAnchorCell(cell);
    setSelectedCellKeys([ptoBucketSelectionKey(cell)]);
  }, [editingMode]);

  const toggleCell = useCallback((cell: PtoBucketCell) => {
    if (!editingMode) return;
    const cellKey = ptoBucketSelectionKey(cell);
    setActiveCell(cell);
    setSelectionAnchorCell(cell);
    setSelectedCellKeys((current) => toggleEditableGridSelectionKey(current, cellKey));
  }, [editingMode]);

  const selectRange = useCallback((cell: PtoBucketCell) => {
    if (!editingMode) return;

    const anchorCell = selectionAnchorCell ?? activeCell ?? cell;
    const anchorRowIndex = rowIndexByKey.get(anchorCell.rowKey);
    const anchorColumnIndex = columnIndexByKey.get(anchorCell.equipmentKey);
    const targetRowIndex = rowIndexByKey.get(cell.rowKey);
    const targetColumnIndex = columnIndexByKey.get(cell.equipmentKey);

    if (
      anchorRowIndex === undefined
      || anchorColumnIndex === undefined
      || targetRowIndex === undefined
      || targetColumnIndex === undefined
    ) {
      selectCell(cell);
      return;
    }

    const rowStart = Math.min(anchorRowIndex, targetRowIndex);
    const rowEnd = Math.max(anchorRowIndex, targetRowIndex);
    const columnStart = Math.min(anchorColumnIndex, targetColumnIndex);
    const columnEnd = Math.max(anchorColumnIndex, targetColumnIndex);
    const nextKeys: string[] = [];

    for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex += 1) {
      for (let columnIndex = columnStart; columnIndex <= columnEnd; columnIndex += 1) {
        nextKeys.push(ptoBucketCellKey(rowKeys[rowIndex], columnKeys[columnIndex]));
      }
    }

    setActiveCell(cell);
    setSelectionAnchorCell(anchorCell);
    setSelectedCellKeys(nextKeys);
  }, [activeCell, columnIndexByKey, columnKeys, editingMode, rowIndexByKey, rowKeys, selectCell, selectionAnchorCell]);

  const finishEdit = useCallback((cellKey: string, draftValue: string) => {
    if (!editingMode) return;
    onCommitValue(cellKey, draftValue);
    setEditKey((current) => (current === cellKey ? null : current));
    setDraft("");
  }, [editingMode, onCommitValue]);

  const moveCell = useCallback((cell: PtoBucketCell, rowOffset: number, columnOffset: number) => {
    if (!editingMode || rowKeys.length === 0 || columnKeys.length === 0) return;

    const rowIndex = rowIndexByKey.get(cell.rowKey);
    const columnIndex = columnIndexByKey.get(cell.equipmentKey);
    if (rowIndex === undefined || columnIndex === undefined) return;

    const nextRowIndex = Math.min(Math.max(rowIndex + rowOffset, 0), rowKeys.length - 1);
    const nextColumnIndex = Math.min(Math.max(columnIndex + columnOffset, 0), columnKeys.length - 1);
    const nextCell = {
      rowKey: rowKeys[nextRowIndex] ?? cell.rowKey,
      equipmentKey: columnKeys[nextColumnIndex] ?? cell.equipmentKey,
    };

    scrollCellIntoView(nextRowIndex, nextColumnIndex);
    selectCell(nextCell);
    focusCell(nextCell);
  }, [columnIndexByKey, columnKeys, editingMode, focusCell, rowIndexByKey, rowKeys, scrollCellIntoView, selectCell]);

  const clearCells = useCallback((fallbackCell: PtoBucketCell) => {
    if (!editingMode) return;
    const targetKeys = selectedCellKeys.length ? selectedCellKeys : [ptoBucketSelectionKey(fallbackCell)];
    skipBlurCommitRef.current = editKey;
    cancelEdit();
    onClearCells(targetKeys);
  }, [cancelEdit, editKey, editingMode, onClearCells, selectedCellKeys]);

  const startEdit = useCallback((cell: PtoBucketCell, value: number | undefined, initialDraft?: string) => {
    if (!editingMode) return;
    const cellKey = ptoBucketSelectionKey(cell);
    selectCell(cell);
    setEditKey(cellKey);
    setDraft(initialDraft ?? formatBucketNumber(value));
    focusCell(cell);
  }, [editingMode, focusCell, selectCell]);

  const handleCellMouseDown = useCallback((event: MouseEvent<HTMLElement>, cell: PtoBucketCell) => {
    if (!editingMode || event.button !== 0) return;

    if (event.shiftKey) {
      selectRange(cell);
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      toggleCell(cell);
      return;
    }

    selectCell(cell);
  }, [editingMode, selectCell, selectRange, toggleCell]);

  const handleCellKeyDown = useCallback((
    event: KeyboardEvent<HTMLElement>,
    cell: PtoBucketCell,
    value: number | undefined,
    cellKey: string,
    isEditing: boolean,
  ) => {
    if (!editingMode) return;

    const arrowMove: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    if (event.key in arrowMove) {
      event.preventDefault();
      if (isEditing) {
        skipBlurCommitRef.current = cellKey;
        finishEdit(cellKey, draft);
      }

      const [rowOffset, columnOffset] = arrowMove[event.key];
      moveCell(cell, rowOffset, columnOffset);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (isEditing) {
        skipBlurCommitRef.current = cellKey;
        finishEdit(cellKey, draft);
      } else {
        startEdit(cell, value);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (isEditing) {
        skipBlurCommitRef.current = cellKey;
        cancelEdit();
      } else {
        clearSelection();
      }
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      clearCells(cell);
      return;
    }

    if (!isEditing && /^[0-9.,-]$/.test(event.key)) {
      event.preventDefault();
      startEdit(cell, value, event.key);
    }
  }, [cancelEdit, clearCells, clearSelection, draft, editingMode, finishEdit, moveCell, startEdit]);

  const addManualRow = useCallback(() => {
    if (!editingMode) return;
    const created = onAddManualRow(draftRow.area, draftRow.structure);
    if (!created) return;
    setDraftRow({ area: defaultDraftArea, structure: "" });
  }, [defaultDraftArea, draftRow.area, draftRow.structure, editingMode, onAddManualRow]);

  const renderBucketCell = (row: PtoBucketRow, column: PtoBucketColumn) => {
    const cellKey = ptoBucketCellKey(row.key, column.key);
    const cell = { rowKey: row.key, equipmentKey: column.key };
    const value = values[cellKey];
    const formattedValue = formatBucketNumber(value);

    if (!editingMode) {
      return (
        <td key={column.key} style={ptoBucketsTdStyle}>
          <div style={ptoBucketReadonlyValueStyle} title={formattedValue || undefined}>{formattedValue}</div>
        </td>
      );
    }

    const isEditing = editKey === cellKey;
    const selected = selectedBucketKeys.has(cellKey);
    const active = activeCell?.rowKey === row.key && activeCell.equipmentKey === column.key;
    const cellControlStyle = {
      ...ptoBucketControlStyle,
      ...(selected ? ptoSelectedFormulaCellStyle : null),
      ...(active ? ptoActiveFormulaCellStyle : null),
      ...(isEditing ? ptoEditingFormulaCellStyle : null),
    };

    return (
      <td key={column.key} style={ptoBucketsTdStyle}>
        {isEditing ? (
          <input
            id={`pto-bucket-cell-${cellKey}`}
            autoFocus
            data-pto-bucket-cell={cellKey}
            inputMode="decimal"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              if (skipBlurCommitRef.current === cellKey) {
                skipBlurCommitRef.current = null;
                return;
              }

              finishEdit(cellKey, draft);
            }}
            onKeyDown={(event) => handleCellKeyDown(event, cell, value, cellKey, true)}
            placeholder="0,00"
            style={cellControlStyle}
          />
        ) : (
          <button
            id={`pto-bucket-cell-${cellKey}`}
            data-pto-bucket-cell={cellKey}
            type="button"
            onFocus={() => {
              if (!selected) selectCell(cell);
            }}
            onMouseDown={(event) => handleCellMouseDown(event, cell)}
            onDoubleClick={() => startEdit(cell, value)}
            onKeyDown={(event) => handleCellKeyDown(event, cell, value, cellKey, false)}
            style={cellControlStyle}
            title={formattedValue || undefined}
          >
            {formattedValue}
          </button>
        )}
      </td>
    );
  };

  return (
    <div style={ptoBucketsLayoutStyle}>
      <div style={ptoToolbarStyle}>
        <div style={ptoToolbarBlockStyle}>
          <span style={ptoToolbarLabelStyle}>Участки</span>
          <div style={ptoToolbarRowStyle}>
            {ptoAreaTabs.map((area) => (
              <PtoToolbarButton key={area} active={ptoAreaFilter === area} onClick={() => onSelectArea(area)} label={area} />
            ))}
          </div>
        </div>

        <div style={{ ...ptoToolbarBlockStyle, justifySelf: "end", alignItems: "end" }}>
          <span style={ptoToolbarLabelStyle}>Редактирование</span>
          <div style={ptoToolbarRowStyle}>
            <PtoToolbarIconButton label={editingMode ? "Завершить редактирование таблицы" : "Редактировать таблицу"} onClick={toggleEditingMode}>
              {editingMode ? <Check size={14} aria-hidden /> : <Pencil size={14} aria-hidden />}
            </PtoToolbarIconButton>
          </div>
        </div>
      </div>

      {columns.length === 0 ? (
        <div style={ptoBucketsHintStyle}>
          Добавь в админке погрузочную технику с видом &quot;Экскаватор&quot; или &quot;Погрузчик&quot;. Здесь автоматически появятся столбцы Марка Модель.
        </div>
      ) : null}

      <div ref={scrollRef} onScroll={scheduleViewportUpdate} style={ptoBucketsScrollStyle}>
        <table style={{ ...ptoBucketsTableStyle, width: tableMinWidth, minWidth: tableMinWidth }}>
          <colgroup>
            <col style={{ width: bucketAreaColumnWidth }} />
            <col style={{ width: bucketStructureColumnWidth }} />
            {virtualColumns.leftSpacerWidth > 0 ? <col style={{ width: virtualColumns.leftSpacerWidth }} /> : null}
            {virtualColumns.columns.map((column) => (
              <col key={column.key} style={{ width: bucketValueColumnWidth }} />
            ))}
            {virtualColumns.rightSpacerWidth > 0 ? <col style={{ width: virtualColumns.rightSpacerWidth }} /> : null}
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...ptoBucketsThStyle, width: bucketAreaColumnWidth }}>Участок</th>
              <th style={{ ...ptoBucketsThStyle, width: bucketStructureColumnWidth }}>Структура</th>
              {virtualColumns.leftSpacerWidth > 0 ? <th aria-hidden style={ptoBucketHorizontalSpacerStyle} /> : null}
              {virtualColumns.columns.map((column) => (
                <th key={column.key} style={ptoBucketsThStyle}>{column.label}</th>
              ))}
              {virtualColumns.rightSpacerWidth > 0 ? <th aria-hidden style={ptoBucketHorizontalSpacerStyle} /> : null}
            </tr>
          </thead>
          <tbody>
            {virtualRows.topSpacerHeight > 0 ? (
              <tr aria-hidden>
                <td colSpan={renderedColumnSpan} style={{ ...ptoBucketSpacerCellStyle, height: virtualRows.topSpacerHeight }} />
              </tr>
            ) : null}
            {virtualRows.rows.map((row) => (
              <tr key={row.key} style={{ height: bucketRowHeight }}>
                <td style={ptoBucketsTdStyle}>{row.area}</td>
                <td style={{ ...ptoBucketsTdStyle, fontWeight: 700 }}>
                  <div style={ptoBucketStructureCellStyle}>
                    <span>{row.structure}</span>
                    {editingMode && row.source === "manual" ? (
                      <span style={ptoBucketManualToolsStyle}>
                        <span style={ptoBucketManualBadgeStyle}>Временная</span>
                        <button
                          type="button"
                          aria-label={`Удалить ${row.structure}`}
                          title="Удалить временную строку"
                          onClick={() => onDeleteManualRow(row)}
                          style={ptoBucketDeleteButtonStyle}
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    ) : null}
                  </div>
                </td>
                {virtualColumns.leftSpacerWidth > 0 ? <td aria-hidden style={ptoBucketHorizontalSpacerStyle} /> : null}
                {virtualColumns.columns.map((column) => renderBucketCell(row, column))}
                {virtualColumns.rightSpacerWidth > 0 ? <td aria-hidden style={ptoBucketHorizontalSpacerStyle} /> : null}
              </tr>
            ))}
            {virtualRows.bottomSpacerHeight > 0 ? (
              <tr aria-hidden>
                <td colSpan={renderedColumnSpan} style={{ ...ptoBucketSpacerCellStyle, height: virtualRows.bottomSpacerHeight }} />
              </tr>
            ) : null}
            {editingMode ? (
              <tr style={ptoBucketDraftRowStyle}>
                <td style={ptoBucketsTdStyle}>
                  <input
                    data-pto-bucket-draft-input
                    value={draftRow.area}
                    list="pto-bucket-area-options"
                    onChange={(event) => setDraftRow((current) => ({ ...current, area: event.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addManualRow();
                      }
                    }}
                    placeholder={ptoAreaFilter === allAreasLabel ? "Участок" : ptoAreaFilter}
                    style={ptoBucketTextInputStyle}
                  />
                </td>
                <td style={ptoBucketsTdStyle}>
                  <div style={ptoBucketDraftCellStyle}>
                    <input
                      data-pto-bucket-draft-input
                      value={draftRow.structure}
                      onChange={(event) => setDraftRow((current) => ({ ...current, structure: event.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addManualRow();
                        }
                      }}
                      placeholder="Временная структура"
                      style={ptoBucketTextInputStyle}
                    />
                    <button
                      type="button"
                      onClick={addManualRow}
                      title="Добавить временную строку"
                      style={ptoBucketAddButtonStyle}
                    >
                      +
                    </button>
                  </div>
                </td>
                {virtualColumns.leftSpacerWidth > 0 ? <td aria-hidden style={ptoBucketHorizontalSpacerStyle} /> : null}
                {virtualColumns.columns.map((column) => (
                  <td key={column.key} style={ptoBucketsTdStyle} />
                ))}
                {virtualColumns.rightSpacerWidth > 0 ? <td aria-hidden style={ptoBucketHorizontalSpacerStyle} /> : null}
              </tr>
            ) : null}
            {rows.length === 0 ? (
              <tr>
                <td style={ptoBucketsTdStyle} colSpan={renderedColumnSpan}>
                  В Плане, Оперучете и Замере пока нет строк с участком и структурой.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editingMode ? (
        <datalist id="pto-bucket-area-options">
          {ptoAreaTabs.filter((area) => area !== allAreasLabel).map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
      ) : null}
    </div>
  );
}

const ptoBucketsLayoutStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const ptoBucketsHintStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  color: "#475569",
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 700,
};

const ptoBucketsScrollStyle: CSSProperties = {
  overflow: "auto",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  maxHeight: "calc(100dvh - 310px)",
  minHeight: 260,
};

const ptoBucketsTableStyle: CSSProperties = {
  width: "100%",
  minWidth: 760,
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
};

const ptoBucketsThStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  background: "#f8fafc",
  color: "#0f172a",
  padding: "6px 8px",
  textAlign: "left",
  verticalAlign: "middle",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.2,
};

const ptoBucketsTdStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  padding: 4,
  verticalAlign: "middle",
  background: "#ffffff",
};

const ptoBucketSpacerCellStyle: CSSProperties = {
  border: "none",
  padding: 0,
  background: "#ffffff",
};

const ptoBucketHorizontalSpacerStyle: CSSProperties = {
  border: "none",
  padding: 0,
  background: "#ffffff",
};

const ptoBucketStructureCellStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const ptoBucketManualToolsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  flex: "0 0 auto",
};

const ptoBucketManualBadgeStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 8,
  color: "#475569",
  background: "#f8fafc",
  padding: "2px 5px",
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1.1,
};

const ptoBucketDeleteButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: "none",
  background: "transparent",
  color: "#991b1b",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 2,
  outline: "none",
};

const ptoBucketDraftRowStyle: CSSProperties = {
  background: "#f8fafc",
};

const ptoBucketDraftCellStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 24px",
  gap: 4,
  alignItems: "center",
};

const ptoBucketTextInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.25,
  outline: "none",
  padding: "3px 4px",
};

const ptoBucketAddButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: 22,
  height: 22,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1,
  padding: 0,
  outline: "none",
};

const ptoBucketReadonlyValueStyle: CSSProperties = {
  minHeight: 22,
  color: "#0f172a",
  fontVariantNumeric: "tabular-nums",
  lineHeight: "22px",
  overflow: "hidden",
  textAlign: "center",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const ptoBucketControlStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#0f172a",
  cursor: "cell",
  display: "block",
  fontFamily: "inherit",
  fontSize: 12,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.25,
  outline: "none",
  overflow: "hidden",
  padding: "3px 4px",
  textAlign: "center",
  textOverflow: "clip",
  whiteSpace: "nowrap",
};

const ptoToolbarStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: "8px 10px",
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) auto",
  gap: 8,
  alignItems: "end",
};

const ptoToolbarBlockStyle: CSSProperties = {
  display: "grid",
  gap: 4,
  alignContent: "start",
};

const ptoToolbarRowStyle: CSSProperties = {
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
  alignItems: "center",
};

const ptoToolbarLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 700,
};

const ptoActiveFormulaCellStyle: CSSProperties = {
  outline: "2px solid #2563eb",
  outlineOffset: "-2px",
  zIndex: 2,
};

const ptoSelectedFormulaCellStyle: CSSProperties = {
  background: "#f0f7ff",
  outline: "2px solid #2563eb",
  outlineOffset: "-2px",
  zIndex: 1,
};

const ptoEditingFormulaCellStyle: CSSProperties = {
  background: "#eaf4ff",
};
