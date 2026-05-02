"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  appUndoSnapshotReferenceSignature,
  appUndoSnapshotReferencesEqual,
  cloneAppUndoSnapshot,
  type AppUndoSnapshot,
  type AppUndoSnapshotReferenceSignature,
  type AppUndoSnapshotScope,
} from "./appUndoSnapshots";

type UseAppUndoSchedulerOptions = {
  adminDataLoaded: boolean;
  disabled: boolean;
  createUndoSnapshot: (scope?: AppUndoSnapshotScope) => AppUndoSnapshot;
};

export function useAppUndoScheduler({
  adminDataLoaded,
  disabled,
  createUndoSnapshot,
}: UseAppUndoSchedulerOptions) {
  const undoHistoryRef = useRef<AppUndoSnapshot[]>([]);
  const undoCurrentSnapshotRef = useRef<AppUndoSnapshot | null>(null);
  const undoCurrentSignatureRef = useRef<AppUndoSnapshotReferenceSignature | null>(null);
  const undoSnapshotTimerRef = useRef<number | null>(null);
  const undoRestoringRef = useRef(false);

  const clearPendingUndoSnapshot = useCallback(() => {
    if (undoSnapshotTimerRef.current !== null) {
      window.clearTimeout(undoSnapshotTimerRef.current);
      undoSnapshotTimerRef.current = null;
    }
  }, []);

  const scheduleAppUndoSnapshot = useCallback((scope: AppUndoSnapshotScope = "all") => {
    clearPendingUndoSnapshot();

    if (!adminDataLoaded || disabled) return;

    undoSnapshotTimerRef.current = window.setTimeout(() => {
      const nextSnapshot = createUndoSnapshot(scope);
      const nextSignature = appUndoSnapshotReferenceSignature(nextSnapshot);

      if (!undoCurrentSnapshotRef.current) {
        undoCurrentSnapshotRef.current = nextSnapshot;
        undoCurrentSignatureRef.current = nextSignature;
        undoSnapshotTimerRef.current = null;
        return;
      }

      if (undoRestoringRef.current) {
        undoRestoringRef.current = false;
        undoCurrentSnapshotRef.current = nextSnapshot;
        undoCurrentSignatureRef.current = nextSignature;
        undoSnapshotTimerRef.current = null;
        return;
      }

      if (appUndoSnapshotReferencesEqual(undoCurrentSignatureRef.current, nextSignature)) {
        undoSnapshotTimerRef.current = null;
        return;
      }

      undoHistoryRef.current = [
        ...undoHistoryRef.current,
        cloneAppUndoSnapshot(undoCurrentSnapshotRef.current),
      ].slice(-10);
      undoCurrentSnapshotRef.current = nextSnapshot;
      undoCurrentSignatureRef.current = nextSignature;

      undoSnapshotTimerRef.current = null;
    }, 700);
  }, [adminDataLoaded, clearPendingUndoSnapshot, createUndoSnapshot, disabled]);

  const resetUndoHistoryForExternalRestore = useCallback(() => {
    undoHistoryRef.current = [];
    undoRestoringRef.current = true;
  }, []);

  const popPreviousAppUndoSnapshot = useCallback(() => {
    const previousSnapshot = undoHistoryRef.current.pop();
    if (!previousSnapshot) return null;

    undoRestoringRef.current = true;
    undoCurrentSnapshotRef.current = previousSnapshot;
    return previousSnapshot;
  }, []);

  const hasAppUndoSnapshot = useCallback(() => undoHistoryRef.current.length > 0, []);

  useEffect(() => {
    if (adminDataLoaded) return;

    clearPendingUndoSnapshot();
    undoHistoryRef.current = [];
    undoCurrentSnapshotRef.current = null;
    undoCurrentSignatureRef.current = null;
    undoRestoringRef.current = false;
  }, [adminDataLoaded, clearPendingUndoSnapshot]);

  return {
    clearPendingUndoSnapshot,
    hasAppUndoSnapshot,
    popPreviousAppUndoSnapshot,
    resetUndoHistoryForExternalRestore,
    scheduleAppUndoSnapshot,
  };
}
