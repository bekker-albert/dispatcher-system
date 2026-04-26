"use client";

import { sharedAppSettingKeys } from "@/lib/domain/app/settings";
import { adminStorageKeys } from "@/lib/storage/keys";
import { initialAppStorageKeys } from "@/features/app/initialAppStorage";

type MutableRef<T> = {
  current: T;
};

type InitialAppDatabaseBootstrapOptions = {
  hasLocalAppState: boolean;
  isCancelled: () => boolean;
  appDatabaseSaveSnapshotRef: MutableRef<string>;
  appSettingsDatabaseLoadedRef: MutableRef<boolean>;
  appSettingsDatabaseSaveSnapshotRef: MutableRef<string>;
};

export async function loadInitialAppDatabaseBootstrap({
  hasLocalAppState,
  isCancelled,
  appDatabaseSaveSnapshotRef,
  appSettingsDatabaseLoadedRef,
  appSettingsDatabaseSaveSnapshotRef,
}: InitialAppDatabaseBootstrapOptions) {
  try {
    const { loadAppStateFromDatabase } = await import("@/lib/data/app-state");
    const databaseAppState = await loadAppStateFromDatabase();

    if (isCancelled()) return false;

    const databaseStorage = databaseAppState?.storage ?? {};
    const localUpdatedAt = window.localStorage.getItem(adminStorageKeys.appLocalUpdatedAt);
    const localUpdatedTime = localUpdatedAt ? Date.parse(localUpdatedAt) : 0;
    const databaseUpdatedTime = databaseAppState?.updatedAt ? Date.parse(databaseAppState.updatedAt) : 0;
    const shouldUseDatabaseAppState = Object.keys(databaseStorage).length > 0
      && (
        !hasLocalAppState
        || (localUpdatedTime > 0 && databaseUpdatedTime > localUpdatedTime)
      );

    if (shouldUseDatabaseAppState) {
      initialAppStorageKeys.forEach((key) => {
        const value = databaseStorage[key];
        if (typeof value === "string") {
          window.localStorage.setItem(key, value);
        }
      });
      if (databaseAppState?.updatedAt) {
        window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, databaseAppState.updatedAt);
      }
      appDatabaseSaveSnapshotRef.current = JSON.stringify(databaseStorage);
    } else if (hasLocalAppState && !localUpdatedAt) {
      window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
    }
  } catch (error) {
    console.warn("Legacy app_state is not ready:", error);
  }

  try {
    const { loadAppSettingsFromDatabase } = await import("@/lib/data/settings");
    const databaseSettings = await loadAppSettingsFromDatabase([...sharedAppSettingKeys]);
    appSettingsDatabaseLoadedRef.current = true;

    if (isCancelled()) return false;

    const databaseSettingsObject = Object.fromEntries(
      databaseSettings.map((setting) => [setting.key, setting.value]),
    );
    const databaseSettingsUpdatedTime = Math.max(
      0,
      ...databaseSettings.map((setting) => (
        setting.updated_at ? Date.parse(setting.updated_at) || 0 : 0
      )),
    );
    const currentLocalUpdatedAt = window.localStorage.getItem(adminStorageKeys.appLocalUpdatedAt);
    const currentLocalUpdatedTime = currentLocalUpdatedAt ? Date.parse(currentLocalUpdatedAt) : 0;
    const shouldUseDatabaseSettings = databaseSettings.length > 0
      && (
        !hasLocalAppState
        || (currentLocalUpdatedTime > 0 && databaseSettingsUpdatedTime > currentLocalUpdatedTime)
      );

    if (shouldUseDatabaseSettings) {
      databaseSettings.forEach((setting) => {
        window.localStorage.setItem(setting.key, JSON.stringify(setting.value));
      });
      if (databaseSettingsUpdatedTime > 0) {
        window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date(databaseSettingsUpdatedTime).toISOString());
      }
    }

    appSettingsDatabaseSaveSnapshotRef.current = JSON.stringify(databaseSettingsObject);
  } catch (error) {
    appSettingsDatabaseLoadedRef.current = false;
    console.warn("App settings table is not ready:", error);
  }

  return true;
}
