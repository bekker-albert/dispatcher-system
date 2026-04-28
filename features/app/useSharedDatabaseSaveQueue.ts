"use client";

import { useCallback, useRef, type RefObject } from "react";
import {
  type SharedAppStorageWriteResult,
} from "@/features/app/sharedAppStorage";
import { databaseConfigured } from "@/lib/data/config";
import { isDatabaseConflictError } from "@/lib/data/errors";
import {
  applySavedSharedAppSettingsToSnapshot,
  createSharedAppSettingsSaveDelta,
} from "@/lib/domain/app/shared-settings-snapshot";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type SharedDatabaseSaveQueue = {
  storage: Record<string, string>;
  settings: Record<string, unknown>;
};

type UseSharedDatabaseSaveQueueOptions = {
  appDatabaseSaveSnapshotRef: RefObject<string>;
  appSettingsDatabaseLoadedRef: RefObject<boolean>;
  appSettingsDatabaseSaveSnapshotRef: RefObject<string>;
  showSaveStatus: ShowSaveStatus;
};

export function useSharedDatabaseSaveQueue({
  appDatabaseSaveSnapshotRef,
  appSettingsDatabaseLoadedRef,
  appSettingsDatabaseSaveSnapshotRef,
  showSaveStatus,
}: UseSharedDatabaseSaveQueueOptions) {
  const sharedDatabaseSaveQueueRef = useRef<SharedDatabaseSaveQueue | null>(null);
  const sharedDatabaseSavingRef = useRef(false);

  const saveSharedAppStateToDatabase = useCallback(async (storage: Record<string, string>) => {
    if (!databaseConfigured) return;

    const storageSnapshot = JSON.stringify(storage);
    const {
      createAppStateSaveCheckpoint,
      parseAppStateSaveCheckpoint,
      saveAppStateToDatabase,
    } = await import("@/lib/data/app-state");
    const checkpoint = parseAppStateSaveCheckpoint(appDatabaseSaveSnapshotRef.current);
    if (storageSnapshot === JSON.stringify(checkpoint.storage)) return;

    showSaveStatus("saving", "Сохраняю общие данные...");

    try {
      const savedState = await saveAppStateToDatabase(storage, { expectedUpdatedAt: checkpoint.updatedAt });
      appDatabaseSaveSnapshotRef.current = createAppStateSaveCheckpoint(
        savedState?.storage ?? storage,
        savedState?.updatedAt ?? null,
      );
      showSaveStatus("saved", "Общие данные сохранены.");
    } catch (error) {
      showSaveStatus("error", `Общие данные не сохранены: ${errorToMessage(error)}`);
      throw error;
    }
  }, [appDatabaseSaveSnapshotRef, showSaveStatus]);

  const saveSharedAppSettingsToDatabase = useCallback(async (settings: Record<string, unknown>) => {
    if (!databaseConfigured || !appSettingsDatabaseLoadedRef.current) return;

    const delta = createSharedAppSettingsSaveDelta(
      settings,
      appSettingsDatabaseSaveSnapshotRef.current,
    );
    const dirtyKeys = Object.keys(delta.settings);
    if (dirtyKeys.length === 0) return;

    showSaveStatus("saving", "Сохраняю настройки...");

    try {
      const { loadAppSettingsFromDatabase, saveAppSettingsToDatabase } = await import("@/lib/data/settings");
      await saveAppSettingsToDatabase(delta.settings, { expectedUpdatedAt: delta.expectedUpdatedAt });
      const savedSettings = await loadAppSettingsFromDatabase(dirtyKeys);
      appSettingsDatabaseSaveSnapshotRef.current = applySavedSharedAppSettingsToSnapshot(
        appSettingsDatabaseSaveSnapshotRef.current,
        savedSettings.length > 0
          ? savedSettings
          : dirtyKeys.map((key) => ({ key, value: delta.settings[key], updated_at: null })),
      );
      showSaveStatus("saved", "Настройки сохранены.");
    } catch (error) {
      showSaveStatus("error", `Настройки не сохранены: ${errorToMessage(error)}`);
      throw error;
    }
  }, [appSettingsDatabaseLoadedRef, appSettingsDatabaseSaveSnapshotRef, showSaveStatus]);

  const runSharedDatabaseSaveQueue = useCallback(async () => {
    if (sharedDatabaseSavingRef.current) return;
    sharedDatabaseSavingRef.current = true;
    let failed = false;

    try {
      while (sharedDatabaseSaveQueueRef.current) {
        const queuedSave = sharedDatabaseSaveQueueRef.current;
        sharedDatabaseSaveQueueRef.current = null;

        try {
          await saveSharedAppSettingsToDatabase(queuedSave.settings);
          await saveSharedAppStateToDatabase(queuedSave.storage);
        } catch (error) {
          if (!isDatabaseConflictError(error)) {
            sharedDatabaseSaveQueueRef.current = sharedDatabaseSaveQueueRef.current ?? queuedSave;
            failed = true;
            throw error;
          }

          sharedDatabaseSaveQueueRef.current = null;
          failed = true;
          showSaveStatus(
            "error",
            "Данные на сервере изменились другим пользователем. Локальная правка сохранена в браузере; обнови страницу перед повторным сохранением.",
          );
          break;
        }
      }
    } catch (error) {
      console.warn("Shared database save failed:", error);
    } finally {
      sharedDatabaseSavingRef.current = false;
      if (!failed && sharedDatabaseSaveQueueRef.current) {
        void runSharedDatabaseSaveQueue();
      }
    }
  }, [
    saveSharedAppSettingsToDatabase,
    saveSharedAppStateToDatabase,
    showSaveStatus,
  ]);

  return useCallback((savedLocalState: SharedAppStorageWriteResult) => {
    if (!databaseConfigured) return;

    sharedDatabaseSaveQueueRef.current = {
      storage: savedLocalState.storage,
      settings: savedLocalState.settings,
    };
    void runSharedDatabaseSaveQueue();
  }, [runSharedDatabaseSaveQueue]);
}
