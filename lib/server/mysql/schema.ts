import { getMysqlPool } from "./connection";

let schemaPromise: Promise<void> | null = null;

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
    KEY vehicles_sort_index_idx (sort_index)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(191) NOT NULL,
    value JSON NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (setting_key)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS app_state (
    state_key VARCHAR(191) NOT NULL,
    value JSON NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (state_key)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pto_rows (
    table_type VARCHAR(32) NOT NULL,
    row_id VARCHAR(191) NOT NULL,
    area TEXT NULL,
    location TEXT NULL,
    structure TEXT NULL,
    unit VARCHAR(64) NULL,
    coefficient DECIMAL(20, 6) NULL,
    status VARCHAR(191) NULL,
    carryover DECIMAL(20, 6) NULL,
    carryovers JSON NULL,
    carryover_manual_years JSON NULL,
    years JSON NULL,
    sort_index INT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (table_type, row_id),
    KEY pto_rows_sort_idx (table_type, sort_index)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pto_day_values (
    table_type VARCHAR(32) NOT NULL,
    row_id VARCHAR(191) NOT NULL,
    work_date DATE NOT NULL,
    value DECIMAL(20, 6) NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (table_type, row_id, work_date),
    KEY pto_day_values_date_idx (work_date)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pto_settings (
    setting_key VARCHAR(191) NOT NULL,
    value JSON NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (setting_key)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pto_bucket_rows (
    row_key VARCHAR(191) NOT NULL,
    area TEXT NULL,
    structure TEXT NULL,
    source VARCHAR(32) NULL,
    sort_index INT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (row_key),
    KEY pto_bucket_rows_sort_idx (sort_index)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pto_bucket_values (
    row_key VARCHAR(191) NOT NULL,
    equipment_key VARCHAR(191) NOT NULL,
    value DECIMAL(20, 6) NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (row_key, equipment_key)
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

export async function ensureMysqlSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      for (const statement of statements) {
        await getMysqlPool().execute(statement);
      }
    })();
  }

  return schemaPromise;
}
