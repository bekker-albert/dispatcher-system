"use client";

import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";

import { useAdminVehicleRowsViewModel } from "@/features/admin/vehicles/useAdminVehicleRowsViewModel";
import { useVehicleFilterMenu } from "@/features/admin/vehicles/useVehicleFilterMenu";
import type { VehicleFilterKey, VehicleFilters } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type UseAppVehicleViewModelOptions = {
  active: boolean;
  adminVehiclesEditing: boolean;
  showAllVehicleRows: boolean;
  vehiclePreviewRowLimit: number;
  vehicleRows: VehicleRow[];
  deferredVehicleRows: VehicleRow[];
  vehicleFilters: VehicleFilters;
  vehicleFilterDrafts: VehicleFilters;
  openVehicleFilter: VehicleFilterKey | null;
  tableScrollRef: RefObject<HTMLDivElement | null>;
  setAdminVehiclesEditing: Dispatch<SetStateAction<boolean>>;
  setShowAllVehicleRows: Dispatch<SetStateAction<boolean>>;
  setVehiclePreviewRowLimit: Dispatch<SetStateAction<number>>;
  setOpenVehicleFilter: Dispatch<SetStateAction<VehicleFilterKey | null>>;
  setVehicleFilters: Dispatch<SetStateAction<VehicleFilters>>;
  setVehicleFilterDrafts: Dispatch<SetStateAction<VehicleFilters>>;
};

export function useAppVehicleViewModel({
  active,
  adminVehiclesEditing,
  showAllVehicleRows,
  vehiclePreviewRowLimit,
  vehicleRows,
  deferredVehicleRows,
  vehicleFilters,
  vehicleFilterDrafts,
  openVehicleFilter,
  tableScrollRef,
  setAdminVehiclesEditing,
  setShowAllVehicleRows,
  setVehiclePreviewRowLimit,
  setOpenVehicleFilter,
  setVehicleFilters,
  setVehicleFilterDrafts,
}: UseAppVehicleViewModelOptions) {
  const vehicleRowsViewModel = useAdminVehicleRowsViewModel({
    active,
    adminVehiclesEditing,
    showAllVehicleRows,
    vehiclePreviewRowLimit,
    vehicleRows,
    deferredVehicleRows,
    vehicleFilters,
    openVehicleFilter,
    tableScrollRef,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    setVehiclePreviewRowLimit,
  });

  const vehicleFilterMenu = useVehicleFilterMenu({
    active,
    openVehicleFilter,
    vehicleFilters,
    vehicleFilterDrafts,
    vehicleRows,
    activeVehicleFilterOptions: vehicleRowsViewModel.activeVehicleFilterOptions,
    setOpenVehicleFilter,
    setVehicleFilters,
    setVehicleFilterDrafts,
  });

  const closeVehicleFilterMenu = useCallback(() => {
    setOpenVehicleFilter(null);
  }, [setOpenVehicleFilter]);

  return {
    ...vehicleRowsViewModel,
    ...vehicleFilterMenu,
    closeVehicleFilterMenu,
  };
}
