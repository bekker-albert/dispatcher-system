"use client";

import { useVehiclePendingFocus } from "@/features/admin/vehicles/useVehiclePendingFocus";
import type { AppStateBundle } from "@/features/app/AppStateBundle";


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
