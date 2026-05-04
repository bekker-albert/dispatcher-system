"use client";

import { useEffect } from "react";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { FleetVehiclesSection } from "@/features/fleet/FleetVehiclesSection";
import { resetVehicleInteractionState } from "@/shared/editable-grid/resetVehicleInteractionState";

type FleetPrimaryContentProps = Pick<AppPrimaryContentProps, "appState"> &
  Partial<Pick<AppPrimaryContentProps, "models" | "runtime">> & {
    mode?: "readonly" | "admin";
  };

export function FleetPrimaryContent({ appState, mode = "readonly" }: FleetPrimaryContentProps) {
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

  return <FleetVehiclesSection vehicleRows={appState.vehicleRows} workDate={appState.reportDate} />;
}
