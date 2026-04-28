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
  updatedAt: string | null;
};

function normalizeStorage(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

export function createAppStateSaveCheckpoint(
  storage: Record<string, string>,
  updatedAt?: string | null,
) {
  return JSON.stringify({
    storage: normalizeStorage(storage),
    updatedAt: updatedAt ?? null,
  });
}

export function parseAppStateSaveCheckpoint(checkpoint: string): DataAppStateSaveCheckpoint {
  if (!checkpoint) return { storage: {}, updatedAt: null };

  try {
    const parsed = JSON.parse(checkpoint) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { storage: {}, updatedAt: null };
    }

    const record = parsed as Record<string, unknown>;
    if ("storage" in record) {
      return {
        storage: normalizeStorage(record.storage),
        updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : null,
      };
    }

    return {
      storage: normalizeStorage(record),
      updatedAt: null,
    };
  } catch {
    return { storage: {}, updatedAt: null };
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
