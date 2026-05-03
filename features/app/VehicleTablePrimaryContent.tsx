"use client";

import { useCallback, useEffect } from "react";
import { exportVehicleRowsToExcel } from "@/features/admin/vehicles/downloadVehicleRowsToExcel";
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
  mode = "readonly",
}: VehicleTablePrimaryContentProps) {
  const canManageVehicles = mode === "admin";
  useEffect(() => {
    if (canManageVehicles) return;

    appState.setAdminVehiclesEditing((current) => (current ? false : current));
    appState.setPendingVehicleFocus((current) => (current === null ? current : null));
    appState.setActiveVehicleCell((current) => (current === null ? current : null));
    appState.setVehicleSelectionAnchorCell((current) => (current === null ? current : null));
    appState.setSelectedVehicleCellKeys((current) => (current.length === 0 ? current : []));
    appState.setEditingVehicleCell((current) => (current === null ? current : null));
    appState.setVehicleCellDraft((current) => (current === "" ? current : ""));
    appState.setVehicleCellInitialDraft((current) => (current === "" ? current : ""));
  }, [appState, canManageVehicles]);
  const { vehicleEditing } = useAppVehicleControllers({
    active: canManageVehicles,
    appState,
    models,
    runtime,
  });
  const exportReadonlyVehiclesToExcel = useCallback(async () => {
    await exportVehicleRowsToExcel(appState.vehicleRows, appState.addAdminLog);
  }, [appState.addAdminLog, appState.vehicleRows]);
  const readonlyVehicleActions = mode === "readonly"
    ? {
      adminVehiclesEditing: false,
      onStartEditing: () => undefined,
      onFinishEditing: () => undefined,
      onAddVehicleRow: () => undefined,
      onOpenVehicleImportFilePicker: () => undefined,
      onExportVehiclesToExcel: exportReadonlyVehiclesToExcel,
      onImportVehiclesFromExcel: () => undefined,
      onToggleVehicleVisibility: () => undefined,
      onVehicleCellChange: () => undefined,
      onDeleteVehicle: () => undefined,
    }
    : {};
  const adminVehiclesProps = {
    ...useAppAdminVehiclesScreenProps({
      appState,
      models,
      vehicleEditing,
    }),
    adminVehiclesEditing: appState.adminVehiclesEditing,
    canManageVehicles,
    ...readonlyVehicleActions,
  };

  return <AdminVehiclesSection {...adminVehiclesProps} />;
}
