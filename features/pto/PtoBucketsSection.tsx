"use client";

import { Check, Pencil, Trash2 } from "lucide-react";
import { PtoToolbarButton, PtoToolbarIconButton } from "@/features/pto/PtoToolbarButtons";
import {
  allAreasLabel,
  bucketAreaColumnWidth,
  bucketRowHeight,
  bucketStructureColumnWidth,
  bucketValueColumnWidth,
} from "@/features/pto/ptoBucketsConfig";
import { usePtoBucketsGridEditing } from "@/features/pto/usePtoBucketsGridEditing";
import { usePtoBucketsVirtualGrid } from "@/features/pto/usePtoBucketsVirtualGrid";
import { usePtoGridViewport } from "@/features/pto/usePtoGridViewport";
import { ptoBucketCellKey, type PtoBucketColumn, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import { formatBucketNumber } from "@/lib/domain/pto/formatting";
import {
  ptoActiveFormulaCellStyle,
  ptoBucketAddButtonStyle,
  ptoBucketControlStyle,
  ptoBucketDeleteButtonStyle,
  ptoBucketDraftCellStyle,
  ptoBucketDraftRowStyle,
  ptoBucketHorizontalSpacerStyle,
  ptoBucketManualBadgeStyle,
  ptoBucketManualToolsStyle,
  ptoBucketReadonlyValueStyle,
  ptoBucketsHintStyle,
  ptoBucketsLayoutStyle,
  ptoBucketsScrollStyle,
  ptoBucketsTableStyle,
  ptoBucketsTdStyle,
  ptoBucketsThStyle,
  ptoBucketSpacerCellStyle,
  ptoBucketStructureCellStyle,
  ptoBucketTextInputStyle,
  ptoEditingFormulaCellStyle,
  ptoSelectedFormulaCellStyle,
  ptoToolbarBlockStyle,
  ptoToolbarLabelStyle,
  ptoToolbarRowStyle,
  ptoToolbarStyle,
} from "@/features/pto/ptoBucketsStyles";

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
  const { scrollRef, viewport, updateViewport, scheduleViewportUpdate } = usePtoGridViewport();
  const {
    tableMinWidth,
    virtualRows,
    virtualColumns,
    renderedColumnSpan,
  } = usePtoBucketsVirtualGrid({ rows, columns, viewport });
  const {
    activeCell,
    addManualRow,
    draft,
    draftRow,
    editKey,
    editingMode,
    handleCellBlur,
    handleCellDraftChange,
    handleCellKeyDown,
    handleCellMouseDown,
    selectCell,
    selectedBucketKeys,
    setDraftRowArea,
    setDraftRowStructure,
    startEdit,
    toggleEditingMode,
  } = usePtoBucketsGridEditing({
    rows,
    columns,
    defaultDraftArea,
    scrollRef,
    updateViewport,
    onCommitValue,
    onClearCells,
    onAddManualRow,
  });

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
            key={cellKey}
            id={`pto-bucket-cell-${cellKey}`}
            autoFocus
            data-pto-bucket-cell={cellKey}
            inputMode="decimal"
            defaultValue={draft}
            onChange={handleCellDraftChange}
            onBlur={() => handleCellBlur(cellKey)}
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
                    onChange={(event) => setDraftRowArea(event.target.value)}
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
                      onChange={(event) => setDraftRowStructure(event.target.value)}
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
