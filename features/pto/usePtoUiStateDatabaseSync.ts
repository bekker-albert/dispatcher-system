"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";

type UsePtoUiStateDatabaseSyncOptions = {
  adminDataLoaded: boolean;
  ptoDatabaseLoadedRef: RefObject<boolean>;
  ptoDatabaseLoadedYearRef: RefObject<string | null>;
  ptoTab: string;
  ptoPlanYear: string;
  ptoAreaFilter: string;
  expandedPtoMonths: Record<string, boolean>;
  requestPtoDatabaseSave: () => void;
};

export function usePtoUiStateDatabaseSync({
  adminDataLoaded,
  ptoDatabaseLoadedRef,
  ptoDatabaseLoadedYearRef,
  ptoTab,
  ptoPlanYear,
  ptoAreaFilter,
  expandedPtoMonths,
  requestPtoDatabaseSave,
}: UsePtoUiStateDatabaseSyncOptions) {
  const uiStateSignature = useMemo(() => JSON.stringify({
    ptoTab,
    ptoPlanYear,
    ptoAreaFilter,
    expandedPtoMonths,
  }), [expandedPtoMonths, ptoAreaFilter, ptoPlanYear, ptoTab]);
  const previousUiStateSignatureRef = useRef(uiStateSignature);
  const databaseLoadedForUiStateRef = useRef(false);

  useEffect(() => {
    const currentYearLoaded = ptoDatabaseLoadedYearRef.current === ptoPlanYear;
    if (!adminDataLoaded || !ptoDatabaseLoadedRef.current || !currentYearLoaded) {
      previousUiStateSignatureRef.current = uiStateSignature;
      databaseLoadedForUiStateRef.current = false;
      return;
    }

    if (!databaseLoadedForUiStateRef.current) {
      databaseLoadedForUiStateRef.current = true;
      previousUiStateSignatureRef.current = uiStateSignature;
      return;
    }

    if (previousUiStateSignatureRef.current === uiStateSignature) return;

    previousUiStateSignatureRef.current = uiStateSignature;
    requestPtoDatabaseSave();
  }, [adminDataLoaded, ptoDatabaseLoadedRef, ptoDatabaseLoadedYearRef, ptoPlanYear, requestPtoDatabaseSave, uiStateSignature]);
}
