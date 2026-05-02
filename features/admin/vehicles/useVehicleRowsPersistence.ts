"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createVehicleRowsSavePlan } from "@/lib/domain/vehicles/persistence";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { adminStorageKeys } from "@/lib/storage/keys";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";
import { createVehicleRowsSaveQueue, type VehicleRowsSaveQueue } from "./vehicleRowsSaveQueue";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

function copyVehicleRows(rows: VehicleRow[]) {
  return rows.map((vehicle) => ({ ...vehicle }));
}

function saveVehicleRowsLocalBackup(snapshot: string, updatedAt: string) {
  try {
    window.localStorage.setItem(adminStorageKeys.vehicles, snapshot);
    window.localStorage.setItem(adminStorageKeys.vehiclesLocalUpdatedAt, updatedAt);
    window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, updatedAt);
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
  requestClientSnapshotSave,
  showSaveStatus,
}: VehicleRowsPersistenceOptions) {
  const vehicleSaveTimerRef = useRef<number | null>(null);
  const databaseSaveQueueRef = useRef<VehicleRowsSaveQueue | null>(null);
  const vehicleRowsVersionRef = useRef(0);
  const vehicleLocalSaveSnapshotRef = useRef<string | null>(null);

  if (databaseSaveQueueRef.current === null) {
    databaseSaveQueueRef.current = createVehicleRowsSaveQueue();
  }

  useEffect(() => {
    vehicleRowsVersionRef.current += 1;
  }, [vehicleRows]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (vehicleSaveTimerRef.current !== null) {
      window.clearTimeout(vehicleSaveTimerRef.current);
    }

    vehicleSaveTimerRef.current = window.setTimeout(() => {
      const rowsSnapshot = copyVehicleRows(vehicleRowsRef.current);
      const snapshot = JSON.stringify(rowsSnapshot);
      const snapshotVersion = vehicleRowsVersionRef.current;
      const localUpdatedAt = new Date().toISOString();
      const previousLocalSnapshot = vehicleLocalSaveSnapshotRef.current ?? readVehicleRowsLocalBackup();
      const localBackupChanged = saveVehicleRowsLocalBackupIfChanged(
        snapshot,
        localUpdatedAt,
        previousLocalSnapshot,
      );

      vehicleLocalSaveSnapshotRef.current = snapshot;

      if (databaseConfigured && databaseLoadedRef.current) {
        if (snapshot !== databaseSaveSnapshotRef.current) {
          const expectedSnapshot = parseExpectedVehicleSnapshot(databaseSaveSnapshotRef.current);
          const savePlan = createVehicleRowsSavePlan(rowsSnapshot, expectedSnapshot);

          showSaveStatus("saving", "\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u044e \u0442\u0435\u0445\u043d\u0438\u043a\u0443...");
          databaseSaveQueueRef.current?.enqueue(async (isLatest) => {
            try {
              const { replaceVehiclesInDatabase, saveVehicleRowsPatchToDatabase } = await import("@/lib/data/vehicles");
              if (!isLatest()) return;

              if (savePlan.kind === "patch") {
                await saveVehicleRowsPatchToDatabase(savePlan.patchRows, { expectedSnapshot: savePlan.expectedSnapshot });
              } else if (savePlan.kind === "replace") {
                await replaceVehiclesInDatabase(savePlan.rows, { expectedSnapshot: savePlan.expectedSnapshot });
              }

              if (!isLatest() || snapshotVersion !== vehicleRowsVersionRef.current) return;

              databaseSaveSnapshotRef.current = snapshot;
              showSaveStatus("saved", "\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430.");
            } catch (error) {
              console.warn("Database vehicles save failed:", error);
              if (isLatest() && snapshotVersion === vehicleRowsVersionRef.current) {
                showSaveStatus("error", `\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u043d\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430: ${errorToMessage(error)}`);
              }
            }
          });
        }
      }
      if (localBackupChanged) {
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
    databaseLoadedRef,
    databaseSaveSnapshotRef,
    requestClientSnapshotSave,
    showSaveStatus,
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
      const snapshot = JSON.stringify(vehicleRowsRef.current);
      const previousLocalSnapshot = vehicleLocalSaveSnapshotRef.current ?? readVehicleRowsLocalBackup();

      if (saveVehicleRowsLocalBackupIfChanged(snapshot, new Date().toISOString(), previousLocalSnapshot)) {
        vehicleLocalSaveSnapshotRef.current = snapshot;
      }
    };

    window.addEventListener("pagehide", flushVehicleRows);
    return () => window.removeEventListener("pagehide", flushVehicleRows);
  }, [adminDataLoaded, vehicleRowsRef]);
}
