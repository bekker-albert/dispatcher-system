"use client";

import { useAppAdminDatabaseProps } from "@/features/app/useAppAdminDatabaseProps";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";
import { databaseConfigured } from "@/lib/data/config";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;

type UseAppAdminDatabaseScreenPropsArgs = {
  appState: AppStateBundle;
};

export function useAppAdminDatabaseScreenProps({
  appState,
}: UseAppAdminDatabaseScreenPropsArgs): ReturnType<typeof useAppAdminDatabaseProps> {
  const {
    ptoPlanRows,
    ptoSurveyRows,
    ptoOperRows,
    ptoBucketValues,
    ptoBucketManualRows,
    vehicleRows,
    clientSnapshots,
    databasePanelMessage,
    databasePanelLoading,
    refreshClientSnapshots,
    createClientSnapshotNow,
    restoreClientSnapshot,
  } = appState;

  return useAppAdminDatabaseProps({
    databaseConfigured,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoBucketManualRows,
    ptoBucketValues,
    vehicleRows,
    clientSnapshots,
    databasePanelMessage,
    databasePanelLoading,
    createClientSnapshotNow,
    refreshClientSnapshots,
    restoreClientSnapshot,
  });
}
