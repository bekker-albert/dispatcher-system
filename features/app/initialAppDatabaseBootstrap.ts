"use client";

import { sharedAppSettingKeys } from "@/lib/domain/app/settings";
import { createSharedAppSettingsDatabaseSnapshot } from "@/lib/domain/app/shared-settings-snapshot";
import { adminStorageKeys } from "@/lib/storage/keys";
import {
  collectInitialStoredAppStorage,
  initialAppStorageKeys,
  parseInitialStoredAppStateFromStorage,
  type InitialStoredAppState,
} from "@/features/app/initialAppStorage";

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

export type InitialAppDatabaseBootstrapResult = {
  completed: boolean;
  storageChanged: boolean;
  storedState: InitialStoredAppState | null;
};

export async function loadInitialAppDatabaseBootstrap({
  hasLocalAppState,
  isCancelled,
  appDatabaseSaveSnapshotRef,
  appSettingsDatabaseLoadedRef,
  appSettingsDatabaseSaveSnapshotRef,
}: InitialAppDatabaseBootstrapOptions): Promise<InitialAppDatabaseBootstrapResult> {
  let storageChanged = false;
  const resolvedStorage = collectInitialStoredAppStorage({ includePto: false });
  const [
    { createAppStateSaveCheckpoint },
    { loadInitialAppBootstrapFromDatabase },
  ] = await Promise.all([
    import("@/lib/data/app-state"),
    import("@/lib/data/app-bootstrap"),
  ]);
  const databaseBootstrap = await loadInitialAppBootstrapFromDatabase([...sharedAppSettingKeys]);
  const appStateResult = databaseBootstrap.appStateError
    ? { status: "rejected" as const, reason: databaseBootstrap.appStateError }
    : {
        status: "fulfilled" as const,
        value: {
          createAppStateSaveCheckpoint,
          databaseAppState: databaseBootstrap.appState,
        },
      };
  const settingsResult = databaseBootstrap.settingsError
    ? { status: "rejected" as const, reason: databaseBootstrap.settingsError }
    : { status: "fulfilled" as const, value: databaseBootstrap.settings };

  if (appStateResult.status === "fulfilled") {
    const { createAppStateSaveCheckpoint, databaseAppState } = appStateResult.value;

    if (isCancelled()) return { completed: false, storageChanged, storedState: null };

    const databaseStorage = databaseAppState?.storage ?? {};
    appDatabaseSaveSnapshotRef.current = createAppStateSaveCheckpoint(
      databaseStorage,
      databaseAppState?.updatedAt ?? null,
    );
    const localUpdatedAt = window.localStorage.getItem(adminStorageKeys.appStateLocalUpdatedAt)
      ?? window.localStorage.getItem(adminStorageKeys.appLocalUpdatedAt);
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
          resolvedStorage[key] = value;
        }
      });
      if (databaseAppState?.updatedAt) {
        window.localStorage.setItem(adminStorageKeys.appStateLocalUpdatedAt, databaseAppState.updatedAt);
        window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, databaseAppState.updatedAt);
      }
      storageChanged = true;
    } else if (hasLocalAppState && !localUpdatedAt) {
      const updatedAt = new Date().toISOString();
      window.localStorage.setItem(adminStorageKeys.appStateLocalUpdatedAt, updatedAt);
      window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, updatedAt);
    }
  } else {
    console.warn("Legacy app_state is not ready:", appStateResult.reason);
  }

  if (settingsResult.status === "fulfilled") {
    const databaseSettings = settingsResult.value;
    appSettingsDatabaseLoadedRef.current = true;

    if (isCancelled()) return { completed: false, storageChanged, storedState: null };

    const databaseSettingsUpdatedTime = Math.max(
      0,
      ...databaseSettings.map((setting) => (
        setting.updated_at ? Date.parse(setting.updated_at) || 0 : 0
      )),
    );
    const currentLocalUpdatedAt = window.localStorage.getItem(adminStorageKeys.appSettingsLocalUpdatedAt)
      ?? window.localStorage.getItem(adminStorageKeys.appLocalUpdatedAt);
    const currentLocalUpdatedTime = currentLocalUpdatedAt ? Date.parse(currentLocalUpdatedAt) : 0;
    const shouldUseDatabaseSettings = databaseSettings.length > 0
      && (
        !hasLocalAppState
        || (currentLocalUpdatedTime > 0 && databaseSettingsUpdatedTime > currentLocalUpdatedTime)
      );

    if (shouldUseDatabaseSettings) {
      databaseSettings.forEach((setting) => {
        const serialized = JSON.stringify(setting.value);
        window.localStorage.setItem(setting.key, serialized);
        resolvedStorage[setting.key] = serialized;
      });
      if (databaseSettingsUpdatedTime > 0) {
        const updatedAt = new Date(databaseSettingsUpdatedTime).toISOString();
        window.localStorage.setItem(adminStorageKeys.appSettingsLocalUpdatedAt, updatedAt);
        window.localStorage.setItem(adminStorageKeys.appStateLocalUpdatedAt, updatedAt);
        window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, updatedAt);
      }
      storageChanged = true;
    }

    appSettingsDatabaseSaveSnapshotRef.current = createSharedAppSettingsDatabaseSnapshot(databaseSettings);
  } else {
    appSettingsDatabaseLoadedRef.current = false;
    console.warn("App settings table is not ready:", settingsResult.reason);
  }

  return {
    completed: true,
    storageChanged,
    storedState: storageChanged
      ? parseInitialStoredAppStateFromStorage(resolvedStorage, { includePto: false })
      : null,
  };
}
