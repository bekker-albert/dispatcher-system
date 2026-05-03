"use client";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { VehicleTablePrimaryContent } from "@/features/app/VehicleTablePrimaryContent";

type AdminVehiclesPrimaryContentProps = Pick<AppPrimaryContentProps, "appState" | "models" | "runtime">;

export function AdminVehiclesPrimaryContent({
  appState,
  models,
  runtime,
}: AdminVehiclesPrimaryContentProps) {
  return (
    <VehicleTablePrimaryContent
      appState={appState}
      models={models}
      runtime={runtime}
      mode="admin"
    />
  );
}
