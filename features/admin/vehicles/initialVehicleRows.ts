"use client";

import { defaultVehicleSeedReplaceLimit, normalizeVehicleRow } from "../../../lib/domain/vehicles/defaults";
import { vehicleRowsSnapshotEquals } from "../../../lib/domain/vehicles/persistence";
import type { VehicleRow } from "../../../lib/domain/vehicles/types";
import { adminStorageKeys } from "../../../lib/storage/keys";
import { loadDefaultVehicleSeed } from "./lib/defaultVehicleSeed";

type MutableRef<T> = {
  current: T;
};

type InitialVehicleRowsOptions = {
  savedVehicles: unknown;
  isCancelled: () => boolean;
  vehiclesDatabaseLoadedRef: MutableRef<boolean>;
  vehiclesDatabaseSaveSnapshotRef: MutableRef<string>;
  vehiclesDatabaseAutoSaveBlockedSnapshotRef: MutableRef<string>;
};

type InitialVehicleRowsResult = {
  completed: boolean;
  rows: VehicleRow[] | null;
  usedSeed: boolean;
};

type InitialVehicleRowsSourceOptions = {
  savedVehicles: unknown;
  databaseUpdatedAt: string | null | undefined;
  databaseRowsCount?: number;
  vehicleLocalUpdatedAt: string | null | undefined;
  appLocalUpdatedAt: string | null | undefined;
};

function timestampToMs(value: string | null | undefined) {
  if (!value) return 0;

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function resolveInitialVehicleRowsSource({
  savedVehicles,
  databaseUpdatedAt,
  databaseRowsCount,
  vehicleLocalUpdatedAt,
  appLocalUpdatedAt,
}: InitialVehicleRowsSourceOptions) {
  const vehicleLocalUpdatedTime = timestampToMs(vehicleLocalUpdatedAt);
  const localUpdatedTime = vehicleLocalUpdatedTime > 0
    ? vehicleLocalUpdatedTime
    : timestampToMs(appLocalUpdatedAt);
  const databaseUpdatedTime = timestampToMs(databaseUpdatedAt);

  if (
    Array.isArray(savedVehicles)
    && savedVehicles.length <= defaultVehicleSeedReplaceLimit
    && typeof databaseRowsCount === "number"
    && databaseRowsCount > savedVehicles.length
  ) {
    return "database";
  }

  if (
    !databaseRowsCount
    && Array.isArray(savedVehicles)
    && localUpdatedTime > 0
    && localUpdatedTime > databaseUpdatedTime
  ) {
    return "local";
  }

  return "database";
}

function saveDatabaseVehicleRowsBackup(rows: VehicleRow[], updatedAt: string | null | undefined) {
  const snapshot = JSON.stringify(rows);
  window.localStorage.setItem(adminStorageKeys.vehicles, snapshot);
  if (updatedAt) {
    window.localStorage.setItem(adminStorageKeys.vehiclesLocalUpdatedAt, updatedAt);
  }

  return snapshot;
}

function shouldTrustLocalVehicleRows(
  savedVehicles: unknown,
  databaseVehicles: VehicleRow[],
  defaultVehicleSeed: VehicleRow[] | null,
) {
  if (!Array.isArray(savedVehicles)) return false;
  if (databaseVehicles.length > 0) return false;
  if (savedVehicles.length <= defaultVehicleSeedReplaceLimit && databaseVehicles.length > savedVehicles.length) return false;
  if (defaultVehicleSeed && vehicleRowsSnapshotEquals(savedVehicles, defaultVehicleSeed)) return false;

  return true;
}

export async function loadInitialVehicleRows({
  savedVehicles,
  isCancelled,
  vehiclesDatabaseLoadedRef,
  vehiclesDatabaseSaveSnapshotRef,
  vehiclesDatabaseAutoSaveBlockedSnapshotRef,
}: InitialVehicleRowsOptions): Promise<InitialVehicleRowsResult> {
  let nextSavedVehicles = savedVehicles;
  let loadedVehiclesFromDatabase = false;
  let shouldSkipVehicleSeed = false;

  const { databaseConfigured } = await import("../../../lib/data/config");

  if (databaseConfigured) {
    try {
      const { loadVehiclesFromDatabase } = await import("@/lib/data/vehicles");
      const databaseVehicles = await loadVehiclesFromDatabase();
      vehiclesDatabaseLoadedRef.current = true;

      if (isCancelled()) return { completed: false, rows: null, usedSeed: false };

      if (databaseVehicles?.rows.length) {
        const defaultVehicleSeed = await loadDefaultVehicleSeed();
        if (isCancelled()) return { completed: false, rows: null, usedSeed: false };

        vehiclesDatabaseSaveSnapshotRef.current = JSON.stringify(databaseVehicles.rows);

        const vehicleRowsSource = resolveInitialVehicleRowsSource({
          savedVehicles,
          databaseUpdatedAt: databaseVehicles.updatedAt,
          databaseRowsCount: databaseVehicles.rows.length,
          vehicleLocalUpdatedAt: window.localStorage.getItem(adminStorageKeys.vehiclesLocalUpdatedAt),
          appLocalUpdatedAt: window.localStorage.getItem(adminStorageKeys.appLocalUpdatedAt),
        });

        if (vehicleRowsSource === "local" && shouldTrustLocalVehicleRows(savedVehicles, databaseVehicles.rows, defaultVehicleSeed.vehicles)) {
          shouldSkipVehicleSeed = true;
        } else {
          nextSavedVehicles = databaseVehicles.rows;
          loadedVehiclesFromDatabase = true;
          vehiclesDatabaseSaveSnapshotRef.current = saveDatabaseVehicleRowsBackup(databaseVehicles.rows, databaseVehicles.updatedAt);
        }
      }
    } catch (error) {
      vehiclesDatabaseLoadedRef.current = false;
      console.warn("Vehicles table is not ready:", error);
    }
  }

  const savedVehicleSeedVersion = window.localStorage.getItem(adminStorageKeys.vehiclesSeedVersion);
  const needsVehicleSeed = !loadedVehiclesFromDatabase && !shouldSkipVehicleSeed && (
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
    if (databaseConfigured) {
      vehiclesDatabaseAutoSaveBlockedSnapshotRef.current = JSON.stringify(defaultVehicleSeed.vehicles);
    } else {
      window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(defaultVehicleSeed.vehicles));
      window.localStorage.setItem(adminStorageKeys.vehiclesSeedVersion, defaultVehicleSeed.version);
    }
    return { completed: true, rows: defaultVehicleSeed.vehicles, usedSeed: true };
  }

  if (Array.isArray(nextSavedVehicles)) {
    const normalizedRows = nextSavedVehicles.map((vehicle) => normalizeVehicleRow(vehicle));
    if (databaseConfigured && needsVehicleSeed && normalizedRows.length <= defaultVehicleSeedReplaceLimit) {
      vehiclesDatabaseAutoSaveBlockedSnapshotRef.current = JSON.stringify(normalizedRows);
    }

    return {
      completed: true,
      rows: normalizedRows,
      usedSeed: false,
    };
  }

  return { completed: true, rows: null, usedSeed: false };
}
