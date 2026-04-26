"use client";

import { useRef, useState } from "react";

export function useAppDataLoadState() {
  const appDatabaseSaveSnapshotRef = useRef("");
  const appSettingsDatabaseLoadedRef = useRef(false);
  const appSettingsDatabaseSaveSnapshotRef = useRef("");
  const [adminDataLoaded, setAdminDataLoaded] = useState(false);

  return {
    appDatabaseSaveSnapshotRef,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    adminDataLoaded,
    setAdminDataLoaded,
  };
}
