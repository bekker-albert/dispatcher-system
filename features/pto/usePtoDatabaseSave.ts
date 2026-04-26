"use client";

import { useCallback, useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import { databaseConfigured } from "@/lib/data/config";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";
import {
  ptoDatabaseMessages,
  ptoDatabaseSaveShouldSkip,
  ptoDatabaseStateChanged,
  savePtoDatabaseSnapshot,
  serializePtoDatabaseState,
  type PtoDatabaseSaveMode,
  type PtoDatabaseState,
} from "@/features/pto/ptoPersistenceModel";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type PtoDatabaseSaveOptions = {
  adminDataLoaded: boolean;
  ptoSaveRevision: number;
  ptoDatabaseStateRef: RefObject<PtoDatabaseState>;
  ptoDatabaseLoadedRef: RefObject<boolean>;
  setPtoDatabaseMessage: Dispatch<SetStateAction<string>>;
  setPtoSaveRevision: Dispatch<SetStateAction<number>>;
  showSaveStatus: ShowSaveStatus;
};

export function usePtoDatabaseSave({
  adminDataLoaded,
  ptoSaveRevision,
  ptoDatabaseStateRef,
  ptoDatabaseLoadedRef,
  setPtoDatabaseMessage,
  setPtoSaveRevision,
  showSaveStatus,
}: PtoDatabaseSaveOptions) {
  const ptoDatabaseSavingRef = useRef(false);
  const ptoDatabaseSaveQueuedRef = useRef(false);
  const ptoDatabaseSaveSnapshotRef = useRef("");

  const savePtoDatabaseChanges = useCallback(async (mode: PtoDatabaseSaveMode = "manual") => {
    if (!databaseConfigured) {
      setPtoDatabaseMessage(ptoDatabaseMessages.notConfigured);
      showSaveStatus("error", ptoDatabaseMessages.notConfigured);
      return;
    }

    if (!ptoDatabaseLoadedRef.current) {
      setPtoDatabaseMessage(ptoDatabaseMessages.loadingSaveDeferred);
      showSaveStatus("saving", ptoDatabaseMessages.loadingSaveDeferredStatus);
      return;
    }

    const snapshotToSave = serializePtoDatabaseState(ptoDatabaseStateRef.current);
    if (ptoDatabaseSaveShouldSkip(mode, snapshotToSave, ptoDatabaseSaveSnapshotRef.current)) {
      setPtoDatabaseMessage(ptoDatabaseMessages.alreadySaved);
      return;
    }

    if (ptoDatabaseSavingRef.current) {
      ptoDatabaseSaveQueuedRef.current = true;
      return;
    }

    ptoDatabaseSavingRef.current = true;
    setPtoDatabaseMessage(ptoDatabaseMessages.savingState(mode));
    showSaveStatus("saving", ptoDatabaseMessages.saving);

    try {
      await savePtoDatabaseSnapshot(ptoDatabaseStateRef.current);
      ptoDatabaseSaveSnapshotRef.current = snapshotToSave;
      setPtoDatabaseMessage(ptoDatabaseMessages.savedState(mode));
      showSaveStatus("saved", ptoDatabaseMessages.savedStatus);
    } catch (error) {
      const message = errorToMessage(error);
      setPtoDatabaseMessage(ptoDatabaseMessages.saveError(message));
      showSaveStatus("error", ptoDatabaseMessages.saveErrorStatus(message));
    } finally {
      ptoDatabaseSavingRef.current = false;
      if (ptoDatabaseSaveQueuedRef.current) {
        ptoDatabaseSaveQueuedRef.current = false;
        if (ptoDatabaseStateChanged(ptoDatabaseStateRef.current, ptoDatabaseSaveSnapshotRef.current)) {
          setPtoSaveRevision((current) => current + 1);
        }
      }
    }
  }, [ptoDatabaseLoadedRef, ptoDatabaseStateRef, setPtoDatabaseMessage, setPtoSaveRevision, showSaveStatus]);

  const requestPtoDatabaseSave = useCallback(() => {
    if (!databaseConfigured || !ptoDatabaseLoadedRef.current) return;
    setPtoDatabaseMessage(ptoDatabaseMessages.queued);
    setPtoSaveRevision((current) => current + 1);
  }, [ptoDatabaseLoadedRef, setPtoDatabaseMessage, setPtoSaveRevision]);

  useEffect(() => {
    if (!adminDataLoaded || !databaseConfigured || !ptoDatabaseLoadedRef.current || ptoSaveRevision === 0) return;
    void savePtoDatabaseChanges("auto");
  }, [adminDataLoaded, ptoDatabaseLoadedRef, ptoSaveRevision, savePtoDatabaseChanges]);

  return {
    ptoDatabaseSaveSnapshotRef,
    savePtoDatabaseChanges,
    requestPtoDatabaseSave,
  };
}
