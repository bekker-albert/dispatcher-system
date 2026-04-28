"use client";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { AdminVehiclesSection } from "@/features/app/lazySections";
import { useAppAdminVehiclesScreenProps } from "@/features/app/useAppAdminVehiclesScreenProps";
import { useAppVehicleControllers } from "@/features/app/useAppVehicleControllers";

type AdminVehiclesPrimaryContentProps = Pick<AppPrimaryContentProps, "appState" | "models" | "runtime">;

export function AdminVehiclesPrimaryContent({
  appState,
  models,
  runtime,
}: AdminVehiclesPrimaryContentProps) {
  const { vehicleEditing } = useAppVehicleControllers({
    active: true,
    appState,
    models,
    runtime,
  });
  const adminVehiclesProps = useAppAdminVehiclesScreenProps({
    appState,
    models,
    vehicleEditing,
  });

  return <AdminVehiclesSection {...adminVehiclesProps} />;
}
