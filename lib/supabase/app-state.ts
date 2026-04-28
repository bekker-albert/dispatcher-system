import { databaseRequest } from "../database/rpc";
import { supabase, supabaseConfigured } from "./client";
import { serverDatabaseConfigured } from "./config";

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

export type SaveAppStateOptions = {
  expectedUpdatedAt?: string | null;
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

function createAppStateConflictError() {
  return new Error("Legacy app_state changed in another tab");
}

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
  if (serverDatabaseConfigured) {
    return databaseRequest<SupabaseAppState | null>("app-state", "load");
  }

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

export async function saveAppStateToSupabase(
  storage: Record<string, string>,
  options: SaveAppStateOptions = {},
): Promise<SupabaseAppState> {
  if (serverDatabaseConfigured) {
    return databaseRequest<SupabaseAppState>("app-state", "save", {
      storage,
      expectedUpdatedAt: options.expectedUpdatedAt,
    });
  }

  const client = requireSupabase();

  if ("expectedUpdatedAt" in options) {
    if (options.expectedUpdatedAt) {
      const updatedAt = new Date().toISOString();
      const { data, error } = await client
        .from(appStateTable)
        .update({
          value: { storage },
          updated_at: updatedAt,
        })
        .eq("key", mainAppStateKey)
        .eq("updated_at", options.expectedUpdatedAt)
        .select("value,updated_at");

      if (error) throw error;
      if ((data ?? []).length !== 1) throw createAppStateConflictError();

      const record = data[0] as AppStateRecord;
      return {
        updatedAt: typeof record.updated_at === "string" ? record.updated_at : updatedAt,
        storage: normalizeStorage(record.value?.storage),
      };
    }

    const updatedAt = new Date().toISOString();
    const { error } = await client
      .from(appStateTable)
      .insert({
        key: mainAppStateKey,
        value: { storage },
        updated_at: updatedAt,
      });

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        throw createAppStateConflictError();
      }
      throw error;
    }

    return { updatedAt, storage };
  }

  const updatedAt = new Date().toISOString();
  const { error } = await client
    .from(appStateTable)
    .upsert({
      key: mainAppStateKey,
      value: { storage },
      updated_at: updatedAt,
    }, { onConflict: "key" });

  if (error) throw error;
  return { updatedAt, storage };
}

export async function saveClientAppSnapshotToSupabase(
  clientId: string,
  storage: Record<string, string>,
  meta: SupabaseClientSnapshotMeta,
) {
  if (serverDatabaseConfigured) {
    await databaseRequest("app-state", "save-client-snapshot", { clientId, storage, meta });
    return;
  }

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
  if (serverDatabaseConfigured) {
    return databaseRequest<SupabaseClientSnapshot[]>("app-state", "load-client-snapshots");
  }

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
