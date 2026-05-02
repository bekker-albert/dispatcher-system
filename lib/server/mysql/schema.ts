import { getMysqlPool } from "./connection";
import type { RowDataPacket } from "mysql2/promise";

let schemaPromise: Promise<void> | null = null;
const schemaVersionMetaKey = "schema:v2026-05-02-01";
const ptoMetaTableStatement = `CREATE TABLE IF NOT EXISTS pto_meta (
    meta_key VARCHAR(191) NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (meta_key),
    KEY pto_meta_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

const statements = [
  `CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id BIGINT NOT NULL,
    sort_index INT NULL,
    visible TINYINT(1) NULL,
    category VARCHAR(255) NULL,
    equipment_type VARCHAR(255) NULL,
    brand VARCHAR(255) NULL,
    model VARCHAR(255) NULL,
    plate_number VARCHAR(255) NULL,
    garage_number VARCHAR(255) NULL,
    owner VARCHAR(255) NULL,
    data JSON NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (vehicle_id),
    KEY vehicles_sort_index_idx (sort_index),
    KEY vehicles_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(191) NOT NULL,
    value JSON NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (setting_key),
    KEY app_settings_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS app_state (
    state_key VARCHAR(191) NOT NULL,
    value JSON NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (state_key),
    KEY app_state_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pto_rows (
    table_type VARCHAR(32) NOT NULL,
    row_id VARCHAR(191) NOT NULL,
    area TEXT NULL,
    location TEXT NULL,
    structure TEXT NULL,
    customer_code VARCHAR(32) NULL,
    unit VARCHAR(64) NULL,
    status VARCHAR(191) NULL,
    carryover DECIMAL(20, 6) NULL,
    carryovers JSON NULL,
    carryover_manual_years JSON NULL,
    years JSON NULL,
    sort_index INT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (table_type, row_id),
    KEY pto_rows_sort_idx (table_type, sort_index),
    KEY pto_rows_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pto_day_values (
    table_type VARCHAR(32) NOT NULL,
    row_id VARCHAR(191) NOT NULL,
    work_date DATE NOT NULL,
    value DECIMAL(20, 6) NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (table_type, row_id, work_date),
    KEY pto_day_values_date_idx (work_date),
    KEY pto_day_values_date_row_idx (work_date, table_type, row_id),
    KEY pto_day_values_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pto_settings (
    setting_key VARCHAR(191) NOT NULL,
    value JSON NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (setting_key),
    KEY pto_settings_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  ptoMetaTableStatement,

  `CREATE TABLE IF NOT EXISTS pto_bucket_rows (
    row_key VARCHAR(191) NOT NULL,
    area TEXT NULL,
    structure TEXT NULL,
    source VARCHAR(32) NULL,
    sort_index INT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (row_key),
    KEY pto_bucket_rows_sort_idx (sort_index),
    KEY pto_bucket_rows_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pto_bucket_values (
    row_key VARCHAR(191) NOT NULL,
    equipment_key VARCHAR(191) NOT NULL,
    value DECIMAL(20, 6) NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (row_key, equipment_key),
    KEY pto_bucket_values_row_idx (row_key),
    KEY pto_bucket_values_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    event_type VARCHAR(191) NOT NULL,
    entity_type VARCHAR(191) NULL,
    entity_id VARCHAR(191) NULL,
    details JSON NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY audit_logs_created_idx (created_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
];

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

async function runMysqlSchemaSetup() {
  await getMysqlPool().execute(ptoMetaTableStatement);

  for (const statement of statements) {
    await getMysqlPool().execute(statement);
  }

  await addMysqlIndexIfMissing(
    "app_state",
    "app_state_updated_idx",
    "ALTER TABLE app_state ADD INDEX app_state_updated_idx (updated_at)",
  );

  await addMysqlIndexIfMissing(
    "vehicles",
    "vehicles_sort_index_idx",
    "ALTER TABLE vehicles ADD INDEX vehicles_sort_index_idx (sort_index)",
  );

  await addMysqlIndexIfMissing(
    "vehicles",
    "vehicles_updated_idx",
    "ALTER TABLE vehicles ADD INDEX vehicles_updated_idx (updated_at)",
  );

  await addMysqlIndexIfMissing(
    "app_settings",
    "app_settings_updated_idx",
    "ALTER TABLE app_settings ADD INDEX app_settings_updated_idx (updated_at)",
  );

  await addMysqlIndexIfMissing(
    "pto_rows",
    "pto_rows_sort_idx",
    "ALTER TABLE pto_rows ADD INDEX pto_rows_sort_idx (table_type, sort_index)",
  );

  await addMysqlIndexIfMissing(
    "pto_rows",
    "pto_rows_updated_idx",
    "ALTER TABLE pto_rows ADD INDEX pto_rows_updated_idx (updated_at)",
  );

  await addMysqlIndexIfMissing(
    "pto_day_values",
    "pto_day_values_date_idx",
    "ALTER TABLE pto_day_values ADD INDEX pto_day_values_date_idx (work_date)",
  );

  await addMysqlIndexIfMissing(
    "pto_day_values",
    "pto_day_values_date_row_idx",
    "ALTER TABLE pto_day_values ADD INDEX pto_day_values_date_row_idx (work_date, table_type, row_id)",
  );

  await addMysqlIndexIfMissing(
    "pto_day_values",
    "pto_day_values_updated_idx",
    "ALTER TABLE pto_day_values ADD INDEX pto_day_values_updated_idx (updated_at)",
  );

  await addMysqlIndexIfMissing(
    "pto_settings",
    "pto_settings_updated_idx",
    "ALTER TABLE pto_settings ADD INDEX pto_settings_updated_idx (updated_at)",
  );

  await addMysqlIndexIfMissing(
    "pto_meta",
    "pto_meta_updated_idx",
    "ALTER TABLE pto_meta ADD INDEX pto_meta_updated_idx (updated_at)",
  );

  await addMysqlIndexIfMissing(
    "pto_bucket_rows",
    "pto_bucket_rows_sort_idx",
    "ALTER TABLE pto_bucket_rows ADD INDEX pto_bucket_rows_sort_idx (sort_index)",
  );

  await addMysqlIndexIfMissing(
    "pto_bucket_rows",
    "pto_bucket_rows_updated_idx",
    "ALTER TABLE pto_bucket_rows ADD INDEX pto_bucket_rows_updated_idx (updated_at)",
  );

  await addMysqlIndexIfMissing(
    "pto_bucket_values",
    "pto_bucket_values_updated_idx",
    "ALTER TABLE pto_bucket_values ADD INDEX pto_bucket_values_updated_idx (updated_at)",
  );

  await addMysqlColumnIfMissing(
    "pto_rows",
    "customer_code",
    "ALTER TABLE pto_rows ADD COLUMN customer_code VARCHAR(32) NULL AFTER structure",
  );

  await addMysqlIndexIfMissing(
    "pto_bucket_values",
    "pto_bucket_values_row_idx",
    "ALTER TABLE pto_bucket_values ADD INDEX pto_bucket_values_row_idx (row_key)",
  );

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
