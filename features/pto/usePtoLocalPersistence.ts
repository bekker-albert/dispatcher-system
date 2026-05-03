"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import {
  savePtoStateToBrowserStorage,
  type PtoBrowserStorageSnapshotCache,
  type PtoDatabaseState,
} from "@/features/pto/ptoPersistenceModel";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type PtoLocalPersistenceOptions = {
  adminDataLoaded: boolean;
  skipUntilDatabaseLoaded: boolean;
  ptoDatabaseStateRef: RefObject<PtoDatabaseState>;
  ptoDatabaseLoadedRef: RefObject<boolean>;
  ptoDatabaseLoadedBucketsYearRef: RefObject<string | null>;
  hasStoredPtoStateRef: RefObject<boolean>;
  getPtoDatabaseExpectedUpdatedAt: () => string | null;
  isPtoDatabaseDirty: () => boolean;
  requestClientSnapshotSave: (reason?: string) => void;
  showSaveStatus: ShowSaveStatus;
  ptoManualYears: string[];
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  ptoColumnWidths: Record<string, number>;
  ptoRowHeights: Record<string, number>;
  ptoHeaderLabels: Record<string, string>;
  ptoBucketValues: Record<string, number>;
  ptoBucketManualRows: PtoBucketRow[];
  ptoTab: string;
  ptoPlanYear: string;
  ptoAreaFilter: string;
  expandedPtoMonths: Record<string, boolean>;
};

export function usePtoLocalPersistence({
  adminDataLoaded,
  skipUntilDatabaseLoaded,
  ptoDatabaseStateRef,
  ptoDatabaseLoadedRef,
  ptoDatabaseLoadedBucketsYearRef,
  hasStoredPtoStateRef,
  getPtoDatabaseExpectedUpdatedAt,
  isPtoDatabaseDirty,
  requestClientSnapshotSave,
  showSaveStatus,
  ptoManualYears,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  ptoColumnWidths,
  ptoRowHeights,
  ptoHeaderLabels,
  ptoBucketValues,
  ptoBucketManualRows,
  ptoTab,
  ptoPlanYear,
  ptoAreaFilter,
  expandedPtoMonths,
}: PtoLocalPersistenceOptions) {
  const ptoLocalSaveTimerRef = useRef<number | null>(null);
  const ptoLocalSaveSnapshotRef = useRef<PtoBrowserStorageSnapshotCache | null>(null);

  const savePtoLocalState = useCallback(() => {
    if (skipUntilDatabaseLoaded && !ptoDatabaseLoadedRef.current) return;

    const state = ptoDatabaseStateRef.current;
    const markLocalUpdatedAt = ptoDatabaseLoadedRef.current;
    const localUpdatedAt = markLocalUpdatedAt && !isPtoDatabaseDirty()
      ? getPtoDatabaseExpectedUpdatedAt()
      : undefined;
    const includeBuckets = !skipUntilDatabaseLoaded
      || ptoTab === "buckets"
      || ptoDatabaseLoadedBucketsYearRef.current === ptoPlanYear;
    const result = savePtoStateToBrowserStorage(
      state,
      {
        includeBuckets,
        markLocalUpdatedAt,
        localUpdatedAt,
      },
      ptoLocalSaveSnapshotRef.current,
    );
    ptoLocalSaveSnapshotRef.current = result.cache;
    if (result.failedLocalKeys.length > 0) {
      showSaveStatus("error", "Локальная копия ПТО не сохранена полностью. Проверь свободное место браузера.");
    }
    if (!result.changed) return;

    if (markLocalUpdatedAt) {
      hasStoredPtoStateRef.current = true;
    }
    requestClientSnapshotSave("pto-local-save");
  }, [
    getPtoDatabaseExpectedUpdatedAt,
    hasStoredPtoStateRef,
    isPtoDatabaseDirty,
    ptoDatabaseLoadedRef,
    ptoDatabaseLoadedBucketsYearRef,
    ptoDatabaseStateRef,
    ptoPlanYear,
    ptoTab,
    requestClientSnapshotSave,
    showSaveStatus,
    skipUntilDatabaseLoaded,
  ]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    if (ptoLocalSaveTimerRef.current !== null) {
      window.clearTimeout(ptoLocalSaveTimerRef.current);
    }

    ptoLocalSaveTimerRef.current = window.setTimeout(() => {
      savePtoLocalState();
      ptoLocalSaveTimerRef.current = null;
    }, 600);

    return () => {
      if (ptoLocalSaveTimerRef.current !== null) {
        window.clearTimeout(ptoLocalSaveTimerRef.current);
        ptoLocalSaveTimerRef.current = null;
      }
    };
  }, [
    adminDataLoaded,
    ptoBucketManualRows,
    ptoBucketValues,
    ptoColumnWidths,
    ptoAreaFilter,
    ptoHeaderLabels,
    ptoManualYears,
    ptoOperRows,
    ptoPlanRows,
    ptoPlanYear,
    ptoRowHeights,
    ptoSurveyRows,
    ptoTab,
    expandedPtoMonths,
    savePtoLocalState,
  ]);

  useEffect(() => {
    if (!adminDataLoaded) return undefined;

    const flushPtoRows = () => {
      if (ptoLocalSaveTimerRef.current !== null) {
        window.clearTimeout(ptoLocalSaveTimerRef.current);
        ptoLocalSaveTimerRef.current = null;
      }
      savePtoLocalState();
    };

    window.addEventListener("pagehide", flushPtoRows);
    return () => window.removeEventListener("pagehide", flushPtoRows);
  }, [adminDataLoaded, savePtoLocalState]);

  return {
    savePtoLocalState,
  };
}
