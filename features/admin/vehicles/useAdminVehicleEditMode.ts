"use client";

import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import { parseVehicleInlineFieldDomKey, type VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { adminStorageKeys } from "@/lib/storage/keys";

type VehicleCellPosition = {
  id: number;
  field: VehicleInlineField;
};

type AdminVehicleEditModeOptions = {
  editingVehicleCell: string | null;
  commitVehicleInlineCellEdit: (vehicleId: number, field: VehicleInlineField) => void;
  setAdminVehiclesEditing: Dispatch<SetStateAction<boolean>>;
  setShowAllVehicleRows: Dispatch<SetStateAction<boolean>>;
  setActiveVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleSelectionAnchorCell: Dispatch<SetStateAction<VehicleCellPosition | null>>;
  setSelectedVehicleCellKeys: Dispatch<SetStateAction<string[]>>;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  vehicleRowsRef: RefObject<VehicleRow[]>;
};

export function useAdminVehicleEditMode({
  editingVehicleCell,
  commitVehicleInlineCellEdit,
  setAdminVehiclesEditing,
  setShowAllVehicleRows,
  setActiveVehicleCell,
  setVehicleSelectionAnchorCell,
  setSelectedVehicleCellKeys,
  setEditingVehicleCell,
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

    setAdminVehiclesEditing(false);
    setShowAllVehicleRows(false);
    setActiveVehicleCell(null);
    setVehicleSelectionAnchorCell(null);
    setSelectedVehicleCellKeys([]);
    setEditingVehicleCell(null);
    window.setTimeout(() => {
      window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(vehicleRowsRef.current));
    }, 0);
  }, [
    commitVehicleInlineCellEdit,
    editingVehicleCell,
    setActiveVehicleCell,
    setAdminVehiclesEditing,
    setEditingVehicleCell,
    setSelectedVehicleCellKeys,
    setShowAllVehicleRows,
    setVehicleSelectionAnchorCell,
    vehicleRowsRef,
  ]);

  return {
    startAdminVehiclesEditing,
    finishAdminVehiclesEditing,
  };
}
