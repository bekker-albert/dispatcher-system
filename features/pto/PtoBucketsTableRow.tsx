"use client";

import { memo } from "react";
import { Trash2 } from "lucide-react";
import { PtoBucketValueCell } from "@/features/pto/PtoBucketValueCell";
import { bucketRowHeight } from "@/features/pto/ptoBucketsConfig";
import {
  ptoBucketDeleteButtonStyle,
  ptoBucketHorizontalSpacerStyle,
  ptoBucketManualBadgeStyle,
  ptoBucketManualToolsStyle,
  ptoBucketsTdStyle,
  ptoBucketStructureCellStyle,
} from "@/features/pto/ptoBucketsStyles";
import { ptoBucketCellKey, type PtoBucketCell, type PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoBucketsCellHandlers, PtoBucketsVirtualColumnsView } from "@/features/pto/PtoBucketsTableTypes";

type PtoBucketsTableRowProps = PtoBucketsCellHandlers & {
  activeCell: PtoBucketCell | null;
  draft: string;
  editKey: string | null;
  editingMode: boolean;
  row: PtoBucketRow;
  selectedBucketKeys: ReadonlySet<string>;
  values: Record<string, number>;
  virtualColumns: PtoBucketsVirtualColumnsView;
  onDeleteManualRow: (row: PtoBucketRow) => void;
};

function bucketCellSelectionSetsEqual(left: ReadonlySet<string>, right: ReadonlySet<string>) {
  if (left === right) return true;
  if (left.size !== right.size) return false;

  for (const key of left) {
    if (!right.has(key)) return false;
  }

  return true;
}

function bucketRowVisibleValuesEqual(
  previous: Pick<PtoBucketsTableRowProps, "row" | "values" | "virtualColumns">,
  next: Pick<PtoBucketsTableRowProps, "row" | "values" | "virtualColumns">,
) {
  if (previous.row.key !== next.row.key) return false;
  if (previous.virtualColumns.columns !== next.virtualColumns.columns) return false;

  return next.virtualColumns.columns.every((column) => {
    const cellKey = ptoBucketCellKey(next.row.key, column.key);
    return previous.values[cellKey] === next.values[cellKey];
  });
}

function bucketCellMatchesRow(cell: PtoBucketCell | null, rowKey: string) {
  return cell?.rowKey === rowKey;
}

function ptoBucketsTableRowPropsEqual(
  previous: PtoBucketsTableRowProps,
  next: PtoBucketsTableRowProps,
) {
  const rowKey = next.row.key;

  return previous.row === next.row
    && previous.editingMode === next.editingMode
    && previous.editKey === next.editKey
    && previous.draft === next.draft
    && previous.virtualColumns === next.virtualColumns
    && previous.onDeleteManualRow === next.onDeleteManualRow
    && previous.onCellBlur === next.onCellBlur
    && previous.onCellDraftChange === next.onCellDraftChange
    && previous.onCellKeyDown === next.onCellKeyDown
    && previous.onCellMouseDown === next.onCellMouseDown
    && previous.onSelectCell === next.onSelectCell
    && previous.onStartEdit === next.onStartEdit
    && bucketCellMatchesRow(previous.activeCell, rowKey) === bucketCellMatchesRow(next.activeCell, rowKey)
    && (
      !bucketCellMatchesRow(next.activeCell, rowKey)
      || previous.activeCell?.equipmentKey === next.activeCell?.equipmentKey
    )
    && bucketCellSelectionSetsEqual(previous.selectedBucketKeys, next.selectedBucketKeys)
    && bucketRowVisibleValuesEqual(previous, next);
}

export const PtoBucketsTableRow = memo(function PtoBucketsTableRow({
  activeCell,
  draft,
  editKey,
  editingMode,
  row,
  selectedBucketKeys,
  values,
  virtualColumns,
  onCellBlur,
  onCellDraftChange,
  onCellKeyDown,
  onCellMouseDown,
  onDeleteManualRow,
  onSelectCell,
  onStartEdit,
}: PtoBucketsTableRowProps) {
  return (
    <tr style={{ height: bucketRowHeight }}>
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
      {virtualColumns.columns.map((column) => {
        const cellKey = ptoBucketCellKey(row.key, column.key);
        const isActiveCell = activeCell?.rowKey === row.key && activeCell.equipmentKey === column.key;
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
      {virtualColumns.rightSpacerWidth > 0 ? <td aria-hidden style={ptoBucketHorizontalSpacerStyle} /> : null}
    </tr>
  );
}, ptoBucketsTableRowPropsEqual);
