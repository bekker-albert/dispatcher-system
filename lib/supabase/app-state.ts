import { supabase, supabaseConfigured } from "./client";

export type SupabaseAppState = {
  updatedAt?: string;
  storage: Record<string, string>;
};

export type SupabaseClientSnapshotMeta = {
  reason: string;
  userAgent?: string;
  url?: string;
};

export type SupabaseClientSnapshot = {
  key: string;
  clientId: string;
  savedAt?: string;
  updatedAt?: string;
  storage: Record<string, string>;
  meta: SupabaseClientSnapshotMeta;
};

type AppStateRecord = {
  key: string;
  value: {
    clientId?: unknown;
    savedAt?: unknown;
    storage?: unknown;
    meta?: unknown;
  } | null;
  updated_at?: string | null;
};

const appStateTable = "app_state";
const mainAppStateKey = "main";
const clientSnapshotKeyPrefix = "client-snapshot:";

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

function normalizeSnapshotMeta(value: unknown): SupabaseClientSnapshotMeta {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { reason: "" };

  const record = value as Record<string, unknown>;
  return {
    reason: typeof record.reason === "string" ? record.reason : "",
    userAgent: typeof record.userAgent === "string" ? record.userAgent : undefined,
    url: typeof record.url === "string" ? record.url : undefined,
  };
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

export async function saveClientAppSnapshotToSupabase(
  clientId: string,
  storage: Record<string, string>,
  meta: SupabaseClientSnapshotMeta,
) {
  const client = requireSupabase();
  const savedAt = new Date().toISOString();
  const { error } = await client
    .from(appStateTable)
    .upsert({
      key: `${clientSnapshotKeyPrefix}${clientId}`,
      value: {
        clientId,
        savedAt,
        storage,
        meta,
      },
      updated_at: savedAt,
    }, { onConflict: "key" });

  if (error) throw error;
}

export async function loadClientAppSnapshotsFromSupabase(): Promise<SupabaseClientSnapshot[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(appStateTable)
    .select("key,value,updated_at")
    .like("key", `${clientSnapshotKeyPrefix}%`)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as AppStateRecord[]).map((record) => {
    const value = record.value ?? {};
    return {
      key: record.key,
      clientId: typeof value.clientId === "string" ? value.clientId : record.key.replace(clientSnapshotKeyPrefix, ""),
      savedAt: typeof value.savedAt === "string" ? value.savedAt : undefined,
      updatedAt: typeof record.updated_at === "string" ? record.updated_at : undefined,
      storage: normalizeStorage(value.storage),
      meta: normalizeSnapshotMeta(value.meta),
    };
  });
}
