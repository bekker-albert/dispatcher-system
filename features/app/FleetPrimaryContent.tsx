"use client";

import { useCallback, useEffect } from "react";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { AdminVehiclesSection } from "@/features/app/lazySections";
import { useAppAdminVehiclesScreenProps } from "@/features/app/useAppAdminVehiclesScreenProps";
import { useAppVehicleControllers } from "@/features/app/useAppVehicleControllers";
import { FleetPlacementSection } from "@/features/fleet/FleetPlacementSection";
import { FleetVehiclesSection } from "@/features/fleet/FleetVehiclesSection";
import type { FleetVehicleListRow } from "@/features/fleet/fleetVehicleModel";
import { resetVehicleInteractionState } from "@/shared/editable-grid/resetVehicleInteractionState";

type FleetPrimaryContentProps = Pick<AppPrimaryContentProps, "appState" | "models" | "runtime"> & {
    fleetTab?: string;
    mode?: "readonly" | "admin";
  };

export function FleetPrimaryContent({ appState, models, runtime, fleetTab = "directory", mode = "readonly" }: FleetPrimaryContentProps) {
  const {
    adminVehiclesEditing,
    setActiveVehicleCell,
    setAdminVehiclesEditing,
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setSelectedVehicleCellKeys,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setVehicleSelectionAnchorCell,
    vehicleImportInputRef,
  } = appState;
  const canManageVehicles = true;
  const showEditableDirectory = fleetTab === "directory" && adminVehiclesEditing;
  const { vehicleEditing } = useAppVehicleControllers({
    active: canManageVehicles && fleetTab === "directory",
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
    adminVehiclesEditing,
    canManageVehicles,
  };
  const exportFleetVehiclesToExcel = useCallback(async (rows: FleetVehicleListRow[]) => {
    const { exportFleetVehicleRowsToExcel } = await import("@/features/fleet/fleetVehicleExcelExport");

    await exportFleetVehicleRowsToExcel(rows, appState.addAdminLog);
  }, [appState.addAdminLog]);

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
    return (
      <FleetPlacementSection
        vehicleRows={models.filteredVehicleRows}
        ptoPlanRows={appState.ptoPlanRows}
        workDate={appState.reportDate}
      />
    );
  }

  if (showEditableDirectory) {
    return <AdminVehiclesSection {...adminVehiclesProps} />;
  }

  return (
    <FleetVehiclesSection
      canManageVehicles={canManageVehicles}
      filterControls={adminVehiclesProps}
      vehicleRows={models.filteredVehicleRows}
      workDate={appState.reportDate}
      vehicleImportInputRef={vehicleImportInputRef}
      onStartEditing={vehicleEditing.startAdminVehiclesEditing}
      onOpenVehicleImportFilePicker={vehicleEditing.openVehicleImportFilePicker}
      onExportVehiclesToExcel={exportFleetVehiclesToExcel}
      onImportVehiclesFromExcel={vehicleEditing.importVehiclesFromExcel}
    />
  );
}
