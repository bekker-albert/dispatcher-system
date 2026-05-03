import { createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "./connection";
import { rebuildPtoRowYearMembership } from "./pto-row-year-membership";
import {
  ptoMetaTableStatement,
  schemaMigrations,
  schemaStatements,
  type MysqlSchemaMigration,
} from "./schema-definitions";

let schemaPromise: Promise<void> | null = null;

function createSchemaVersionMetaKey() {
  const schemaSignature = [
    ptoMetaTableStatement,
    ...schemaStatements,
    ...schemaMigrations.map((migration) => migration.statement),
  ].join("\n\n");

  return `schema:v${createHash("sha256").update(schemaSignature).digest("hex").slice(0, 16)}`;
}

const schemaVersionMetaKey = createSchemaVersionMetaKey();

async function executeIgnoringMysqlError(statement: string, ignoredCode: string) {
  try {
    await getMysqlPool().execute(statement);
  } catch (error) {
    if (!(
      error
      && typeof error === "object"
      && "code" in error
      && (error as { code?: string }).code === ignoredCode
    )) {
      throw error;
    }
  }
}

async function mysqlRows<T extends RowDataPacket = RowDataPacket>(sql: string, values: unknown[] = []) {
  const [rows] = await getMysqlPool().query<T[]>(sql, values);
  return rows;
}

async function mysqlSchemaVersionExists() {
  try {
    const rows = await mysqlRows(
      "SELECT 1 AS schema_ready FROM pto_meta WHERE meta_key = ? LIMIT 1",
      [schemaVersionMetaKey],
    );
    return rows.length > 0;
  } catch (error) {
    if (
      error
      && typeof error === "object"
      && "code" in error
      && (error as { code?: string }).code === "ER_NO_SUCH_TABLE"
    ) {
      return false;
    }

    throw error;
  }
}

async function mysqlIndexExists(tableName: string, indexName: string) {
  const rows = await mysqlRows(`SHOW INDEX FROM \`${tableName}\` WHERE Key_name = ?`, [indexName]);
  return rows.length > 0;
}

async function mysqlColumnExists(tableName: string, columnName: string) {
  const rows = await mysqlRows(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
  return rows.length > 0;
}

async function addMysqlIndexIfMissing(tableName: string, indexName: string, statement: string) {
  if (await mysqlIndexExists(tableName, indexName)) return;
  await executeIgnoringMysqlError(statement, "ER_DUP_KEYNAME");
}

async function addMysqlColumnIfMissing(tableName: string, columnName: string, statement: string) {
  if (await mysqlColumnExists(tableName, columnName)) return;
  await executeIgnoringMysqlError(statement, "ER_DUP_FIELDNAME");
}

function createSchemaSetupExecutor() {
  const execute = (async (sql: string, values: unknown[] = []) => {
    const [result] = await getMysqlPool().execute(sql, values as never[]);
    return result;
  }) as Parameters<typeof rebuildPtoRowYearMembership>[0];

  execute.rows = mysqlRows;
  return execute;
}

async function applyMysqlSchemaMigration(migration: MysqlSchemaMigration) {
  if (migration.kind === "index") {
    await addMysqlIndexIfMissing(migration.tableName, migration.indexName, migration.statement);
    return;
  }

  await addMysqlColumnIfMissing(migration.tableName, migration.columnName, migration.statement);
}

async function runMysqlSchemaSetup() {
  if (await mysqlSchemaVersionExists()) return;

  await getMysqlPool().execute(ptoMetaTableStatement);

  for (const statement of schemaStatements) {
    await getMysqlPool().execute(statement);
  }

  for (const migration of schemaMigrations) {
    await applyMysqlSchemaMigration(migration);
  }

  await rebuildPtoRowYearMembership(createSchemaSetupExecutor());

  await getMysqlPool().execute(
    "INSERT IGNORE INTO pto_meta (meta_key) VALUES (?)",
    [schemaVersionMetaKey],
  );
}

export async function ensureMysqlSchema() {
  if (!schemaPromise) {
    schemaPromise = runMysqlSchemaSetup().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}
