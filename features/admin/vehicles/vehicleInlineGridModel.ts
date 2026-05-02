import {
  parseVehicleInlineFieldDomKey,
  vehicleFieldIsNumeric,
  vehicleInlineFieldDomKey,
  vehicleInlineFields,
  type VehicleInlineField,
} from "../../../lib/domain/vehicles/grid";
import type { VehicleRow } from "../../../lib/domain/vehicles/types";

export type VehicleCell = {
  id: number;
  field: VehicleInlineField;
};

export function vehicleCellKey({ id, field }: VehicleCell) {
  return vehicleInlineFieldDomKey(id, field);
}

export function createVehicleGridKeys(rows: VehicleRow[]) {
  return rows.map((vehicle) => (
    vehicleInlineFields.map((inlineField) => vehicleInlineFieldDomKey(vehicle.id, inlineField))
  ));
}

function vehicleCellPosition(rows: VehicleRow[], cell: VehicleCell) {
  const rowIndex = rows.findIndex((vehicle) => vehicle.id === cell.id);
  const columnIndex = vehicleInlineFields.indexOf(cell.field);

  return rowIndex >= 0 && columnIndex >= 0
    ? { rowIndex, columnIndex }
    : null;
}

export function vehicleCellRangeKeys(rows: VehicleRow[], anchor: VehicleCell, target: VehicleCell) {
  const anchorPosition = vehicleCellPosition(rows, anchor);
  const targetPosition = vehicleCellPosition(rows, target);

  if (!anchorPosition || !targetPosition) return [vehicleCellKey(target)];

  const rowStart = Math.min(anchorPosition.rowIndex, targetPosition.rowIndex);
  const rowEnd = Math.max(anchorPosition.rowIndex, targetPosition.rowIndex);
  const columnStart = Math.min(anchorPosition.columnIndex, targetPosition.columnIndex);
  const columnEnd = Math.max(anchorPosition.columnIndex, targetPosition.columnIndex);
  const keys: string[] = [];

  for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!row) continue;

    for (let columnIndex = columnStart; columnIndex <= columnEnd; columnIndex += 1) {
      const field = vehicleInlineFields[columnIndex];
      if (field) keys.push(vehicleInlineFieldDomKey(row.id, field));
    }
  }

  return keys;
}

export function resolveVehicleCellByOffset(
  rows: VehicleRow[],
  activeCell: VehicleCell,
  rowOffset: number,
  fieldOffset: number,
) {
  const position = vehicleCellPosition(rows, activeCell);
  if (!position || rows.length === 0) return null;

  const nextRowIndex = Math.min(rows.length - 1, Math.max(0, position.rowIndex + rowOffset));
  const nextColumnIndex = Math.min(vehicleInlineFields.length - 1, Math.max(0, position.columnIndex + fieldOffset));
  const nextRow = rows[nextRowIndex];
  const nextField = vehicleInlineFields[nextColumnIndex];

  return nextRow && nextField ? { id: nextRow.id, field: nextField } : null;
}

export function collectSelectedVehicleFieldsById(targetKeys: string[]) {
  const targetFieldsById = new Map<number, Set<VehicleInlineField>>();

  targetKeys.forEach((key) => {
    const parsedCell = parseVehicleInlineFieldDomKey(key);
    if (!parsedCell) return;

    const fields = targetFieldsById.get(parsedCell.vehicleId) ?? new Set<VehicleInlineField>();
    fields.add(parsedCell.field);
    targetFieldsById.set(parsedCell.vehicleId, fields);
  });

  return targetFieldsById;
}

export function vehicleKeyStartsInlineEdit(field: VehicleInlineField, key: string) {
  return key.length === 1 && (!vehicleFieldIsNumeric(field) || /^[0-9]$/.test(key));
}
