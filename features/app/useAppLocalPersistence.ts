"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { sharedAppSettingKeys } from "@/lib/domain/app/settings";
import { databaseConfigured } from "@/lib/data/config";
import { adminStorageKeys } from "@/lib/storage/keys";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type AppLocalPersistenceOptions = {
  adminDataLoaded: boolean;
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
    window.localStorage.setItem(adminStorageKeys.reportCustomers, JSON.stringify(reportCustomers));
    window.localStorage.setItem(adminStorageKeys.reportAreaOrder, JSON.stringify(reportAreaOrder));
    window.localStorage.setItem(adminStorageKeys.reportWorkOrder, JSON.stringify(reportWorkOrder));
    window.localStorage.setItem(adminStorageKeys.reportHeaderLabels, JSON.stringify(reportHeaderLabels));
    window.localStorage.setItem(adminStorageKeys.reportColumnWidths, JSON.stringify(reportColumnWidths));
    window.localStorage.setItem(adminStorageKeys.reportReasons, JSON.stringify(reportReasons));
    window.localStorage.setItem(adminStorageKeys.areaShiftCutoffs, JSON.stringify(areaShiftCutoffs));
    window.localStorage.setItem(adminStorageKeys.customTabs, JSON.stringify(customTabs));
    window.localStorage.setItem(adminStorageKeys.topTabs, JSON.stringify(topTabs));
    window.localStorage.setItem(adminStorageKeys.subTabs, JSON.stringify(subTabs));
    window.localStorage.setItem(adminStorageKeys.dispatchSummaryRows, JSON.stringify(dispatchSummaryRows));
    window.localStorage.setItem(adminStorageKeys.orgMembers, JSON.stringify(orgMembers));
    window.localStorage.setItem(adminStorageKeys.dependencyNodes, JSON.stringify(dependencyNodes));
    window.localStorage.setItem(adminStorageKeys.dependencyLinks, JSON.stringify(dependencyLinks));
    window.localStorage.setItem(adminStorageKeys.adminLogs, JSON.stringify(adminLogs));
    window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
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

  const collectSharedAppSettings = useCallback(() => (
    Object.fromEntries(
      sharedAppSettingKeys.flatMap((key) => {
        const value = window.localStorage.getItem(key);
        if (value === null) return [];

        try {
          return [[key, JSON.parse(value)] as const];
        } catch {
          return [];
        }
      }),
    )
  ), []);

  const saveSharedAppSettingsToDatabase = useCallback(async () => {
    if (!databaseConfigured || !appSettingsDatabaseLoadedRef.current) return;

    const settings = collectSharedAppSettings();
    const snapshot = JSON.stringify(settings);
    if (snapshot === appSettingsDatabaseSaveSnapshotRef.current) return;

    showSaveStatus("saving", "\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u044e \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438...");

    try {
      const { saveAppSettingsToDatabase } = await import("@/lib/data/settings");
      await saveAppSettingsToDatabase(settings);
      appSettingsDatabaseSaveSnapshotRef.current = snapshot;
      showSaveStatus("saved", "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b.");
    } catch (error) {
      showSaveStatus("error", `\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u043d\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b: ${errorToMessage(error)}`);
      throw error;
    }
  }, [appSettingsDatabaseLoadedRef, appSettingsDatabaseSaveSnapshotRef, collectSharedAppSettings, showSaveStatus]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (appStateSaveTimerRef.current !== null) {
      window.clearTimeout(appStateSaveTimerRef.current);
    }

    appStateSaveTimerRef.current = window.setTimeout(() => {
      saveAppLocalState();
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
  }, [adminDataLoaded, requestClientSnapshotSave, saveAppLocalState, saveSharedAppSettingsToDatabase]);

  // The shared main app_state remains load-only. Per-browser snapshots are
  // written separately so one stale browser cannot overwrite another one.
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
