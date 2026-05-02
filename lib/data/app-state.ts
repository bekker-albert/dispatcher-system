import { databaseRequest } from "../database/rpc";
import { serverDatabaseConfigured } from "./config";

export type DataAppState = {
  updatedAt?: string;
  storage: Record<string, string>;
};

export type DataClientSnapshotMeta = {
  reason: string;
  userAgent?: string;
  url?: string;
};

export type DataClientSnapshot = {
  key: string;
  clientId: string;
  savedAt?: string;
  updatedAt?: string;
  storage: Record<string, string>;
  meta: DataClientSnapshotMeta;
};

export type SaveAppStateOptions = {
  expectedUpdatedAt?: string | null;
};

export type DataAppStateSaveCheckpoint = {
  storage: Record<string, string>;
  storageSnapshot: string;
  updatedAt: string | null;
};

function normalizeStorage(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

export function createAppStateStorageSnapshot(storage: Record<string, string>) {
  const normalizedStorage = normalizeStorage(storage);
  const sortedStorage = Object.fromEntries(
    Object.entries(normalizedStorage).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey)),
  );

  return JSON.stringify(sortedStorage);
}

export function createAppStateSaveCheckpoint(
  storage: Record<string, string>,
  updatedAt?: string | null,
) {
  const normalizedStorage = normalizeStorage(storage);

  return JSON.stringify({
    storage: normalizedStorage,
    storageSnapshot: createAppStateStorageSnapshot(normalizedStorage),
    updatedAt: updatedAt ?? null,
  });
}

export function parseAppStateSaveCheckpoint(checkpoint: string): DataAppStateSaveCheckpoint {
  if (!checkpoint) return { storage: {}, storageSnapshot: createAppStateStorageSnapshot({}), updatedAt: null };

  try {
    const parsed = JSON.parse(checkpoint) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { storage: {}, storageSnapshot: createAppStateStorageSnapshot({}), updatedAt: null };
    }

    const record = parsed as Record<string, unknown>;
    if ("storage" in record) {
      const storage = normalizeStorage(record.storage);

      return {
        storage,
        storageSnapshot: createAppStateStorageSnapshot(storage),
        updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : null,
      };
    }

    const storage = normalizeStorage(record);

    return {
      storage,
      storageSnapshot: createAppStateStorageSnapshot(storage),
      updatedAt: null,
    };
  } catch {
    return { storage: {}, storageSnapshot: createAppStateStorageSnapshot({}), updatedAt: null };
  }
}

async function loadSupabaseAppStateAdapter() {
  return import("../supabase/app-state");
}

export function loadAppStateFromDatabase() {
  if (serverDatabaseConfigured) {
    return databaseRequest<DataAppState | null>("app-state", "load");
  }

  return loadSupabaseAppStateAdapter()
    .then(({ loadAppStateFromSupabase }) => loadAppStateFromSupabase());
}

export function saveAppStateToDatabase(
  storage: Record<string, string>,
  options: SaveAppStateOptions = {},
) {
  if (serverDatabaseConfigured) {
    return databaseRequest<DataAppState>("app-state", "save", {
      storage,
      expectedUpdatedAt: options.expectedUpdatedAt,
    });
  }

  return loadSupabaseAppStateAdapter()
    .then(({ saveAppStateToSupabase }) => saveAppStateToSupabase(storage, options));
}

export function saveClientAppSnapshotToDatabase(
  clientId: string,
  storage: Record<string, string>,
  meta: DataClientSnapshotMeta,
) {
  if (serverDatabaseConfigured) {
    return databaseRequest("app-state", "save-client-snapshot", { clientId, storage, meta });
  }

  return loadSupabaseAppStateAdapter()
    .then(({ saveClientAppSnapshotToSupabase }) => saveClientAppSnapshotToSupabase(clientId, storage, meta));
}

export function loadClientAppSnapshotsFromDatabase() {
  if (serverDatabaseConfigured) {
    return databaseRequest<DataClientSnapshot[]>("app-state", "load-client-snapshots");
  }

  return loadSupabaseAppStateAdapter()
    .then(({ loadClientAppSnapshotsFromSupabase }) => loadClientAppSnapshotsFromSupabase());
}
