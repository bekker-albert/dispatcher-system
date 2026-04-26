import {
  loadAppSettingsFromSupabase as loadAppSettingsFromBackend,
  saveAppSettingsToSupabase as saveAppSettingsToBackend,
  type SupabaseSettingRecord as BackendSettingRecord,
} from "@/lib/supabase/settings";

export type DataSettingRecord = BackendSettingRecord;

export function loadAppSettingsFromDatabase(keys: string[]) {
  return loadAppSettingsFromBackend(keys);
}

export function saveAppSettingsToDatabase(settings: Record<string, unknown>) {
  return saveAppSettingsToBackend(settings);
}
