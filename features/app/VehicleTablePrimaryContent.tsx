"use client";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { AdminVehiclesSection } from "@/features/app/lazySections";
import { useAppAdminVehiclesScreenProps } from "@/features/app/useAppAdminVehiclesScreenProps";
import { useAppVehicleControllers } from "@/features/app/useAppVehicleControllers";

type VehicleTableModeProps = { mode: "readonly" | "admin" };
type VehicleTablePrimaryContentProps = Pick<AppPrimaryContentProps, "appState" | "models" | "runtime"> & Partial<VehicleTableModeProps>;

export function VehicleTablePrimaryContent({
  appState,
  models,
  runtime,
}: VehicleTablePrimaryContentProps) {
  const canManageVehicles = true;
  const { vehicleEditing } = useAppVehicleControllers({
    active: canManageVehicles,
    appState,
    models,
    runtime,
  });
  const adminVehiclesProps = {
    ...useAppAdminVehiclesScreenProps({
      appState,
      models,
      vehicleEditing,
    }),
    adminVehiclesEditing: appState.adminVehiclesEditing,
    canManageVehicles,
  };

  return <AdminVehiclesSection {...adminVehiclesProps} />;
}
