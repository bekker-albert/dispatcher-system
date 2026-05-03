"use client";

import { useMemo, type RefObject } from "react";

import { bucketValueColumnWidth } from "@/features/pto/ptoBucketsConfig";
import {
  createPtoBucketSelectedKeysByRow,
  emptyPtoBucketSelectedKeys,
} from "@/features/pto/ptoBucketsGridModel";
import {
  ptoBucketHorizontalSpacerStyle,
  ptoBucketSpacerCellStyle,
  ptoBucketsScrollStyle,
  ptoBucketsTableStyle,
  ptoBucketsTdStyle,
  ptoBucketsThStyle,
} from "@/features/pto/ptoBucketsStyles";
import type {
  PtoBucketsCellHandlers,
  PtoBucketsVirtualColumnsView,
} from "@/features/pto/PtoBucketsTableTypes";
import { PtoPerformanceTableRow } from "@/features/pto/PtoPerformanceTableRow";
import {
  performanceAreaColumnWidth,
  performanceComputedColumnWidth,
  performanceStructureColumnWidth,
  performanceUnitColumnWidth,
} from "@/features/pto/ptoPerformanceConfig";
import { renderPtoMatrixHeaderText, type PtoMatrixHeaderEditor } from "@/features/pto/ptoMatrixHeaderEditing";
import type { PtoBucketCell } from "@/lib/domain/pto/buckets";
import {
  ptoPerformanceCalculatedColumn,
  type PtoPerformanceColumn,
  type PtoPerformanceRow,
} from "@/lib/domain/pto/performance";

type PtoPerformanceVirtualRowsView = {
  rows: PtoPerformanceRow[];
  topSpacerHeight: number;
  bottomSpacerHeight: number;
};

type PtoPerformanceTableProps = PtoBucketsCellHandlers & {
  activeCell: PtoBucketCell | null;
  draft: string;
  editKey: string | null;
  editingMode: boolean;
  headerEditor: PtoMatrixHeaderEditor;
  renderedColumnSpan: number;
  rows: PtoPerformanceRow[];
  scrollRef: RefObject<HTMLDivElement | null>;
  selectedBucketKeys: ReadonlySet<string>;
  tableMinWidth: number;
  values: Record<string, number>;
  virtualColumns: PtoBucketsVirtualColumnsView<PtoPerformanceColumn>;
  virtualRows: PtoPerformanceVirtualRowsView;
  onScheduleViewportUpdate: () => void;
};

const areaHeaderLabel = "\u0423\u0447\u0430\u0441\u0442\u043e\u043a";
const structureHeaderLabel = "\u0421\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430 (\u0412\u0438\u0434 \u0440\u0430\u0431\u043e\u0442)";
const unitHeaderLabel = "\u0415\u0434.";
const emptyPerformanceLabel = "\u041d\u0435\u0442 \u0441\u0442\u0440\u043e\u043a \u0434\u043b\u044f \u0440\u0430\u0441\u0447\u0435\u0442\u0430 \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u0438.";

export function PtoPerformanceTable({
  activeCell,
  draft,
  editKey,
  editingMode,
  headerEditor,
  renderedColumnSpan,
  rows,
  scrollRef,
  selectedBucketKeys,
  tableMinWidth,
  values,
  virtualColumns,
  virtualRows,
  onCellBlur,
  onCellDraftChange,
  onCellKeyDown,
  onCellMouseDown,
  onScheduleViewportUpdate,
  onSelectCell,
  onStartEdit,
}: PtoPerformanceTableProps) {
  const selectedBucketKeysByRow = useMemo(
    () => createPtoBucketSelectedKeysByRow(selectedBucketKeys),
    [selectedBucketKeys],
  );

  return (
    <div ref={scrollRef} onScroll={onScheduleViewportUpdate} style={ptoBucketsScrollStyle}>
      <table style={{ ...ptoBucketsTableStyle, width: tableMinWidth, minWidth: tableMinWidth }}>
        <colgroup>
          <col style={{ width: performanceAreaColumnWidth }} />
          <col style={{ width: performanceStructureColumnWidth }} />
          <col style={{ width: performanceUnitColumnWidth }} />
          {virtualColumns.leftSpacerWidth > 0 ? <col style={{ width: virtualColumns.leftSpacerWidth }} /> : null}
          {virtualColumns.columns.map((column) => (
            <col key={column.key} style={{ width: bucketValueColumnWidth }} />
          ))}
          {virtualColumns.rightSpacerWidth > 0 ? <col style={{ width: virtualColumns.rightSpacerWidth }} /> : null}
          <col style={{ width: performanceComputedColumnWidth }} />
        </colgroup>
        <thead>
          <tr>
            <th style={ptoBucketsThStyle}>
              {renderPtoMatrixHeaderText(headerEditor, editingMode, "area", areaHeaderLabel)}
            </th>
            <th style={ptoBucketsThStyle}>
              {renderPtoMatrixHeaderText(headerEditor, editingMode, "structure", structureHeaderLabel)}
            </th>
            <th style={{ ...ptoBucketsThStyle, textAlign: "center" }}>
              {renderPtoMatrixHeaderText(headerEditor, editingMode, "unit", unitHeaderLabel, "center")}
            </th>
            {virtualColumns.leftSpacerWidth > 0 ? <th aria-hidden style={ptoBucketHorizontalSpacerStyle} /> : null}
            {virtualColumns.columns.map((column) => (
              <th key={column.key} style={ptoBucketsThStyle}>
                {renderPtoMatrixHeaderText(headerEditor, editingMode, column.key, column.label, "center")}
              </th>
            ))}
            {virtualColumns.rightSpacerWidth > 0 ? <th aria-hidden style={ptoBucketHorizontalSpacerStyle} /> : null}
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
          {virtualRows.topSpacerHeight > 0 ? (
            <tr aria-hidden>
              <td colSpan={renderedColumnSpan} style={{ ...ptoBucketSpacerCellStyle, height: virtualRows.topSpacerHeight }} />
            </tr>
          ) : null}
          {virtualRows.rows.map((row) => {
            const rowActiveCell = activeCell?.rowKey === row.key ? activeCell : null;

            return (
              <PtoPerformanceTableRow
                key={row.key}
                activeCell={rowActiveCell}
                draft={rowActiveCell ? draft : ""}
                editKey={editKey}
                editingMode={editingMode}
                row={row}
                selectedBucketKeys={selectedBucketKeysByRow.get(row.key) ?? emptyPtoBucketSelectedKeys}
                values={values}
                virtualColumns={virtualColumns}
                onCellBlur={onCellBlur}
                onCellDraftChange={onCellDraftChange}
                onCellKeyDown={onCellKeyDown}
                onCellMouseDown={onCellMouseDown}
                onSelectCell={onSelectCell}
                onStartEdit={onStartEdit}
              />
            );
          })}
          {virtualRows.bottomSpacerHeight > 0 ? (
            <tr aria-hidden>
              <td colSpan={renderedColumnSpan} style={{ ...ptoBucketSpacerCellStyle, height: virtualRows.bottomSpacerHeight }} />
            </tr>
          ) : null}
          {rows.length === 0 ? (
            <tr>
              <td style={ptoBucketsTdStyle} colSpan={renderedColumnSpan}>
                {emptyPerformanceLabel}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
