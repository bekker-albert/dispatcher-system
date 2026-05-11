# ERP core draft migrations

Р”Р°С‚Р°: 2026-05-10
РЎС‚Р°С‚СѓСЃ: draft/staged, РЅРµ РїСЂРёРјРµРЅСЏС‚СЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё
РћР±Р»Р°СЃС‚СЊ: РїРѕРґРіРѕС‚РѕРІРєР° ERP-СЏРґСЂР° С‚РµС…РЅРёРєРё, СѓС‡Р°СЃС‚РєРѕРІ Рё РїСЂР°РІ

## РџСЂРёРЅС†РёРїС‹

- Р­С‚РѕС‚ РґРѕРєСѓРјРµРЅС‚ РЅРµ СЏРІР»СЏРµС‚СЃСЏ runtime migration Рё РЅРµ РїРѕРґРєР»СЋС‡РµРЅ Рє `lib/server/mysql/schema-definitions.ts`.
- РўРµРєСѓС‰Р°СЏ С‚Р°Р±Р»РёС†Р° `vehicles` РЅРµ СѓРґР°Р»СЏРµС‚СЃСЏ Рё РЅРµ РјРµРЅСЏРµС‚СЃСЏ СЂР°Р·СЂСѓС€РёС‚РµР»СЊРЅРѕ.
- Backfill РЅРµ РІС‹РїРѕР»РЅСЏРµС‚СЃСЏ РІ СЌС‚РѕРј СЃРїСЂРёРЅС‚Рµ.
- Р’СЃРµ СЃРІСЏР·Рё СЃРѕ СЃС‚Р°СЂРѕР№ РјРѕРґРµР»СЊСЋ РёРґСѓС‚ С‡РµСЂРµР· nullable legacy fields.
- Р’СЃРµ production handlers РѕСЃС‚Р°СЋС‚СЃСЏ Р·Р° РµРґРёРЅС‹Рј `/api/database`; РЅРѕРІС‹Рµ `app/api/<module>` routes РЅРµ СЃРѕР·РґР°СЋС‚СЃСЏ.
- Seed-РґР°РЅРЅС‹Рµ РЅРµ РґРѕР±Р°РІР»СЏСЋС‚СЃСЏ: СЃРїСЂР°РІРѕС‡РЅРёРєРё Р±СѓРґСѓС‚ Р·Р°РїРѕР»РЅСЏС‚СЊСЃСЏ РѕС‚РґРµР»СЊРЅС‹Рј reviewable seed/backfill С€Р°РіРѕРј.

## РЎРїРёСЃРѕРє Р±СѓРґСѓС‰РёС… С‚Р°Р±Р»РёС†

| РўР°Р±Р»РёС†Р° | РќР°Р·РЅР°С‡РµРЅРёРµ | РЎС‚Р°С‚СѓСЃ РїРµСЂРІРѕРіРѕ СЌС‚Р°РїР° |
|---|---|---|
| `sections` | РЎРїСЂР°РІРѕС‡РЅРёРє СѓС‡Р°СЃС‚РєРѕРІ | РќРѕРІР°СЏ master table |
| `section_schedules` | Р“СЂР°С„РёРєРё СЃРјРµРЅ, cut-off time | РќРѕРІР°СЏ history/effective table |
| `section_managers` | РћС‚РІРµС‚СЃС‚РІРµРЅРЅС‹Рµ РїРѕ СѓС‡Р°СЃС‚РєР°Рј | РќРѕРІР°СЏ link/history table |
| `section_user_scope` | РћРїРµСЂР°С†РёРѕРЅРЅР°СЏ РѕР±Р»Р°СЃС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїРѕ СѓС‡Р°СЃС‚РєР°Рј | РќРѕРІР°СЏ link/history table |
| `vehicle_cards` | РќРѕСЂРјР°Р»РёР·РѕРІР°РЅРЅР°СЏ РєР°СЂС‚РѕС‡РєР° С‚РµС…РЅРёРєРё | РџР°СЂР°Р»Р»РµР»СЊРЅРѕ legacy `vehicles` |
| `vehicle_status_history` | РСЃС‚РѕСЂРёСЏ СЃС‚Р°С‚СѓСЃРѕРІ С‚РµС…РЅРёРєРё | РќРѕРІР°СЏ event/history table |
| `vehicle_section_history` | РСЃС‚РѕСЂРёСЏ Р·Р°РєСЂРµРїР»РµРЅРёСЏ С‚РµС…РЅРёРєРё Р·Р° СѓС‡Р°СЃС‚РєР°РјРё | РќРѕРІР°СЏ event/history table |
| `vehicle_documents` | Р”РѕРєСѓРјРµРЅС‚С‹ С‚РµС…РЅРёРєРё | РќРѕРІР°СЏ document table |
| `vehicle_contract_links` | РЎРІСЏР·Рё С‚РµС…РЅРёРєРё СЃ РєРѕРЅС‚СЂР°РіРµРЅС‚Р°РјРё/РґРѕРіРѕРІРѕСЂР°РјРё | Link table, РІРЅРµС€РЅРёРµ contracts РїРѕРєР° legacy/deferred |
| `vehicle_gps_links` | РЎРІСЏР·Рё С‚РµС…РЅРёРєРё СЃ GPS/Wialon РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂР°РјРё | Link table, GPS РјРѕРґСѓР»СЊ РЅРµ Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ |
| `erp_roles` | ERP-СЂРѕР»Рё | РќРѕРІР°СЏ master table |
| `erp_user_roles` | РќР°Р·РЅР°С‡РµРЅРёСЏ СЂРѕР»РµР№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРј | Link/history table |
| `erp_role_permissions` | РџСЂР°РІР° СЂРѕР»РµР№ РїРѕ module/action | Permission table |
| `erp_user_permissions` | РРЅРґРёРІРёРґСѓР°Р»СЊРЅС‹Рµ allow/deny РёСЃРєР»СЋС‡РµРЅРёСЏ | Permission override table |
| `erp_user_section_scope` | Authorization scope РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїРѕ СѓС‡Р°СЃС‚РєР°Рј | Link/history table |
| `erp_access_audit` | Audit РёР·РјРµРЅРµРЅРёР№ РїСЂР°РІ | Audit table |
| `vehicle_import_batches` | Batch metadata РґР»СЏ Р±СѓРґСѓС‰РёС… import/backfill | Control table |

## Nullable РїРѕР»СЏ РїРµСЂРІРѕРіРѕ СЌС‚Р°РїР°

РќР° РїРµСЂРІРѕРј СЌС‚Р°РїРµ nullable РѕСЃС‚Р°РІР»СЏСЋС‚СЃСЏ РїРѕР»СЏ, РєРѕС‚РѕСЂС‹Рµ РЅРµР»СЊР·СЏ РіР°СЂР°РЅС‚РёСЂРѕРІР°РЅРЅРѕ Р·Р°РїРѕР»РЅРёС‚СЊ РёР· `vehicles.data` РёР»Рё `data/default-vehicles.json`:

- `sections.parent_section_id`, `sections.site_name`;
- `section_schedules.effective_to`;
- РІСЃРµ `ended_at`;
- `vehicle_cards.vin`, `manufacture_year`, `owner_party_id`, `legacy_snapshot_hash`;
- `vehicle_status_history.section_id`, `reason`, `source_module`, `source_entity_id`, `ended_at`;
- `vehicle_section_history.ended_at`, `comment`;
- `vehicle_documents.number`, `issued_at`, `expires_at`, `file_ref`;
- `vehicle_contract_links.party_id`, `contract_id`, `rate_policy_id`;
- `vehicle_gps_links.external_unit_id`, `terminal_id`;
- `erp_*` РїРѕР»СЏ `ended_at`, `conditions_json`, `reason`, `section_id` С‚Р°Рј, РіРґРµ scope РјРѕР¶РµС‚ Р±С‹С‚СЊ РіР»РѕР±Р°Р»СЊРЅС‹Рј.

## SQL draft

```sql
-- ERP core draft migration.
-- Do not run automatically. Review, backup, and execute manually in staging first.

CREATE TABLE IF NOT EXISTS sections (
  section_id BIGINT NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(191) NOT NULL,
  short_name VARCHAR(64) NULL,
  parent_section_id BIGINT NULL,
  site_name VARCHAR(191) NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Qyzylorda',
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (section_id),
  UNIQUE KEY sections_code_uidx (code),
  KEY sections_parent_idx (parent_section_id),
  KEY sections_active_idx (active, sort_order),
  KEY sections_updated_idx (updated_at),
  CONSTRAINT sections_parent_fk
    FOREIGN KEY (parent_section_id) REFERENCES sections(section_id)
    ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS section_schedules (
  schedule_id BIGINT NOT NULL AUTO_INCREMENT,
  section_id BIGINT NOT NULL,
  schedule_code VARCHAR(64) NOT NULL,
  shift_mode VARCHAR(64) NOT NULL,
  day_shift_start TIME NULL,
  night_shift_start TIME NULL,
  cut_off_time TIME NULL,
  effective_from DATE NOT NULL,
  effective_to DATE NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (schedule_id),
  KEY section_schedules_section_idx (section_id, active),
  KEY section_schedules_effective_idx (section_id, effective_from, effective_to),
  KEY section_schedules_updated_idx (updated_at),
  CONSTRAINT section_schedules_section_fk
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
    ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS section_managers (
  manager_id BIGINT NOT NULL AUTO_INCREMENT,
  section_id BIGINT NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  role_in_section VARCHAR(64) NOT NULL,
  started_at TIMESTAMP(3) NOT NULL,
  ended_at TIMESTAMP(3) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (manager_id),
  KEY section_managers_section_idx (section_id, active),
  KEY section_managers_user_idx (user_id, active),
  KEY section_managers_dates_idx (started_at, ended_at),
  CONSTRAINT section_managers_section_fk
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
    ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS section_user_scope (
  scope_id BIGINT NOT NULL AUTO_INCREMENT,
  section_id BIGINT NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  scope_kind VARCHAR(64) NOT NULL,
  started_at TIMESTAMP(3) NOT NULL,
  ended_at TIMESTAMP(3) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (scope_id),
  KEY section_user_scope_section_idx (section_id, active),
  KEY section_user_scope_user_idx (user_id, active),
  KEY section_user_scope_dates_idx (started_at, ended_at),
  CONSTRAINT section_user_scope_section_fk
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
    ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_import_batches (
  batch_id BIGINT NOT NULL AUTO_INCREMENT,
  source VARCHAR(191) NOT NULL,
  source_file_ref VARCHAR(512) NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'draft',
  accepted_rows INT NOT NULL DEFAULT 0,
  rejected_rows INT NOT NULL DEFAULT 0,
  created_by_user_id VARCHAR(64) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (batch_id),
  KEY vehicle_import_batches_status_idx (status, created_at),
  KEY vehicle_import_batches_user_idx (created_by_user_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_cards (
  vehicle_id BIGINT NOT NULL AUTO_INCREMENT,
  legacy_vehicle_id BIGINT NULL,
  legacy_snapshot_hash VARCHAR(128) NULL,
  import_batch_id BIGINT NULL,
  display_name VARCHAR(255) NOT NULL,
  brand VARCHAR(191) NULL,
  model VARCHAR(191) NULL,
  plate_number VARCHAR(191) NULL,
  garage_number VARCHAR(191) NULL,
  vehicle_type_code VARCHAR(64) NULL,
  equipment_type_code VARCHAR(64) NULL,
  manufacture_year VARCHAR(16) NULL,
  vin VARCHAR(191) NULL,
  owner_party_id BIGINT NULL,
  fuel_calc_type VARCHAR(64) NULL,
  fuel_norm_winter DECIMAL(12, 3) NULL,
  fuel_norm_summer DECIMAL(12, 3) NULL,
  lifecycle_status VARCHAR(64) NOT NULL DEFAULT 'active',
  active TINYINT(1) NOT NULL DEFAULT 1,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (vehicle_id),
  UNIQUE KEY vehicle_cards_legacy_vehicle_uidx (legacy_vehicle_id),
  KEY vehicle_cards_plate_idx (plate_number),
  KEY vehicle_cards_garage_idx (garage_number),
  KEY vehicle_cards_vin_idx (vin),
  KEY vehicle_cards_status_idx (lifecycle_status, active, visible),
  KEY vehicle_cards_owner_idx (owner_party_id),
  KEY vehicle_cards_import_batch_idx (import_batch_id),
  KEY vehicle_cards_updated_idx (updated_at),
  CONSTRAINT vehicle_cards_import_batch_fk
    FOREIGN KEY (import_batch_id) REFERENCES vehicle_import_batches(batch_id)
    ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_status_history (
  status_id BIGINT NOT NULL AUTO_INCREMENT,
  vehicle_id BIGINT NOT NULL,
  section_id BIGINT NULL,
  status VARCHAR(64) NOT NULL,
  reason VARCHAR(255) NULL,
  started_at TIMESTAMP(3) NOT NULL,
  ended_at TIMESTAMP(3) NULL,
  source_module VARCHAR(64) NULL,
  source_entity_id VARCHAR(191) NULL,
  created_by_user_id VARCHAR(64) NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (status_id),
  KEY vehicle_status_vehicle_idx (vehicle_id, started_at, ended_at),
  KEY vehicle_status_section_idx (section_id, started_at),
  KEY vehicle_status_status_idx (status, started_at),
  KEY vehicle_status_source_idx (source_module, source_entity_id),
  CONSTRAINT vehicle_status_vehicle_fk
    FOREIGN KEY (vehicle_id) REFERENCES vehicle_cards(vehicle_id)
    ON DELETE RESTRICT,
  CONSTRAINT vehicle_status_section_fk
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
    ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_section_history (
  history_id BIGINT NOT NULL AUTO_INCREMENT,
  vehicle_id BIGINT NOT NULL,
  section_id BIGINT NOT NULL,
  assignment_kind VARCHAR(64) NOT NULL DEFAULT 'primary',
  started_at TIMESTAMP(3) NOT NULL,
  ended_at TIMESTAMP(3) NULL,
  comment TEXT NULL,
  created_by_user_id VARCHAR(64) NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (history_id),
  KEY vehicle_section_vehicle_idx (vehicle_id, started_at, ended_at),
  KEY vehicle_section_section_idx (section_id, started_at, ended_at),
  KEY vehicle_section_active_idx (vehicle_id, ended_at),
  CONSTRAINT vehicle_section_vehicle_fk
    FOREIGN KEY (vehicle_id) REFERENCES vehicle_cards(vehicle_id)
    ON DELETE RESTRICT,
  CONSTRAINT vehicle_section_section_fk
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
    ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_documents (
  document_id BIGINT NOT NULL AUTO_INCREMENT,
  vehicle_id BIGINT NOT NULL,
  document_type VARCHAR(64) NOT NULL,
  number VARCHAR(191) NULL,
  issued_at DATE NULL,
  expires_at DATE NULL,
  file_ref VARCHAR(512) NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'active',
  created_by_user_id VARCHAR(64) NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (document_id),
  KEY vehicle_documents_vehicle_idx (vehicle_id, status),
  KEY vehicle_documents_type_idx (document_type, status),
  KEY vehicle_documents_expires_idx (expires_at),
  CONSTRAINT vehicle_documents_vehicle_fk
    FOREIGN KEY (vehicle_id) REFERENCES vehicle_cards(vehicle_id)
    ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_contract_links (
  link_id BIGINT NOT NULL AUTO_INCREMENT,
  vehicle_id BIGINT NOT NULL,
  party_id BIGINT NULL,
  contract_id BIGINT NULL,
  legacy_owner_name VARCHAR(255) NULL,
  legacy_contractor_name VARCHAR(255) NULL,
  rate_policy_id BIGINT NULL,
  started_at TIMESTAMP(3) NOT NULL,
  ended_at TIMESTAMP(3) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (link_id),
  KEY vehicle_contract_vehicle_idx (vehicle_id, active),
  KEY vehicle_contract_party_idx (party_id, active),
  KEY vehicle_contract_contract_idx (contract_id, active),
  KEY vehicle_contract_dates_idx (started_at, ended_at),
  CONSTRAINT vehicle_contract_vehicle_fk
    FOREIGN KEY (vehicle_id) REFERENCES vehicle_cards(vehicle_id)
    ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_gps_links (
  link_id BIGINT NOT NULL AUTO_INCREMENT,
  vehicle_id BIGINT NOT NULL,
  provider VARCHAR(64) NOT NULL,
  external_unit_id VARCHAR(191) NULL,
  terminal_id VARCHAR(191) NULL,
  started_at TIMESTAMP(3) NOT NULL,
  ended_at TIMESTAMP(3) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (link_id),
  KEY vehicle_gps_vehicle_idx (vehicle_id, active),
  KEY vehicle_gps_provider_idx (provider, external_unit_id),
  KEY vehicle_gps_dates_idx (started_at, ended_at),
  CONSTRAINT vehicle_gps_vehicle_fk
    FOREIGN KEY (vehicle_id) REFERENCES vehicle_cards(vehicle_id)
    ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS erp_roles (
  role_id BIGINT NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(191) NOT NULL,
  description TEXT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (role_id),
  UNIQUE KEY erp_roles_code_uidx (code),
  KEY erp_roles_active_idx (active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS erp_user_roles (
  user_role_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(64) NOT NULL,
  role_id BIGINT NOT NULL,
  section_id BIGINT NULL,
  started_at TIMESTAMP(3) NOT NULL,
  ended_at TIMESTAMP(3) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_role_id),
  KEY erp_user_roles_user_idx (user_id, active),
  KEY erp_user_roles_role_idx (role_id, active),
  KEY erp_user_roles_section_idx (section_id, active),
  KEY erp_user_roles_dates_idx (started_at, ended_at),
  CONSTRAINT erp_user_roles_role_fk
    FOREIGN KEY (role_id) REFERENCES erp_roles(role_id)
    ON DELETE RESTRICT,
  CONSTRAINT erp_user_roles_section_fk
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
    ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS erp_role_permissions (
  permission_id BIGINT NOT NULL AUTO_INCREMENT,
  role_id BIGINT NOT NULL,
  module VARCHAR(64) NOT NULL,
  action VARCHAR(32) NOT NULL,
  section_scoped TINYINT(1) NOT NULL DEFAULT 0,
  conditions_json JSON NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (permission_id),
  UNIQUE KEY erp_role_permissions_uidx (role_id, module, action),
  KEY erp_role_permissions_module_idx (module, action, active),
  KEY erp_role_permissions_role_idx (role_id, active),
  CONSTRAINT erp_role_permissions_role_fk
    FOREIGN KEY (role_id) REFERENCES erp_roles(role_id)
    ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS erp_user_permissions (
  permission_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(64) NOT NULL,
  module VARCHAR(64) NOT NULL,
  action VARCHAR(32) NOT NULL,
  section_id BIGINT NULL,
  effect VARCHAR(16) NOT NULL,
  reason VARCHAR(255) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (permission_id),
  KEY erp_user_permissions_user_idx (user_id, active),
  KEY erp_user_permissions_module_idx (module, action, active),
  KEY erp_user_permissions_section_idx (section_id, active),
  CONSTRAINT erp_user_permissions_section_fk
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
    ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS erp_user_section_scope (
  scope_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(64) NOT NULL,
  section_id BIGINT NOT NULL,
  scope_kind VARCHAR(64) NOT NULL,
  started_at TIMESTAMP(3) NOT NULL,
  ended_at TIMESTAMP(3) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (scope_id),
  KEY erp_user_section_scope_user_idx (user_id, active),
  KEY erp_user_section_scope_section_idx (section_id, active),
  KEY erp_user_section_scope_dates_idx (started_at, ended_at),
  CONSTRAINT erp_user_section_scope_section_fk
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
    ON DELETE RESTRICT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS erp_access_audit (
  audit_id BIGINT NOT NULL AUTO_INCREMENT,
  actor_user_id VARCHAR(64) NULL,
  target_user_id VARCHAR(64) NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(191) NULL,
  module VARCHAR(64) NULL,
  action VARCHAR(32) NULL,
  section_id BIGINT NULL,
  decision VARCHAR(16) NULL,
  reason VARCHAR(255) NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (audit_id),
  KEY erp_access_audit_actor_idx (actor_user_id, created_at),
  KEY erp_access_audit_target_idx (target_user_id, created_at),
  KEY erp_access_audit_module_idx (module, action, created_at),
  KEY erp_access_audit_section_idx (section_id, created_at),
  CONSTRAINT erp_access_audit_section_fk
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
    ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## РРЅРґРµРєСЃС‹

РћР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РёРЅРґРµРєСЃС‹ РїРµСЂРІРѕРіРѕ СЌС‚Р°РїР°:

- `section_id`: `section_schedules`, `section_managers`, `section_user_scope`, `vehicle_status_history`, `vehicle_section_history`, `erp_user_roles`, `erp_user_permissions`, `erp_user_section_scope`, `erp_access_audit`.
- `vehicle_id`: `vehicle_status_history`, `vehicle_section_history`, `vehicle_documents`, `vehicle_contract_links`, `vehicle_gps_links`.
- `user_id`: `section_managers`, `section_user_scope`, `erp_user_roles`, `erp_user_permissions`, `erp_user_section_scope`.
- `module/action`: `erp_role_permissions`, `erp_user_permissions`, `erp_access_audit`.
- `started_at/ended_at`: РІСЃРµ history/link С‚Р°Р±Р»РёС†С‹.
- legacy: `vehicle_cards.legacy_vehicle_id`, `vehicle_cards.legacy_snapshot_hash`.
- lookup: `plate_number`, `garage_number`, `vin`, `lifecycle_status`.

## Р’РЅРµС€РЅРёРµ РєР»СЋС‡Рё

РњРѕР¶РЅРѕ РІРєР»СЋС‡РёС‚СЊ СЃСЂР°Р·Сѓ РІ staging РїРѕСЃР»Рµ РїСЂРѕРІРµСЂРєРё РїРѕСЂСЏРґРєР° СЃРѕР·РґР°РЅРёСЏ:

- `sections.parent_section_id -> sections.section_id`;
- `section_schedules.section_id -> sections.section_id`;
- `section_managers.section_id -> sections.section_id`;
- `section_user_scope.section_id -> sections.section_id`;
- `vehicle_cards.import_batch_id -> vehicle_import_batches.batch_id`;
- `vehicle_status_history.vehicle_id -> vehicle_cards.vehicle_id`;
- `vehicle_status_history.section_id -> sections.section_id`;
- `vehicle_section_history.vehicle_id -> vehicle_cards.vehicle_id`;
- `vehicle_section_history.section_id -> sections.section_id`;
- `vehicle_documents.vehicle_id -> vehicle_cards.vehicle_id`;
- `vehicle_contract_links.vehicle_id -> vehicle_cards.vehicle_id`;
- `vehicle_gps_links.vehicle_id -> vehicle_cards.vehicle_id`;
- `erp_user_roles.role_id -> erp_roles.role_id`;
- `erp_user_roles.section_id -> sections.section_id`;
- `erp_role_permissions.role_id -> erp_roles.role_id`;
- `erp_user_permissions.section_id -> sections.section_id`;
- `erp_user_section_scope.section_id -> sections.section_id`;
- `erp_access_audit.section_id -> sections.section_id`.

Р›СѓС‡С€Рµ РѕС‚Р»РѕР¶РёС‚СЊ РёР·-Р·Р° legacy compatibility:

- `vehicle_cards.legacy_vehicle_id -> vehicles.vehicle_id`: legacy rows РјРѕРіСѓС‚ Р±С‹С‚СЊ РїРµСЂРµСЃРѕР·РґР°РЅС‹/Р·Р°РјРµРЅРµРЅС‹ С‚РµРєСѓС‰РёРј UI, Р° backfill РґРѕР»Р¶РµРЅ СЃРЅР°С‡Р°Р»Р° РґРѕРєР°Р·Р°С‚СЊ СЃС‚Р°Р±РёР»СЊРЅРѕСЃС‚СЊ ids.
- `*_user_id -> auth_users.user_id`: С‚РµРєСѓС‰РёР№ auth bootstrap Рё initial user РёРјРµСЋС‚ special id; РїРµСЂРµРґ FK РЅСѓР¶РЅР° РЅРѕСЂРјР°Р»РёР·Р°С†РёСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.
- `vehicle_contract_links.party_id/contract_id`: РјРѕРґСѓР»СЊ РєРѕРЅС‚СЂР°РіРµРЅС‚РѕРІ/РґРѕРіРѕРІРѕСЂРѕРІ РµС‰Рµ РЅРµ production.
- `vehicle_gps_links.external_unit_id/terminal_id`: GPS/Wialon РЅРµ Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ РІ СЌС‚РѕРј СЃРїСЂРёРЅС‚Рµ.
- `vehicle_cards.owner_party_id`: СЃРїСЂР°РІРѕС‡РЅРёРє РєРѕРЅС‚СЂР°РіРµРЅС‚РѕРІ РµС‰Рµ РЅРµ СЃРѕР·РґР°РЅ.

## Rollback section

Rollback РєР°СЃР°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ РЅРѕРІС‹С… draft tables. РўРµРєСѓС‰СѓСЋ `vehicles` РЅРµ С‚СЂРѕРіР°С‚СЊ.

```sql
-- Rollback draft ERP core tables only.
-- Run manually only if the draft migration was applied in staging.
DROP TABLE IF EXISTS erp_access_audit;
DROP TABLE IF EXISTS erp_user_section_scope;
DROP TABLE IF EXISTS erp_user_permissions;
DROP TABLE IF EXISTS erp_role_permissions;
DROP TABLE IF EXISTS erp_user_roles;
DROP TABLE IF EXISTS erp_roles;
DROP TABLE IF EXISTS vehicle_gps_links;
DROP TABLE IF EXISTS vehicle_contract_links;
DROP TABLE IF EXISTS vehicle_documents;
DROP TABLE IF EXISTS vehicle_section_history;
DROP TABLE IF EXISTS vehicle_status_history;
DROP TABLE IF EXISTS vehicle_cards;
DROP TABLE IF EXISTS vehicle_import_batches;
DROP TABLE IF EXISTS section_user_scope;
DROP TABLE IF EXISTS section_managers;
DROP TABLE IF EXISTS section_schedules;
DROP TABLE IF EXISTS sections;
```

## Р РёСЃРєРё РјРёРіСЂР°С†РёРё

| Р РёСЃРє | Р’Р»РёСЏРЅРёРµ | РњРёС‚РёРіРёСЂРѕРІР°С‚СЊ |
|---|---|---|
| `vehicles.data` Рё seed РЅРµ РёРјРµСЋС‚ РїРѕР»РЅРѕРіРѕ `section_id` | РќРµР»СЊР·СЏ РєРѕСЂСЂРµРєС‚РЅРѕ Р·Р°РїРѕР»РЅРёС‚СЊ `vehicle_section_history` | РЎРЅР°С‡Р°Р»Р° СЃРѕР·РґР°С‚СЊ СЃРїСЂР°РІРѕС‡РЅРёРє СѓС‡Р°СЃС‚РєРѕРІ Рё mapping rules. |
| VIN С‡Р°СЃС‚Рѕ РїСѓСЃС‚РѕР№ | РќРµР»СЊР·СЏ РґРµР»Р°С‚СЊ `vin` РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рј РёР»Рё СѓРЅРёРєР°Р»СЊРЅС‹Рј РЅР° РїРµСЂРІРѕРј СЌС‚Р°РїРµ | РћСЃС‚Р°РІРёС‚СЊ nullable, Р°РЅР°Р»РёР·РёСЂРѕРІР°С‚СЊ РїРѕР·Р¶Рµ. |
| Р”СѓР±Р»Рё plate/garage РјРѕРіСѓС‚ Р±С‹С‚СЊ Р»РµРіРёС‚РёРјРЅС‹РјРё СЃР»СѓР¶РµР±РЅС‹РјРё Р·РЅР°С‡РµРЅРёСЏРјРё | РћС€РёР±РѕС‡РЅС‹Рµ unique constraints СЃР»РѕРјР°СЋС‚ import | РќР° РїРµСЂРІРѕРј СЌС‚Р°РїРµ С‚РѕР»СЊРєРѕ РЅРµСѓРЅРёРєР°Р»СЊРЅС‹Рµ РёРЅРґРµРєСЃС‹ Рё quality report. |
| `owner/contractor` РїРѕРєР° СЃС‚СЂРѕРєРё | РќРµС‚ FK РЅР° РєРѕРЅС‚СЂР°РіРµРЅС‚РѕРІ | РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ `legacy_owner_name` Рё `legacy_contractor_name`, party links РїРѕР·Р¶Рµ. |
| Auth user ids С‡Р°СЃС‚РёС‡РЅРѕ special/bootstrap | FK РЅР° `auth_users` РјРѕР¶РµС‚ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ РјРёРіСЂР°С†РёСЋ | Р’РєР»СЋС‡Р°С‚СЊ user FKs РїРѕСЃР»Рµ РЅРѕСЂРјР°Р»РёР·Р°С†РёРё auth СЏРґСЂР°. |
| Runtime schema bootstrap РјРѕР¶РµС‚ СЃР»СѓС‡Р°Р№РЅРѕ РЅР°С‡Р°С‚СЊ СЃРѕР·РґР°РІР°С‚СЊ draft tables | РќР°СЂСѓС€РёС‚ staged-РїРѕРґС…РѕРґ | РќРµ РґРѕР±Р°РІР»СЏС‚СЊ СЌС‚Рё SQL РІ `schema-definitions.ts` РґРѕ РѕС‚РґРµР»СЊРЅРѕРіРѕ СЂРµС€РµРЅРёСЏ. |
