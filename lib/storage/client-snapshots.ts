import type { DataClientSnapshot } from "@/lib/data/app-state";
import { createId } from "@/lib/utils/id";
import { adminStorageKeys } from "./keys";

export const clientIdStorageKey = "dispatcher:client-id";
export const ptoLocalRecoveryBackupKey = "dispatcher:pto-local-recovery-backup";
export const clientSnapshotRestoreFlagKey = "dispatcher:restore-client-snapshot";

const ptoLocalStateKeys = [
  adminStorageKeys.ptoYears,
  adminStorageKeys.ptoPlanRows,
  adminStorageKeys.ptoSurveyRows,
  adminStorageKeys.ptoOperRows,
  adminStorageKeys.ptoColumnWidths,
  adminStorageKeys.ptoRowHeights,
  adminStorageKeys.ptoHeaderLabels,
  adminStorageKeys.ptoBucketValues,
  adminStorageKeys.ptoBucketRows,
  adminStorageKeys.ptoLocalUpdatedAt,
] as const;

export function savePtoLocalRecoveryBackup(reason: string, databaseUpdatedAt?: string | null) {
  const entries = Object.fromEntries(
    ptoLocalStateKeys.flatMap((key) => {
      const value = window.localStorage.getItem(key);
      return value === null ? [] : [[key, value] as const];
    }),
  );

  if (Object.keys(entries).length === 0) return;

  window.localStorage.setItem(ptoLocalRecoveryBackupKey, JSON.stringify({
    savedAt: new Date().toISOString(),
    reason,
    databaseUpdatedAt: databaseUpdatedAt ?? null,
    entries,
  }));
}

export function getOrCreateClientId() {
  const currentId = window.localStorage.getItem(clientIdStorageKey);
  if (currentId) return currentId;

  const nextId = `client-${createId()}`;
  window.localStorage.setItem(clientIdStorageKey, nextId);
  return nextId;
}

export function collectLocalStorageBackup() {
  const backupKeys = [
    ...Object.values(adminStorageKeys),
    clientIdStorageKey,
    ptoLocalRecoveryBackupKey,
  ];

  return Object.fromEntries(
    backupKeys.flatMap((key) => {
      const value = window.localStorage.getItem(key);
      return value === null ? [] : [[key, value] as const];
    }),
  );
}

function readSnapshotJson<T>(storage: Record<string, string>, key: string, fallback: T): T {
  const rawValue = storage[key];
  if (!rawValue) return fallback;

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export function clientSnapshotStats(snapshot: DataClientSnapshot) {
  const planRows = readSnapshotJson<unknown[]>(snapshot.storage, adminStorageKeys.ptoPlanRows, []);
  const operRows = readSnapshotJson<unknown[]>(snapshot.storage, adminStorageKeys.ptoOperRows, []);
  const surveyRows = readSnapshotJson<unknown[]>(snapshot.storage, adminStorageKeys.ptoSurveyRows, []);
  const vehicles = readSnapshotJson<unknown[]>(snapshot.storage, adminStorageKeys.vehicles, []);
  const bucketValues = readSnapshotJson<Record<string, unknown>>(snapshot.storage, adminStorageKeys.ptoBucketValues, {});

  return {
    appKeys: Object.keys(snapshot.storage).length,
    ptoRows: planRows.length + operRows.length + surveyRows.length,
    vehicles: vehicles.length,
    bucketValues: Object.keys(bucketValues).length,
  };
}
