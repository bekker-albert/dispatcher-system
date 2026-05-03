"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { isDatabaseConflictError } from "@/lib/data/errors";
import { createVehicleRowsSavePlan, shouldBlockVehicleRowsAutoSave } from "@/lib/domain/vehicles/persistence";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { adminStorageKeys } from "@/lib/storage/keys";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";
import { createVehicleRowsSaveQueue, type VehicleRowsSaveQueue } from "./vehicleRowsSaveQueue";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

const vehicleDatabaseRetryInitialDelayMs = 2000;
const vehicleDatabaseRetryMaxDelayMs = 30000;

function copyVehicleRows(rows: VehicleRow[]) {
  return rows.map((vehicle) => ({ ...vehicle }));
}

function saveVehicleRowsLocalBackup(snapshot: string, updatedAt: string) {
  try {
    window.localStorage.setItem(adminStorageKeys.vehicles, snapshot);
    window.localStorage.setItem(adminStorageKeys.vehiclesLocalUpdatedAt, updatedAt);
  } catch (error) {
    console.warn("Vehicle local backup failed:", error);
  }
}

function readVehicleRowsLocalBackup() {
  try {
    return window.localStorage.getItem(adminStorageKeys.vehicles);
  } catch (error) {
    console.warn("Vehicle local backup read failed:", error);
    return null;
  }
}

function saveVehicleRowsLocalBackupIfChanged(
  snapshot: string,
  updatedAt: string,
  previousSnapshot: string | null,
) {
  if (snapshot === previousSnapshot) return false;

  saveVehicleRowsLocalBackup(snapshot, updatedAt);
  return true;
}

function parseExpectedVehicleSnapshot(snapshot: string) {
  if (!snapshot) return null;

  try {
    const value = JSON.parse(snapshot);
    return Array.isArray(value) ? value as VehicleRow[] : null;
  } catch {
    return null;
  }
}

type VehicleRowsPersistenceOptions = {
  adminDataLoaded: boolean;
  vehicleRows: VehicleRow[];
  vehicleRowsRef: RefObject<VehicleRow[]>;
  databaseConfigured: boolean;
  databaseLoadedRef: RefObject<boolean>;
  databaseSaveSnapshotRef: RefObject<string>;
  databaseAutoSaveBlockedSnapshotRef: RefObject<string>;
  requestClientSnapshotSave: (reason?: string) => void;
  showSaveStatus: ShowSaveStatus;
};

export function useVehicleRowsPersistence({
  adminDataLoaded,
  vehicleRows,
  vehicleRowsRef,
  databaseConfigured,
  databaseLoadedRef,
  databaseSaveSnapshotRef,
  databaseAutoSaveBlockedSnapshotRef,
  requestClientSnapshotSave,
  showSaveStatus,
}: VehicleRowsPersistenceOptions) {
  const vehicleSaveTimerRef = useRef<number | null>(null);
  const databaseSaveQueueRef = useRef<VehicleRowsSaveQueue | null>(null);
  const vehicleRowsVersionRef = useRef(0);
  const vehicleLocalSaveSnapshotRef = useRef<string | null>(null);
  const vehicleDatabaseRetryTimerRef = useRef<number | null>(null);
  const vehicleDatabaseRetryDelayRef = useRef(vehicleDatabaseRetryInitialDelayMs);

  if (databaseSaveQueueRef.current === null) {
    databaseSaveQueueRef.current = createVehicleRowsSaveQueue();
  }

  useEffect(() => {
    vehicleRowsVersionRef.current += 1;
  }, [vehicleRows]);

  useEffect(() => () => {
    if (vehicleDatabaseRetryTimerRef.current !== null) {
      window.clearTimeout(vehicleDatabaseRetryTimerRef.current);
      vehicleDatabaseRetryTimerRef.current = null;
    }
  }, []);

  const queueDatabaseVehicleSave = useCallback((
    rowsSnapshot: VehicleRow[],
    snapshot: string,
    snapshotVersion: number,
  ) => {
    if (!databaseConfigured || !databaseLoadedRef.current) return;
    if (shouldBlockVehicleRowsAutoSave(snapshot, databaseAutoSaveBlockedSnapshotRef.current)) return;
    if (snapshot === databaseSaveSnapshotRef.current) {
      vehicleDatabaseRetryDelayRef.current = vehicleDatabaseRetryInitialDelayMs;
      return;
    }

    databaseSaveQueueRef.current?.enqueue(async (isLatest) => {
      try {
        if (snapshot === databaseSaveSnapshotRef.current) {
          vehicleDatabaseRetryDelayRef.current = vehicleDatabaseRetryInitialDelayMs;
          return;
        }

        const expectedSnapshot = parseExpectedVehicleSnapshot(databaseSaveSnapshotRef.current);
        const savePlan = createVehicleRowsSavePlan(rowsSnapshot, expectedSnapshot);
        if (savePlan.kind === "none") {
          databaseSaveSnapshotRef.current = snapshot;
          vehicleDatabaseRetryDelayRef.current = vehicleDatabaseRetryInitialDelayMs;
          return;
        }

        const { replaceVehiclesInDatabase, saveVehicleRowsPatchToDatabase } = await import("@/lib/data/vehicles");
        if (!isLatest()) return;

        showSaveStatus("saving", "\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u044e \u0442\u0435\u0445\u043d\u0438\u043a\u0443...");
        if (savePlan.kind === "patch") {
          await saveVehicleRowsPatchToDatabase(savePlan.patchRows, { expectedSnapshot: savePlan.expectedSnapshot });
        } else if (savePlan.kind === "replace") {
          await replaceVehiclesInDatabase(savePlan.rows, { expectedSnapshot: savePlan.expectedSnapshot });
        }

        databaseSaveSnapshotRef.current = snapshot;
        vehicleDatabaseRetryDelayRef.current = vehicleDatabaseRetryInitialDelayMs;
        if (!isLatest() || snapshotVersion !== vehicleRowsVersionRef.current) return;

        showSaveStatus("saved", "\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430.");
      } catch (error) {
        console.warn("Database vehicles save failed:", error);
        if (!isLatest() || snapshotVersion !== vehicleRowsVersionRef.current) return;

        if (isDatabaseConflictError(error)) {
          showSaveStatus("error", `\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u043d\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430: ${errorToMessage(error)}`);
          return;
        }

        const retryDelay = vehicleDatabaseRetryDelayRef.current;
        showSaveStatus("saving", `\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u043d\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430. \u041f\u043e\u0432\u0442\u043e\u0440\u044e \u0447\u0435\u0440\u0435\u0437 ${Math.round(retryDelay / 1000)} \u0441\u0435\u043a.`);
        vehicleDatabaseRetryDelayRef.current = Math.min(
          retryDelay * 2,
          vehicleDatabaseRetryMaxDelayMs,
        );
        vehicleDatabaseRetryTimerRef.current = window.setTimeout(() => {
          vehicleDatabaseRetryTimerRef.current = null;
          const retryRowsSnapshot = copyVehicleRows(vehicleRowsRef.current);
          queueDatabaseVehicleSave(
            retryRowsSnapshot,
            JSON.stringify(retryRowsSnapshot),
            vehicleRowsVersionRef.current,
          );
        }, retryDelay);
      }
    });
  }, [
    databaseConfigured,
    databaseAutoSaveBlockedSnapshotRef,
    databaseLoadedRef,
    databaseSaveSnapshotRef,
    showSaveStatus,
    vehicleRowsRef,
  ]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (vehicleSaveTimerRef.current !== null) {
      window.clearTimeout(vehicleSaveTimerRef.current);
    }
    if (vehicleDatabaseRetryTimerRef.current !== null) {
      window.clearTimeout(vehicleDatabaseRetryTimerRef.current);
      vehicleDatabaseRetryTimerRef.current = null;
    }

    vehicleSaveTimerRef.current = window.setTimeout(() => {
      const rowsSnapshot = copyVehicleRows(vehicleRowsRef.current);
      const snapshot = JSON.stringify(rowsSnapshot);
      const snapshotVersion = vehicleRowsVersionRef.current;
      const localUpdatedAt = new Date().toISOString();
      const previousLocalSnapshot = vehicleLocalSaveSnapshotRef.current ?? readVehicleRowsLocalBackup();
      const autoSaveBlocked = shouldBlockVehicleRowsAutoSave(snapshot, databaseAutoSaveBlockedSnapshotRef.current);
      const localBackupChanged = autoSaveBlocked
        ? false
        : saveVehicleRowsLocalBackupIfChanged(
          snapshot,
          localUpdatedAt,
          previousLocalSnapshot,
        );

      if (!autoSaveBlocked) {
        vehicleLocalSaveSnapshotRef.current = snapshot;
      }

      if (!autoSaveBlocked) {
        queueDatabaseVehicleSave(rowsSnapshot, snapshot, snapshotVersion);
      }
      if (localBackupChanged && !autoSaveBlocked) {
        requestClientSnapshotSave("vehicles-save");
      }
      vehicleSaveTimerRef.current = null;
    }, 700);

    return () => {
      if (vehicleSaveTimerRef.current !== null) {
        window.clearTimeout(vehicleSaveTimerRef.current);
        vehicleSaveTimerRef.current = null;
      }
    };
  }, [
    adminDataLoaded,
    databaseConfigured,
    databaseAutoSaveBlockedSnapshotRef,
    databaseLoadedRef,
    databaseSaveSnapshotRef,
    queueDatabaseVehicleSave,
    requestClientSnapshotSave,
    vehicleRows,
    vehicleRowsRef,
  ]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    const flushVehicleRows = () => {
      if (vehicleSaveTimerRef.current !== null) {
        window.clearTimeout(vehicleSaveTimerRef.current);
        vehicleSaveTimerRef.current = null;
      }
      const rowsSnapshot = copyVehicleRows(vehicleRowsRef.current);
      const snapshot = JSON.stringify(rowsSnapshot);
      const autoSaveBlocked = shouldBlockVehicleRowsAutoSave(snapshot, databaseAutoSaveBlockedSnapshotRef.current);
      const previousLocalSnapshot = vehicleLocalSaveSnapshotRef.current ?? readVehicleRowsLocalBackup();

      if (!autoSaveBlocked && saveVehicleRowsLocalBackupIfChanged(snapshot, new Date().toISOString(), previousLocalSnapshot)) {
        vehicleLocalSaveSnapshotRef.current = snapshot;
      }

      if (autoSaveBlocked) return;

      queueDatabaseVehicleSave(rowsSnapshot, snapshot, vehicleRowsVersionRef.current);
      queueMicrotask(() => {
        if (databaseConfigured && databaseLoadedRef.current) {
          void databaseSaveQueueRef.current?.flush();
        }
      });
    };

    window.addEventListener("pagehide", flushVehicleRows);
    return () => window.removeEventListener("pagehide", flushVehicleRows);
  }, [adminDataLoaded, databaseConfigured, databaseAutoSaveBlockedSnapshotRef, databaseLoadedRef, queueDatabaseVehicleSave, vehicleRowsRef]);
}
