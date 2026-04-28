"use client";

import { useCallback, useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import { databaseConfigured } from "@/lib/data/config";
import { isDatabaseConflictError } from "@/lib/data/errors";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";
import { enqueuePtoDatabaseWrite } from "@/features/pto/ptoSaveQueue";
import {
  createPtoDatabaseSaveBaseline,
  patchPtoDatabaseSaveBaseline,
  ptoDatabaseMessages,
  ptoDatabaseSaveShouldSkip,
  ptoDatabaseStateChanged,
  readPtoDatabaseSaveBaseline,
  savePtoDatabaseSnapshot,
  serializePtoDatabaseState,
  type PtoDatabaseInlineSavePatch,
  type PtoDatabaseSaveMode,
  type PtoDatabaseState,
} from "@/features/pto/ptoPersistenceModel";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type PtoDatabaseSaveOptions = {
  adminDataLoaded: boolean;
  ptoSaveRevision: number;
  ptoDatabaseStateRef: RefObject<PtoDatabaseState>;
  ptoDatabaseLoadedRef: RefObject<boolean>;
  ptoDatabaseLoadedYearRef: RefObject<string | null>;
  ptoDatabaseFullSaveNextRef: RefObject<boolean>;
  setPtoDatabaseMessage: Dispatch<SetStateAction<string>>;
  setPtoSaveRevision: Dispatch<SetStateAction<number>>;
  showSaveStatus: ShowSaveStatus;
};

export function usePtoDatabaseSave({
  adminDataLoaded,
  ptoSaveRevision,
  ptoDatabaseStateRef,
  ptoDatabaseLoadedRef,
  ptoDatabaseLoadedYearRef,
  ptoDatabaseFullSaveNextRef,
  setPtoDatabaseMessage,
  setPtoSaveRevision,
  showSaveStatus,
}: PtoDatabaseSaveOptions) {
  const ptoDatabaseSavingRef = useRef(false);
  const ptoDatabaseSaveQueuedRef = useRef(false);
  const ptoDatabaseSaveSnapshotRef = useRef("");
  const ptoDatabaseSaveRequestTimerRef = useRef<number | null>(null);
  const ptoDatabaseActiveSaveRef = useRef<Promise<void> | null>(null);

  const markPtoDatabaseInlineWriteSaved = useCallback((updatedAt?: string | null, patch?: PtoDatabaseInlineSavePatch) => {
    if (!updatedAt) return;

    const baseline = readPtoDatabaseSaveBaseline(ptoDatabaseSaveSnapshotRef.current);
    ptoDatabaseSaveSnapshotRef.current = patch
      ? patchPtoDatabaseSaveBaseline(ptoDatabaseSaveSnapshotRef.current, updatedAt, patch)
      : createPtoDatabaseSaveBaseline(baseline.snapshot, updatedAt);
  }, []);

  const getPtoDatabaseExpectedUpdatedAt = useCallback(() => (
    readPtoDatabaseSaveBaseline(ptoDatabaseSaveSnapshotRef.current).expectedUpdatedAt
  ), []);

  const savePtoDatabaseChanges = useCallback(async (mode: PtoDatabaseSaveMode = "manual") => {
    if (ptoDatabaseSaveRequestTimerRef.current !== null) {
      window.clearTimeout(ptoDatabaseSaveRequestTimerRef.current);
      ptoDatabaseSaveRequestTimerRef.current = null;
    }

    if (!databaseConfigured) {
      setPtoDatabaseMessage(ptoDatabaseMessages.notConfigured);
      showSaveStatus("error", ptoDatabaseMessages.notConfigured);
      return false;
    }

    const currentYear = ptoDatabaseStateRef.current.uiState.ptoPlanYear;
    const currentYearLoaded = ptoDatabaseLoadedYearRef.current === currentYear;
    if (!ptoDatabaseLoadedRef.current || !currentYearLoaded) {
      setPtoDatabaseMessage(ptoDatabaseMessages.loadingSaveDeferred);
      showSaveStatus("saving", ptoDatabaseMessages.loadingSaveDeferredStatus);
      return false;
    }

    const snapshotToSave = serializePtoDatabaseState(ptoDatabaseStateRef.current);
    if (ptoDatabaseSaveShouldSkip(mode, snapshotToSave, ptoDatabaseSaveSnapshotRef.current)) {
      setPtoDatabaseMessage(ptoDatabaseMessages.alreadySaved);
      return true;
    }

    if (ptoDatabaseSavingRef.current) {
      ptoDatabaseSaveQueuedRef.current = true;
      try {
        await ptoDatabaseActiveSaveRef.current;
      } catch {
        return false;
      }
      if (ptoDatabaseStateChanged(ptoDatabaseStateRef.current, ptoDatabaseSaveSnapshotRef.current)) {
        return await savePtoDatabaseChanges(mode);
      }
      return true;
    }

    ptoDatabaseSavingRef.current = true;
    let suppressQueuedRetry = false;
    setPtoDatabaseMessage(ptoDatabaseMessages.savingState(mode));
    showSaveStatus("saving", ptoDatabaseMessages.saving);

    try {
      const savePromise = enqueuePtoDatabaseWrite(async () => {
        const snapshotAtWrite = serializePtoDatabaseState(ptoDatabaseStateRef.current);
        const baseline = readPtoDatabaseSaveBaseline(ptoDatabaseSaveSnapshotRef.current);
        const saveAllYears = ptoDatabaseFullSaveNextRef.current;
        const saved = await savePtoDatabaseSnapshot(ptoDatabaseStateRef.current, baseline.expectedUpdatedAt, {
          yearScope: saveAllYears ? undefined : ptoDatabaseStateRef.current.uiState.ptoPlanYear,
        });
        return createPtoDatabaseSaveBaseline(snapshotAtWrite, saved?.updatedAt ?? null);
      });
      ptoDatabaseActiveSaveRef.current = savePromise.then(() => undefined);
      const savedSnapshot = await savePromise;
      ptoDatabaseSaveSnapshotRef.current = savedSnapshot;
      ptoDatabaseFullSaveNextRef.current = false;
      setPtoDatabaseMessage(ptoDatabaseMessages.savedState(mode));
      showSaveStatus("saved", ptoDatabaseMessages.savedStatus);
      return true;
    } catch (error) {
      const message = errorToMessage(error);
      if (isDatabaseConflictError(error)) {
        suppressQueuedRetry = true;
        ptoDatabaseSaveQueuedRef.current = false;
        setPtoDatabaseMessage(ptoDatabaseMessages.conflict);
        showSaveStatus("error", ptoDatabaseMessages.conflict);
      } else {
        setPtoDatabaseMessage(ptoDatabaseMessages.saveError(message));
        showSaveStatus("error", ptoDatabaseMessages.saveErrorStatus(message));
      }
      return false;
    } finally {
      ptoDatabaseSavingRef.current = false;
      ptoDatabaseActiveSaveRef.current = null;
      if (!suppressQueuedRetry && ptoDatabaseSaveQueuedRef.current) {
        ptoDatabaseSaveQueuedRef.current = false;
        if (ptoDatabaseStateChanged(ptoDatabaseStateRef.current, ptoDatabaseSaveSnapshotRef.current)) {
          setPtoSaveRevision((current) => current + 1);
        }
      }
    }
  }, [
    ptoDatabaseLoadedRef,
    ptoDatabaseLoadedYearRef,
    ptoDatabaseFullSaveNextRef,
    ptoDatabaseStateRef,
    setPtoDatabaseMessage,
    setPtoSaveRevision,
    showSaveStatus,
  ]);

  const flushPtoDatabasePendingSave = useCallback(async () => {
    if (ptoDatabaseSaveRequestTimerRef.current !== null) {
      window.clearTimeout(ptoDatabaseSaveRequestTimerRef.current);
      ptoDatabaseSaveRequestTimerRef.current = null;
    }

    const currentYear = ptoDatabaseStateRef.current.uiState.ptoPlanYear;
    if (
      !databaseConfigured
      || !ptoDatabaseLoadedRef.current
      || ptoDatabaseLoadedYearRef.current !== currentYear
    ) {
      return false;
    }

    if (!ptoDatabaseStateChanged(ptoDatabaseStateRef.current, ptoDatabaseSaveSnapshotRef.current)) {
      return true;
    }

    return await savePtoDatabaseChanges("manual");
  }, [ptoDatabaseLoadedRef, ptoDatabaseLoadedYearRef, ptoDatabaseStateRef, savePtoDatabaseChanges]);

  const requestPtoDatabaseSave = useCallback(() => {
    const currentYear = ptoDatabaseStateRef.current.uiState.ptoPlanYear;
    if (!databaseConfigured || !ptoDatabaseLoadedRef.current || ptoDatabaseLoadedYearRef.current !== currentYear) return;
    setPtoDatabaseMessage(ptoDatabaseMessages.queued);

    if (ptoDatabaseSaveRequestTimerRef.current !== null) {
      window.clearTimeout(ptoDatabaseSaveRequestTimerRef.current);
    }

    ptoDatabaseSaveRequestTimerRef.current = window.setTimeout(() => {
      ptoDatabaseSaveRequestTimerRef.current = null;
      setPtoSaveRevision((current) => current + 1);
    }, 500);
  }, [ptoDatabaseLoadedRef, ptoDatabaseLoadedYearRef, ptoDatabaseStateRef, setPtoDatabaseMessage, setPtoSaveRevision]);

  useEffect(() => {
    const currentYear = ptoDatabaseStateRef.current.uiState.ptoPlanYear;
    if (
      !adminDataLoaded
      || !databaseConfigured
      || !ptoDatabaseLoadedRef.current
      || ptoDatabaseLoadedYearRef.current !== currentYear
      || ptoSaveRevision === 0
    ) return;
    void savePtoDatabaseChanges("auto");
  }, [adminDataLoaded, ptoDatabaseLoadedRef, ptoDatabaseLoadedYearRef, ptoDatabaseStateRef, ptoSaveRevision, savePtoDatabaseChanges]);

  useEffect(() => () => {
    if (ptoDatabaseSaveRequestTimerRef.current !== null) {
      window.clearTimeout(ptoDatabaseSaveRequestTimerRef.current);
      ptoDatabaseSaveRequestTimerRef.current = null;
    }
  }, []);

  return {
    ptoDatabaseSaveSnapshotRef,
    markPtoDatabaseInlineWriteSaved,
    getPtoDatabaseExpectedUpdatedAt,
    savePtoDatabaseChanges,
    flushPtoDatabasePendingSave,
    requestPtoDatabaseSave,
  };
}
