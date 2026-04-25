import type { RowDataPacket } from "mysql2/promise";
import { dbExecute, dbRows } from "./pool";
import { parseJson, stringifyJson } from "./json";

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

export async function saveAppSettingsToMysql(settings: Record<string, unknown>) {
  const entries = Object.entries(settings);
  if (entries.length === 0) return;

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
