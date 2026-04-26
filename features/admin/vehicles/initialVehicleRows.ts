"use client";

import { loadDefaultVehicleSeed } from "@/features/admin/vehicles/lib/defaultVehicleSeed";
import { databaseConfigured } from "@/lib/data/config";
import { defaultVehicleSeedReplaceLimit, normalizeVehicleRow } from "@/lib/domain/vehicles/defaults";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { adminStorageKeys } from "@/lib/storage/keys";

type MutableRef<T> = {
  current: T;
};

type InitialVehicleRowsOptions = {
  savedVehicles: unknown;
  isCancelled: () => boolean;
  vehiclesDatabaseLoadedRef: MutableRef<boolean>;
  vehiclesDatabaseSaveSnapshotRef: MutableRef<string>;
};

type InitialVehicleRowsResult = {
  completed: boolean;
  rows: VehicleRow[] | null;
  usedSeed: boolean;
};

export async function loadInitialVehicleRows({
  savedVehicles,
  isCancelled,
  vehiclesDatabaseLoadedRef,
  vehiclesDatabaseSaveSnapshotRef,
}: InitialVehicleRowsOptions): Promise<InitialVehicleRowsResult> {
  let nextSavedVehicles = savedVehicles;
  let loadedVehiclesFromDatabase = false;

  if (databaseConfigured) {
    try {
      const { loadVehiclesFromDatabase } = await import("@/lib/data/vehicles");
      const databaseVehicles = await loadVehiclesFromDatabase();
      vehiclesDatabaseLoadedRef.current = true;

      if (isCancelled()) return { completed: false, rows: null, usedSeed: false };

      if (databaseVehicles?.rows.length) {
        nextSavedVehicles = databaseVehicles.rows;
        loadedVehiclesFromDatabase = true;
        vehiclesDatabaseSaveSnapshotRef.current = JSON.stringify(databaseVehicles.rows);
        window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(databaseVehicles.rows));
        if (databaseVehicles.updatedAt) {
          window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, databaseVehicles.updatedAt);
        }
      }
    } catch (error) {
      vehiclesDatabaseLoadedRef.current = false;
      console.warn("Vehicles table is not ready:", error);
    }
  }

  const savedVehicleSeedVersion = window.localStorage.getItem(adminStorageKeys.vehiclesSeedVersion);
  const needsVehicleSeed = !loadedVehiclesFromDatabase && (
    !Array.isArray(nextSavedVehicles)
    || nextSavedVehicles.length <= defaultVehicleSeedReplaceLimit
  );
  const defaultVehicleSeed = needsVehicleSeed ? await loadDefaultVehicleSeed() : null;
  if (isCancelled()) return { completed: false, rows: null, usedSeed: false };

  const shouldUseVehicleSeed = defaultVehicleSeed !== null
    && defaultVehicleSeed.rows.length > 0
    && (
      !Array.isArray(nextSavedVehicles)
      || savedVehicleSeedVersion !== defaultVehicleSeed.version
    );

  if (shouldUseVehicleSeed && defaultVehicleSeed) {
    window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(defaultVehicleSeed.vehicles));
    window.localStorage.setItem(adminStorageKeys.vehiclesSeedVersion, defaultVehicleSeed.version);
    return { completed: true, rows: defaultVehicleSeed.vehicles, usedSeed: true };
  }

  if (Array.isArray(nextSavedVehicles)) {
    return {
      completed: true,
      rows: nextSavedVehicles.map((vehicle) => normalizeVehicleRow(vehicle)),
      usedSeed: false,
    };
  }

  return { completed: true, rows: null, usedSeed: false };
}
