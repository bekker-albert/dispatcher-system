"use client";

import { useAppAdminDatabaseProps } from "@/features/app/useAppAdminDatabaseProps";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { databaseConfigured } from "@/lib/data/config";

type AppAdminDatabaseScreenState = Pick<
  AppStateBundle,
  | "ptoPlanRows"
  | "ptoSurveyRows"
  | "ptoOperRows"
  | "ptoBucketValues"
  | "ptoBucketManualRows"
  | "vehicleRows"
  | "clientSnapshots"
  | "databasePanelMessage"
  | "databasePanelLoading"
  | "refreshClientSnapshots"
  | "createClientSnapshotNow"
  | "restoreClientSnapshot"
>;

type UseAppAdminDatabaseScreenPropsArgs = {
  active: boolean;
  appState: AppAdminDatabaseScreenState;
};

export function useAppAdminDatabaseScreenProps({
  active,
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
    active,
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
