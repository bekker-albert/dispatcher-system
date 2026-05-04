"use client";

import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { PendingVehicleFocus } from "@/features/admin/vehicles/useVehiclePendingFocus";
import { parseVehicleInlineFieldDomKey, type VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { adminStorageKeys } from "@/lib/storage/keys";
import { resetVehicleInteractionState } from "@/shared/editable-grid/resetVehicleInteractionState";

type VehicleCellPosition = {
  id: number;
  field: VehicleInlineField;
};

type AdminVehicleEditModeOptions = {
  editingVehicleCell: string | null;
  commitVehicleInlineCellEdit: (vehicleId: number, field: VehicleInlineField) => void;
  setAdminVehiclesEditing: Dispatch<SetStateAction<boolean>>;
  setShowAllVehicleRows: Dispatch<SetStateAction<boolean>>;
  setPendingVehicleFocus: Dispatch<SetStateAction<PendingVehicleFocus | null>>;
  setActiveVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleSelectionAnchorCell: Dispatch<SetStateAction<VehicleCellPosition | null>>;
  setSelectedVehicleCellKeys: Dispatch<SetStateAction<string[]>>;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleCellDraft: Dispatch<SetStateAction<string>>;
  setVehicleCellInitialDraft: Dispatch<SetStateAction<string>>;
  vehicleRowsRef: RefObject<VehicleRow[]>;
};

export function useAdminVehicleEditMode({
  editingVehicleCell,
  commitVehicleInlineCellEdit,
  setAdminVehiclesEditing,
  setShowAllVehicleRows,
  setPendingVehicleFocus,
  setActiveVehicleCell,
  setVehicleSelectionAnchorCell,
  setSelectedVehicleCellKeys,
  setEditingVehicleCell,
  setVehicleCellDraft,
  setVehicleCellInitialDraft,
  vehicleRowsRef,
}: AdminVehicleEditModeOptions) {
  const startAdminVehiclesEditing = useCallback(() => {
    setAdminVehiclesEditing(true);
  }, [setAdminVehiclesEditing]);

  const finishAdminVehiclesEditing = useCallback(() => {
    if (editingVehicleCell) {
      const parsedCell = parseVehicleInlineFieldDomKey(editingVehicleCell);

      if (parsedCell) {
        commitVehicleInlineCellEdit(parsedCell.vehicleId, parsedCell.field);
      }
    }

    resetVehicleInteractionState({
      setAdminVehiclesEditing,
      setPendingVehicleFocus,
      setActiveVehicleCell,
      setVehicleSelectionAnchorCell,
      setSelectedVehicleCellKeys,
      setEditingVehicleCell,
      setVehicleCellDraft,
      setVehicleCellInitialDraft,
    });
    setShowAllVehicleRows(false);
    window.setTimeout(() => {
      window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(vehicleRowsRef.current));
    }, 0);
  }, [
    commitVehicleInlineCellEdit,
    editingVehicleCell,
    setActiveVehicleCell,
    setAdminVehiclesEditing,
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setSelectedVehicleCellKeys,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setShowAllVehicleRows,
    setVehicleSelectionAnchorCell,
    vehicleRowsRef,
  ]);

  return {
    startAdminVehiclesEditing,
    finishAdminVehiclesEditing,
  };
}
