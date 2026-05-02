import { useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from "react";

import { vehicleFilterColumns } from "@/features/admin/vehicles/vehicleFilterColumns";
import { createVehicleFilterOptionsForKey, createVehicleFilterSets } from "@/lib/domain/vehicles/filtering";
import type { VehicleFilterKey, VehicleFilters } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type UseVehicleFilterMenuOptions = {
  active: boolean;
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
  active,
  openVehicleFilter,
  vehicleFilters,
  vehicleFilterDrafts,
  vehicleRows,
  activeVehicleFilterOptions,
  setOpenVehicleFilter,
  setVehicleFilters,
  setVehicleFilterDrafts,
}: UseVehicleFilterMenuOptions) {
  const vehicleFilterSets = useMemo(() => (
    active ? createVehicleFilterSets(vehicleFilters) : {}
  ), [active, vehicleFilters]);

  useEffect(() => {
    if (!active || !openVehicleFilter) return undefined;

    const closeVehicleFilter = () => setOpenVehicleFilter(null);
    window.addEventListener("click", closeVehicleFilter);

    return () => window.removeEventListener("click", closeVehicleFilter);
  }, [active, openVehicleFilter, setOpenVehicleFilter]);

  const openVehicleFilterMenu = useCallback((key: VehicleFilterKey) => {
    if (!active) return;

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
  }, [active, openVehicleFilter, setOpenVehicleFilter, setVehicleFilterDrafts, vehicleFilters]);

  const getVehicleFilterOptionsForKey = useCallback((key: VehicleFilterKey) => {
    if (!active) return [];
    if (openVehicleFilter === key) return activeVehicleFilterOptions;

    return createVehicleFilterOptionsForKey(
      vehicleRows,
      vehicleFilterColumns,
      vehicleFilterSets,
      key,
      vehicleFilters[key],
    );
  }, [active, activeVehicleFilterOptions, openVehicleFilter, vehicleFilterSets, vehicleFilters, vehicleRows]);

  const toggleVehicleFilterDraftValue = useCallback((key: VehicleFilterKey, value: string) => {
    if (!active) return;

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
  }, [active, getVehicleFilterOptionsForKey, setVehicleFilterDrafts]);

  const selectAllVehicleFilterDraftValues = useCallback((key: VehicleFilterKey) => {
    if (!active) return;

    setVehicleFilterDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[key];
      return nextDrafts;
    });
  }, [active, setVehicleFilterDrafts]);

  const deselectAllVehicleFilterDraftValues = useCallback((key: VehicleFilterKey) => {
    if (!active) return;

    setVehicleFilterDrafts((current) => ({
      ...current,
      [key]: [],
    }));
  }, [active, setVehicleFilterDrafts]);

  const applyVehicleFilter = useCallback((key: VehicleFilterKey) => {
    if (!active) return;

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
  }, [active, setOpenVehicleFilter, setVehicleFilters, vehicleFilterDrafts]);

  const clearAllVehicleFilters = useCallback(() => {
    if (!active) return;

    setVehicleFilters({});
    setVehicleFilterDrafts({});
    setOpenVehicleFilter(null);
  }, [active, setOpenVehicleFilter, setVehicleFilterDrafts, setVehicleFilters]);

  return {
    openVehicleFilterMenu,
    toggleVehicleFilterDraftValue,
    selectAllVehicleFilterDraftValues,
    deselectAllVehicleFilterDraftValues,
    applyVehicleFilter,
    clearAllVehicleFilters,
  };
}
