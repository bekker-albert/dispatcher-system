import type { VehicleInlineField } from "@/lib/domain/vehicles/grid";
import {
  editableGridArrowOffset,
  isEditableGridArrowKey,
} from "@/shared/editable-grid/selection";
import { vehicleKeyStartsInlineEdit } from "./vehicleInlineGridModel";

type VehicleInlineKeyInput = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  editing: boolean;
  field: VehicleInlineField;
};

type VehicleInlineKeyCommand =
  | { type: "none" }
  | { type: "cancelEdit" }
  | { type: "clearCells" }
  | { type: "commitAndFocusCurrent" }
  | { type: "focusOffset"; rowOffset: number; fieldOffset: number; commitFirst: boolean }
  | { type: "resetSelection" }
  | { type: "startEdit"; draftOverride?: string };

export function resolveVehicleInlineKeyCommand({
  key,
  ctrlKey,
  altKey,
  metaKey,
  editing,
  field,
}: VehicleInlineKeyInput): VehicleInlineKeyCommand {
  if (ctrlKey || altKey || metaKey) return { type: "none" };

  if (editing) {
    if (isEditableGridArrowKey(key)) {
      const offset = editableGridArrowOffset(key);
      return {
        type: "focusOffset",
        rowOffset: offset.rowOffset,
        fieldOffset: offset.columnOffset,
        commitFirst: true,
      };
    }

    if (key === "Enter") return { type: "commitAndFocusCurrent" };
    if (key === "Escape") return { type: "cancelEdit" };
    return { type: "none" };
  }

  if (vehicleKeyStartsInlineEdit(field, key)) return { type: "startEdit", draftOverride: key };
  if (key === "Backspace" || key === "Delete") return { type: "clearCells" };
  if (key === "F2" || key === "Enter") return { type: "startEdit" };

  if (isEditableGridArrowKey(key)) {
    const offset = editableGridArrowOffset(key);
    return {
      type: "focusOffset",
      rowOffset: offset.rowOffset,
      fieldOffset: offset.columnOffset,
      commitFirst: false,
    };
  }

  if (key === "Escape") return { type: "resetSelection" };
  return { type: "none" };
}
