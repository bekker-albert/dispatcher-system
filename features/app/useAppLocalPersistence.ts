"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  collectSharedAppStorageFromBrowserStorage,
  type SharedAppStorageWriteResult,
  writeSharedAppStateToBrowserStorage,
} from "@/features/app/sharedAppStorage";
import { useSharedDatabaseSaveQueue } from "@/features/app/useSharedDatabaseSaveQueue";
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
  const appStateSerializedByKeyRef = useRef<Record<string, string>>({});
  const appStateLocalBaselineInitializedRef = useRef(false);
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
      appStateSerializedByKeyRef.current,
    );
  }, [
    createCurrentSharedState,
  ]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (!appStateLocalBaselineInitializedRef.current) {
      appStateSerializedByKeyRef.current = collectSharedAppStorageFromBrowserStorage();
      appStateLocalBaselineInitializedRef.current = true;
    }

    if (appStateSaveTimerRef.current !== null) {
      window.clearTimeout(appStateSaveTimerRef.current);
    }

    appStateSaveTimerRef.current = window.setTimeout(() => {
      const savedLocalState: SharedAppStorageWriteResult = saveAppLocalState();

      if (savedLocalState.changedKeys.length > 0) {
        enqueueSharedDatabaseSave(savedLocalState);
        requestClientSnapshotSave("app-state-save");
      }
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
    enqueueSharedDatabaseSave,
    requestClientSnapshotSave,
    saveAppLocalState,
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
