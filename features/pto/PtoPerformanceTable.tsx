"use client";

import type { RefObject } from "react";

import { PtoBucketValueCell } from "@/features/pto/PtoBucketValueCell";
import { bucketRowHeight, bucketValueColumnWidth } from "@/features/pto/ptoBucketsConfig";
import {
  ptoBucketReadonlyValueStyle,
  ptoBucketsScrollStyle,
  ptoBucketsTableStyle,
  ptoBucketsTdStyle,
  ptoBucketsThStyle,
} from "@/features/pto/ptoBucketsStyles";
import type { PtoBucketsCellHandlers } from "@/features/pto/PtoBucketsTableTypes";
import { renderPtoMatrixHeaderText, type PtoMatrixHeaderEditor } from "@/features/pto/ptoMatrixHeaderEditing";
import { formatBucketNumber } from "@/lib/domain/pto/formatting";
import {
  calculatePtoObrKio,
  ptoPerformanceCalculatedColumn,
  type PtoPerformanceColumn,
  type PtoPerformanceRow,
} from "@/lib/domain/pto/performance";
import {
  ptoBucketCellKey,
  type PtoBucketCell,
} from "@/lib/domain/pto/buckets";

type PtoPerformanceTableProps = PtoBucketsCellHandlers & {
  activeCell: PtoBucketCell | null;
  columns: PtoPerformanceColumn[];
  draft: string;
  editKey: string | null;
  editingMode: boolean;
  headerEditor: PtoMatrixHeaderEditor;
  rows: PtoPerformanceRow[];
  scrollRef: RefObject<HTMLDivElement | null>;
  selectedBucketKeys: ReadonlySet<string>;
  values: Record<string, number>;
  onScheduleViewportUpdate: () => void;
};

const performanceAreaColumnWidth = 150;
const performanceStructureColumnWidth = 260;
const performanceUnitColumnWidth = 64;
const performanceComputedColumnWidth = 90;

export function PtoPerformanceTable({
  activeCell,
  columns,
  draft,
  editKey,
  editingMode,
  headerEditor,
  rows,
  scrollRef,
  selectedBucketKeys,
  values,
  onCellBlur,
  onCellDraftChange,
  onCellKeyDown,
  onCellMouseDown,
  onScheduleViewportUpdate,
  onSelectCell,
  onStartEdit,
}: PtoPerformanceTableProps) {
  const tableMinWidth = performanceAreaColumnWidth
    + performanceStructureColumnWidth
    + performanceUnitColumnWidth
    + columns.length * bucketValueColumnWidth
    + performanceComputedColumnWidth;

  return (
    <div ref={scrollRef} onScroll={onScheduleViewportUpdate} style={ptoBucketsScrollStyle}>
      <table style={{ ...ptoBucketsTableStyle, width: tableMinWidth, minWidth: tableMinWidth }}>
        <colgroup>
          <col style={{ width: performanceAreaColumnWidth }} />
          <col style={{ width: performanceStructureColumnWidth }} />
          <col style={{ width: performanceUnitColumnWidth }} />
          {columns.map((column) => (
            <col key={column.key} style={{ width: bucketValueColumnWidth }} />
          ))}
          <col style={{ width: performanceComputedColumnWidth }} />
        </colgroup>
        <thead>
          <tr>
            <th style={ptoBucketsThStyle}>
              {renderPtoMatrixHeaderText(headerEditor, editingMode, "area", "Участок")}
            </th>
            <th style={ptoBucketsThStyle}>
              {renderPtoMatrixHeaderText(headerEditor, editingMode, "structure", "Структура (Вид работ)")}
            </th>
            <th style={{ ...ptoBucketsThStyle, textAlign: "center" }}>
              {renderPtoMatrixHeaderText(headerEditor, editingMode, "unit", "Ед.", "center")}
            </th>
            {columns.map((column) => (
              <th key={column.key} style={ptoBucketsThStyle}>
                {renderPtoMatrixHeaderText(headerEditor, editingMode, column.key, column.label, "center")}
              </th>
            ))}
            <th style={{ ...ptoBucketsThStyle, textAlign: "center" }}>
              {renderPtoMatrixHeaderText(
                headerEditor,
                editingMode,
                ptoPerformanceCalculatedColumn.key,
                ptoPerformanceCalculatedColumn.label,
                "center",
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowActiveCell = activeCell?.rowKey === row.key ? activeCell : null;
            const workingTime = values[ptoBucketCellKey(row.key, "performance:working-time")];
            const obrKio = calculatePtoObrKio(workingTime);

            return (
              <tr key={row.key} style={{ height: bucketRowHeight }}>
                <td style={ptoBucketsTdStyle}>{row.area}</td>
                <td style={{ ...ptoBucketsTdStyle, fontWeight: 700 }}>{row.structure}</td>
                <td style={{ ...ptoBucketsTdStyle, textAlign: "center" }}>{row.unit}</td>
                {columns.map((column) => {
                  const cellKey = ptoBucketCellKey(row.key, column.key);
                  const isActiveCell = rowActiveCell?.equipmentKey === column.key;
                  const isEditingCell = editKey === cellKey;

                  return (
                    <PtoBucketValueCell
                      key={column.key}
                      row={row}
                      column={column}
                      cellKey={cellKey}
                      value={values[cellKey]}
                      draft={isActiveCell ? draft : ""}
                      editingMode={editingMode}
                      active={isActiveCell}
                      selected={selectedBucketKeys.has(cellKey)}
                      isEditing={isEditingCell}
                      onBlur={onCellBlur}
                      onDraftChange={onCellDraftChange}
                      onKeyDown={onCellKeyDown}
                      onMouseDown={onCellMouseDown}
                      onSelectCell={onSelectCell}
                      onStartEdit={onStartEdit}
                    />
                  );
                })}
                <td style={ptoBucketsTdStyle}>
                  <div style={ptoBucketReadonlyValueStyle}>{formatBucketNumber(obrKio)}</div>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td style={ptoBucketsTdStyle} colSpan={4 + columns.length}>
                Нет строк для расчета производительности.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
