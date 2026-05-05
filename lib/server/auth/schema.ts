import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "../mysql/connection";

const authUsersTableStatement = `CREATE TABLE IF NOT EXISTS auth_users (
    user_id VARCHAR(64) NOT NULL,
    login VARCHAR(191) NOT NULL,
    display_name VARCHAR(191) NOT NULL,
    role VARCHAR(64) NOT NULL,
    can_manage_users TINYINT(1) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (user_id),
    UNIQUE KEY auth_users_login_idx (login),
    KEY auth_users_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

type DbValue = string | number | boolean | null | Date | Buffer;

let authSchemaPromise: Promise<void> | null = null;

function normalizeValues(values: unknown[]): DbValue[] {
  return values.map((value) => {
    if (value === undefined) return null;
    if (
      value === null
      || typeof value === "string"
      || typeof value === "number"
      || typeof value === "boolean"
      || value instanceof Date
      || Buffer.isBuffer(value)
    ) {
      return value;
    }

    return JSON.stringify(value);
  });
}

async function runAuthSchemaSetup() {
  await getMysqlPool().execute(authUsersTableStatement);
}

export async function ensureAuthSchema() {
  if (!authSchemaPromise) {
    authSchemaPromise = runAuthSchemaSetup().catch((error) => {
      authSchemaPromise = null;
      throw error;
    });
  }

  return authSchemaPromise;
}

export async function authRows<T extends RowDataPacket = RowDataPacket>(sql: string, values: unknown[] = []) {
  await ensureAuthSchema();
  const [rows] = await getMysqlPool().query<T[]>(sql, normalizeValues(values));
  return rows;
}

export async function authExecute(sql: string, values: unknown[] = []) {
  await ensureAuthSchema();
  const [result] = await getMysqlPool().execute<ResultSetHeader>(sql, normalizeValues(values));
  return result;
}
