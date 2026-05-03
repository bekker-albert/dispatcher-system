"use client";

import { useEffect } from "react";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { FleetVehiclesSection } from "@/features/fleet/FleetVehiclesSection";

type FleetPrimaryContentProps = Pick<AppPrimaryContentProps, "appState"> &
  Partial<Pick<AppPrimaryContentProps, "models" | "runtime">> & {
    mode?: "readonly" | "admin";
  };

export function FleetPrimaryContent({ appState }: FleetPrimaryContentProps) {
  useEffect(() => {
    appState.setAdminVehiclesEditing((current) => (current ? false : current));
    appState.setPendingVehicleFocus((current) => (current === null ? current : null));
    appState.setActiveVehicleCell((current) => (current === null ? current : null));
    appState.setVehicleSelectionAnchorCell((current) => (current === null ? current : null));
    appState.setSelectedVehicleCellKeys((current) => (current.length === 0 ? current : []));
    appState.setEditingVehicleCell((current) => (current === null ? current : null));
    appState.setVehicleCellDraft((current) => (current === "" ? current : ""));
    appState.setVehicleCellInitialDraft((current) => (current === "" ? current : ""));
  }, [appState]);

  return <FleetVehiclesSection vehicleRows={appState.vehicleRows} workDate={appState.reportDate} />;
}
