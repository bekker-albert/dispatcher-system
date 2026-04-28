import {
  deleteVehicleFromSupabase as deleteVehicleFromBackend,
  loadVehiclesFromSupabase as loadVehiclesFromBackend,
  replaceVehiclesInSupabase as replaceVehiclesInBackend,
  saveVehiclesToSupabase as saveVehiclesToBackend,
  type SupabaseVehiclesState as BackendVehiclesState,
  type VehicleSnapshotReplaceOptions,
  type VehicleSnapshotWriteOptions,
} from "@/lib/supabase/vehicles";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

export type DataVehiclesState = BackendVehiclesState;

export function loadVehiclesFromDatabase() {
  return loadVehiclesFromBackend();
}

export function saveVehiclesToDatabase(rows: VehicleRow[], options?: VehicleSnapshotWriteOptions) {
  return saveVehiclesToBackend(rows, options);
}

export function replaceVehiclesInDatabase(rows: VehicleRow[], options?: VehicleSnapshotReplaceOptions) {
  return replaceVehiclesInBackend(rows, options);
}

export function deleteVehicleFromDatabase(id: number) {
  return deleteVehicleFromBackend(id);
}
