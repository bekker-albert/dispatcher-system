# ERP core draft migrations

Дата: 2026-05-10
Статус: draft/staged, не применять автоматически
Область: подготовка ERP-ядра техники, участков и прав

## Принципы

- Этот документ не является runtime migration и не подключен к `lib/server/mysql/schema-definitions.ts`.
- Текущая таблица `vehicles` не удаляется и не меняется разрушительно.
- Backfill не выполняется в этом спринте.
- Все связи со старой моделью идут через nullable legacy fields.
- Все production handlers остаются за единым `/api/database`; новые `app/api/<module>` routes не создаются.
- Seed-данные не добавляются: справочники будут заполняться отдельным reviewable seed/backfill шагом.

## Список будущих таблиц

| Таблица | Назначение | Статус первого этапа |
|---|---|---|
| `sections` | Справочник участков | Новая master table |
| `section_schedules` | Графики смен, cut-off time | Новая history/effective table |
| `section_managers` | Ответственные по участкам | Новая link/history table |
| `section_user_scope` | Операционная область пользователя по участкам | Новая link/history table |
| `vehicle_cards` | Нормализованная карточка техники | Параллельно legacy `vehicles` |
| `vehicle_status_history` | История статусов техники | Новая event/history table |
| `vehicle_section_history` | История закрепления техники за участками | Новая event/history table |
| `vehicle_documents` | Документы техники | Новая document table |
| `vehicle_contract_links` | Связи техники с контрагентами/договорами | Link table, внешние contracts пока legacy/deferred |
| `vehicle_gps_links` | Связи техники с GPS/Wialon идентификаторами | Link table, GPS модуль не запускается |
| `erp_roles` | ERP-роли | Новая master table |
| `erp_user_roles` | Назначения ролей пользователям | Link/history table |
| `erp_role_permissions` | Права ролей по module/action | Permission table |
| `erp_user_permissions` | Индивидуальные allow/deny исключения | Permission override table |
| `erp_user_section_scope` | Authorization scope пользователя по участкам | Link/history table |
| `erp_access_audit` | Audit изменений прав | Audit table |
| `vehicle_import_batches` | Batch metadata для будущих import/backfill | Control table |

## Nullable поля первого этапа

На первом этапе nullable оставляются поля, которые нельзя гарантированно заполнить из `vehicles.data` или `data/default-vehicles.json`:

- `sections.parent_section_id`, `sections.site_name`;
- `section_schedules.effective_to`;
- все `ended_at`;
- `vehicle_cards.vin`, `manufacture_year`, `owner_party_id`, `legacy_snapshot_hash`;
- `vehicle_status_history.section_id`, `reason`, `source_module`, `source_entity_id`, `ended_at`;
- `vehicle_section_history.ended_at`, `comment`;
- `vehicle_documents.number`, `issued_at`, `expires_at`, `file_ref`;
- `vehicle_contract_links.party_id`, `contract_id`, `rate_policy_id`;
- `vehicle_gps_links.external_unit_id`, `terminal_id`;
- `erp_*` поля `ended_at`, `conditions_json`, `reason`, `section_id` там, где scope может быть глобальным.

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

## Индексы

Обязательные индексы первого этапа:

- `section_id`: `section_schedules`, `section_managers`, `section_user_scope`, `vehicle_status_history`, `vehicle_section_history`, `erp_user_roles`, `erp_user_permissions`, `erp_user_section_scope`, `erp_access_audit`.
- `vehicle_id`: `vehicle_status_history`, `vehicle_section_history`, `vehicle_documents`, `vehicle_contract_links`, `vehicle_gps_links`.
- `user_id`: `section_managers`, `section_user_scope`, `erp_user_roles`, `erp_user_permissions`, `erp_user_section_scope`.
- `module/action`: `erp_role_permissions`, `erp_user_permissions`, `erp_access_audit`.
- `started_at/ended_at`: все history/link таблицы.
- legacy: `vehicle_cards.legacy_vehicle_id`, `vehicle_cards.legacy_snapshot_hash`.
- lookup: `plate_number`, `garage_number`, `vin`, `lifecycle_status`.

## Внешние ключи

Можно включить сразу в staging после проверки порядка создания:

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

Лучше отложить из-за legacy compatibility:

- `vehicle_cards.legacy_vehicle_id -> vehicles.vehicle_id`: legacy rows могут быть пересозданы/заменены текущим UI, а backfill должен сначала доказать стабильность ids.
- `*_user_id -> auth_users.user_id`: текущий auth bootstrap и initial user имеют special id; перед FK нужна нормализация пользователей.
- `vehicle_contract_links.party_id/contract_id`: модуль контрагентов/договоров еще не production.
- `vehicle_gps_links.external_unit_id/terminal_id`: GPS/Wialon не запускается в этом спринте.
- `vehicle_cards.owner_party_id`: справочник контрагентов еще не создан.

## Rollback section

Rollback касается только новых draft tables. Текущую `vehicles` не трогать.

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

## Риски миграции

| Риск | Влияние | Митигировать |
|---|---|---|
| `vehicles.data` и seed не имеют полного `section_id` | Нельзя корректно заполнить `vehicle_section_history` | Сначала создать справочник участков и mapping rules. |
| VIN часто пустой | Нельзя делать `vin` обязательным или уникальным на первом этапе | Оставить nullable, анализировать позже. |
| Дубли plate/garage могут быть легитимными служебными значениями | Ошибочные unique constraints сломают import | На первом этапе только неуникальные индексы и quality report. |
| `owner/contractor` пока строки | Нет FK на контрагентов | Использовать `legacy_owner_name` и `legacy_contractor_name`, party links позже. |
| Auth user ids частично special/bootstrap | FK на `auth_users` может заблокировать миграцию | Включать user FKs после нормализации auth ядра. |
| Runtime schema bootstrap может случайно начать создавать draft tables | Нарушит staged-подход | Не добавлять эти SQL в `schema-definitions.ts` до отдельного решения. |
