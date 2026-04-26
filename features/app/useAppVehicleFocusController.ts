"use client";

import { useVehiclePendingFocus } from "@/features/admin/vehicles/useVehiclePendingFocus";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;

type UseAppVehicleFocusControllerOptions = {
  appState: AppStateBundle;
};

export function useAppVehicleFocusController({
  appState,
}: UseAppVehicleFocusControllerOptions) {
  useVehiclePendingFocus({
    pendingVehicleFocus: appState.pendingVehicleFocus,
    setPendingVehicleFocus: appState.setPendingVehicleFocus,
    vehicleSelectionAnchorRef: appState.vehicleSelectionAnchorRef,
    setActiveVehicleCell: appState.setActiveVehicleCell,
    setEditingVehicleCell: appState.setEditingVehicleCell,
    setVehicleSelectionAnchorCell: appState.setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys: appState.setSelectedVehicleCellKeys,
  });
}
