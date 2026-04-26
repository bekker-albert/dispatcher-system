import { useCallback, type Dispatch, type SetStateAction } from "react";

import { vehicleFilterColumns } from "@/features/admin/vehicles/vehicleFilterColumns";
import { createVehicleFilterOptions, vehicleFilterOptionLabel, vehicleMatchesFilters } from "@/lib/domain/vehicles/filtering";
import type { VehicleFilterKey, VehicleFilters } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type UseVehicleFilterMenuOptions = {
  openVehicleFilter: VehicleFilterKey | null;
  vehicleFilters: VehicleFilters;
  vehicleFilterDrafts: VehicleFilters;
  vehicleRows: VehicleRow[];
  activeVehicleFilterOptions: string[];
  setOpenVehicleFilter: Dispatch<SetStateAction<VehicleFilterKey | null>>;
  setVehicleFilters: Dispatch<SetStateAction<VehicleFilters>>;
  setVehicleFilterDrafts: Dispatch<SetStateAction<VehicleFilters>>;
};

export function useVehicleFilterMenu({
  openVehicleFilter,
  vehicleFilters,
  vehicleFilterDrafts,
  vehicleRows,
  activeVehicleFilterOptions,
  setOpenVehicleFilter,
  setVehicleFilters,
  setVehicleFilterDrafts,
}: UseVehicleFilterMenuOptions) {
  const openVehicleFilterMenu = useCallback((key: VehicleFilterKey) => {
    if (openVehicleFilter === key) {
      setOpenVehicleFilter(null);
      return;
    }

    setVehicleFilterDrafts((current) => {
      const nextDrafts = { ...current };
      const appliedValues = vehicleFilters[key];

      if (appliedValues === undefined) {
        delete nextDrafts[key];
      } else {
        nextDrafts[key] = appliedValues;
      }

      return nextDrafts;
    });
    setOpenVehicleFilter(key);
  }, [openVehicleFilter, setOpenVehicleFilter, setVehicleFilterDrafts, vehicleFilters]);

  const getVehicleFilterOptionsForKey = useCallback((key: VehicleFilterKey) => {
    if (openVehicleFilter === key) return activeVehicleFilterOptions;

    const column = vehicleFilterColumns.find((item) => item.key === key);
    if (!column) return [];

    const rowsForColumn = vehicleRows.filter((vehicle) => vehicleMatchesFilters(vehicle, vehicleFilters, vehicleFilterColumns, key));
    const options = createVehicleFilterOptions(rowsForColumn, column);
    const selectedValues = vehicleFilters[key] ?? [];

    return Array.from(new Set([...options, ...selectedValues]))
      .sort((a, b) => vehicleFilterOptionLabel(a).localeCompare(vehicleFilterOptionLabel(b), "ru"));
  }, [activeVehicleFilterOptions, openVehicleFilter, vehicleFilters, vehicleRows]);

  const toggleVehicleFilterDraftValue = useCallback((key: VehicleFilterKey, value: string) => {
    const allOptions = getVehicleFilterOptionsForKey(key);

    setVehicleFilterDrafts((current) => {
      const selected = current[key];
      const nextSelection = new Set(selected === undefined ? allOptions : selected);

      if (nextSelection.has(value)) {
        nextSelection.delete(value);
      } else {
        nextSelection.add(value);
      }

      const nextValues = allOptions.filter((option) => nextSelection.has(option));
      const nextDrafts = { ...current };

      if (nextValues.length === allOptions.length) {
        delete nextDrafts[key];
      } else {
        nextDrafts[key] = nextValues;
      }

      return nextDrafts;
    });
  }, [getVehicleFilterOptionsForKey, setVehicleFilterDrafts]);

  const selectAllVehicleFilterDraftValues = useCallback((key: VehicleFilterKey) => {
    setVehicleFilterDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[key];
      return nextDrafts;
    });
  }, [setVehicleFilterDrafts]);

  const deselectAllVehicleFilterDraftValues = useCallback((key: VehicleFilterKey) => {
    setVehicleFilterDrafts((current) => ({
      ...current,
      [key]: [],
    }));
  }, [setVehicleFilterDrafts]);

  const applyVehicleFilter = useCallback((key: VehicleFilterKey) => {
    const draftValues = vehicleFilterDrafts[key];

    setVehicleFilters((current) => {
      const nextFilters = { ...current };

      if (draftValues === undefined) {
        delete nextFilters[key];
      } else {
        nextFilters[key] = draftValues;
      }

      return nextFilters;
    });
    setOpenVehicleFilter(null);
  }, [setOpenVehicleFilter, setVehicleFilters, vehicleFilterDrafts]);

  const clearAllVehicleFilters = useCallback(() => {
    setVehicleFilters({});
    setVehicleFilterDrafts({});
    setOpenVehicleFilter(null);
  }, [setOpenVehicleFilter, setVehicleFilterDrafts, setVehicleFilters]);

  return {
    openVehicleFilterMenu,
    toggleVehicleFilterDraftValue,
    selectAllVehicleFilterDraftValues,
    deselectAllVehicleFilterDraftValues,
    applyVehicleFilter,
    clearAllVehicleFilters,
  };
}
