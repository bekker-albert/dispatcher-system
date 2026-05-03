"use client";

import { useAppDeferredData } from "@/features/app/useAppDeferredData";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { useAppVehicleViewModel } from "@/features/app/useAppVehicleViewModel";
import { vehicleFilterColumns } from "@/features/admin/vehicles/vehicleFilterColumns";


type UseAppDerivedModelsArgs = {
  appState: AppStateBundle;
};

export function useAppDerivedModels({ appState }: UseAppDerivedModelsArgs) {
  const {
    topTab,
    adminSection,
    adminVehiclesEditing,
    showAllVehicleRows,
    vehiclePreviewRowLimit,
    vehicleRows,
    vehicleFilters,
    setVehicleFilters,
    vehicleFilterDrafts,
    setVehicleFilterDrafts,
    openVehicleFilter,
    setOpenVehicleFilter,
    adminVehicleTableScrollRef,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    setVehiclePreviewRowLimit,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
  } = appState;

  const deferredData = useAppDeferredData({
    ptoPlanRows,
    ptoSurveyRows,
    ptoOperRows,
    vehicleRows,
    topTab,
    adminSection,
  });

  const {
    deferredVehicleRows,
    renderedTopTab,
  } = deferredData;

  const vehicleTableActive = renderedTopTab === "fleet"
    || (renderedTopTab === "admin" && adminSection === "vehicles");

  const vehicleViewModel = useAppVehicleViewModel({
    active: vehicleTableActive,
    adminVehiclesEditing,
    showAllVehicleRows,
    vehiclePreviewRowLimit,
    vehicleRows,
    deferredVehicleRows,
    vehicleFilters,
    openVehicleFilter,
    tableScrollRef: adminVehicleTableScrollRef,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    setVehiclePreviewRowLimit,
    vehicleFilterDrafts,
    setOpenVehicleFilter,
    setVehicleFilters,
    setVehicleFilterDrafts,
  });

  return {
    ...deferredData,
    ...vehicleViewModel,
    vehicleFilterColumns,
  };
}
