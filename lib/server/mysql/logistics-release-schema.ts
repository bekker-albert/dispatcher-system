export const logisticsReleaseSchemaStatements = [
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
] as const;
