export type MysqlSchemaMigration = {
  kind: "index";
  tableName: string;
  indexName: string;
  statement: string;
} | {
  kind: "column";
  tableName: string;
  columnName: string;
  statement: string;
};

export const ptoMetaTableStatement = `CREATE TABLE IF NOT EXISTS pto_meta (
    meta_key VARCHAR(191) NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (meta_key),
    KEY pto_meta_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

export const schemaStatements = [
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
    KEY pto_day_values_table_date_row_idx (table_type, work_date, row_id),
    KEY pto_day_values_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pto_row_years (
    year_value VARCHAR(16) NOT NULL,
    table_type VARCHAR(32) NOT NULL,
    row_id VARCHAR(191) NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (year_value, table_type, row_id),
    KEY pto_row_years_row_idx (table_type, row_id, year_value),
    KEY pto_row_years_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pto_settings (
    setting_key VARCHAR(191) NOT NULL,
    value JSON NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (setting_key),
    KEY pto_settings_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

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

  `CREATE TABLE IF NOT EXISTS wialon_units (
    wialon_unit_id BIGINT NOT NULL,
    vehicle_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    unique_id VARCHAR(255) NULL,
    phone VARCHAR(255) NULL,
    raw JSON NULL,
    hidden TINYINT(1) NOT NULL DEFAULT 0,
    synced_at TIMESTAMP(3) NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (wialon_unit_id),
    KEY wialon_units_vehicle_idx (vehicle_id),
    KEY wialon_units_hidden_idx (hidden),
    KEY wialon_units_synced_idx (synced_at),
    KEY wialon_units_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS wialon_positions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    wialon_unit_id BIGINT NOT NULL,
    latitude DECIMAL(12, 8) NULL,
    longitude DECIMAL(12, 8) NULL,
    speed DECIMAL(12, 3) NULL,
    course DECIMAL(12, 3) NULL,
    altitude DECIMAL(12, 3) NULL,
    position_time DATETIME(3) NULL,
    raw JSON NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY wialon_positions_unit_idx (wialon_unit_id),
    KEY wialon_positions_time_idx (position_time),
    KEY wialon_positions_unit_time_idx (wialon_unit_id, position_time)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS wialon_sync_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sync_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    message TEXT NULL,
    details JSON NULL,
    started_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    finished_at TIMESTAMP(3) NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY wialon_sync_logs_type_idx (sync_type),
    KEY wialon_sync_logs_status_idx (status),
    KEY wialon_sync_logs_created_idx (created_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
];

export const schemaMigrations: MysqlSchemaMigration[] = [
  {
    kind: "index",
    tableName: "app_state",
    indexName: "app_state_updated_idx",
    statement: "ALTER TABLE app_state ADD INDEX app_state_updated_idx (updated_at)",
  },
  {
    kind: "index",
    tableName: "vehicles",
    indexName: "vehicles_sort_index_idx",
    statement: "ALTER TABLE vehicles ADD INDEX vehicles_sort_index_idx (sort_index)",
  },
  {
    kind: "index",
    tableName: "vehicles",
    indexName: "vehicles_updated_idx",
    statement: "ALTER TABLE vehicles ADD INDEX vehicles_updated_idx (updated_at)",
  },
  {
    kind: "index",
    tableName: "app_settings",
    indexName: "app_settings_updated_idx",
    statement: "ALTER TABLE app_settings ADD INDEX app_settings_updated_idx (updated_at)",
  },
  {
    kind: "index",
    tableName: "pto_rows",
    indexName: "pto_rows_sort_idx",
    statement: "ALTER TABLE pto_rows ADD INDEX pto_rows_sort_idx (table_type, sort_index)",
  },
  {
    kind: "index",
    tableName: "pto_rows",
    indexName: "pto_rows_updated_idx",
    statement: "ALTER TABLE pto_rows ADD INDEX pto_rows_updated_idx (updated_at)",
  },
  {
    kind: "index",
    tableName: "pto_day_values",
    indexName: "pto_day_values_date_idx",
    statement: "ALTER TABLE pto_day_values ADD INDEX pto_day_values_date_idx (work_date)",
  },
  {
    kind: "index",
    tableName: "pto_day_values",
    indexName: "pto_day_values_date_row_idx",
    statement: "ALTER TABLE pto_day_values ADD INDEX pto_day_values_date_row_idx (work_date, table_type, row_id)",
  },
  {
    kind: "index",
    tableName: "pto_day_values",
    indexName: "pto_day_values_table_date_row_idx",
    statement: "ALTER TABLE pto_day_values ADD INDEX pto_day_values_table_date_row_idx (table_type, work_date, row_id)",
  },
  {
    kind: "index",
    tableName: "pto_day_values",
    indexName: "pto_day_values_updated_idx",
    statement: "ALTER TABLE pto_day_values ADD INDEX pto_day_values_updated_idx (updated_at)",
  },
  {
    kind: "index",
    tableName: "pto_row_years",
    indexName: "pto_row_years_row_idx",
    statement: "ALTER TABLE pto_row_years ADD INDEX pto_row_years_row_idx (table_type, row_id, year_value)",
  },
  {
    kind: "index",
    tableName: "pto_row_years",
    indexName: "pto_row_years_updated_idx",
    statement: "ALTER TABLE pto_row_years ADD INDEX pto_row_years_updated_idx (updated_at)",
  },
  {
    kind: "index",
    tableName: "pto_settings",
    indexName: "pto_settings_updated_idx",
    statement: "ALTER TABLE pto_settings ADD INDEX pto_settings_updated_idx (updated_at)",
  },
  {
    kind: "index",
    tableName: "pto_meta",
    indexName: "pto_meta_updated_idx",
    statement: "ALTER TABLE pto_meta ADD INDEX pto_meta_updated_idx (updated_at)",
  },
  {
    kind: "index",
    tableName: "pto_bucket_rows",
    indexName: "pto_bucket_rows_sort_idx",
    statement: "ALTER TABLE pto_bucket_rows ADD INDEX pto_bucket_rows_sort_idx (sort_index)",
  },
  {
    kind: "index",
    tableName: "pto_bucket_rows",
    indexName: "pto_bucket_rows_updated_idx",
    statement: "ALTER TABLE pto_bucket_rows ADD INDEX pto_bucket_rows_updated_idx (updated_at)",
  },
  {
    kind: "index",
    tableName: "pto_bucket_values",
    indexName: "pto_bucket_values_updated_idx",
    statement: "ALTER TABLE pto_bucket_values ADD INDEX pto_bucket_values_updated_idx (updated_at)",
  },
  {
    kind: "column",
    tableName: "pto_rows",
    columnName: "customer_code",
    statement: "ALTER TABLE pto_rows ADD COLUMN customer_code VARCHAR(32) NULL AFTER structure",
  },
  {
    kind: "index",
    tableName: "pto_bucket_values",
    indexName: "pto_bucket_values_row_idx",
    statement: "ALTER TABLE pto_bucket_values ADD INDEX pto_bucket_values_row_idx (row_key)",
  },
];
