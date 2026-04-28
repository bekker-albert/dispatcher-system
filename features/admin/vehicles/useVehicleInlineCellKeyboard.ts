"use client";

import { useCallback, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";
import type { VehicleInlineField } from "@/lib/domain/vehicles/grid";
import { resolveVehicleInlineKeyCommand } from "./vehicleInlineKeyboard";
import type { PendingVehicleFocus } from "./useVehiclePendingFocus";

type UseVehicleInlineCellKeyboardOptions = {
  activeVehicleCell: string | null;
  cancelVehicleInlineCellEdit: (id: number, field: VehicleInlineField) => void;
  clearSelectedVehicleCells: (id: number, field: VehicleInlineField) => void;
  commitVehicleInlineCellEdit: (id: number, field: VehicleInlineField) => void;
  focusVehicleCellByOffset: (
    id: number,
    field: VehicleInlineField,
    rowOffset: number,
    fieldOffset: number,
  ) => void;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  setPendingVehicleFocus: Dispatch<SetStateAction<PendingVehicleFocus | null>>;
  setSelectedVehicleCellKeys: Dispatch<SetStateAction<string[]>>;
  startVehicleInlineCellEdit: (id: number, field: VehicleInlineField, draftOverride?: string) => void;
};

export function useVehicleInlineCellKeyboard({
  activeVehicleCell,
  cancelVehicleInlineCellEdit,
  clearSelectedVehicleCells,
  commitVehicleInlineCellEdit,
  focusVehicleCellByOffset,
  setEditingVehicleCell,
  setPendingVehicleFocus,
  setSelectedVehicleCellKeys,
  startVehicleInlineCellEdit,
}: UseVehicleInlineCellKeyboardOptions) {
  return useCallback((event: KeyboardEvent<HTMLElement>, id: number, field: VehicleInlineField, editing: boolean) => {
    const command = resolveVehicleInlineKeyCommand({
      key: event.key,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      editing,
      field,
    });

    if (command.type === "none") return;

    event.preventDefault();

    if (command.type === "cancelEdit") {
      cancelVehicleInlineCellEdit(id, field);
    } else if (command.type === "clearCells") {
      clearSelectedVehicleCells(id, field);
    } else if (command.type === "commitAndFocusCurrent") {
      commitVehicleInlineCellEdit(id, field);
      setPendingVehicleFocus({ id, field });
    } else if (command.type === "focusOffset") {
      if (command.commitFirst) commitVehicleInlineCellEdit(id, field);
      focusVehicleCellByOffset(id, field, command.rowOffset, command.fieldOffset);
    } else if (command.type === "resetSelection") {
      setEditingVehicleCell(null);
      setSelectedVehicleCellKeys(activeVehicleCell ? [activeVehicleCell] : []);
    } else {
      startVehicleInlineCellEdit(id, field, command.draftOverride);
    }
  }, [
    activeVehicleCell,
    cancelVehicleInlineCellEdit,
    clearSelectedVehicleCells,
    commitVehicleInlineCellEdit,
    focusVehicleCellByOffset,
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setSelectedVehicleCellKeys,
    startVehicleInlineCellEdit,
  ]);
}
