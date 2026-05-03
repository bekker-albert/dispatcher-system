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

function timestampToMs(value: string | null | undefined) {
  if (!value) return 0;

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

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
    const databaseStorageIncludesSharedSettings = sharedAppSettingKeys.some((key) => typeof databaseStorage[key] === "string");
    appDatabaseSaveSnapshotRef.current = createAppStateSaveCheckpoint(
      databaseStorage,
      databaseAppState?.updatedAt ?? null,
    );
    const localUpdatedAt = window.localStorage.getItem(adminStorageKeys.appStateLocalUpdatedAt)
      ?? window.localStorage.getItem(adminStorageKeys.appLocalUpdatedAt);
    const localUpdatedTime = timestampToMs(localUpdatedAt);
    const databaseUpdatedTime = timestampToMs(databaseAppState?.updatedAt);
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
        if (databaseStorageIncludesSharedSettings) {
          window.localStorage.setItem(adminStorageKeys.appSettingsLocalUpdatedAt, databaseAppState.updatedAt);
        }
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
        timestampToMs(setting.updated_at)
      )),
    );
    const currentAppSettingsLocalUpdatedAt = window.localStorage.getItem(adminStorageKeys.appSettingsLocalUpdatedAt);
    const currentAppLocalUpdatedAt = window.localStorage.getItem(adminStorageKeys.appLocalUpdatedAt);
    const currentLocalUpdatedTime = Math.max(
      timestampToMs(currentAppSettingsLocalUpdatedAt),
      timestampToMs(currentAppLocalUpdatedAt),
    );
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
