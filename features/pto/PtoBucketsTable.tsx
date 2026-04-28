"use client";

import type { RefObject } from "react";
import {
  bucketAreaColumnWidth,
  bucketStructureColumnWidth,
  bucketValueColumnWidth,
} from "@/features/pto/ptoBucketsConfig";
import { PtoBucketsDraftRow } from "@/features/pto/PtoBucketsDraftRow";
import { PtoBucketsTableRow } from "@/features/pto/PtoBucketsTableRow";
import {
  ptoBucketHorizontalSpacerStyle,
  ptoBucketsScrollStyle,
  ptoBucketsTableStyle,
  ptoBucketsTdStyle,
  ptoBucketsThStyle,
  ptoBucketSpacerCellStyle,
} from "@/features/pto/ptoBucketsStyles";
import type { PtoBucketCell, PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";
import type {
  PtoBucketsCellHandlers,
  PtoBucketsDraftRowValue,
  PtoBucketsVirtualColumnsView,
  PtoBucketsVirtualRowsView,
} from "@/features/pto/PtoBucketsTableTypes";

type PtoBucketsTableProps = PtoBucketsCellHandlers & {
  activeCell: PtoBucketCell | null;
  draft: string;
  draftRow: PtoBucketsDraftRowValue;
  editKey: string | null;
  editingMode: boolean;
  ptoAreaFilter: string;
  renderedColumnSpan: number;
  rows: PtoBucketRow[];
  scrollRef: RefObject<HTMLDivElement | null>;
  selectedBucketKeys: Set<string>;
  tableMinWidth: number;
  values: Record<string, number>;
  virtualColumns: PtoBucketsVirtualColumnsView;
  virtualRows: PtoBucketsVirtualRowsView;
  onAddManualRow: () => void;
  onDeleteManualRow: (row: PtoBucketRow) => void;
  onScheduleViewportUpdate: () => void;
  onSetDraftRowArea: (area: string) => void;
  onSetDraftRowStructure: (structure: string) => void;
};

export function PtoBucketsTable({
  activeCell,
  draft,
  draftRow,
  editKey,
  editingMode,
  ptoAreaFilter,
  renderedColumnSpan,
  rows,
  scrollRef,
  selectedBucketKeys,
  tableMinWidth,
  values,
  virtualColumns,
  virtualRows,
  onAddManualRow,
  onCellBlur,
  onCellDraftChange,
  onCellKeyDown,
  onCellMouseDown,
  onDeleteManualRow,
  onScheduleViewportUpdate,
  onSelectCell,
  onSetDraftRowArea,
  onSetDraftRowStructure,
  onStartEdit,
}: PtoBucketsTableProps) {
  return (
    <div ref={scrollRef} onScroll={onScheduleViewportUpdate} style={ptoBucketsScrollStyle}>
      <table style={{ ...ptoBucketsTableStyle, width: tableMinWidth, minWidth: tableMinWidth }}>
        <PtoBucketsColGroup virtualColumns={virtualColumns} />
        <PtoBucketsTableHeader virtualColumns={virtualColumns} />
        <tbody>
          {virtualRows.topSpacerHeight > 0 ? (
            <tr aria-hidden>
              <td colSpan={renderedColumnSpan} style={{ ...ptoBucketSpacerCellStyle, height: virtualRows.topSpacerHeight }} />
            </tr>
          ) : null}
          {virtualRows.rows.map((row) => (
            <PtoBucketsTableRow
              key={row.key}
              activeCell={activeCell}
              draft={draft}
              editKey={editKey}
              editingMode={editingMode}
              row={row}
              selectedBucketKeys={selectedBucketKeys}
              values={values}
              virtualColumns={virtualColumns}
              onCellBlur={onCellBlur}
              onCellDraftChange={onCellDraftChange}
              onCellKeyDown={onCellKeyDown}
              onCellMouseDown={onCellMouseDown}
              onDeleteManualRow={onDeleteManualRow}
              onSelectCell={onSelectCell}
              onStartEdit={onStartEdit}
            />
          ))}
          {virtualRows.bottomSpacerHeight > 0 ? (
            <tr aria-hidden>
              <td colSpan={renderedColumnSpan} style={{ ...ptoBucketSpacerCellStyle, height: virtualRows.bottomSpacerHeight }} />
            </tr>
          ) : null}
          {editingMode ? (
            <PtoBucketsDraftRow
              draftRow={draftRow}
              ptoAreaFilter={ptoAreaFilter}
              virtualColumns={virtualColumns}
              onAddManualRow={onAddManualRow}
              onSetDraftRowArea={onSetDraftRowArea}
              onSetDraftRowStructure={onSetDraftRowStructure}
            />
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
  );
}

function PtoBucketsColGroup({ virtualColumns }: { virtualColumns: PtoBucketsVirtualColumnsView }) {
  return (
    <colgroup>
      <col style={{ width: bucketAreaColumnWidth }} />
      <col style={{ width: bucketStructureColumnWidth }} />
      {virtualColumns.leftSpacerWidth > 0 ? <col style={{ width: virtualColumns.leftSpacerWidth }} /> : null}
      {virtualColumns.columns.map((column: PtoBucketColumn) => (
        <col key={column.key} style={{ width: bucketValueColumnWidth }} />
      ))}
      {virtualColumns.rightSpacerWidth > 0 ? <col style={{ width: virtualColumns.rightSpacerWidth }} /> : null}
    </colgroup>
  );
}

function PtoBucketsTableHeader({ virtualColumns }: { virtualColumns: PtoBucketsVirtualColumnsView }) {
  return (
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
  );
}
