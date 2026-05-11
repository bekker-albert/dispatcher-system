# Stage 1 stabilization report

Дата: 2026-05-10
Проект: `dispatcher-system`
Область: Этап 1 из `docs/ERP_IMPLEMENTATION_PLAN.md`

## Краткий вывод

Текущий сайт уже имеет рабочий production data path через единый `/api/database` и MySQL. Supabase и browser storage остаются как fallback/recovery слои, но не должны считаться ERP source of truth. В этом спринте не менялись рабочие форматы ПТО, отчетов и техники; добавлены только guardrails вокруг админского восстановления browser snapshot и видимость уже существующего экрана базы.

## Что проверено

| Зона | Проверенные файлы | Вывод |
|---|---|---|
| Production data source | `.env.example`, `lib/supabase/config.ts`, `lib/data/config.ts`, `app/api/database/route.ts`, `lib/server/database/router.ts` | MySQL выбран основным источником при `NEXT_PUBLIC_DATA_PROVIDER=mysql` или server DB config. Все рабочие модульные данные идут через `/api/database`. |
| MySQL schema | `lib/server/mysql/schema-definitions.ts`, `lib/server/auth/schema.ts` | Есть runtime schema для `vehicles`, `app_settings`, `app_state`, PTO tables, `audit_logs`, auth users/requests/reset codes. Для ERP нужны явные миграции, но текущую схему не ломаем. |
| Supabase fallback | `lib/data/app-state.ts`, `lib/supabase/config.ts`, Supabase SQL files | Fallback сохранен. В production Supabase блокируется без явного `NEXT_PUBLIC_ALLOW_PRODUCTION_SUPABASE_FALLBACK=true`. |
| Browser storage | `features/app/initialAppStorage.ts`, `features/app/initialAppDatabaseBootstrap.ts`, `features/app/sharedAppStorage.ts`, `features/pto/ptoDatabaseLoadRunner.ts`, `lib/storage/client-snapshots.ts` | Используется как локальный cache/recovery слой: initial bootstrap, PTO backup, app settings cache, client snapshots. Это не ERP база. |
| Admin database screen | `features/admin/database/*`, `features/app/useAppAdminScreenProps.tsx`, `features/app/useAppAdminDatabaseProps.ts`, `lib/domain/admin/navigation.ts` | Экран уже был подключен лениво и активировался только для `adminSection === "database"`, но пункт меню отсутствовал. Вкладка включена. |
| Restore flow | `features/admin/database/useClientSnapshotsPanel.ts`, `features/pto/ptoPersistenceLoadResolution.ts` | Browser snapshot restore может привести к сохранению восстановленных локальных данных через существующий recovery path. Добавлено явное подтверждение администратора перед restore. |
| Server authorization | `lib/server/database/authorization.ts`, `lib/server/database/module-authorization.ts`, `lib/domain/auth/types.ts` | Есть server-side проверки для `/api/database`, но будущая ERP-авторизация пока опирается на tab permissions и planned access contracts. Нужна полноценная RBAC/ABAC матрица. |
| Future module handlers | `lib/server/database/module-live-handlers.ts`, `lib/domain/data-access/moduleLiveHandlerRegistry.ts` | Registry и server dispatcher есть, но live registrations пустые. Это правильно для текущего спринта: новые ERP handlers не подключались. |

## Политика источников данных

| Источник | Статус | Политика |
|---|---|---|
| MySQL через `/api/database` | Основной production source of truth | Все production-данные ERP должны читаться и писаться через единый router `/api/database`. Для новых модулей не создавать `app/api/<module>` routes. |
| Supabase fallback | Legacy/dev/emergency fallback | Допустим только если MySQL не используется или при осознанном emergency режиме. В production должен быть выключен, кроме ручного `NEXT_PUBLIC_ALLOW_PRODUCTION_SUPABASE_FALLBACK=true` после проверки RLS. |
| `localStorage` | Cache/recovery only | Допустим для локального UI состояния, восстановления старого браузера, временного draft/cache и offline safety backup. Не является ERP source of truth. |
| `sessionStorage` | Runtime flag only | Допустим для одноразовых флагов вроде `dispatcher:restore-client-snapshot` и временных UI overrides. Не хранит production данные. |
| JSON/default data | Seed/demo/fallback | Можно использовать для первичного seed и preview. Нельзя считать production-справочником без миграции в MySQL. |

## Правила восстановления данных

1. Нормальная загрузка должна брать данные из MySQL, если он настроен.
2. Локальные PTO/app snapshots могут использоваться только для recovery, когда локальная копия явно новее или администратор вручную восстанавливает browser snapshot.
3. Перед загрузкой данных из базы текущий локальный PTO backup сохраняется, чтобы не потерять пользовательский state.
4. Browser snapshot restore теперь требует явного `window.confirm` в `useClientSnapshotsPanel`.
5. Автоматическое затирание MySQL локальным snapshot без действия администратора запрещено политикой. Текущий recovery path все еще может выполнить full save после подтвержденного restore, поэтому следующий шаг - server-side restore workflow с audit entry, expected version и отдельным правом `admin`.

## AdminDatabaseSection

Экран базы данных оставлен как рабочий recovery/admin экран и сделан видимым в админке:

- он lazy-loaded через `features/app/lazySections.ts`;
- props рассчитываются только для `adminSection === "database"`;
- список snapshots грузится только при `active`;
- restore теперь требует явного подтверждения;
- экран не меняет поведение ПТО, отчетов и техники до выбора вкладки.

Оставшийся статус: `production recovery utility`, но не полноценная DB admin console. На следующем этапе нужно добавить серверный audit restore, health details, роли доступа и запрет restore без отдельного ERP permission.

## Runtime config и `.env.example`

Проверено:

- секреты не заполнены;
- MySQL переменные указаны явно: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`;
- production data policy описана рядом с `NEXT_PUBLIC_DATA_PROVIDER=mysql`;
- auth/session переменные указаны явно: `AUTH_REQUIRED`, `AUTH_SESSION_SECRET`, initial admin credentials placeholders;
- сохранен guardrail: `AUTH_REQUIRED=false is blocked in production`;
- сохранен guardrail: `NEXT_PUBLIC_ALLOW_PRODUCTION_SUPABASE_FALLBACK=false`.

## Что изменено

| Файл | Изменение |
|---|---|
| `.env.example` | Уточнены комментарии: MySQL через `/api/database` как production source of truth, `localStorage` только cache/recovery, production auth требует session secret. |
| `lib/domain/admin/navigation.ts` | Добавлена видимая вкладка `database` в `adminSectionTabs`. |
| `features/admin/database/useClientSnapshotsPanel.ts` | Добавлено явное подтверждение администратора перед восстановлением browser snapshot. |
| `tests/app-shell-architecture-checks.ts` | Добавлен guardrail, что admin navigation сохраняет вкладку `database`. |
| `docs/ERP_STAGE_1_STABILIZATION_REPORT.md` | Создан отчет стабилизации. |
| `docs/ERP_CORE_MODEL_PLAN.md` | Создан план ядра ERP. |

## Что не трогалось специально

- рабочие таблицы ПТО и формат сохранения ПТО;
- текущий формат `VehicleRow` и MySQL table `vehicles`;
- Supabase fallback;
- localStorage recovery;
- `/api/database` contract для существующих ресурсов;
- GPS/Wialon, топливо, договоры, путевые листы, AI, ремонты/простои как отдельные модули.

## Оставшиеся риски

| Риск | Влияние | Что делать дальше |
|---|---|---|
| `app_state` и часть browser storage остаются snapshot-слоем | Сложно масштабировать, нет нормального audit/permissions per entity | Постепенно выводить справочники и документы в нормализованные MySQL tables. |
| Restore browser snapshot может после подтверждения попасть в существующий full-save recovery path | Нужен более строгий серверный контроль | Создать server-side restore endpoint внутри `/api/database` с expected version, audit trail и отдельным правом. |
| Supabase fallback живой | Возможен разнобой окружений | Оставить только dev/emergency, production использовать MySQL. |
| `module-live-handlers` пустой | Будущие модули пока planned-only | Подключать live handlers только после схем, query policies, server auth и тестов. |
| Tab permissions не равны ERP authorization | Недостаточно для section-scoped workflows | Реализовать серверную матрицу role/user/section/module/action. |

## Проверки

Все проверки запускались через bundled Node:

`C:\Users\albert.bekker\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

| Команда | Результат |
|---|---|
| `scripts/check-project-health.mjs` | passed |
| `scripts/refactor-audit.mjs` | passed; blocking architecture issues: none; warnings по крупным файлам остались. |
| `tests/database-router-checks.ts` | passed |
| `tests/database-rpc-checks.ts` | passed |
| `tests/security-runtime-config-checks.ts` | passed |
| `tests/release-safety-checks.ts` | passed |
| `tests/app-shell-architecture-checks.ts` | passed |
| `tests/modular-monolith-guardrails-checks.ts` | passed |
| `tests/single-data-layer-boundary-checks.ts` | passed |
| `tests/module-data-routes-checks.ts` | passed |
| `tests/domain-purity-guardrails-checks.ts` | passed |

Недоступных команд в обязательном списке не было. Системный `rg` в текущем PowerShell возвращал `Access is denied`, поэтому поиск по проекту выполнялся через `Get-ChildItem` + `Select-String`.

## Что делать дальше

1. Утвердить политику MySQL as source of truth и emergency-only Supabase fallback.
2. Добавить server-side restore workflow с audit и правом `admin`.
3. Перейти к безопасной подготовке ERP core model из `docs/ERP_CORE_MODEL_PLAN.md`.
4. Перед Этапом 4 не начинать сменную сводку как production workflow, пока не зафиксированы `vehicle_cards`, `sections`, users/roles/section scopes и access matrix.
