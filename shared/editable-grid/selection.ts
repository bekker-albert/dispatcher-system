export type EditableGridKeyMatrix = string[][];

export type EditableGridPosition = {
  rowIndex: number;
  columnIndex: number;
};

export const editableGridArrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"] as const;

export type EditableGridArrowKey = typeof editableGridArrowKeys[number];

export function isEditableGridArrowKey(value: string): value is EditableGridArrowKey {
  return editableGridArrowKeys.includes(value as EditableGridArrowKey);
}

export function editableGridArrowOffset(key: EditableGridArrowKey) {
  if (key === "ArrowLeft") return { rowOffset: 0, columnOffset: -1 };
  if (key === "ArrowRight") return { rowOffset: 0, columnOffset: 1 };
  if (key === "ArrowUp") return { rowOffset: -1, columnOffset: 0 };

  return { rowOffset: 1, columnOffset: 0 };
}

export function findEditableGridKeyPosition(grid: EditableGridKeyMatrix, key: string): EditableGridPosition | null {
  for (let rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
    const columnIndex = grid[rowIndex].indexOf(key);
    if (columnIndex >= 0) return { rowIndex, columnIndex };
  }

  return null;
}

export function editableGridRangeKeys(grid: EditableGridKeyMatrix, anchorKey: string, targetKey: string) {
  const anchorPosition = findEditableGridKeyPosition(grid, anchorKey);
  const targetPosition = findEditableGridKeyPosition(grid, targetKey);

  if (!anchorPosition || !targetPosition) return [targetKey];

  const rowStart = Math.min(anchorPosition.rowIndex, targetPosition.rowIndex);
  const rowEnd = Math.max(anchorPosition.rowIndex, targetPosition.rowIndex);
  const columnStart = Math.min(anchorPosition.columnIndex, targetPosition.columnIndex);
  const columnEnd = Math.max(anchorPosition.columnIndex, targetPosition.columnIndex);

  return grid
    .slice(rowStart, rowEnd + 1)
    .flatMap((row) => row.slice(columnStart, columnEnd + 1));
}

export function editableGridKeyAtOffset(
  grid: EditableGridKeyMatrix,
  activeKey: string,
  rowOffset: number,
  columnOffset: number,
) {
  const position = findEditableGridKeyPosition(grid, activeKey);
  if (!position || grid.length === 0) return null;

  const nextRowIndex = Math.min(grid.length - 1, Math.max(0, position.rowIndex + rowOffset));
  const nextRow = grid[nextRowIndex];
  if (!nextRow.length) return null;

  const nextColumnIndex = Math.min(nextRow.length - 1, Math.max(0, position.columnIndex + columnOffset));
  return nextRow[nextColumnIndex] ?? null;
}

export function toggleEditableGridSelectionKey(currentKeys: string[], targetKey: string) {
  const nextKeys = currentKeys.includes(targetKey)
    ? currentKeys.filter((key) => key !== targetKey)
    : [...currentKeys, targetKey];

  return nextKeys.length ? nextKeys : [targetKey];
}
