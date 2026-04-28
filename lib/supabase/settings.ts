import { databaseRequest } from "../database/rpc";
import type { SaveAppSettingsOptions } from "../domain/app/settings";
import { supabase, supabaseConfigured } from "./client";
import { serverDatabaseConfigured } from "./config";

export type SupabaseSettingRecord = {
  key: string;
  value: unknown;
  updated_at?: string | null;
};

const appSettingsTable = "app_settings";

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  return supabase;
}

export async function loadAppSettingsFromSupabase(keys: string[]) {
  if (serverDatabaseConfigured) {
    return databaseRequest<SupabaseSettingRecord[]>("settings", "load", { keys });
  }

  if (keys.length === 0) return [];
  const client = requireSupabase();
  const { data, error } = await client
    .from(appSettingsTable)
    .select("key,value,updated_at")
    .in("key", keys);

  if (error) throw error;
  return (data ?? []) as SupabaseSettingRecord[];
}

function createAppSettingsConflictError(keys: string[]) {
  return new Error(`App settings changed in another tab: ${keys.join(", ")}`);
}

export async function saveAppSettingsToSupabase(
  settings: Record<string, unknown>,
  options: SaveAppSettingsOptions = {},
) {
  const keys = Object.keys(settings);

  if (serverDatabaseConfigured) {
    return await databaseRequest<SupabaseSettingRecord[]>("settings", "save", { settings, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  const entries = Object.entries(settings);
  const records = entries.map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  if (records.length === 0) return;

  const client = requireSupabase();

  if (options.expectedUpdatedAt) {
    const conflictedKeys: string[] = [];

    for (const [key, value] of entries) {
      const updatedAt = new Date().toISOString();
      const expectedUpdatedAt = options.expectedUpdatedAt[key] ?? null;

      if (expectedUpdatedAt) {
        const { data, error } = await client
          .from(appSettingsTable)
          .update({ value, updated_at: updatedAt })
          .eq("key", key)
          .eq("updated_at", expectedUpdatedAt)
          .select("key");

        if (error) throw error;
        if ((data ?? []).length !== 1) conflictedKeys.push(key);
        continue;
      }

      const { error } = await client
        .from(appSettingsTable)
        .insert({ key, value, updated_at: updatedAt });

      if (error) {
        if ((error as { code?: string }).code === "23505") {
          conflictedKeys.push(key);
        } else {
          throw error;
        }
      }
    }

    if (conflictedKeys.length > 0) {
      throw createAppSettingsConflictError(conflictedKeys);
    }
    return await loadAppSettingsFromSupabase(keys);
  }

  const { error } = await client
    .from(appSettingsTable)
    .upsert(records, { onConflict: "key" });

  if (error) throw error;
  return await loadAppSettingsFromSupabase(keys);
}
