# ERP core model plan

Дата: 2026-05-10
Проект: `dispatcher-system`
Область: Этап 3 из `docs/ERP_IMPLEMENTATION_PLAN.md`

## Краткий вывод

Текущий справочник техники уже полезен и рабочий, но это еще не ERP-модель. Сейчас `VehicleRow` совмещает паспорт техники, текущую принадлежность к участку, производственные показатели смены, состояние ремонта/простоя и временные расчетные поля. Для ERP нужно сохранить совместимость текущего `vehicles` read/write path и параллельно подготовить нормализованные таблицы: `vehicle_cards`, истории статусов и участков, документы, договорные и GPS-связи, справочник участков, пользователей, ролей и server-side access matrix.

Разрушительная миграция в этом спринте не выполнялась.

## Текущая модель техники

Основной тип: `VehicleRow` в `lib/domain/vehicles/types.ts`.
Текущая MySQL таблица: `vehicles` в `lib/server/mysql/schema-definitions.ts`.

Текущий storage pattern:

- `vehicles.vehicle_id` - числовой id;
- индексируемые поля: `sort_index`, `visible`, `category`, `equipment_type`, `brand`, `model`, `plate_number`, `garage_number`, `owner`;
- полная карточка хранится в `data JSON`;
- клиентские операции идут через `/api/database` resource `vehicles`: `load`, `save`, `savePatch`, `replace`, `delete`;
- fallback/seed: `data/default-vehicles.json`, `lib/domain/vehicles/defaults.ts`.

## Классификация полей `VehicleRow`

| Поле | Текущая роль | Целевая ERP-категория | Комментарий |
|---|---|---|---|
| `id` | Идентификатор строки | Паспорт/primary key или legacy id | Нужна стабильная связка с будущим `vehicle_cards.vehicle_id`. |
| `name` | Display name | Временное/расчетное поле | Лучше строить из brand/model/garage/plate, не хранить как source of truth. |
| `brand`, `model`, `manufactureYear`, `vin` | Технические сведения | Паспортные данные | Остаются в `vehicle_cards`. |
| `plateNumber`, `garageNumber` | Учетные номера | Паспортные/регистрационные данные | Нужны уникальные индексы с учетом пустых значений и истории смены номеров. |
| `vehicleType`, `equipmentType` | Категория/тип | Паспорт + классификаторы | В будущем вынести в справочники vehicle categories/equipment types. |
| `fuelNormWinter`, `fuelNormSummer`, `fuelCalcType` | Нормы топлива | Производственный норматив | Не запускать топливный модуль сейчас; сохранить как поля карточки или отдельные нормы по периодам позже. |
| `owner`, `contractor` | Владелец/подрядчик | Договорная принадлежность | Должно перейти в `vehicle_contract_links` и справочник контрагентов. |
| `area` | Участок | Текущее состояние + история | Должно перейти в `vehicle_section_history`. |
| `location` | Место/позиция | Текущее состояние или событие | Для ERP лучше хранить как status/location event, не как вечное поле карточки. |
| `workType` | Вид работы | Производственные данные | Должно быть частью сменной сводки/назначения, не master data. |
| `excavator` | Связка с экскаватором | Производственное назначение/событие | Должно быть assignment/event, особенно для самосвалов. |
| `work`, `rent`, `repair`, `downtime`, `trips` | Часы/рейсы/состояния | Временные/сменные агрегаты | Не должны жить в карточке техники. Нужны shift report lines, status events, downtime/repair events. |
| `active`, `visible` | Флаги отображения/активности | Текущее состояние карточки | `active` оставить как lifecycle status; `visible` как UI/archive flag или заменить статусом. |

## Проблемы текущей модели

1. Карточка техники смешана с оперативной сменной информацией.
2. История участков, статусов, договоров, ремонтов и простоев не нормализована.
3. `data JSON` помогает совместимости, но ограничивает серверные фильтры, audit и права.
4. `area`, `contractor`, `workType`, `excavator` могут меняться во времени, но сейчас выглядят как постоянные свойства.
5. Производственные агрегаты (`work`, `rent`, `repair`, `downtime`, `trips`) могут конфликтовать с будущими сменными сводками.
6. Нет отдельной таблицы документов техники.
7. Нет server-side section scope для техники.
8. Excel import/export и текущий inline grid завязаны на `VehicleRow`, поэтому миграция должна быть совместимой.

## Целевая ERP-модель техники

| Таблица | Назначение | Ключевые поля |
|---|---|---|
| `vehicle_cards` | Основная карточка техники | `vehicle_id`, `legacy_vehicle_id`, `display_name`, `brand`, `model`, `plate_number`, `garage_number`, `vehicle_type_id`, `equipment_type_id`, `manufacture_year`, `vin`, `owner_party_id`, `fuel_calc_type`, `fuel_norm_winter`, `fuel_norm_summer`, `lifecycle_status`, `visible`, `created_at`, `updated_at`, `version` |
| `vehicle_status_history` | История состояния техники | `status_id`, `vehicle_id`, `status`, `reason`, `started_at`, `ended_at`, `section_id`, `source_module`, `source_entity_id`, `created_by_user_id`, `created_at` |
| `vehicle_section_history` | История закрепления за участками | `history_id`, `vehicle_id`, `section_id`, `started_at`, `ended_at`, `assignment_kind`, `comment`, `created_by_user_id`, `created_at` |
| `vehicle_documents` | Документы техники | `document_id`, `vehicle_id`, `document_type`, `number`, `issued_at`, `expires_at`, `file_ref`, `status`, `created_by_user_id`, `created_at`, `updated_at` |
| `vehicle_contract_links` | Связь техники с подрядчиками/договорами | `link_id`, `vehicle_id`, `party_id`, `contract_id`, `started_at`, `ended_at`, `rate_policy_id`, `active`, `created_at` |
| `vehicle_gps_links` | Связь техники с GPS/Wialon сущностями | `link_id`, `vehicle_id`, `provider`, `external_unit_id`, `terminal_id`, `started_at`, `ended_at`, `active`, `created_at` |
| `vehicle_import_batches` | Контроль Excel/import миграций | `batch_id`, `source`, `created_by_user_id`, `created_at`, `accepted_rows`, `rejected_rows`, `status` |

Важно: `vehicle_contract_links` и `vehicle_gps_links` проектируются как связи ядра, но в этом спринте не запускают модули договоров или GPS/Wialon.

## Проект справочника участков

| Таблица | Назначение | Ключевые поля |
|---|---|---|
| `sections` | Справочник участков | `section_id`, `code`, `name`, `short_name`, `parent_section_id`, `site_name`, `timezone`, `active`, `sort_order`, `created_at`, `updated_at` |
| `section_schedules` | Графики смен и cut-off | `schedule_id`, `section_id`, `schedule_code`, `shift_mode`, `day_shift_start`, `night_shift_start`, `cut_off_time`, `effective_from`, `effective_to`, `active` |
| `section_managers` | Ответственные по участкам | `manager_id`, `section_id`, `user_id`, `role_in_section`, `started_at`, `ended_at`, `active` |
| `section_vehicle_assignments` | Текущее закрепление техники | `assignment_id`, `section_id`, `vehicle_id`, `started_at`, `ended_at`, `assignment_kind`, `active` |
| `section_user_scope` | Видимость/права пользователей по участкам | `scope_id`, `user_id`, `section_id`, `scope_kind`, `started_at`, `ended_at`, `active` |

Базовые правила:

- участок имеет `active/inactive` статус;
- cut-off time хранится в schedule, а не в UI defaults;
- shift schedule должен быть versioned по `effective_from/effective_to`;
- связь техники с участком хранится исторически;
- связь пользователя с участком используется серверной авторизацией, а не только UI-фильтром.

## Текущая система пользователей и ролей

Текущие сущности:

- `AuthUserRole`: `dispatch-chief`, `dispatcher`, `admin`;
- `auth_users`: login, ФИО, контакты, role, `can_manage_users`, `tab_permissions`, active, password hash;
- `tab_permissions`: `{ view, edit }` по вкладкам;
- superuser logic: `dispatch-chief` и `admin` получают view/edit на вкладки;
- `/api/database` уже проверяет серверные права, но будущие module actions пока сопоставляются с текущими tab permissions.

Проблема: tab permissions - это навигационный/UI уровень. Для ERP нужны server-side права по пользователю, роли, участку, модулю, действию и workflow status.

## Проект server-side матрицы доступа

Целевые действия:

`read`, `create`, `update`, `delete`, `approve`, `close`, `export`, `import`, `admin`.

| Таблица | Назначение | Ключевые поля |
|---|---|---|
| `erp_roles` | Роли ERP | `role_id`, `code`, `name`, `description`, `active`, `created_at`, `updated_at` |
| `erp_user_roles` | Назначение ролей пользователям | `user_role_id`, `user_id`, `role_id`, `section_id`, `started_at`, `ended_at`, `active` |
| `erp_role_permissions` | Права роли | `permission_id`, `role_id`, `module`, `action`, `section_scoped`, `conditions_json`, `active` |
| `erp_user_permissions` | Индивидуальные исключения | `permission_id`, `user_id`, `module`, `action`, `section_id`, `effect`, `reason`, `active` |
| `erp_user_section_scope` | Область видимости пользователя | `scope_id`, `user_id`, `section_id`, `scope_kind`, `started_at`, `ended_at`, `active` |
| `erp_access_audit` | История изменения прав | `audit_id`, `actor_user_id`, `target_user_id`, `entity_type`, `entity_id`, `old_value`, `new_value`, `reason`, `created_at` |

Server-side проверка должна принимать:

- текущего пользователя из session cookie;
- `module`;
- `action`;
- `section_id` или другой scope из payload/query;
- entity owner/status/version, если action workflow-зависимый;
- deny/allow с audit-friendly reason.

## Какие миграции нужны

Миграции должны быть неразрушительными и не применяться автоматически в этом спринте.

1. Создать новые таблицы `sections`, `section_schedules`, `section_managers`, `section_user_scope`.
2. Создать новые таблицы `vehicle_cards`, `vehicle_status_history`, `vehicle_section_history`, `vehicle_documents`, `vehicle_contract_links`, `vehicle_gps_links`.
3. Создать таблицы RBAC/ABAC: `erp_roles`, `erp_user_roles`, `erp_role_permissions`, `erp_user_permissions`, `erp_user_section_scope`, `erp_access_audit`.
4. Добавить nullable legacy links: `legacy_vehicle_id`, `legacy_snapshot_hash`, `source`.
5. Подготовить backfill script, который читает текущий `vehicles.data` и пишет в новые таблицы без удаления старой таблицы.
6. Подготовить compatibility view/read model, который собирает `VehicleRow` из новых таблиц для старого UI.
7. Только после сверки включать dual-read или staged switch.

## Какие API handlers нужны через `/api/database`

Новые `app/api/<module>` routes не нужны. Все действия должны стать resource/action внутри текущего router.

| Resource | Actions | Статус |
|---|---|---|
| `vehicles` | legacy `load`, `save`, `savePatch`, `replace`, `delete` | Оставить для совместимости. |
| `vehicle-core` | `list-vehicle-cards`, `get-vehicle-card`, `patch-vehicle-card`, `list-vehicle-status-history`, `list-vehicle-section-history` | План, не подключать до схем и тестов. |
| `sections` | `list-sections`, `get-section`, `create-section`, `patch-section`, `archive-section`, `list-section-schedules`, `patch-section-schedule` | План. |
| `access-matrix` | `list-role-permissions`, `patch-role-permission`, `list-user-section-scope`, `patch-user-section-scope` | Уже есть planned contract layer; нужен live handler позже. |
| `audit` | `list-entity-changes`, `create-restore-audit-entry` | План для server-side audit trail. |

Каждый future handler должен иметь:

- auth requirement;
- section scope validation;
- query policy с bounded pagination;
- expected version для update;
- audit trail;
- tests before live registration.

## Какие UI-экраны будут затронуты

| Экран | Как затрагивается | Правило безопасности |
|---|---|---|
| Admin Vehicles inline grid | Должен сохранить `VehicleRow` compatibility на переходный период | Не менять формат сохранения без migration/read model. |
| Fleet/Техника readonly list | Должен продолжать читать совместимые vehicle rows | Не ломать текущие фильтры и списки. |
| PTO buckets/производительность | Использует технику для ковшей/кузовов/производительности | Перед миграцией проверить Excel, формулы, bucket columns. |
| Reports | Используют технику и ПТО как источник отчетов | Не переключать на новую модель без prepared aggregates. |
| Admin Structure | Может стать UI для `sections` | Пока не считать текущую структуру production справочником участков. |
| Users/Profile/UserManagement | Станут UI для ролей и section scope | Tab permissions оставить как legacy navigation layer. |
| Admin Access Matrix | Сейчас preview | Не считать production authorization до live server-side checks. |

## Риски для текущего ПТО и отчетов

1. Если убрать или переименовать поля `VehicleRow`, сломаются Excel import/export, buckets и reports.
2. Если `area` перевести в историю без compatibility read model, текущие фильтры и отчеты потеряют участок.
3. Если `work/repair/downtime/trips` удалить из карточки без сменных документов, текущие preview/fleet показатели исчезнут.
4. Если roles заменить сразу, можно сломать вход, регистрацию и доступ к админке.
5. Если live handlers подключить до query policy и server auth, planned ERP modules создадут иллюзию готовности.

## План безопасной миграции без потери данных

1. Зафиксировать текущий MySQL backup и snapshot `vehicles`.
2. Добавить новые таблицы как пустые, nullable, без удаления `vehicles`.
3. Создать dry-run backfill report: сколько строк техники распознано, какие поля пустые, где есть дубли garage/plate/vin.
4. Запустить backfill только в отдельном migration script с логом batch id.
5. Сверить counts и hashes между `vehicles.data` и `vehicle_cards`.
6. Сделать compatibility read model `VehicleRow` из новых таблиц.
7. Включить dual-read сравнение в dev/staging, не меняя production write path.
8. Перевести UI чтение на read model только после тестов ПТО/отчетов/техники.
9. Перевести write path на versioned patch только после server audit и expected version.
10. Сохранить rollback: legacy `vehicles` остается источником до полного acceptance.

## Что можно оставить

- текущий `VehicleRow` как compatibility DTO;
- текущий `/api/database` resource `vehicles`;
- Admin Vehicles inline grid как рабочий UI;
- MySQL table `vehicles` до завершения миграции;
- Supabase/localStorage fallback как recovery, но не как ERP source of truth.

## Что нужно создать заново

- нормализованный справочник участков;
- server-side role/user/section/module/action access matrix;
- истории статусов и участков техники;
- документы техники;
- договорные и GPS-связи как core links без запуска самих модулей;
- server-side audit trail для changes/restore/migration.

## Следующий безопасный шаг

Перед Этапом 4 нужно подготовить draft MySQL migration plan и dry-run analyzer для `vehicles -> vehicle_cards`, а также минимальную server-side матрицу `role/user/section/module/action`. Только после этого можно начинать нормализованную сменную сводку, потому что она должна ссылаться на стабильные `vehicle_id`, `section_id`, `user_id` и права.
