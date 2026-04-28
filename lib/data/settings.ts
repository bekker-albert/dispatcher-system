import {
  loadAppSettingsFromSupabase as loadAppSettingsFromBackend,
  saveAppSettingsToSupabase as saveAppSettingsToBackend,
  type SupabaseSettingRecord as BackendSettingRecord,
} from "@/lib/supabase/settings";
import type { SaveAppSettingsOptions } from "@/lib/domain/app/settings";

export type DataSettingRecord = BackendSettingRecord;
export type { SaveAppSettingsOptions };

export function loadAppSettingsFromDatabase(keys: string[]) {
  return loadAppSettingsFromBackend(keys);
}

export function saveAppSettingsToDatabase(
  settings: Record<string, unknown>,
  options: SaveAppSettingsOptions = {},
) {
  return saveAppSettingsToBackend(settings, options);
}
