import { ptoBucketCellKey, ptoBucketSelectionKey, type PtoBucketCell } from "../../lib/domain/pto/buckets";
import {
  editableGridArrowOffset,
  isEditableGridArrowKey,
} from "../../shared/editable-grid/selection";

export type PtoBucketNavigationTarget = {
  cell: PtoBucketCell;
  rowIndex: number;
  columnIndex: number;
};

export function createPtoBucketGridKeys(rowKeys: string[], columnKeys: string[]) {
  return rowKeys.map((rowKey) => columnKeys.map((columnKey) => ptoBucketCellKey(rowKey, columnKey)));
}

export function ptoBucketCellRangeKeys(
  rowKeys: string[],
  columnKeys: string[],
  anchorCell: PtoBucketCell,
  targetCell: PtoBucketCell,
) {
  const anchorRowIndex = rowKeys.indexOf(anchorCell.rowKey);
  const anchorColumnIndex = columnKeys.indexOf(anchorCell.equipmentKey);
  const targetRowIndex = rowKeys.indexOf(targetCell.rowKey);
  const targetColumnIndex = columnKeys.indexOf(targetCell.equipmentKey);

  if (
    anchorRowIndex < 0
    || anchorColumnIndex < 0
    || targetRowIndex < 0
    || targetColumnIndex < 0
  ) {
    return [ptoBucketSelectionKey(targetCell)];
  }

  const rowStart = Math.min(anchorRowIndex, targetRowIndex);
  const rowEnd = Math.max(anchorRowIndex, targetRowIndex);
  const columnStart = Math.min(anchorColumnIndex, targetColumnIndex);
  const columnEnd = Math.max(anchorColumnIndex, targetColumnIndex);
  const rangeKeys: string[] = [];

  for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex += 1) {
    const rowKey = rowKeys[rowIndex];
    if (!rowKey) continue;

    for (let columnIndex = columnStart; columnIndex <= columnEnd; columnIndex += 1) {
      const columnKey = columnKeys[columnIndex];
      if (columnKey) rangeKeys.push(ptoBucketCellKey(rowKey, columnKey));
    }
  }

  return rangeKeys;
}

export function resolvePtoBucketCellByOffset(
  rowKeys: string[],
  columnKeys: string[],
  activeCell: PtoBucketCell,
  rowOffset: number,
  columnOffset: number,
): PtoBucketNavigationTarget | null {
  if (rowKeys.length === 0 || columnKeys.length === 0) return null;

  const activeRowIndex = rowKeys.indexOf(activeCell.rowKey);
  const activeColumnIndex = columnKeys.indexOf(activeCell.equipmentKey);
  if (activeRowIndex < 0 || activeColumnIndex < 0) return null;

  const rowIndex = Math.min(rowKeys.length - 1, Math.max(0, activeRowIndex + rowOffset));
  const columnIndex = Math.min(columnKeys.length - 1, Math.max(0, activeColumnIndex + columnOffset));

  const rowKey = rowKeys[rowIndex];
  const equipmentKey = columnKeys[columnIndex];
  if (!rowKey || !equipmentKey) return null;

  return {
    cell: { rowKey, equipmentKey },
    rowIndex,
    columnIndex,
  };
}

export function ptoBucketKeyStartsInlineEdit(key: string) {
  return /^[0-9.,-]$/.test(key);
}

export type PtoBucketKeyboardAction =
  | { type: "move"; rowOffset: number; columnOffset: number; commitEditing: boolean }
  | { type: "commit-edit" }
  | { type: "start-edit" }
  | { type: "cancel-edit" }
  | { type: "clear-selection" }
  | { type: "clear-cells" }
  | { type: "start-edit-with-draft"; draft: string }
  | { type: "none" };

export function resolvePtoBucketKeyboardAction(key: string, isEditing: boolean): PtoBucketKeyboardAction {
  if (isEditableGridArrowKey(key)) {
    const { rowOffset, columnOffset } = editableGridArrowOffset(key);
    return { type: "move", rowOffset, columnOffset, commitEditing: isEditing };
  }

  if (key === "Enter") return isEditing ? { type: "commit-edit" } : { type: "start-edit" };
  if (key === "Escape") return isEditing ? { type: "cancel-edit" } : { type: "clear-selection" };
  if (key === "Delete") return { type: "clear-cells" };
  if (!isEditing && ptoBucketKeyStartsInlineEdit(key)) return { type: "start-edit-with-draft", draft: key };

  return { type: "none" };
}
