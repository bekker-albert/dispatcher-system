"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

const saveStatusSavedHideMs = 2600;
const saveStatusAttentionHideMs = 30000;

const idleSaveStatus: SaveStatusState = { kind: "idle", message: "" };

export function useSaveStatus() {
  const [saveStatus, setSaveStatus] = useState<SaveStatusState>(idleSaveStatus);
  const saveStatusTimerRef = useRef<number | null>(null);

  const clearSaveStatusTimer = useCallback(() => {
    if (saveStatusTimerRef.current === null) return;

    window.clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = null;
  }, []);

  const hideSaveStatus = useCallback(() => {
    clearSaveStatusTimer();
    setSaveStatus(idleSaveStatus);
  }, [clearSaveStatusTimer]);

  const showSaveStatus = useCallback((kind: SaveStatusState["kind"], message: string) => {
    clearSaveStatusTimer();
    setSaveStatus({ kind, message });

    if (kind === "saved" || kind === "error") {
      saveStatusTimerRef.current = window.setTimeout(() => {
        setSaveStatus(idleSaveStatus);
        saveStatusTimerRef.current = null;
      }, kind === "saved" ? saveStatusSavedHideMs : saveStatusAttentionHideMs);
    }
  }, [clearSaveStatusTimer]);

  useEffect(() => clearSaveStatusTimer, [clearSaveStatusTimer]);

  return {
    saveStatus,
    showSaveStatus,
    hideSaveStatus,
  };
}
