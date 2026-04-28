"use client";

import { useEffect } from "react";
import type { AppUndoSnapshot } from "./appUndoSnapshots";

type UseAppGlobalUndoKeyHandlerOptions = {
  topTab: string;
  adminSection: string;
  vehicleUndoActive: boolean;
  hasVehicleUndoSnapshot: () => boolean;
  hasAppUndoSnapshot: () => boolean;
  restoreVehicleUndoSnapshot: () => void;
  popPreviousAppUndoSnapshot: () => AppUndoSnapshot | null;
  restoreUndoSnapshot: (snapshot: AppUndoSnapshot) => void;
};

export function useAppGlobalUndoKeyHandler({
  topTab,
  adminSection,
  vehicleUndoActive,
  hasVehicleUndoSnapshot,
  hasAppUndoSnapshot,
  restoreVehicleUndoSnapshot,
  popPreviousAppUndoSnapshot,
  restoreUndoSnapshot,
}: UseAppGlobalUndoKeyHandlerOptions) {
  useEffect(() => {
    const handleGlobalUndo = (event: KeyboardEvent) => {
      const isUndo = (event.ctrlKey || event.metaKey)
        && !event.shiftKey
        && (event.key.toLowerCase() === "z" || event.code === "KeyZ");

      const canUndoVehicleRows = topTab === "admin" && adminSection === "vehicles" && hasVehicleUndoSnapshot();
      const canUndoAppSnapshot = !vehicleUndoActive && hasAppUndoSnapshot();
      if (!isUndo || (!canUndoVehicleRows && !canUndoAppSnapshot)) return;

      const target = event.target;
      const targetElement = target instanceof HTMLElement ? target : null;
      const isNativeEditable = Boolean(targetElement?.closest("input, textarea, select, [contenteditable='true']"));
      if (isNativeEditable) return;

      event.preventDefault();

      if (canUndoVehicleRows) {
        restoreVehicleUndoSnapshot();
        return;
      }

      const previousSnapshot = popPreviousAppUndoSnapshot();
      if (previousSnapshot) restoreUndoSnapshot(previousSnapshot);
    };

    window.addEventListener("keydown", handleGlobalUndo);
    return () => window.removeEventListener("keydown", handleGlobalUndo);
  }, [
    adminSection,
    hasAppUndoSnapshot,
    hasVehicleUndoSnapshot,
    popPreviousAppUndoSnapshot,
    restoreUndoSnapshot,
    restoreVehicleUndoSnapshot,
    topTab,
    vehicleUndoActive,
  ]);
}
