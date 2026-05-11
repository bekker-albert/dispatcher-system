"use client";

import { useEffect } from "react";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { FleetPlacementSection } from "@/features/fleet/FleetPlacementSection";
import { FleetVehiclesSection } from "@/features/fleet/FleetVehiclesSection";
import { resetVehicleInteractionState } from "@/shared/editable-grid/resetVehicleInteractionState";

type FleetPrimaryContentProps = Pick<AppPrimaryContentProps, "appState"> &
  Partial<Pick<AppPrimaryContentProps, "models" | "runtime">> & {
    fleetTab?: string;
    mode?: "readonly" | "admin";
  };

export function FleetPrimaryContent({ appState, fleetTab = "directory", mode = "readonly" }: FleetPrimaryContentProps) {
  const {
    setActiveVehicleCell,
    setAdminVehiclesEditing,
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setSelectedVehicleCellKeys,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setVehicleSelectionAnchorCell,
  } = appState;

  useEffect(() => {
    if (mode === "admin") return;

    resetVehicleInteractionState({
      setActiveVehicleCell,
      setAdminVehiclesEditing,
      setEditingVehicleCell,
      setPendingVehicleFocus,
      setSelectedVehicleCellKeys,
      setVehicleCellDraft,
      setVehicleCellInitialDraft,
      setVehicleSelectionAnchorCell,
    });
  }, [
    setActiveVehicleCell,
    setAdminVehiclesEditing,
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setSelectedVehicleCellKeys,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setVehicleSelectionAnchorCell,
    mode,
  ]);

  if (fleetTab === "placement") {
    return <FleetPlacementSection vehicleRows={appState.vehicleRows} workDate={appState.reportDate} />;
  }

  return <FleetVehiclesSection vehicleRows={appState.vehicleRows} workDate={appState.reportDate} />;
}
