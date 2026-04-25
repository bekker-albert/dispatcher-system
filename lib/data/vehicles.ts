import {
  deleteVehicleFromSupabase,
  loadVehiclesFromSupabase,
  replaceVehiclesInSupabase,
  saveVehiclesToSupabase,
  type SupabaseVehiclesState,
} from "@/lib/supabase/vehicles";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

export type DataVehiclesState = SupabaseVehiclesState;

export function loadVehiclesFromDatabase() {
  return loadVehiclesFromSupabase();
}

export function saveVehiclesToDatabase(rows: VehicleRow[]) {
  return saveVehiclesToSupabase(rows);
}

export function replaceVehiclesInDatabase(rows: VehicleRow[]) {
  return replaceVehiclesInSupabase(rows);
}

export function deleteVehicleFromDatabase(id: number) {
  return deleteVehicleFromSupabase(id);
}
