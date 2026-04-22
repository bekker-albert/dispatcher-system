import { supabase, supabaseConfigured } from "./client";

export type SupabaseAppState = {
  updatedAt?: string;
  storage: Record<string, string>;
};

type AppStateRecord = {
  key: string;
  value: {
    storage?: unknown;
  } | null;
  updated_at?: string | null;
};

const appStateTable = "app_state";
const mainAppStateKey = "main";

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  return supabase;
}

function normalizeStorage(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

export async function loadAppStateFromSupabase(): Promise<SupabaseAppState | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(appStateTable)
    .select("key,value,updated_at")
    .eq("key", mainAppStateKey)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const record = data as AppStateRecord;

  return {
    updatedAt: typeof record.updated_at === "string" ? record.updated_at : undefined,
    storage: normalizeStorage(record.value?.storage),
  };
}

export async function saveAppStateToSupabase(storage: Record<string, string>) {
  const client = requireSupabase();
  const { error } = await client
    .from(appStateTable)
    .upsert({
      key: mainAppStateKey,
      value: { storage },
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

  if (error) throw error;
}
