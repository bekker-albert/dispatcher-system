import {
  loadAppStateFromSupabase as loadAppStateFromBackend,
  loadClientAppSnapshotsFromSupabase as loadClientAppSnapshotsFromBackend,
  saveAppStateToSupabase as saveAppStateToBackend,
  saveClientAppSnapshotToSupabase as saveClientAppSnapshotToBackend,
  type SaveAppStateOptions as BackendSaveAppStateOptions,
  type SupabaseAppState as BackendAppState,
  type SupabaseClientSnapshot as BackendClientSnapshot,
  type SupabaseClientSnapshotMeta as BackendClientSnapshotMeta,
} from "../supabase/app-state";

export type DataAppState = BackendAppState;
export type DataClientSnapshot = BackendClientSnapshot;
export type DataClientSnapshotMeta = BackendClientSnapshotMeta;
export type SaveAppStateOptions = BackendSaveAppStateOptions;

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

export function loadAppStateFromDatabase() {
  return loadAppStateFromBackend();
}

export function saveAppStateToDatabase(
  storage: Record<string, string>,
  options: SaveAppStateOptions = {},
) {
  return saveAppStateToBackend(storage, options);
}

export function saveClientAppSnapshotToDatabase(
  clientId: string,
  storage: Record<string, string>,
  meta: DataClientSnapshotMeta,
) {
  return saveClientAppSnapshotToBackend(clientId, storage, meta);
}

export function loadClientAppSnapshotsFromDatabase() {
  return loadClientAppSnapshotsFromBackend();
}
