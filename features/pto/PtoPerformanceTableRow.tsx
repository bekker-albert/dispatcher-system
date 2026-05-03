"use client";

import { memo } from "react";

import { PtoBucketValueCell } from "@/features/pto/PtoBucketValueCell";
import { performanceRowHeight } from "@/features/pto/ptoPerformanceConfig";
import {
  ptoBucketHorizontalSpacerStyle,
  ptoBucketReadonlyValueStyle,
  ptoBucketsTdStyle,
} from "@/features/pto/ptoBucketsStyles";
import { formatBucketNumber } from "@/lib/domain/pto/formatting";
import {
  calculatePtoObrKio,
  type PtoPerformanceColumn,
  type PtoPerformanceRow,
} from "@/lib/domain/pto/performance";
import {
  ptoBucketCellKey,
  type PtoBucketCell,
} from "@/lib/domain/pto/buckets";
import type {
  PtoBucketsCellHandlers,
  PtoBucketsVirtualColumnsView,
} from "@/features/pto/PtoBucketsTableTypes";

type PtoPerformanceTableRowProps = PtoBucketsCellHandlers & {
  activeCell: PtoBucketCell | null;
  draft: string;
  editKey: string | null;
  editingMode: boolean;
  row: PtoPerformanceRow;
  selectedBucketKeys: ReadonlySet<string>;
  values: Record<string, number>;
  virtualColumns: PtoBucketsVirtualColumnsView<PtoPerformanceColumn>;
};

function bucketCellSelectionSetsEqual(left: ReadonlySet<string>, right: ReadonlySet<string>) {
  if (left === right) return true;
  if (left.size !== right.size) return false;

  for (const key of left) {
    if (!right.has(key)) return false;
  }

  return true;
}

function performanceRowVisibleValuesEqual(
  previous: Pick<PtoPerformanceTableRowProps, "row" | "values" | "virtualColumns">,
  next: Pick<PtoPerformanceTableRowProps, "row" | "values" | "virtualColumns">,
) {
  if (previous.row.key !== next.row.key) return false;
  if (previous.virtualColumns.columns !== next.virtualColumns.columns) return false;

  const workingTimeKey = ptoBucketCellKey(next.row.key, "performance:working-time");
  if (previous.values[workingTimeKey] !== next.values[workingTimeKey]) return false;

  return next.virtualColumns.columns.every((column) => {
    const cellKey = ptoBucketCellKey(next.row.key, column.key);
    return previous.values[cellKey] === next.values[cellKey];
  });
}

function bucketCellMatchesRow(cell: PtoBucketCell | null, rowKey: string) {
  return cell?.rowKey === rowKey;
}

function editKeyMatchesRow(editKey: string | null, rowKey: string) {
  return editKey?.startsWith(`${rowKey}::`) ?? false;
}

function rowEditKeyStateEqual(previousEditKey: string | null, nextEditKey: string | null, rowKey: string) {
  const previousMatchesRow = editKeyMatchesRow(previousEditKey, rowKey);
  const nextMatchesRow = editKeyMatchesRow(nextEditKey, rowKey);

  return previousMatchesRow === nextMatchesRow
    && (!nextMatchesRow || previousEditKey === nextEditKey);
}

function ptoPerformanceTableRowPropsEqual(
  previous: PtoPerformanceTableRowProps,
  next: PtoPerformanceTableRowProps,
) {
  const rowKey = next.row.key;

  return previous.row === next.row
    && previous.editingMode === next.editingMode
    && rowEditKeyStateEqual(previous.editKey, next.editKey, rowKey)
    && previous.draft === next.draft
    && previous.virtualColumns === next.virtualColumns
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
    && performanceRowVisibleValuesEqual(previous, next);
}

export const PtoPerformanceTableRow = memo(function PtoPerformanceTableRow({
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
  onSelectCell,
  onStartEdit,
}: PtoPerformanceTableRowProps) {
  const workingTime = values[ptoBucketCellKey(row.key, "performance:working-time")];
  const obrKio = calculatePtoObrKio(workingTime);

  return (
    <tr style={{ height: performanceRowHeight }}>
      <td style={ptoBucketsTdStyle}>{row.area}</td>
      <td style={{ ...ptoBucketsTdStyle, fontWeight: 700 }}>{row.structure}</td>
      <td style={{ ...ptoBucketsTdStyle, textAlign: "center" }}>{row.unit}</td>
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
      <td style={ptoBucketsTdStyle}>
        <div style={ptoBucketReadonlyValueStyle}>{formatBucketNumber(obrKio)}</div>
      </td>
    </tr>
  );
}, ptoPerformanceTableRowPropsEqual);
