"use client";

import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import {
  vehicleInlineFieldDomKey,
  type VehicleInlineField,
} from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import {
  clearVehicleInlineFields,
  vehicleInlineCellValue,
  vehicleInlineClearLogEntry,
  vehicleInlineEditLogEntry,
} from "./vehicleInlineEditModel";
import {
  collectSelectedVehicleFieldsById,
  resolveVehicleCellByOffset,
  type VehicleCell,
} from "./vehicleInlineGridModel";
import type { PendingVehicleFocus } from "./useVehiclePendingFocus";

type UseVehicleInlineCellEditOptions = {
  vehicleRows: VehicleRow[];
  visibleVehicleRows: VehicleRow[];
  selectedVehicleCellKeys: string[];
  vehicleCellDraft: string;
  vehicleCellInitialDraft: string;
  vehicleCellSkipBlurCommitRef: MutableRefObject<boolean>;
  vehicleSelectionAnchorRef: MutableRefObject<VehicleCell | null>;
  setVehicleRows: Dispatch<SetStateAction<VehicleRow[]>>;
  setActiveVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleSelectionAnchorCell: Dispatch<SetStateAction<VehicleCell | null>>;
  setSelectedVehicleCellKeys: Dispatch<SetStateAction<string[]>>;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleCellDraft: Dispatch<SetStateAction<string>>;
  setVehicleCellInitialDraft: Dispatch<SetStateAction<string>>;
  setPendingVehicleFocus: Dispatch<SetStateAction<PendingVehicleFocus | null>>;
  updateVehicleRow: (id: number, field: VehicleInlineField, value: string) => void;
  pushVehicleUndoSnapshot: () => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function useVehicleInlineCellEdit({
  vehicleRows,
  visibleVehicleRows,
  selectedVehicleCellKeys,
  vehicleCellDraft,
  vehicleCellInitialDraft,
  vehicleCellSkipBlurCommitRef,
  vehicleSelectionAnchorRef,
  setVehicleRows,
  setActiveVehicleCell,
  setVehicleSelectionAnchorCell,
  setSelectedVehicleCellKeys,
  setEditingVehicleCell,
  setVehicleCellDraft,
  setVehicleCellInitialDraft,
  setPendingVehicleFocus,
  updateVehicleRow,
  pushVehicleUndoSnapshot,
  addAdminLog,
}: UseVehicleInlineCellEditOptions) {
  const vehicleCellValue = useCallback((id: number, field: VehicleInlineField) => {
    return vehicleInlineCellValue(vehicleRows, id, field);
  }, [vehicleRows]);

  const startVehicleInlineCellEdit = useCallback((id: number, field: VehicleInlineField, draftOverride?: string) => {
    const fieldKey = vehicleInlineFieldDomKey(id, field);
    const currentValue = vehicleCellValue(id, field);
    const draft = draftOverride ?? currentValue;

    vehicleCellSkipBlurCommitRef.current = false;
    setActiveVehicleCell(fieldKey);
    vehicleSelectionAnchorRef.current = { id, field };
    setVehicleSelectionAnchorCell({ id, field });
    setSelectedVehicleCellKeys([fieldKey]);
    setEditingVehicleCell(fieldKey);
    setVehicleCellDraft(draft);
    setVehicleCellInitialDraft(currentValue);
    setPendingVehicleFocus({ id, field, edit: true, selectContents: draftOverride === undefined });
  }, [
    setActiveVehicleCell,
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setSelectedVehicleCellKeys,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setVehicleSelectionAnchorCell,
    vehicleCellSkipBlurCommitRef,
    vehicleCellValue,
    vehicleSelectionAnchorRef,
  ]);

  const commitVehicleInlineCellEdit = useCallback((id: number, field: VehicleInlineField) => {
    const fieldKey = vehicleInlineFieldDomKey(id, field);
    setEditingVehicleCell((current) => (current === fieldKey ? null : current));
    if (vehicleCellDraft !== vehicleCellInitialDraft) {
      updateVehicleRow(id, field, vehicleCellDraft);
      addAdminLog(vehicleInlineEditLogEntry(vehicleRows, id, field));
    }
    setVehicleCellInitialDraft("");
  }, [
    addAdminLog,
    setEditingVehicleCell,
    setVehicleCellInitialDraft,
    updateVehicleRow,
    vehicleCellDraft,
    vehicleCellInitialDraft,
    vehicleRows,
  ]);

  const cancelVehicleInlineCellEdit = useCallback((id: number, field: VehicleInlineField) => {
    const fieldKey = vehicleInlineFieldDomKey(id, field);
    vehicleCellSkipBlurCommitRef.current = true;
    setVehicleCellDraft(vehicleCellInitialDraft);
    setVehicleCellInitialDraft("");
    setEditingVehicleCell((current) => (current === fieldKey ? null : current));
    setPendingVehicleFocus({ id, field });
  }, [
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    vehicleCellInitialDraft,
    vehicleCellSkipBlurCommitRef,
  ]);

  const focusVehicleInlineCell = useCallback((id: number, field: VehicleInlineField, edit = false) => {
    setPendingVehicleFocus({ id, field, edit });
  }, [setPendingVehicleFocus]);

  const clearSelectedVehicleCells = useCallback((id: number, field: VehicleInlineField) => {
    const fallbackKey = vehicleInlineFieldDomKey(id, field);
    const targetKeys = selectedVehicleCellKeys.length ? selectedVehicleCellKeys : [fallbackKey];
    const targetFieldsById = collectSelectedVehicleFieldsById(targetKeys);

    pushVehicleUndoSnapshot();
    setVehicleRows((current) => clearVehicleInlineFields(current, targetFieldsById));
    addAdminLog(vehicleInlineClearLogEntry(targetKeys.length));
  }, [addAdminLog, pushVehicleUndoSnapshot, selectedVehicleCellKeys, setVehicleRows]);

  const focusVehicleCellByOffset = useCallback((id: number, field: VehicleInlineField, rowOffset: number, fieldOffset: number) => {
    const nextCell = resolveVehicleCellByOffset(visibleVehicleRows, { id, field }, rowOffset, fieldOffset);
    if (!nextCell) return;
    focusVehicleInlineCell(nextCell.id, nextCell.field);
  }, [focusVehicleInlineCell, visibleVehicleRows]);

  return {
    cancelVehicleInlineCellEdit,
    clearSelectedVehicleCells,
    commitVehicleInlineCellEdit,
    focusVehicleCellByOffset,
    startVehicleInlineCellEdit,
  };
}
