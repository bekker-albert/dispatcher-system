import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getMysqlPool } from "../mysql/connection";

const authUsersTableStatement = `CREATE TABLE IF NOT EXISTS auth_users (
    user_id VARCHAR(64) NOT NULL,
    login VARCHAR(191) NOT NULL,
    display_name VARCHAR(191) NOT NULL,
    last_name VARCHAR(191) NULL,
    first_name VARCHAR(191) NULL,
    middle_name VARCHAR(191) NULL,
    email VARCHAR(191) NULL,
    phone VARCHAR(64) NULL,
    position_title VARCHAR(191) NULL,
    role VARCHAR(64) NOT NULL,
    can_manage_users TINYINT(1) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    tab_permissions LONGTEXT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (user_id),
    UNIQUE KEY auth_users_login_idx (login),
    KEY auth_users_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

type DbValue = string | number | boolean | null | Date | Buffer;
type AuthColumnDefinition = {
  name: string;
  definition: string;
};

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
  await ensureAuthUserColumns([
    { name: "last_name", definition: "VARCHAR(191) NULL" },
    { name: "first_name", definition: "VARCHAR(191) NULL" },
    { name: "middle_name", definition: "VARCHAR(191) NULL" },
    { name: "email", definition: "VARCHAR(191) NULL" },
    { name: "phone", definition: "VARCHAR(64) NULL" },
    { name: "position_title", definition: "VARCHAR(191) NULL" },
    { name: "tab_permissions", definition: "LONGTEXT NULL" },
  ]);
}

async function ensureAuthUserColumns(columns: AuthColumnDefinition[]) {
  const pool = getMysqlPool();

  for (const column of columns) {
    const [existing] = await pool.query<RowDataPacket[]>(
      "SHOW COLUMNS FROM auth_users LIKE ?",
      [column.name],
    );
    if (existing.length > 0) continue;

    await pool.execute(`ALTER TABLE auth_users ADD COLUMN ${column.name} ${column.definition}`);
  }
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
