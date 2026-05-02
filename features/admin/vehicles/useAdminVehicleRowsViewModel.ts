import { useEffect, useMemo, type Dispatch, type RefObject, type SetStateAction } from "react";

import { vehicleFilterColumns } from "@/features/admin/vehicles/vehicleFilterColumns";
import {
  createVehicleFilterOptionsForKey,
  createVehicleFilterOptions,
  createVehicleFilterSets,
  vehicleMatchesFilterSets,
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

  const vehicleFilterSets = useMemo(() => (
    active ? createVehicleFilterSets(vehicleFilters) : {}
  ), [active, vehicleFilters]);

  const vehicleAutocompleteOptions = useMemo(() => (
    active && adminVehiclesEditing
      ? Object.fromEntries(
          vehicleFilterColumns
            .filter((column) => vehicleAutocompleteFilterKeys.includes(column.key))
            .map((column) => [column.key, createVehicleFilterOptions(deferredVehicleRows, column)]),
        ) as Partial<Record<VehicleFilterKey, string[]>>
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

  const filteredVehicleRows = useMemo(() => (
    active
      ? vehicleRows.filter((vehicle) => vehicleMatchesFilterSets(vehicle, vehicleFilterSets, vehicleFilterColumns))
      : emptyVehicleRows
  ), [active, vehicleFilterSets, vehicleRows]);

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
  }, [active, adminVehiclesEditing, filteredVehicleRows.length, setVehiclePreviewRowLimit, showAllVehicleRows, tableScrollRef]);

  const visibleVehicleRows = active
    ? (
        showAllVehicleRows
          ? filteredVehicleRows
          : filteredVehicleRows.slice(0, vehiclePreviewRowLimit)
      )
    : emptyVehicleRows;
  const hiddenVehicleRowsCount = Math.max(filteredVehicleRows.length - visibleVehicleRows.length, 0);

  const activeVehicleFilterCount = useMemo(() => (
    Object.values(vehicleFilters).filter((values) => values !== undefined).length
  ), [vehicleFilters]);

  return {
    vehicleAutocompleteOptions,
    activeVehicleFilterOptions,
    filteredVehicleRows,
    visibleVehicleRows,
    hiddenVehicleRowsCount,
    activeVehicleFilterCount,
  };
}
