import type { RowDataPacket } from "mysql2/promise";
import { DatabaseConflictError } from "../database/conflicts";
import { toIsoLike } from "./json";
import { dbRows, type DbExecutor } from "./pool";

export const ptoVersionMetaKey = "pto";

type PtoVersionRow = RowDataPacket & {
  updated_at?: string | Date | null;
};

export async function touchPtoVersion(execute: DbExecutor) {
  await execute(
    `INSERT INTO pto_meta (meta_key, updated_at)
    VALUES (?, CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP(3)`,
    [ptoVersionMetaKey],
  );
}

export async function loadPtoVersionUpdatedAt() {
  const records = await dbRows<PtoVersionRow>(
    "SELECT updated_at FROM pto_meta WHERE meta_key = ? LIMIT 1",
    [ptoVersionMetaKey],
  );

  return toIsoLike(records[0]?.updated_at) ?? null;
}

async function ptoVersionRowsForUpdate(execute: DbExecutor) {
  if (execute.rows) {
    return execute.rows<PtoVersionRow>(
      "SELECT updated_at FROM pto_meta WHERE meta_key = ? LIMIT 1 FOR UPDATE",
      [ptoVersionMetaKey],
    );
  }

  return dbRows<PtoVersionRow>(
    "SELECT updated_at FROM pto_meta WHERE meta_key = ? LIMIT 1",
    [ptoVersionMetaKey],
  );
}

export async function assertPtoVersionMatchesExpectedUpdatedAt(
  expectedUpdatedAt: string | null | undefined,
  execute: DbExecutor,
) {
  if (expectedUpdatedAt === undefined) return;

  const insertResult = await execute(
    "INSERT IGNORE INTO pto_meta (meta_key) VALUES (?)",
    [ptoVersionMetaKey],
  );
  const records = await ptoVersionRowsForUpdate(execute);
  if (insertResult.affectedRows > 0) return;

  const currentUpdatedAt = toIsoLike(records[0]?.updated_at);

  if (!currentUpdatedAt) return;

  if (!expectedUpdatedAt) {
    throw new DatabaseConflictError("Данные ПТО в базе уже изменились. Обновите страницу перед сохранением.");
  }

  const currentTime = Date.parse(currentUpdatedAt);
  const expectedTime = Date.parse(expectedUpdatedAt);

  if (!Number.isFinite(currentTime) || !Number.isFinite(expectedTime) || currentTime > expectedTime) {
    throw new DatabaseConflictError("Данные ПТО изменились другим пользователем. Обновите страницу перед сохранением.");
  }
}
