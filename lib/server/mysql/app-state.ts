import type { RowDataPacket } from "mysql2/promise";
import { DatabaseConflictError } from "../database/conflicts";
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

export type SaveAppStateOptions = {
  expectedUpdatedAt?: string | null;
};

type AppStateRecord = RowDataPacket & {
  state_key: string;
  value: unknown;
  updated_at?: string | null;
};

type AppStateKeyRecord = RowDataPacket & {
  state_key: string;
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

function createAppStateConflictError() {
  return new DatabaseConflictError("Данные приложения уже изменились в базе. Обновите страницу перед повторным сохранением.");
}

function expectedUpdatedAtValue(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}

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

export async function saveAppStateToMysql(
  storage: Record<string, string>,
  options: SaveAppStateOptions = {},
): Promise<MysqlAppState> {
  if ("expectedUpdatedAt" in options) {
    if (options.expectedUpdatedAt) {
      const result = await dbExecute(
        `UPDATE app_state
        SET value = ?, updated_at = CURRENT_TIMESTAMP(3)
        WHERE state_key = ? AND updated_at = ?`,
        [stringifyJson({ storage }), mainAppStateKey, expectedUpdatedAtValue(options.expectedUpdatedAt)],
      );
      if (result.affectedRows !== 1) throw createAppStateConflictError();
    } else {
      const result = await dbExecute(
        `INSERT IGNORE INTO app_state (state_key, value) VALUES (?, ?)`,
        [mainAppStateKey, stringifyJson({ storage })],
      );
      if (result.affectedRows !== 1) throw createAppStateConflictError();
    }
  } else {
    await upsertAppState(mainAppStateKey, { storage });
  }

  return await loadAppStateFromMysql() ?? { storage };
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
  const keyRecords = await dbRows<AppStateKeyRecord>(
    `SELECT state_key, updated_at
    FROM app_state
    WHERE state_key LIKE ?
    ORDER BY updated_at DESC
    LIMIT 20`,
    [`${clientSnapshotKeyPrefix}%`],
  );
  if (keyRecords.length === 0) return [];

  const orderByKey = new Map(keyRecords.map((record, index) => [record.state_key, index]));
  const placeholders = keyRecords.map(() => "?").join(", ");
  const records = await dbRows<AppStateRecord>(
    `SELECT state_key, value, updated_at
    FROM app_state
    WHERE state_key IN (${placeholders})`,
    keyRecords.map((record) => record.state_key),
  );

  return records
    .sort((left, right) => (orderByKey.get(left.state_key) ?? 0) - (orderByKey.get(right.state_key) ?? 0))
    .map((record) => {
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
