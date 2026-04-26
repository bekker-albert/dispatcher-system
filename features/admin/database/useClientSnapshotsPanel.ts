"use client";

import { useCallback, useRef, useState } from "react";
import { clientSnapshotAutoMinIntervalMs, clientSnapshotSaveDelayMs } from "@/lib/domain/app/settings";
import type { DataClientSnapshot } from "@/lib/data/app-state";
import { databaseConfigured } from "@/lib/data/config";
import { clientSnapshotRestoreFlagKey, collectLocalStorageBackup, getOrCreateClientId } from "@/lib/storage/client-snapshots";
import { adminStorageKeys } from "@/lib/storage/keys";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type ClientSnapshotsPanelOptions = {
  showSaveStatus: ShowSaveStatus;
};

export function useClientSnapshotsPanel({ showSaveStatus }: ClientSnapshotsPanelOptions) {
  const [clientSnapshots, setClientSnapshots] = useState<DataClientSnapshot[]>([]);
  const [databasePanelMessage, setDatabasePanelMessage] = useState("");
  const [databasePanelLoading, setDatabasePanelLoading] = useState(false);
  const clientSnapshotSaveTimerRef = useRef<number | null>(null);
  const clientSnapshotSaveSnapshotRef = useRef("");
  const clientSnapshotSaveDisabledRef = useRef(false);
  const clientSnapshotLastAutoQueuedAtRef = useRef(0);

  const saveClientSnapshotToDatabase = useCallback(async (reason: string) => {
    if (!databaseConfigured || clientSnapshotSaveDisabledRef.current) return;

    const clientId = getOrCreateClientId();
    const storage = collectLocalStorageBackup();
    if (Object.keys(storage).length === 0) return;

    const snapshot = JSON.stringify({ clientId, storage });
    if (snapshot === clientSnapshotSaveSnapshotRef.current) return;

    const { saveClientAppSnapshotToDatabase } = await import("@/lib/data/app-state");
    await saveClientAppSnapshotToDatabase(clientId, storage, {
      reason,
      userAgent: window.navigator.userAgent,
      url: window.location.href,
    });
    clientSnapshotSaveSnapshotRef.current = snapshot;
  }, []);

  const requestClientSnapshotSave = useCallback((reason = "auto") => {
    if (!databaseConfigured || clientSnapshotSaveDisabledRef.current) return;

    const manualSnapshot = reason.startsWith("manual");
    const now = Date.now();
    if (!manualSnapshot && now - clientSnapshotLastAutoQueuedAtRef.current < clientSnapshotAutoMinIntervalMs) return;
    if (!manualSnapshot) clientSnapshotLastAutoQueuedAtRef.current = now;

    if (clientSnapshotSaveTimerRef.current !== null) {
      window.clearTimeout(clientSnapshotSaveTimerRef.current);
    }

    clientSnapshotSaveTimerRef.current = window.setTimeout(() => {
      void saveClientSnapshotToDatabase(reason).catch((error) => {
        console.warn("Database client snapshot save failed:", error);
        const message = errorToMessage(error);
        if (message.includes("public.app_state") || message.includes("PGRST205")) {
          clientSnapshotSaveDisabledRef.current = true;
          showSaveStatus("error", "\u0420\u0435\u0437\u0435\u0440\u0432\u043d\u0430\u044f \u043a\u043e\u043f\u0438\u044f \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430 \u043e\u0442\u043a\u043b\u044e\u0447\u0435\u043d\u0430: \u0442\u0430\u0431\u043b\u0438\u0446\u0430 \u0441\u043d\u0438\u043c\u043a\u043e\u0432 \u043d\u0435 \u0441\u043e\u0437\u0434\u0430\u043d\u0430. \u041e\u0441\u043d\u043e\u0432\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u044e\u0442\u0441\u044f \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u043e.");
          return;
        }
        showSaveStatus("error", `\u0420\u0435\u0437\u0435\u0440\u0432\u043d\u0430\u044f \u043a\u043e\u043f\u0438\u044f \u043d\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430: ${message}`);
      });
      clientSnapshotSaveTimerRef.current = null;
    }, clientSnapshotSaveDelayMs);
  }, [saveClientSnapshotToDatabase, showSaveStatus]);

  const refreshClientSnapshots = useCallback(async () => {
    if (!databaseConfigured) {
      setDatabasePanelMessage("\u0411\u0430\u0437\u0430 \u0434\u0430\u043d\u043d\u044b\u0445 \u043d\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u0430.");
      return;
    }

    setDatabasePanelLoading(true);
    try {
      const { loadClientAppSnapshotsFromDatabase } = await import("@/lib/data/app-state");
      const snapshots = await loadClientAppSnapshotsFromDatabase();
      setClientSnapshots(snapshots);
      setDatabasePanelMessage(`\u0421\u043d\u0438\u043c\u043a\u043e\u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u043e\u0432: ${snapshots.length}.`);
    } catch (error) {
      setDatabasePanelMessage(`\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0440\u043e\u0447\u0438\u0442\u0430\u0442\u044c \u0441\u043d\u0438\u043c\u043a\u0438: ${errorToMessage(error)}`);
    } finally {
      setDatabasePanelLoading(false);
    }
  }, []);

  const createClientSnapshotNow = useCallback(() => {
    void saveClientSnapshotToDatabase("manual-admin-database-panel")
      .then(refreshClientSnapshots)
      .catch((error) => {
        setDatabasePanelMessage(`\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u0441\u043d\u0438\u043c\u043e\u043a: ${errorToMessage(error)}`);
      });
  }, [refreshClientSnapshots, saveClientSnapshotToDatabase]);

  const restoreClientSnapshot = useCallback((snapshot: DataClientSnapshot) => {
    Object.entries(snapshot.storage).forEach(([key, value]) => {
      window.localStorage.setItem(key, value);
    });
    window.localStorage.setItem(adminStorageKeys.ptoLocalUpdatedAt, new Date().toISOString());
    window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
    window.sessionStorage.setItem(clientSnapshotRestoreFlagKey, "1");
    window.location.reload();
  }, []);

  return {
    clientSnapshots,
    databasePanelMessage,
    databasePanelLoading,
    saveClientSnapshotToDatabase,
    requestClientSnapshotSave,
    refreshClientSnapshots,
    createClientSnapshotNow,
    restoreClientSnapshot,
  };
}
