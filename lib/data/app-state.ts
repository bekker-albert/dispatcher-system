import {
  loadAppStateFromSupabase as loadAppStateFromBackend,
  loadClientAppSnapshotsFromSupabase as loadClientAppSnapshotsFromBackend,
  saveAppStateToSupabase as saveAppStateToBackend,
  saveClientAppSnapshotToSupabase as saveClientAppSnapshotToBackend,
  type SupabaseAppState as BackendAppState,
  type SupabaseClientSnapshot as BackendClientSnapshot,
  type SupabaseClientSnapshotMeta as BackendClientSnapshotMeta,
} from "@/lib/supabase/app-state";

export type DataAppState = BackendAppState;
export type DataClientSnapshot = BackendClientSnapshot;
export type DataClientSnapshotMeta = BackendClientSnapshotMeta;

export function loadAppStateFromDatabase() {
  return loadAppStateFromBackend();
}

export function saveAppStateToDatabase(storage: Record<string, string>) {
  return saveAppStateToBackend(storage);
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
