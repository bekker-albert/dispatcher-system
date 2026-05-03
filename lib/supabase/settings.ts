import type { SaveAppSettingsOptions } from "../domain/app/settings";
import { supabase, supabaseConfigured } from "./client";

export type SupabaseSettingRecord = {
  key: string;
  value: unknown;
  updated_at?: string | null;
};

export type SupabaseAppSettingsClient = NonNullable<typeof supabase>;

const appSettingsTable = "app_settings";

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  return supabase;
}

export async function loadAppSettingsFromSupabase(keys: string[]) {
  if (keys.length === 0) return [];
  const client = requireSupabase();
  return await loadAppSettingsFromSupabaseClient(keys, client);
}

async function loadAppSettingsFromSupabaseClient(keys: string[], client: SupabaseAppSettingsClient) {
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

async function assertAppSettingsMatchExpectedUpdatedAt(
  entries: Array<[string, unknown]>,
  expectedUpdatedAt: Record<string, string | null | undefined>,
  client: SupabaseAppSettingsClient,
) {
  if (entries.length === 0) return;

  const keys = entries.map(([key]) => key);
  const { data, error } = await client
    .from(appSettingsTable)
    .select("key,updated_at")
    .in("key", keys);

  if (error) throw error;

  const currentByKey = new Map(
    ((data ?? []) as SupabaseSettingRecord[]).map((record) => [record.key, record]),
  );
  const conflictedKeys = entries.flatMap(([key]) => {
    const expected = expectedUpdatedAt[key] ?? null;
    const current = currentByKey.get(key);

    if (expected === null) return current ? [key] : [];
    return current?.updated_at === expected ? [] : [key];
  });

  if (conflictedKeys.length > 0) {
    throw createAppSettingsConflictError(conflictedKeys);
  }
}

export async function saveAppSettingsToSupabase(
  settings: Record<string, unknown>,
  options: SaveAppSettingsOptions = {},
) {
  const keys = Object.keys(settings);

  if (keys.length === 0) return;

  const client = requireSupabase();
  return await saveAppSettingsToSupabaseClient(settings, client, options);
}

export async function saveAppSettingsToSupabaseClient(
  settings: Record<string, unknown>,
  client: SupabaseAppSettingsClient,
  options: SaveAppSettingsOptions = {},
) {
  const entries = Object.entries(settings);
  if (entries.length === 0) return;

  const keys = entries.map(([key]) => key);
  const updatedAt = new Date().toISOString();
  const records = entries.map(([key, value]) => ({
    key,
    value,
    updated_at: updatedAt,
  }));

  if (options.expectedUpdatedAt) {
    await assertAppSettingsMatchExpectedUpdatedAt(entries, options.expectedUpdatedAt, client);
  }

  const { error } = await client
    .from(appSettingsTable)
    .upsert(records, { onConflict: "key" });

  if (error) throw error;
  return await loadAppSettingsFromSupabaseClient(keys, client);
}
