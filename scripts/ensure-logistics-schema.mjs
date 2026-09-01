import { loadEnvConfig } from "@next/env";
import mysql from "mysql2/promise";

loadEnvConfig(process.cwd());

const requiredEnv = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(`Missing database environment variables: ${missingEnv.join(", ")}`);
}

const statements = [
  `CREATE TABLE IF NOT EXISTS logistics_requests (
    request_id VARCHAR(64) NOT NULL,
    request_number VARCHAR(64) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    author_user_id VARCHAR(191) NOT NULL,
    author_display_name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NULL,
    project VARCHAR(255) NULL,
    cost_center VARCHAR(191) NULL,
    purpose TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'normal',
    desired_departure_at DATETIME(3) NULL,
    desired_return_at DATETIME(3) NULL,
    passenger_count INT NULL,
    cargo_description TEXT NULL,
    cargo_weight_kg DECIMAL(18,3) NULL,
    cargo_volume_m3 DECIMAL(18,3) NULL,
    requires_business_trip TINYINT(1) NOT NULL DEFAULT 0,
    requires_waybill TINYINT(1) NOT NULL DEFAULT 0,
    requires_consignment_note TINYINT(1) NOT NULL DEFAULT 0,
    notes TEXT NULL,
    submitted_at DATETIME(3) NULL,
    approved_at DATETIME(3) NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (request_id),
    UNIQUE KEY logistics_requests_number_uq (request_number),
    KEY logistics_requests_status_idx (status),
    KEY logistics_requests_author_idx (author_user_id),
    KEY logistics_requests_project_idx (project),
    KEY logistics_requests_departure_idx (desired_departure_at),
    KEY logistics_requests_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_request_stops (
    stop_id VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) NOT NULL,
    sequence_no INT NOT NULL,
    stop_type VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NULL,
    planned_at DATETIME(3) NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (stop_id),
    UNIQUE KEY logistics_request_stops_sequence_uq (request_id, sequence_no),
    KEY logistics_request_stops_request_idx (request_id),
    CONSTRAINT logistics_request_stops_request_fk FOREIGN KEY (request_id)
      REFERENCES logistics_requests (request_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_request_versions (
    version_id VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) NOT NULL,
    version_no INT NOT NULL,
    snapshot JSON NOT NULL,
    change_reason TEXT NULL,
    created_by_user_id VARCHAR(191) NOT NULL,
    created_by_display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (version_id),
    UNIQUE KEY logistics_request_versions_uq (request_id, version_no),
    KEY logistics_request_versions_request_idx (request_id),
    CONSTRAINT logistics_request_versions_request_fk FOREIGN KEY (request_id)
      REFERENCES logistics_requests (request_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_approvals (
    approval_id VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) NOT NULL,
    request_version_no INT NOT NULL,
    workflow_version_id VARCHAR(64) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    started_at DATETIME(3) NOT NULL,
    completed_at DATETIME(3) NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (approval_id),
    KEY logistics_approvals_request_idx (request_id),
    KEY logistics_approvals_status_idx (status),
    CONSTRAINT logistics_approvals_request_fk FOREIGN KEY (request_id)
      REFERENCES logistics_requests (request_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_approval_steps (
    step_id VARCHAR(64) NOT NULL,
    approval_id VARCHAR(64) NOT NULL,
    sequence_no INT NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    role_code VARCHAR(191) NOT NULL,
    assignee_user_id VARCHAR(191) NULL,
    decision VARCHAR(32) NOT NULL DEFAULT 'pending',
    comment TEXT NULL,
    deadline_at DATETIME(3) NULL,
    decided_at DATETIME(3) NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (step_id),
    UNIQUE KEY logistics_approval_steps_sequence_uq (approval_id, sequence_no),
    KEY logistics_approval_steps_assignee_idx (assignee_user_id, decision),
    CONSTRAINT logistics_approval_steps_approval_fk FOREIGN KEY (approval_id)
      REFERENCES logistics_approvals (approval_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_trips (
    trip_id VARCHAR(64) NOT NULL,
    trip_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    vehicle_id VARCHAR(191) NULL,
    driver_user_id VARCHAR(191) NULL,
    planned_departure_at DATETIME(3) NULL,
    planned_return_at DATETIME(3) NULL,
    actual_departure_at DATETIME(3) NULL,
    actual_return_at DATETIME(3) NULL,
    planned_distance_km DECIMAL(18,3) NULL,
    actual_distance_km DECIMAL(18,3) NULL,
    planned_fuel_liters DECIMAL(18,3) NULL,
    actual_fuel_liters DECIMAL(18,3) NULL,
    created_by_user_id VARCHAR(191) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (trip_id),
    UNIQUE KEY logistics_trips_number_uq (trip_number),
    KEY logistics_trips_status_idx (status),
    KEY logistics_trips_vehicle_idx (vehicle_id, planned_departure_at),
    KEY logistics_trips_driver_idx (driver_user_id, planned_departure_at),
    KEY logistics_trips_updated_idx (updated_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_trip_requests (
    trip_id VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (trip_id, request_id),
    KEY logistics_trip_requests_request_idx (request_id),
    CONSTRAINT logistics_trip_requests_trip_fk FOREIGN KEY (trip_id)
      REFERENCES logistics_trips (trip_id) ON DELETE CASCADE,
    CONSTRAINT logistics_trip_requests_request_fk FOREIGN KEY (request_id)
      REFERENCES logistics_requests (request_id) ON DELETE RESTRICT
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_document_templates (
    template_id VARCHAR(64) NOT NULL,
    template_type VARCHAR(191) NOT NULL,
    name VARCHAR(255) NOT NULL,
    version_no INT NOT NULL,
    status VARCHAR(32) NOT NULL,
    legal_entity VARCHAR(255) NULL,
    effective_from DATE NULL,
    effective_to DATE NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(191) NOT NULL,
    variables JSON NOT NULL,
    checksum_sha256 CHAR(64) NOT NULL,
    created_by_user_id VARCHAR(191) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (template_id),
    UNIQUE KEY logistics_document_templates_version_uq (template_type, version_no),
    KEY logistics_document_templates_status_idx (status),
    KEY logistics_document_templates_effective_idx (effective_from, effective_to)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_document_instances (
    document_id VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) NULL,
    trip_id VARCHAR(64) NULL,
    template_id VARCHAR(64) NOT NULL,
    template_version_no INT NOT NULL,
    document_type VARCHAR(191) NOT NULL,
    status VARCHAR(32) NOT NULL,
    source_snapshot JSON NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(191) NOT NULL,
    checksum_sha256 CHAR(64) NOT NULL,
    supersedes_document_id VARCHAR(64) NULL,
    generated_by_user_id VARCHAR(191) NOT NULL,
    generated_at DATETIME(3) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (document_id),
    KEY logistics_document_instances_request_idx (request_id),
    KEY logistics_document_instances_trip_idx (trip_id),
    KEY logistics_document_instances_template_idx (template_id),
    KEY logistics_document_instances_status_idx (status)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_config_versions (
    config_version_id VARCHAR(64) NOT NULL,
    version_no INT NOT NULL,
    status VARCHAR(32) NOT NULL,
    configuration JSON NOT NULL,
    validation_report JSON NULL,
    change_summary TEXT NULL,
    created_by_user_id VARCHAR(191) NOT NULL,
    published_by_user_id VARCHAR(191) NULL,
    published_at DATETIME(3) NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (config_version_id),
    UNIQUE KEY logistics_config_versions_no_uq (version_no),
    KEY logistics_config_versions_status_idx (status),
    KEY logistics_config_versions_published_idx (published_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_audit_events (
    audit_id VARCHAR(64) NOT NULL,
    actor_user_id VARCHAR(191) NOT NULL,
    actor_display_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(191) NOT NULL,
    entity_type VARCHAR(191) NOT NULL,
    entity_id VARCHAR(191) NOT NULL,
    reason TEXT NULL,
    before_snapshot JSON NULL,
    after_snapshot JSON NULL,
    source VARCHAR(32) NOT NULL,
    correlation_id VARCHAR(64) NOT NULL,
    request_ip VARCHAR(64) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (audit_id),
    KEY logistics_audit_entity_idx (entity_type, entity_id, created_at),
    KEY logistics_audit_actor_idx (actor_user_id, created_at),
    KEY logistics_audit_correlation_idx (correlation_id),
    KEY logistics_audit_created_idx (created_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_trip_release_checklists (
    release_id VARCHAR(64) NOT NULL,
    trip_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    checks JSON NOT NULL,
    blocking_reasons JSON NOT NULL,
    override_reason TEXT NULL,
    checked_by_user_id VARCHAR(191) NULL,
    checked_by_display_name VARCHAR(255) NULL,
    checked_at DATETIME(3) NULL,
    approved_by_user_id VARCHAR(191) NULL,
    approved_by_display_name VARCHAR(255) NULL,
    approved_at DATETIME(3) NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (release_id),
    UNIQUE KEY logistics_trip_release_trip_uq (trip_id),
    KEY logistics_trip_release_status_idx (status, updated_at),
    CONSTRAINT logistics_trip_release_trip_fk FOREIGN KEY (trip_id)
      REFERENCES logistics_trips (trip_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_document_template_contents (
    template_id VARCHAR(64) NOT NULL,
    content_html LONGTEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (template_id),
    CONSTRAINT logistics_document_template_contents_template_fk FOREIGN KEY (template_id)
      REFERENCES logistics_document_templates (template_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_document_instance_contents (
    document_id VARCHAR(64) NOT NULL,
    content_html LONGTEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (document_id),
    CONSTRAINT logistics_document_instance_contents_document_fk FOREIGN KEY (document_id)
      REFERENCES logistics_document_instances (document_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_document_package_rules (
    rule_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    event_code VARCHAR(64) NOT NULL,
    request_kind VARCHAR(32) NULL,
    requires_business_trip TINYINT(1) NULL,
    requires_waybill TINYINT(1) NULL,
    requires_consignment_note TINYINT(1) NULL,
    template_type VARCHAR(191) NOT NULL,
    sequence_no INT NOT NULL DEFAULT 1,
    required_flag TINYINT(1) NOT NULL DEFAULT 1,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_by_user_id VARCHAR(191) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (rule_id),
    KEY logistics_document_package_rules_event_idx (event_code, active, sequence_no),
    KEY logistics_document_package_rules_template_idx (template_type)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
];

const requiredTables = [
  "logistics_requests",
  "logistics_request_stops",
  "logistics_request_versions",
  "logistics_approvals",
  "logistics_approval_steps",
  "logistics_trips",
  "logistics_trip_requests",
  "logistics_document_templates",
  "logistics_document_instances",
  "logistics_config_versions",
  "logistics_audit_events",
  "logistics_trip_release_checklists",
  "logistics_document_template_contents",
  "logistics_document_instance_contents",
  "logistics_document_package_rules",
];

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  charset: "utf8mb4",
});

try {
  for (const statement of statements) {
    await connection.execute(statement);
  }

  const [rows] = await connection.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
    [process.env.DB_NAME],
  );
  const existing = new Set(rows.map((row) => row.TABLE_NAME || row.table_name));
  const missingTables = requiredTables.filter((table) => !existing.has(table));
  if (missingTables.length) {
    throw new Error(`Logistics schema bootstrap incomplete: ${missingTables.join(", ")}`);
  }

  console.log(`Logistics schema ready: ${requiredTables.length} tables verified`);
} finally {
  await connection.end();
}
