import {
  loadAppSettingsFromSupabase,
  saveAppSettingsToSupabase,
  type SupabaseSettingRecord,
} from "@/lib/supabase/settings";

export type DataSettingRecord = SupabaseSettingRecord;

export function loadAppSettingsFromDatabase(keys: string[]) {
  return loadAppSettingsFromSupabase(keys);
}

export function saveAppSettingsToDatabase(settings: Record<string, unknown>) {
  return saveAppSettingsToSupabase(settings);
}
