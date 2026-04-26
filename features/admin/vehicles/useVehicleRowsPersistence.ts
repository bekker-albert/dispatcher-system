"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { adminStorageKeys } from "@/lib/storage/keys";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

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

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (vehicleSaveTimerRef.current !== null) {
      window.clearTimeout(vehicleSaveTimerRef.current);
    }

    vehicleSaveTimerRef.current = window.setTimeout(() => {
      window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(vehicleRowsRef.current));
      window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
      if (databaseConfigured && databaseLoadedRef.current) {
        const snapshot = JSON.stringify(vehicleRowsRef.current);
        if (snapshot !== databaseSaveSnapshotRef.current) {
          showSaveStatus("saving", "\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u044e \u0442\u0435\u0445\u043d\u0438\u043a\u0443...");
          void import("@/lib/data/vehicles")
            .then(({ saveVehiclesToDatabase }) => saveVehiclesToDatabase(vehicleRowsRef.current))
            .then(() => {
              databaseSaveSnapshotRef.current = snapshot;
              showSaveStatus("saved", "\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430.");
            })
            .catch((error) => {
              console.warn("Database vehicles save failed:", error);
              showSaveStatus("error", `\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u043d\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430: ${errorToMessage(error)}`);
            });
        }
      }
      requestClientSnapshotSave("vehicles-save");
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
      window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(vehicleRowsRef.current));
      window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
    };

    window.addEventListener("pagehide", flushVehicleRows);
    return () => window.removeEventListener("pagehide", flushVehicleRows);
  }, [adminDataLoaded, vehicleRowsRef]);
}
