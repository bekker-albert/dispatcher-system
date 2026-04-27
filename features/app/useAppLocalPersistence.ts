"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  collectSharedAppSettingsFromBrowserStorage,
  collectSharedAppStorageFromBrowserStorage,
  writeSharedAppStateToBrowserStorage,
} from "@/features/app/sharedAppStorage";
import { databaseConfigured } from "@/lib/data/config";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type AppLocalPersistenceOptions = {
  adminDataLoaded: boolean;
  appDatabaseSaveSnapshotRef: RefObject<string>;
  appSettingsDatabaseLoadedRef: RefObject<boolean>;
  appSettingsDatabaseSaveSnapshotRef: RefObject<string>;
  requestClientSnapshotSave: (reason?: string) => void;
  showSaveStatus: ShowSaveStatus;
  reportCustomers: unknown;
  reportAreaOrder: unknown;
  reportWorkOrder: unknown;
  reportHeaderLabels: unknown;
  reportColumnWidths: unknown;
  reportReasons: unknown;
  areaShiftCutoffs: unknown;
  customTabs: unknown;
  topTabs: unknown;
  subTabs: unknown;
  dispatchSummaryRows: unknown;
  orgMembers: unknown;
  dependencyNodes: unknown;
  dependencyLinks: unknown;
  adminLogs: unknown;
};

export function useAppLocalPersistence({
  adminDataLoaded,
  appDatabaseSaveSnapshotRef,
  appSettingsDatabaseLoadedRef,
  appSettingsDatabaseSaveSnapshotRef,
  requestClientSnapshotSave,
  showSaveStatus,
  reportCustomers,
  reportAreaOrder,
  reportWorkOrder,
  reportHeaderLabels,
  reportColumnWidths,
  reportReasons,
  areaShiftCutoffs,
  customTabs,
  topTabs,
  subTabs,
  dispatchSummaryRows,
  orgMembers,
  dependencyNodes,
  dependencyLinks,
  adminLogs,
}: AppLocalPersistenceOptions) {
  const appStateSaveTimerRef = useRef<number | null>(null);

  const saveAppLocalState = useCallback(() => {
    writeSharedAppStateToBrowserStorage({
      reportCustomers,
      reportAreaOrder,
      reportWorkOrder,
      reportHeaderLabels,
      reportColumnWidths,
      reportReasons,
      areaShiftCutoffs,
      customTabs,
      topTabs,
      subTabs,
      dispatchSummaryRows,
      orgMembers,
      dependencyNodes,
      dependencyLinks,
      adminLogs,
    });
  }, [
    adminLogs,
    areaShiftCutoffs,
    customTabs,
    dependencyLinks,
    dependencyNodes,
    dispatchSummaryRows,
    orgMembers,
    reportAreaOrder,
    reportColumnWidths,
    reportCustomers,
    reportHeaderLabels,
    reportReasons,
    reportWorkOrder,
    subTabs,
    topTabs,
  ]);

  const saveSharedAppStateToDatabase = useCallback(async () => {
    if (!databaseConfigured) return;

    const storage = collectSharedAppStorageFromBrowserStorage();
    const snapshot = JSON.stringify(storage);
    if (snapshot === appDatabaseSaveSnapshotRef.current) return;

    showSaveStatus("saving", "Сохраняю общие данные...");

    try {
      const { saveAppStateToDatabase } = await import("@/lib/data/app-state");
      await saveAppStateToDatabase(storage);
      appDatabaseSaveSnapshotRef.current = snapshot;
      showSaveStatus("saved", "Общие данные сохранены.");
    } catch (error) {
      showSaveStatus("error", `Общие данные не сохранены: ${errorToMessage(error)}`);
      throw error;
    }
  }, [appDatabaseSaveSnapshotRef, showSaveStatus]);

  const saveSharedAppSettingsToDatabase = useCallback(async () => {
    if (!databaseConfigured || !appSettingsDatabaseLoadedRef.current) return;

    const settings = collectSharedAppSettingsFromBrowserStorage();
    const snapshot = JSON.stringify(settings);
    if (snapshot === appSettingsDatabaseSaveSnapshotRef.current) return;

    showSaveStatus("saving", "Сохраняю настройки...");

    try {
      const { saveAppSettingsToDatabase } = await import("@/lib/data/settings");
      await saveAppSettingsToDatabase(settings);
      appSettingsDatabaseSaveSnapshotRef.current = snapshot;
      showSaveStatus("saved", "Настройки сохранены.");
    } catch (error) {
      showSaveStatus("error", `Настройки не сохранены: ${errorToMessage(error)}`);
      throw error;
    }
  }, [appSettingsDatabaseLoadedRef, appSettingsDatabaseSaveSnapshotRef, showSaveStatus]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (appStateSaveTimerRef.current !== null) {
      window.clearTimeout(appStateSaveTimerRef.current);
    }

    appStateSaveTimerRef.current = window.setTimeout(() => {
      saveAppLocalState();
      void saveSharedAppStateToDatabase().catch((error) => {
        console.warn("Database app_state save failed:", error);
      });
      void saveSharedAppSettingsToDatabase().catch((error) => {
        console.warn("Database app_settings save failed:", error);
      });
      requestClientSnapshotSave("app-state-save");
      appStateSaveTimerRef.current = null;
    }, 300);

    return () => {
      if (appStateSaveTimerRef.current !== null) {
        window.clearTimeout(appStateSaveTimerRef.current);
        appStateSaveTimerRef.current = null;
      }
    };
  }, [
    adminDataLoaded,
    requestClientSnapshotSave,
    saveAppLocalState,
    saveSharedAppSettingsToDatabase,
    saveSharedAppStateToDatabase,
  ]);

  // Pagehide only flushes browser storage. Server writes stay debounced above
  // to avoid blocking page close and to keep database writes predictable.
  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    const flushAppLocalState = () => {
      if (appStateSaveTimerRef.current !== null) {
        window.clearTimeout(appStateSaveTimerRef.current);
        appStateSaveTimerRef.current = null;
      }
      saveAppLocalState();
    };

    window.addEventListener("pagehide", flushAppLocalState);
    return () => window.removeEventListener("pagehide", flushAppLocalState);
  }, [adminDataLoaded, saveAppLocalState]);
}
