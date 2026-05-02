import { databaseRequest } from "@/lib/database/rpc";
import type { SaveAppSettingsOptions } from "@/lib/domain/app/settings";
import { serverDatabaseConfigured } from "./config";

export type DataSettingRecord = {
  key: string;
  value: unknown;
  updated_at?: string | null;
};

export type { SaveAppSettingsOptions };

async function loadSupabaseSettingsAdapter() {
  return import("@/lib/supabase/settings");
}

export function loadAppSettingsFromDatabase(keys: string[]) {
  if (serverDatabaseConfigured) {
    return databaseRequest<DataSettingRecord[]>("settings", "load", { keys });
  }

  return loadSupabaseSettingsAdapter()
    .then(({ loadAppSettingsFromSupabase }) => loadAppSettingsFromSupabase(keys));
}

export function saveAppSettingsToDatabase(
  settings: Record<string, unknown>,
  options: SaveAppSettingsOptions = {},
) {
  if (serverDatabaseConfigured) {
    return databaseRequest<DataSettingRecord[]>("settings", "save", {
      settings,
      expectedUpdatedAt: options.expectedUpdatedAt,
    });
  }

  return loadSupabaseSettingsAdapter()
    .then(({ saveAppSettingsToSupabase }) => saveAppSettingsToSupabase(settings, options));
}
