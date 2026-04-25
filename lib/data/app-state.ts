import {
  loadAppStateFromSupabase,
  loadClientAppSnapshotsFromSupabase,
  saveAppStateToSupabase,
  saveClientAppSnapshotToSupabase,
  type SupabaseAppState,
  type SupabaseClientSnapshot,
  type SupabaseClientSnapshotMeta,
} from "@/lib/supabase/app-state";

export type DataAppState = SupabaseAppState;
export type DataClientSnapshot = SupabaseClientSnapshot;
export type DataClientSnapshotMeta = SupabaseClientSnapshotMeta;

export function loadAppStateFromDatabase() {
  return loadAppStateFromSupabase();
}

export function saveAppStateToDatabase(storage: Record<string, string>) {
  return saveAppStateToSupabase(storage);
}

export function saveClientAppSnapshotToDatabase(
  clientId: string,
  storage: Record<string, string>,
  meta: DataClientSnapshotMeta,
) {
  return saveClientAppSnapshotToSupabase(clientId, storage, meta);
}

export function loadClientAppSnapshotsFromDatabase() {
  return loadClientAppSnapshotsFromSupabase();
}
