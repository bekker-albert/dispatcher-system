import {
  parseVehicleInlineFieldDomKey,
  vehicleFieldIsNumeric,
  vehicleInlineFieldDomKey,
  vehicleInlineFields,
  type VehicleInlineField,
} from "../../../lib/domain/vehicles/grid";
import type { VehicleRow } from "../../../lib/domain/vehicles/types";
import {
  editableGridKeyAtOffset,
  editableGridRangeKeys,
} from "../../../shared/editable-grid/selection";

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

export function vehicleCellRangeKeys(rows: VehicleRow[], anchor: VehicleCell, target: VehicleCell) {
  return editableGridRangeKeys(
    createVehicleGridKeys(rows),
    vehicleCellKey(anchor),
    vehicleCellKey(target),
  );
}

export function resolveVehicleCellByOffset(
  rows: VehicleRow[],
  activeCell: VehicleCell,
  rowOffset: number,
  fieldOffset: number,
) {
  const nextKey = editableGridKeyAtOffset(
    createVehicleGridKeys(rows),
    vehicleCellKey(activeCell),
    rowOffset,
    fieldOffset,
  );
  if (!nextKey) return null;

  const parsedCell = parseVehicleInlineFieldDomKey(nextKey);
  return parsedCell ? { id: parsedCell.vehicleId, field: parsedCell.field } : null;
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
