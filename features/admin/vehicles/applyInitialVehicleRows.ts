import type { Dispatch, SetStateAction } from "react";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

export type InitialVehicleRowsSetters = {
  setVehicleRows: Dispatch<SetStateAction<VehicleRow[]>>;
};

export function applyInitialVehicleRows(rows: VehicleRow[] | null, setters: InitialVehicleRowsSetters) {
  if (rows) {
    setters.setVehicleRows(rows);
  }
}
