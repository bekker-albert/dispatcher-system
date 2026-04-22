import { supabase, supabaseConfigured } from "./client";

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
  if (keys.length === 0) return [];
  const client = requireSupabase();
  const { data, error } = await client
    .from(appSettingsTable)
    .select("key,value,updated_at")
    .in("key", keys);

  if (error) throw error;
  return (data ?? []) as SupabaseSettingRecord[];
}

export async function saveAppSettingsToSupabase(settings: Record<string, unknown>) {
  const records = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  if (records.length === 0) return;

  const client = requireSupabase();
  const { error } = await client
    .from(appSettingsTable)
    .upsert(records, { onConflict: "key" });

  if (error) throw error;
}
