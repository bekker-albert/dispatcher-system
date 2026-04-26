import {
  deleteVehicleFromSupabase as deleteVehicleFromBackend,
  loadVehiclesFromSupabase as loadVehiclesFromBackend,
  replaceVehiclesInSupabase as replaceVehiclesInBackend,
  saveVehiclesToSupabase as saveVehiclesToBackend,
  type SupabaseVehiclesState as BackendVehiclesState,
} from "@/lib/supabase/vehicles";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

export type DataVehiclesState = BackendVehiclesState;

export function loadVehiclesFromDatabase() {
  return loadVehiclesFromBackend();
}

export function saveVehiclesToDatabase(rows: VehicleRow[]) {
  return saveVehiclesToBackend(rows);
}

export function replaceVehiclesInDatabase(rows: VehicleRow[]) {
  return replaceVehiclesInBackend(rows);
}

export function deleteVehicleFromDatabase(id: number) {
  return deleteVehicleFromBackend(id);
}
