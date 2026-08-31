import { useEffect, useMemo, type Dispatch, type RefObject, type SetStateAction } from "react";

import { vehicleFilterColumns } from "@/features/admin/vehicles/vehicleFilterColumns";
import {
  createVehicleFilterOptionsForKey,
  createVehicleFilterOptionsByKey,
  createVehicleFilterSets,
  vehicleMatchesFilterSets,
  type VehicleFilterSets,
} from "@/lib/domain/vehicles/filtering";
import {
  adminVehicleFallbackPreviewRows,
  adminVehicleMinPreviewRows,
  adminVehicleViewportBottomReserve,
  vehicleAutocompleteFilterKeys,
  type VehicleFilterKey,
  type VehicleFilters,
} from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

const emptyVehicleRows: VehicleRow[] = [];
const emptyVehicleFilterOptions: string[] = [];
const emptyVehicleAutocompleteOptions: Partial<Record<VehicleFilterKey, string[]>> = {};
const emptyVehicleFilterSets: VehicleFilterSets = {};

type UseAdminVehicleRowsViewModelOptions = {
  active: boolean;
  adminVehiclesEditing: boolean;
  showAllVehicleRows: boolean;
  vehiclePreviewRowLimit: number;
  vehicleRows: VehicleRow[];
  deferredVehicleRows: VehicleRow[];
  vehicleFilters: VehicleFilters;
  openVehicleFilter: VehicleFilterKey | null;
  tableScrollRef: RefObject<HTMLDivElement | null>;
  setAdminVehiclesEditing: Dispatch<SetStateAction<boolean>>;
  setShowAllVehicleRows: Dispatch<SetStateAction<boolean>>;
  setVehiclePreviewRowLimit: Dispatch<SetStateAction<number>>;
};

export function useAdminVehicleRowsViewModel({
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
}: UseAdminVehicleRowsViewModelOptions) {
  useEffect(() => {
    if (!active && adminVehiclesEditing) {
      setAdminVehiclesEditing(false);
    }

    if (!active && showAllVehicleRows) {
      setShowAllVehicleRows(false);
    }
  }, [active, adminVehiclesEditing, setAdminVehiclesEditing, setShowAllVehicleRows, showAllVehicleRows]);

  useEffect(() => {
    setShowAllVehicleRows(false);
  }, [setShowAllVehicleRows, vehicleFilters]);

  const activeVehicleFilterCount = useMemo(() => (
    Object.values(vehicleFilters).filter((values) => values !== undefined).length
  ), [vehicleFilters]);
  const hasActiveVehicleFilters = activeVehicleFilterCount > 0;

  const vehicleFilterSets = useMemo(() => (
    active && hasActiveVehicleFilters ? createVehicleFilterSets(vehicleFilters) : emptyVehicleFilterSets
  ), [active, hasActiveVehicleFilters, vehicleFilters]);

  const vehicleAutocompleteOptions = useMemo(() => (
    active && adminVehiclesEditing
      ? createVehicleFilterOptionsByKey(deferredVehicleRows, vehicleFilterColumns, vehicleAutocompleteFilterKeys) as Partial<Record<VehicleFilterKey, string[]>>
      : emptyVehicleAutocompleteOptions
  ), [active, adminVehiclesEditing, deferredVehicleRows]);

  const activeVehicleFilterOptions = useMemo(() => {
    if (!active || !openVehicleFilter) return emptyVehicleFilterOptions;

    return createVehicleFilterOptionsForKey(
      deferredVehicleRows,
      vehicleFilterColumns,
      vehicleFilterSets,
      openVehicleFilter,
      vehicleFilters[openVehicleFilter],
    );
  }, [active, deferredVehicleRows, openVehicleFilter, vehicleFilterSets, vehicleFilters]);

  const filteredVehicleRows = useMemo(() => {
    if (!active) return emptyVehicleRows;
    if (!hasActiveVehicleFilters) return vehicleRows;

    return vehicleRows.filter((vehicle) => vehicleMatchesFilterSets(vehicle, vehicleFilterSets, vehicleFilterColumns));
  }, [active, hasActiveVehicleFilters, vehicleFilterSets, vehicleRows]);

  useEffect(() => {
    if (!active || showAllVehicleRows) return undefined;

    const updateVehiclePreviewLimit = () => {
      const tableScroll = tableScrollRef.current;
      if (!tableScroll) return;

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const tableTop = tableScroll.getBoundingClientRect().top;
      const headerHeight = tableScroll.querySelector("thead")?.getBoundingClientRect().height ?? 30;
      const firstRowHeight = tableScroll.querySelector("tbody tr")?.getBoundingClientRect().height ?? 28;
      const availableRowsHeight = viewportHeight - tableTop - headerHeight - adminVehicleViewportBottomReserve;
      const nextLimit = Math.max(adminVehicleMinPreviewRows, Math.floor(availableRowsHeight / Math.max(1, firstRowHeight)));
      const boundedLimit = Math.max(
        adminVehicleMinPreviewRows,
        Math.min(filteredVehicleRows.length || adminVehicleFallbackPreviewRows, nextLimit),
      );

      setVehiclePreviewRowLimit((current) => (current === boundedLimit ? current : boundedLimit));
    };

    const frame = window.requestAnimationFrame(updateVehiclePreviewLimit);
    window.addEventListener("resize", updateVehiclePreviewLimit);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateVehiclePreviewLimit);
    };
  }, [active, filteredVehicleRows.length, setVehiclePreviewRowLimit, showAllVehicleRows, tableScrollRef]);

  const visibleVehicleRows = useMemo(() => (
    active
      ? (
          showAllVehicleRows
            ? filteredVehicleRows
            : filteredVehicleRows.slice(0, vehiclePreviewRowLimit)
        )
      : emptyVehicleRows
  ), [active, filteredVehicleRows, showAllVehicleRows, vehiclePreviewRowLimit]);
  const hiddenVehicleRowsCount = Math.max(filteredVehicleRows.length - visibleVehicleRows.length, 0);

  return {
    vehicleFilterSets,
    vehicleAutocompleteOptions,
    activeVehicleFilterOptions,
    filteredVehicleRows,
    visibleVehicleRows,
    hiddenVehicleRowsCount,
    activeVehicleFilterCount,
  };
}
