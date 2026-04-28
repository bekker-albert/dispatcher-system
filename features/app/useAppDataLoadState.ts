"use client";

import { useRef, useState } from "react";

export function useAppDataLoadState() {
  const appDatabaseSaveSnapshotRef = useRef("");
  const appSettingsDatabaseLoadedRef = useRef(false);
  const appSettingsDatabaseSaveSnapshotRef = useRef("");
  const [ptoDatabaseLoadStarted, setPtoDatabaseLoadStarted] = useState(false);
  const [ptoBootstrapLoaded, setPtoBootstrapLoaded] = useState(false);
  const [adminDataLoaded, setAdminDataLoaded] = useState(false);

  return {
    appDatabaseSaveSnapshotRef,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    ptoDatabaseLoadStarted,
    setPtoDatabaseLoadStarted,
    ptoBootstrapLoaded,
    setPtoBootstrapLoaded,
    adminDataLoaded,
    setAdminDataLoaded,
  };
}
