"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { useCallback, useRef } from "react";
import { cloneVehicleRows } from "@/lib/domain/vehicles/filtering";
import type { UndoSnapshot } from "@/lib/domain/app/undo";
import type { VehicleFilterKey } from "@/lib/domain/vehicles/grid";
import type { AdminLogInput } from "./appUndoHistoryTypes";

type VehicleRowsUndoOptions = {
  addAdminLog: (entry: AdminLogInput) => void;
  vehicleRowsRef: RefObject<UndoSnapshot["vehicleRows"]>;
  setVehicleRows: Dispatch<SetStateAction<UndoSnapshot["vehicleRows"]>>;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleCellDraft: Dispatch<SetStateAction<string>>;
  setVehicleCellInitialDraft: Dispatch<SetStateAction<string>>;
  setOpenVehicleFilter: Dispatch<SetStateAction<VehicleFilterKey | null>>;
};

export function useVehicleRowsUndoHistory({
  addAdminLog,
  vehicleRowsRef,
  setVehicleRows,
  setEditingVehicleCell,
  setVehicleCellDraft,
  setVehicleCellInitialDraft,
  setOpenVehicleFilter,
}: VehicleRowsUndoOptions) {
  const vehicleUndoHistoryRef = useRef<UndoSnapshot["vehicleRows"][]>([]);

  const pushVehicleUndoSnapshot = useCallback(() => {
    vehicleUndoHistoryRef.current = [
      ...vehicleUndoHistoryRef.current,
      cloneVehicleRows(vehicleRowsRef.current),
    ].slice(-10);
  }, [vehicleRowsRef]);

  const restoreVehicleUndoSnapshot = useCallback(() => {
    const previousVehicleRows = vehicleUndoHistoryRef.current.pop();
    if (!previousVehicleRows) return;

    setVehicleRows(cloneVehicleRows(previousVehicleRows));
    setEditingVehicleCell(null);
    setVehicleCellDraft("");
    setVehicleCellInitialDraft("");
    setOpenVehicleFilter(null);
    addAdminLog({
      action: "Отмена",
      section: "Техника",
      details: "Выполнен возврат списка техники на шаг назад через Ctrl+Z.",
    });
  }, [
    addAdminLog,
    setEditingVehicleCell,
    setOpenVehicleFilter,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setVehicleRows,
  ]);

  const hasVehicleUndoSnapshot = useCallback(() => vehicleUndoHistoryRef.current.length > 0, []);

  return {
    hasVehicleUndoSnapshot,
    pushVehicleUndoSnapshot,
    restoreVehicleUndoSnapshot,
  };
}
