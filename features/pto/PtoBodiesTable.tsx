"use client";

import { useMemo, type RefObject } from "react";

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
import { createPtoBodyColumnGroups, type PtoBodyColumn } from "@/lib/domain/pto/bodies";
import {
  ptoBucketCellKey,
  type PtoBucketCell,
  type PtoBucketRow,
} from "@/lib/domain/pto/buckets";

type PtoBodiesTableProps = PtoBucketsCellHandlers & {
  activeCell: PtoBucketCell | null;
  columns: PtoBodyColumn[];
  draft: string;
  editKey: string | null;
  editingMode: boolean;
  headerEditor: PtoMatrixHeaderEditor;
  rows: PtoBucketRow[];
  scrollRef: RefObject<HTMLDivElement | null>;
  selectedBucketKeys: ReadonlySet<string>;
  values: Record<string, number>;
  onScheduleViewportUpdate: () => void;
};

const bodyTechniqueColumnWidth = 230;
const techniqueHeaderLabel = "\u0422\u0435\u0445\u043d\u0438\u043a\u0430";
const emptyBodiesLabel = "\u041d\u0435\u0442 \u0441\u0430\u043c\u043e\u0441\u0432\u0430\u043b\u043e\u0432 \u0434\u043b\u044f \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430 \u043a\u0443\u0437\u043e\u0432\u043e\u0432.";

export function PtoBodiesTable({
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
}: PtoBodiesTableProps) {
  const columnGroups = useMemo(() => createPtoBodyColumnGroups(columns), [columns]);
  const tableMinWidth = bodyTechniqueColumnWidth + columns.length * bucketValueColumnWidth;

  return (
    <div ref={scrollRef} onScroll={onScheduleViewportUpdate} style={ptoBucketsScrollStyle}>
      <table style={{ ...ptoBucketsTableStyle, width: tableMinWidth, minWidth: tableMinWidth }}>
        <colgroup>
          <col style={{ width: bodyTechniqueColumnWidth }} />
          {columns.map((column) => (
            <col key={column.key} style={{ width: bucketValueColumnWidth }} />
          ))}
        </colgroup>
        <thead>
          {columns.length > 0 ? (
            <>
              <tr>
                <th rowSpan={2} style={{ ...ptoBucketsThStyle, width: bodyTechniqueColumnWidth }}>
                  {renderPtoMatrixHeaderText(headerEditor, editingMode, "technique", techniqueHeaderLabel)}
                </th>
                {columnGroups.map((group) => (
                  <th key={group.area} colSpan={group.span} style={{ ...ptoBucketsThStyle, textAlign: "center" }}>
                    {renderPtoMatrixHeaderText(headerEditor, editingMode, `area-group:${group.area}`, group.area, "center")}
                  </th>
                ))}
              </tr>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={ptoBucketsThStyle}>
                    {renderPtoMatrixHeaderText(headerEditor, editingMode, column.key, column.label, "center")}
                  </th>
                ))}
              </tr>
            </>
          ) : (
            <tr>
              <th style={{ ...ptoBucketsThStyle, width: bodyTechniqueColumnWidth }}>
                {renderPtoMatrixHeaderText(headerEditor, editingMode, "technique", techniqueHeaderLabel)}
              </th>
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowActiveCell = activeCell?.rowKey === row.key ? activeCell : null;

            return (
              <tr key={row.key} style={{ height: bucketRowHeight }}>
                <td style={{ ...ptoBucketsTdStyle, fontWeight: 700 }}>
                  <div style={{ ...ptoBucketReadonlyValueStyle, textAlign: "left" }}>{row.area}</div>
                </td>
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
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td style={ptoBucketsTdStyle} colSpan={1 + columns.length}>
                {emptyBodiesLabel}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
