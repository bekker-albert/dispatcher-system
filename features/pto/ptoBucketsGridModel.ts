import { ptoBucketCellKey, ptoBucketSelectionKey, type PtoBucketCell } from "../../lib/domain/pto/buckets";
import {
  editableGridArrowOffset,
  editableGridAxisCellByOffset,
  editableGridAxisRangeKeys,
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
  return editableGridAxisRangeKeys(
    rowKeys,
    columnKeys,
    anchorCell.rowKey,
    anchorCell.equipmentKey,
    targetCell.rowKey,
    targetCell.equipmentKey,
    ptoBucketCellKey,
    ptoBucketSelectionKey(targetCell),
  );
}

export function resolvePtoBucketCellByOffset(
  rowKeys: string[],
  columnKeys: string[],
  activeCell: PtoBucketCell,
  rowOffset: number,
  columnOffset: number,
): PtoBucketNavigationTarget | null {
  return editableGridAxisCellByOffset(
    rowKeys,
    columnKeys,
    activeCell.rowKey,
    activeCell.equipmentKey,
    rowOffset,
    columnOffset,
    (rowKey, equipmentKey) => ({ rowKey, equipmentKey }),
  );
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
