import { databaseRequest } from "@/lib/database/rpc";
import type { VehicleRowsPatchItem } from "@/lib/domain/vehicles/persistence";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { serverDatabaseConfigured } from "./config";

export type DataVehiclesState = {
  updatedAt?: string;
  rows: VehicleRow[];
};

export type VehicleSnapshotWriteOptions = {
  expectedSnapshot?: VehicleRow[] | null;
};

export type VehicleSnapshotReplaceOptions = VehicleSnapshotWriteOptions;

async function loadSupabaseVehiclesAdapter() {
  return import("@/lib/supabase/vehicles");
}

export function loadVehiclesFromDatabase() {
  if (serverDatabaseConfigured) {
    return databaseRequest<DataVehiclesState | null>("vehicles", "load");
  }

  return loadSupabaseVehiclesAdapter().then(({ loadVehiclesFromSupabase }) => loadVehiclesFromSupabase());
}

export function saveVehiclesToDatabase(rows: VehicleRow[], options?: VehicleSnapshotWriteOptions) {
  if (serverDatabaseConfigured) {
    return databaseRequest("vehicles", "save", {
      rows,
      expectedSnapshot: options?.expectedSnapshot,
    });
  }

  return loadSupabaseVehiclesAdapter().then(({ saveVehiclesToSupabase }) => saveVehiclesToSupabase(rows, options));
}

export function saveVehicleRowsPatchToDatabase(patchRows: VehicleRowsPatchItem[], options?: VehicleSnapshotWriteOptions) {
  if (serverDatabaseConfigured) {
    return databaseRequest("vehicles", "savePatch", {
      patchRows,
      expectedSnapshot: options?.expectedSnapshot,
    });
  }

  return loadSupabaseVehiclesAdapter()
    .then(({ saveVehicleRowsPatchToSupabase }) => saveVehicleRowsPatchToSupabase(patchRows, options));
}

export function replaceVehiclesInDatabase(rows: VehicleRow[], options?: VehicleSnapshotReplaceOptions) {
  if (serverDatabaseConfigured) {
    return databaseRequest("vehicles", "replace", {
      rows,
      expectedSnapshot: options?.expectedSnapshot,
    });
  }

  return loadSupabaseVehiclesAdapter()
    .then(({ replaceVehiclesInSupabase }) => replaceVehiclesInSupabase(rows, options));
}

export function deleteVehicleFromDatabase(id: number) {
  if (serverDatabaseConfigured) {
    return databaseRequest("vehicles", "delete", { id });
  }

  return loadSupabaseVehiclesAdapter().then(({ deleteVehicleFromSupabase }) => deleteVehicleFromSupabase(id));
}
