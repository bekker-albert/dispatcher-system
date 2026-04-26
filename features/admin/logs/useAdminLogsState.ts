"use client";

import { useCallback, useMemo, useState } from "react";
import { adminLogLimit, normalizeAdminLogEntry, type AdminLogEntry } from "@/lib/domain/admin/logs";
import { defaultUserCard } from "@/lib/domain/reference/defaults";
import { adminStorageKeys } from "@/lib/storage/keys";
import { createId } from "@/lib/utils/id";

type AdminLogDraft = Omit<AdminLogEntry, "id" | "at" | "user">;

const changeLogActions = new Set([
  "\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435",
  "\u0414\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0438\u0435",
  "\u0423\u0434\u0430\u043b\u0435\u043d\u0438\u0435",
]);

function writeAdminLogsToBrowser(logs: AdminLogEntry[]) {
  window.localStorage.setItem(adminStorageKeys.adminLogs, JSON.stringify(logs));
  window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
}

export function useAdminLogsState() {
  const [adminLogs, setAdminLogs] = useState<AdminLogEntry[]>([]);

  const addAdminLog = useCallback((entry: AdminLogDraft) => {
    const nextEntry: AdminLogEntry = {
      id: createId(),
      at: new Date().toISOString(),
      user: defaultUserCard.fullName || "\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c",
      ...entry,
    };

    setAdminLogs((current) => {
      const previousEntry = current[0];
      const previousDate = previousEntry ? new Date(previousEntry.at).getTime() : 0;
      const shouldMerge = previousEntry
        && previousEntry.action === nextEntry.action
        && previousEntry.section === nextEntry.section
        && previousEntry.details === nextEntry.details
        && Date.now() - previousDate < 10000;
      const nextLogs = shouldMerge
        ? [{ ...previousEntry, ...nextEntry }, ...current.slice(1)]
        : [nextEntry, ...current].slice(0, adminLogLimit);

      writeAdminLogsToBrowser(nextLogs);
      return nextLogs;
    });
  }, []);

  const restoreAdminLogs = useCallback((value: unknown) => {
    if (!Array.isArray(value)) return;

    setAdminLogs(value.flatMap((entry) => {
      const normalizedEntry = normalizeAdminLogEntry(entry);
      return normalizedEntry ? [normalizedEntry] : [];
    }).slice(0, adminLogLimit));
  }, []);

  const clearAdminLogs = useCallback(() => {
    if (!window.confirm("\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0436\u0443\u0440\u043d\u0430\u043b \u043b\u043e\u0433\u043e\u0432?")) return;

    setAdminLogs([]);
    window.localStorage.setItem(adminStorageKeys.adminLogs, JSON.stringify([]));
  }, []);

  const lastChangeLog = useMemo(
    () => adminLogs.find((log) => changeLogActions.has(log.action)),
    [adminLogs],
  );

  const lastUploadLog = useMemo(
    () => adminLogs.find((log) => log.action === "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430"),
    [adminLogs],
  );

  return {
    adminLogs,
    addAdminLog,
    restoreAdminLogs,
    clearAdminLogs,
    lastChangeLog,
    lastUploadLog,
  };
}
