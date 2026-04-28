import type { RowDataPacket } from "mysql2/promise";
import { DatabaseConflictError } from "../database/conflicts";
import { dbExecute, dbRows, dbTransaction } from "./pool";
import { parseJson, stringifyJson } from "./json";
import type { SaveAppSettingsOptions } from "../../domain/app/settings";

export type MysqlSettingRecord = {
  key: string;
  value: unknown;
  updated_at?: string | null;
};

type SettingRecord = RowDataPacket & {
  setting_key: string;
  value: unknown;
  updated_at?: string | null;
};

function createAppSettingsConflictError(keys: string[]) {
  return new DatabaseConflictError(`Настройки уже изменились в базе. Обновите страницу перед повторным сохранением. Поля: ${keys.join(", ")}`);
}

function expectedUpdatedAtValue(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}

export async function loadAppSettingsFromMysql(keys: string[]) {
  if (keys.length === 0) return [];

  const placeholders = keys.map(() => "?").join(", ");
  const records = await dbRows<SettingRecord>(
    `SELECT setting_key, value, updated_at FROM app_settings WHERE setting_key IN (${placeholders})`,
    keys,
  );

  return records.map((record): MysqlSettingRecord => ({
    key: record.setting_key,
    value: parseJson(record.value, null),
    updated_at: record.updated_at,
  }));
}

export async function saveAppSettingsToMysql(
  settings: Record<string, unknown>,
  options: SaveAppSettingsOptions = {},
) {
  const entries = Object.entries(settings);
  if (entries.length === 0) return;

  if (options.expectedUpdatedAt) {
    await dbTransaction(async (execute) => {
      const conflictedKeys: string[] = [];

      for (const [key, value] of entries) {
        const expectedUpdatedAt = options.expectedUpdatedAt?.[key] ?? null;

        if (expectedUpdatedAt) {
          const result = await execute(
            `UPDATE app_settings
            SET value = ?, updated_at = CURRENT_TIMESTAMP(3)
            WHERE setting_key = ? AND updated_at = ?`,
            [stringifyJson(value), key, expectedUpdatedAtValue(expectedUpdatedAt)],
          );
          if (result.affectedRows !== 1) conflictedKeys.push(key);
          continue;
        }

        const result = await execute(
          `INSERT IGNORE INTO app_settings (setting_key, value) VALUES (?, ?)`,
          [key, stringifyJson(value)],
        );
        if (result.affectedRows !== 1) conflictedKeys.push(key);
      }

      if (conflictedKeys.length > 0) {
        throw createAppSettingsConflictError(conflictedKeys);
      }
    });
    return;
  }

  const placeholders = entries.map(() => "(?, ?)").join(", ");
  const values = entries.flatMap(([key, value]) => [key, stringifyJson(value)]);

  await dbExecute(
    `INSERT INTO app_settings (setting_key, value)
    VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      value = VALUES(value),
      updated_at = CURRENT_TIMESTAMP(3)`,
    values,
  );
}
