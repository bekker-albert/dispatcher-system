"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  collectSharedAppStorageFromBrowserStorage,
  createSharedAppStorageSerializationCache,
  type SharedAppStorageSerializationCache,
  type SharedAppStorageWriteResult,
  writeSharedAppStateToBrowserStorage,
} from "@/features/app/sharedAppStorage";
import { useSharedDatabaseSaveQueue } from "@/features/app/useSharedDatabaseSaveQueue";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

const appLocalSaveDelayMs = 300;
const firstAppLocalSaveDelayMs = 1200;
const firstAppLocalIdleTimeoutMs = 2000;

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
  const appStateSaveIdleRef = useRef<number | null>(null);
  const appStateStorageCacheRef = useRef<SharedAppStorageSerializationCache>(
    createSharedAppStorageSerializationCache(),
  );
  const appStateLocalBaselineInitializedRef = useRef(false);
  const firstAppLocalSaveRef = useRef(true);
  const enqueueSharedDatabaseSave = useSharedDatabaseSaveQueue({
    appDatabaseSaveSnapshotRef,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    showSaveStatus,
  });

  const createCurrentSharedState = useCallback(() => ({
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
  }), [
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

  const saveAppLocalState = useCallback(() => {
    return writeSharedAppStateToBrowserStorage(
      createCurrentSharedState(),
      appStateStorageCacheRef.current,
    );
  }, [
    createCurrentSharedState,
  ]);

  const clearScheduledAppLocalStateSave = useCallback(() => {
    if (appStateSaveTimerRef.current !== null) {
      window.clearTimeout(appStateSaveTimerRef.current);
      appStateSaveTimerRef.current = null;
    }
    if (appStateSaveIdleRef.current !== null) {
      window.cancelIdleCallback?.(appStateSaveIdleRef.current);
      appStateSaveIdleRef.current = null;
    }
  }, []);

  const persistAppLocalState = useCallback((reason: string) => {
    const savedLocalState: SharedAppStorageWriteResult = saveAppLocalState();

    if (savedLocalState.changedKeys.length > 0) {
      enqueueSharedDatabaseSave(savedLocalState);
      requestClientSnapshotSave(reason);
    }
  }, [enqueueSharedDatabaseSave, requestClientSnapshotSave, saveAppLocalState]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (!appStateLocalBaselineInitializedRef.current) {
      appStateStorageCacheRef.current = createSharedAppStorageSerializationCache(
        collectSharedAppStorageFromBrowserStorage(),
      );
      appStateLocalBaselineInitializedRef.current = true;
    }

    clearScheduledAppLocalStateSave();

    const isFirstSave = firstAppLocalSaveRef.current;
    firstAppLocalSaveRef.current = false;
    appStateSaveTimerRef.current = window.setTimeout(() => {
      appStateSaveTimerRef.current = null;
      const runSave = () => {
        appStateSaveIdleRef.current = null;
        persistAppLocalState("app-state-save");
      };

      if (isFirstSave && window.requestIdleCallback) {
        appStateSaveIdleRef.current = window.requestIdleCallback(runSave, {
          timeout: firstAppLocalIdleTimeoutMs,
        });
        return;
      }

      runSave();
    }, isFirstSave ? firstAppLocalSaveDelayMs : appLocalSaveDelayMs);

    return () => {
      clearScheduledAppLocalStateSave();
    };
  }, [
    adminDataLoaded,
    clearScheduledAppLocalStateSave,
    persistAppLocalState,
  ]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    const flushAppLocalState = () => {
      clearScheduledAppLocalStateSave();
      persistAppLocalState("app-state-pagehide");
    };

    window.addEventListener("pagehide", flushAppLocalState);
    return () => window.removeEventListener("pagehide", flushAppLocalState);
  }, [adminDataLoaded, clearScheduledAppLocalStateSave, persistAppLocalState]);
}
