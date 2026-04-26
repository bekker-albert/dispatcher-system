import { useMemo } from "react";

import type { VehicleRow } from "@/lib/domain/vehicles/types";

type UseFleetRowsOptions = {
  active: boolean;
  fleetTab: string;
  vehicleRows: VehicleRow[];
};

export function useFleetRows({ active, fleetTab, vehicleRows }: UseFleetRowsOptions) {
  return useMemo(() => {
    if (!active) return [];

    return vehicleRows.filter((vehicle) => {
      if (vehicle.visible === false) return false;

      switch (fleetTab) {
        case "rent":
          return vehicle.rent > 0;
        case "work":
          return vehicle.work > 0;
        case "idle":
          return vehicle.downtime > 0;
        case "repair":
          return vehicle.repair > 0;
        case "free":
          return !vehicle.active || (vehicle.work === 0 && vehicle.rent === 0 && vehicle.repair === 0 && vehicle.downtime === 0);
        default:
          return true;
      }
    });
  }, [active, fleetTab, vehicleRows]);
}
