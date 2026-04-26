import { useEffect, useMemo, type Dispatch, type RefObject, type SetStateAction } from "react";

import { vehicleFilterColumns } from "@/features/admin/vehicles/vehicleFilterColumns";
import { createVehicleFilterOptions, vehicleFilterOptionLabel, vehicleMatchesFilters } from "@/lib/domain/vehicles/filtering";
import {
  adminVehicleFallbackPreviewRows,
  adminVehicleMinPreviewRows,
  adminVehicleViewportBottomReserve,
  vehicleAutocompleteFilterKeys,
  type VehicleFilterKey,
  type VehicleFilters,
} from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

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

  const vehicleAutocompleteOptions = useMemo(() => (
    active && adminVehiclesEditing
      ? Object.fromEntries(
          vehicleFilterColumns
            .filter((column) => vehicleAutocompleteFilterKeys.includes(column.key))
            .map((column) => [column.key, createVehicleFilterOptions(deferredVehicleRows, column)]),
        ) as Partial<Record<VehicleFilterKey, string[]>>
      : {}
  ), [active, adminVehiclesEditing, deferredVehicleRows]);

  const activeVehicleFilterOptions = useMemo(() => {
    if (!active || !openVehicleFilter) return [];

    const column = vehicleFilterColumns.find((item) => item.key === openVehicleFilter);
    if (!column) return [];

    const rowsForColumn = deferredVehicleRows.filter((vehicle) => vehicleMatchesFilters(vehicle, vehicleFilters, vehicleFilterColumns, column.key));
    const options = createVehicleFilterOptions(rowsForColumn, column);
    const selectedValues = vehicleFilters[column.key] ?? [];

    return Array.from(new Set([...options, ...selectedValues]))
      .sort((a, b) => vehicleFilterOptionLabel(a).localeCompare(vehicleFilterOptionLabel(b), "ru"));
  }, [active, deferredVehicleRows, openVehicleFilter, vehicleFilters]);

  const filteredVehicleRows = useMemo(() => (
    active
      ? vehicleRows.filter((vehicle) => vehicleMatchesFilters(vehicle, vehicleFilters, vehicleFilterColumns))
      : []
  ), [active, vehicleFilters, vehicleRows]);

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

  const visibleVehicleRows = showAllVehicleRows
    ? filteredVehicleRows
    : filteredVehicleRows.slice(0, vehiclePreviewRowLimit);
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
