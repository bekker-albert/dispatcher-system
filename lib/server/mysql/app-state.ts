import type { RowDataPacket } from "mysql2/promise";
import { dbExecute, dbRows } from "./pool";
import { parseJson, stringifyJson } from "./json";

export type MysqlAppState = {
  updatedAt?: string;
  storage: Record<string, string>;
};

export type MysqlClientSnapshotMeta = {
  reason: string;
  userAgent?: string;
  url?: string;
};

export type MysqlClientSnapshot = {
  key: string;
  clientId: string;
  savedAt?: string;
  updatedAt?: string;
  storage: Record<string, string>;
  meta: MysqlClientSnapshotMeta;
};

type AppStateRecord = RowDataPacket & {
  state_key: string;
  value: unknown;
  updated_at?: string | null;
};

type AppStateValue = {
  clientId?: unknown;
  savedAt?: unknown;
  storage?: unknown;
  meta?: unknown;
};

const mainAppStateKey = "main";
const clientSnapshotKeyPrefix = "client-snapshot:";

function normalizeStorage(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function normalizeSnapshotMeta(value: unknown): MysqlClientSnapshotMeta {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { reason: "" };

  const record = value as Record<string, unknown>;
  return {
    reason: typeof record.reason === "string" ? record.reason : "",
    userAgent: typeof record.userAgent === "string" ? record.userAgent : undefined,
    url: typeof record.url === "string" ? record.url : undefined,
  };
}

async function upsertAppState(key: string, value: unknown) {
  await dbExecute(
    `INSERT INTO app_state (state_key, value)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE
      value = VALUES(value),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [key, stringifyJson(value)],
  );
}

export async function loadAppStateFromMysql(): Promise<MysqlAppState | null> {
  const records = await dbRows<AppStateRecord>(
    `SELECT state_key, value, updated_at FROM app_state WHERE state_key = ? LIMIT 1`,
    [mainAppStateKey],
  );
  const record = records[0];
  if (!record) return null;

  const value = parseJson<AppStateValue>(record.value, {});

  return {
    updatedAt: record.updated_at ?? undefined,
    storage: normalizeStorage(value.storage),
  };
}

export async function saveAppStateToMysql(storage: Record<string, string>) {
  await upsertAppState(mainAppStateKey, { storage });
}

export async function saveClientAppSnapshotToMysql(
  clientId: string,
  storage: Record<string, string>,
  meta: MysqlClientSnapshotMeta,
) {
  const savedAt = new Date().toISOString();
  await upsertAppState(`${clientSnapshotKeyPrefix}${clientId}`, {
    clientId,
    savedAt,
    storage,
    meta,
  });
}

export async function loadClientAppSnapshotsFromMysql(): Promise<MysqlClientSnapshot[]> {
  const records = await dbRows<AppStateRecord>(
    `SELECT state_key, value, updated_at
    FROM app_state
    WHERE state_key LIKE ?
    ORDER BY updated_at DESC`,
    [`${clientSnapshotKeyPrefix}%`],
  );

  return records.map((record) => {
    const value = parseJson<AppStateValue>(record.value, {});

    return {
      key: record.state_key,
      clientId: typeof value.clientId === "string" ? value.clientId : record.state_key.replace(clientSnapshotKeyPrefix, ""),
      savedAt: typeof value.savedAt === "string" ? value.savedAt : undefined,
      updatedAt: record.updated_at ?? undefined,
      storage: normalizeStorage(value.storage),
      meta: normalizeSnapshotMeta(value.meta),
    };
  });
}
