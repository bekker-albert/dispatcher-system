# Аудит подготовки dispatcher-system к ERP/ERM диспетчерской службы

Дата аудита: 2026-05-10
Проект: `dispatcher-system`
GitHub: `bekker-albert/dispatcher-system`
Локальная ветка: `feature/dispatch-service-architecture`
Коммит локальной HEAD: `78e46b2873fc2c753a1120525541ebce390a7514`

## 1. Краткий вывод

Проект уже не является одним прототипным `page.tsx`. Это Next.js приложение с разделением на `app`, `features`, `lib/domain`, `lib/data`, `lib/server`, `shared`, `supabase` и `tests`. Самые зрелые зоны: ПТО, отчеты, техника, базовая авторизация, единый `/api/database`, MySQL/Supabase fallback и архитектурные guardrail-тесты.

Главный риск: большая часть будущей ERP уже описана в доменных контрактах и каталогах модулей, но не подключена как реальные live-handlers и нормализованные таблицы. Многие экраны являются каркасом, static preview или session-only/mock UI. Поэтому нельзя считать готовыми GPS/Wialon, путевые листы, топливо, договоры, ремонты, общие процессы, матрицу доступа и AI-интеграции.

## 2. Проверенный контур

Проверены:

- `app/page.tsx`, `app/api/auth/*`, `app/api/database/route.ts`.
- `features/app`, `features/dispatch`, `features/pto`, `features/reports`, `features/fleet`, `features/fuel`, `features/contractors`, `features/safety-driving`, `features/admin`, `features/users`, `features/ai-assistant`, `features/workspaces`.
- `lib/domain`, `lib/data`, `lib/database`, `lib/server/database`, `lib/server/mysql`, `lib/server/auth`, `lib/supabase`.
- `data/default-vehicles.json`, `supabase/*.sql`, `docs/*`, `tests/*`.
- GitHub repository metadata через connector.
- Локальные архитектурные скрипты через bundled Node:
  - `scripts/refactor-audit.mjs`: blocking architecture issues не найдены; warnings по крупным файлам.
  - `scripts/check-project-health.mjs`: passed.

Ограничение среды: системные `git` и `npm` в текущем PowerShell недоступны. Проверки запускались через bundled Node, без изменения кода приложения.

## 3. Существующие страницы, вкладки и таблицы

### 3.1 Entry points и API

| Путь | Состояние | Комментарий |
|---|---|---|
| `/` | работает | `app/page.tsx` тонкий: проверяет auth/session и рендерит `AppRoot` или `LoginScreen`. |
| `/manifest.webmanifest` | работает | Генерируется из `app/manifest.ts`. |
| `/api/database` | работает частично | Единый router для `status`, `vehicles`, `settings`, `app-state`, `pto`; будущие module routes пока planned-only. |
| `/api/auth/login` | работает | MySQL auth, fallback initial user в dev. |
| `/api/auth/logout` | работает | Завершение session. |
| `/api/auth/session` | работает | Получение текущей session. |
| `/api/auth/register` | работает | Заявка на регистрацию. |
| `/api/auth/registration-requests` | работает | Просмотр/обработка заявок. |
| `/api/auth/users` | работает | Управление пользователями. |
| `/api/auth/password-reset/request` | работает | Запрос кода восстановления. |
| `/api/auth/password-reset/confirm` | работает | Подтверждение восстановления. |

### 3.2 Верхние вкладки

Определены в `lib/domain/navigation/tabs.ts` и рендерятся через `AppPrimaryContent`/`lazyPrimaryContent`.

| Вкладка | Реальный экран | Состояние |
|---|---|---|
| Главная | `features/workspaces/WorkspaceOverviewSection.tsx` | Каркас/обзор готовности, не аналитический dashboard. |
| Горная диспетчеризация | `features/dispatch/DispatchSection.tsx` | Рабочая сменная/суточная сводка, но без нормализованного workflow. |
| Таксировка | `features/fuel/FuelSection.tsx` | Визуальная витрина на hardcoded данных. |
| СМТС / GPS | `features/safety-driving/SafetySection.tsx` | Визуальная заглушка. |
| Техника | `features/fleet/FleetVehiclesSection.tsx` | Readonly список техники из общего `vehicleRows`. |
| Общие процессы | `features/workspaces/CommonProcessesSection.tsx` | Архитектурный каркас, без данных и workflow. |
| Отчеты | `features/reports/ReportsSection.tsx` | Рабочий экран отчетности, строится из ПТО/default rows. |
| Администрирование | `features/admin/*`, `features/users/*` | Частично рабочее: навигация, структура, техника, пользователи, логи, отчеты; часть экранов preview. |
| Подрядчики | `features/contractors/ContractorsSection.tsx` | Визуальная витрина на hardcoded данных. |
| ПТО | `features/pto/PtoSection.tsx` | Самый рабочий производственный контур: план, оперучет, замер, ковши, кузова, цикл, производительность. |
| AI-ассистент | `features/ai-assistant/*` | Богатый UI и доменная модель, но session-only/mock/dry-run. |

### 3.3 Подвкладки

| Группа | Подвкладки |
|---|---|
| Отчеты | Все участки, Аксу, Акбакай, Жолымбет; отдельно клиенты: ТОО AA Mining, АО АК Алтыналмас, ТОО AA Engineering. |
| Горная диспетчеризация | Сутки, Ночь, День. |
| Техника | Все, Аренда, Работа, Простой, Ремонт, Свободна. В текущем readonly экране фильтры верхнего уровня не полностью выделены как самостоятельная модель модуля. |
| Подрядчики | AA Mining, Qaz Trucks, Proline Logistic, Эко-Сервис из hardcoded defaults. |
| Таксировка | Общая, Подрядчики. |
| ПТО | Кузова, Производительность, Цикл, Ковши, План, Оперучет, Замер. |
| ТБ / СМТС | Техника, Вождение, Подрядчики. |
| Администрирование | Вкладки, Структура, ИИ-сводка, Права, Техника, Отчетность, Профиль, Логи. Тип `database` существует, но не добавлен в `adminSectionTabs`, поэтому экран базы фактически не виден из шапки. |
| Структура | Схема, Элементы, Связи, Роли, Распорядок. |

### 3.4 Текущие таблицы и хранилища

| Слой | Таблицы/хранилища | Что хранится |
|---|---|---|
| MySQL runtime schema | `vehicles`, `app_settings`, `app_state`, `pto_rows`, `pto_day_values`, `pto_row_years`, `pto_settings`, `pto_bucket_rows`, `pto_bucket_values`, `audit_logs`, `pto_meta` | Техника, общие настройки, общий app snapshot, ПТО, ковши/матрицы, базовый audit. |
| MySQL auth schema | `auth_users`, `auth_registration_requests`, `auth_password_reset_codes` | Пользователи, заявки, восстановление пароля. |
| Supabase fallback | `app_state`, `vehicles`, `pto_rows`, `pto_day_values`, `pto_bucket_rows`, `pto_bucket_values`, `pto_settings`, `app_settings`, `audit_logs` | Legacy/fallback storage, не основной production путь. |
| Browser storage | `localStorage`, частично `sessionStorage` | Локальные snapshots, app state, admin logs, PTO backup, report date override, client recovery. |
| JSON seed | `data/default-vehicles.json` | 881 записей исходного справочника техники. |

## 4. Основная таблица аудита модулей

| Модуль | Текущее состояние | Что уже реализовано | Что отсутствует | Проблемы архитектуры | Рекомендация: оставить / доработать / переработать / создать заново | Приоритет: высокий / средний / низкий |
|---|---|---|---|---|---|---|
| Главная аналитика | Каркас рабочей зоны, не аналитика | Overview рабочих зон, readiness, module catalog, переходы по вкладкам | KPI диспетчерской, статусы смен, просрочки, аварии, топливо, ремонты, сдача отчетов | Главная показывает архитектурные метрики, а не производственные данные; аналитика не подключена к prepared aggregates | Доработать | Средний |
| Горная диспетчеризация: сменные сводки | Частично работает | Вкладки Сутки/Ночь/День, добавление техники, редактирование строк, расчет итогов, AI draft text | Документ сменной сводки, статусы draft/submitted/accepted/closed, section scope, version, server list/detail, согласование | Данные сохраняются как часть общего app state/localStorage, а не как нормализованные shift reports; workflow есть только в домене | Переработать аккуратно на базе текущего UI | Высокий |
| Суточные отчеты | Частично работает | Сводная вкладка "Сутки", консолидация день/ночь, отчеты по план/факт | Закрытие суток, контроль полноты смен, подписи, версии, подготовленные суточные aggregates | Суточная консолидация клиентская и зависит от текущих массивов | Доработать | Высокий |
| Отчетность план/факт | Работает частично | `ReportsSection`, печать, причины, клиенты, derived rows из ПТО, admin report settings | Серверные prepared aggregates, экспорт через очередь, контроль stale source versions | Есть fallback default rows; большие расчеты остаются в браузере при росте данных | Доработать | Высокий |
| Справочник техники | Работает лучше остальных справочников | Admin Vehicles: inline grid, Excel import/export, seed 881 строк, MySQL/Supabase load/save/patch/replace/delete, readonly fleet list | Нормализованная карточка техники, история участков, документы перемещения, ТО/страховка/резина, связи с GPS/путевыми листами | `vehicles.data JSON` и частичный snapshot-подход осложнят ERP-связи; прямое изменение участка в карточке рискованно | Оставить ядро, доработать модель | Высокий |
| Справочник участков | Каркас | Участки выводятся из техники/ПТО/отчетов, есть schedule cutoffs и admin structure | Отдельная таблица `sections`, иерархия, коды, владельцы, права, активность, сменный график | Участки сейчас производные строки, нет единого source of truth | Создать заново | Высокий |
| ПТО: план | Работает | Editable date table, Excel import/export, формулы, годы, carryover, MySQL/Supabase persistence по `pto_rows` и `pto_day_values` | Версии утвержденного плана, workflow согласования, связь с участками/клиентами как справочниками | Сильная зависимость от локальных моделей и общего state; часть сохранений full snapshot/year scoped | Оставить и постепенно нормализовать | Высокий |
| ПТО: оперучет | Работает как таблица | Отдельная дата-таблица `oper`, связь с отчетностью, persistence как ПТО rows/day values | Автоматическое формирование из принятых сменных сводок, запрет ручного обхода без основания, versioned corrections | Сейчас может быть ручным слоем, не привязанным к accepted shift reports | Переработать после сменных сводок | Высокий |
| ПТО: маркшейдерский замер | Работает как таблица | Отдельная дата-таблица `survey`, расчет отчетных фактов с survey/oper | Документ замера, дата/период действия, источник, утверждение, корректирующий слой к оперучету | Доменная идея есть, но UI и DB пока table-like, без workflow | Доработать | Высокий |
| ПТО: ковши | Работает | Матрица ковшей, ручные строки, значения, Excel, MySQL/Supabase `pto_bucket_rows`/`pto_bucket_values` | Нормализованные типы техники/ковшей, версии, audit по ячейкам | `ptoBucketValues` общая карта для нескольких матриц; нужен явный table_type/namespace в модели | Доработать | Средний |
| ПТО: объемы кузовов | Частично работает | Строки выводятся из самосвалов, колонки из материалов, редактируемая матрица | Единый справочник моделей кузовов, материалы, плотность, история изменений | Данные производные, зависят от качества справочника техники и ПТО материалов | Доработать | Средний |
| ПТО: расчет объемов/производительность/цикл | Частично работает | Матрицы cycle/performance, расчетная колонка `ОбрКИО`, Excel | Проверенные формулы, утвержденные параметры, связь с рейсами/планом/техникой | Формулы и параметры еще не оформлены как утверждаемые бизнес-правила | Доработать | Средний |
| GPS/Wialon | Визуальная заглушка и доменные контракты | `SafetySection` показывает подпункты; в `lib/domain/dispatch/gpsReconciliation.ts` и `lib/domain/smts/*` есть pure-domain правила | Реальный Wialon connector, таблицы терминалов/SIM/ДУТ/GPS events, bounded API, reconciliation UI | Нет live data, нет нормализованных сущностей СМТС | Создать заново на существующих доменных контрактах | Высокий |
| Топливо | Визуальная витрина и доменный каркас | `FuelSection` отображает hardcoded fuel rows; `lib/domain/taxation/fuelAccounting.ts` описывает периоды и мини-склад ТЗ | Поставки, выдачи, остатки, сверки, периоды 1С, долги, акты, связи с путевыми листами | UI не связан с БД; данные в `lib/domain/reference/defaults.ts` | Создать заново | Высокий |
| Путевые листы | Только доменный каркас | `lib/domain/taxation/waybillIssuance.ts`, data route contracts planned | Реальный экран, таблицы, печать/повторная печать, закрепления водитель-техника, статусы | Вкладка Таксировка не реализует путевые листы | Создать заново | Высокий |
| Договоры и подрядчики | Визуальная витрина | Подрядчики как hardcoded списки техники, legacy bridge в workspace architecture | Договоры, сроки, ставки, лимиты, долги, акты, доступы подрядчиков | Нет DB, нет контрактной модели договоров; подрядчики смешаны с owners/contractors в технике | Создать заново | Средний |
| Ремонты и простои | Частично есть как поля | В технике есть `repair`, `downtime`, дата ремонта в fleet view; доменные контракты `serviceVehicleRepairs`, `serviceVehicleReminders` | Документы ремонта, заявки, причины простоя, ответственность, длительность, согласование, связь со сменной сводкой | Сейчас ремонт/простой выглядит как числовые поля и текст, без события и истории | Создать заново с переиспользованием fleet UI | Высокий |
| ТБ / безопасное вождение | Визуальная заглушка | Подвкладки Техника/Вождение/Подрядчики, доменный `ecoDriving` | События нарушений, водители, рейтинги, привязка к GPS, уведомления, ответственность | Нет реальных данных, нет таблиц, нет интеграции | Создать заново | Средний |
| AI-ассистент | UI работает, данные mock/session-only | Панели main/inbox/drafts/history/settings, задачи, согласования, drafts, mock integrations, dry-run connectors, workload policy | Backend persistence, OpenAI/backend connector, права на действия, реальный audit, bounded context из ERP | Много mock данных в `features/ai-assistant/mock`; нельзя считать production AI | Доработать после стабилизации данных | Низкий |
| Справочники и настройки | Частично работает | Настройки вкладок, custom tabs, структура, report settings, app settings через DB/localStorage | Нормализованные справочники участков, материалов, клиентов, контрагентов, водителей, ролей, статусов | Справочники распределены по defaults, app_state и отдельным UI; нет единого registry справочников | Переработать | Высокий |
| Администрирование: пользователи и роли | Частично работает | Login, session, users, registration requests, password reset, tab permissions, user management panel | Полная RBAC/ABAC матрица user/role/section/workspace, audit grants, server-side section scope | `AdminAccessMatrixSection` preview не меняет authorization; auth зависит от MySQL schema bootstrap | Доработать | Высокий |
| Администрирование: база | Экран есть, но скрыт из меню | `AdminDatabaseSection`, snapshots, provider status, restore snapshot props | Видимый доступ из админки, health details, миграции, backup policy | `database` есть в типе и render branch, но нет в `adminSectionTabs` | Доработать | Средний |
| Журнал изменений | Частично работает | Admin logs в локальном/app state, `audit_logs` в MySQL schema, доменные `changeHistory`, `undoHistory` | Обязательный audit trail по всем create/patch/workflow/import/export, пользователь, old/new, reason, entity version | Текущий `useAdminLogsState` пишет локальный журнал и использует default user label; server audit не централизован | Переработать | Высокий |
| Data layer и API | Работает для legacy ресурсов | Единый `/api/database`, MySQL/Supabase adapters, origin guard, auth check, planned module data routes | Live handlers для будущих модулей, нормализованные list/detail/create/patch/workflow routes | `module-live-handlers` пустой; `configuredLiveModuleHandlers` пустой; часть данных идет full snapshot | Оставить основу, доработать | Высокий |
| Архитектурные guardrails | Хорошая основа | `lib/domain/workspaces`, `moduleCatalog`, `moduleDataRoutes`, `moduleHandlerReadiness`, множество `tests/*-checks.ts` | Интеграционные тесты с реальной MySQL, e2e критичных workflow | Риск: contracts могут создать иллюзию готовности без live implementation | Оставить | Средний |

## 5. Что реально связано с базой данных

Реально подключенные ресурсы через `/api/database`:

- `vehicles`: загрузка, full save, patch save, replace, delete.
- `pto`: load, load-year, load-buckets, load-updated-at, save, inline save-day/save-days, delete-year, delete rows, bucket rows/values.
- `settings`: load/save app settings.
- `app-state`: load, load-bootstrap, save, client snapshots.
- `status`: provider/configured state.

Реально подключенные auth-ресурсы через `/api/auth/*`:

- пользователи;
- сессии;
- заявки на регистрацию;
- восстановление пароля.

Будущие ERP module resources (`dispatch`, `taxation`, `smts`, `fleet`, `common-processes`, `reports`, `admin`, `ai-assistant`) описаны в `moduleDataRouteCatalog`, но их live handlers не подключены.

## 6. Где данные захардкожены или mock

- `features/ai-assistant/data.ts` и `features/ai-assistant/mock/*`: AI dataset, tasks, approvals, documents, integrations, audit.
- `lib/domain/reference/defaults.ts`: подрядчики, топливо, user card.
- `lib/domain/reports/defaults.ts`: default report rows и report customers.
- `lib/domain/vehicles/defaults.ts`: fallback техника.
- `data/default-vehicles.json`: seed техники, полезный источник, но не ERP-справочник как таковой.
- `features/workspaces/CommonProcessesSection.tsx`, `features/admin/access/AdminAccessMatrixSection.tsx`, `features/admin/ai/AdminAiSection.tsx`: архитектурные/static preview.
- `features/safety-driving/SafetySection.tsx`, `features/fuel/FuelSection.tsx`, `features/contractors/ContractorsSection.tsx`: визуальные витрины.

## 7. Архитектурные нарушения и риски роста

1. `useAppStateBundle` агрегирует много состояний. Сейчас он не нарушает guardrails, но при добавлении новых ERP-модулей туда нельзя класть business arrays и workflow state.
2. `AppPrimaryContent` остается роутером, но количество веток уже большое. Новые разделы должны идти через lazy primary screens, а не через логику внутри `AppPrimaryContent`.
3. Смешаны три persistence режима: MySQL, Supabase fallback и browser storage. Для ERP нужен один production source of truth и четкая политика восстановления локальных snapshots.
4. `app_state` хранит много общего состояния как snapshot. Это удобно для черновика, но плохо для ERP-аналитики, прав, аудита и параллельной работы.
5. ПТО зрелое, но часть операций еще строится вокруг больших клиентских массивов и snapshot/year saves. При росте объема нужен переход к bounded list/detail и versioned patch.
6. Reports пока рассчитываются из текущих PTO rows/default rows в браузере. Для ERP нужны prepared aggregates.
7. Future module contracts уже сильные, но `module-live-handlers.ts` и `moduleLiveHandlerRegistry.ts` пустые. Это значит: каркас есть, production API модулей еще нет.
8. `AdminDatabaseSection` не виден из `adminSectionTabs`, хотя есть render branch.
9. `LoginScreen`, `UserProfileSection`, `UserManagementPanel` крупные и должны дробиться при следующем изменении auth/users.
10. Runtime schema bootstrap для MySQL удобен в черновике, но production лучше переводить на явные миграции и rollback.
11. Журнал изменений не централизован на сервере: локальные admin logs не заменяют ERP audit trail.

## 8. Дублирование и перегруженные места

- Похожие паттерны storage/load/save повторяются между `features/app/*`, `features/pto/*`, `lib/data/*`, `lib/supabase/*`, `lib/server/mysql/*`.
- ПТО matrix tabs (`buckets`, `cycle`, `bodies`, `performance`) требуют синхронной поддержки view model, Excel, persistence, табов и tests. Нужен единый registry.
- Справочные значения участков, подрядчиков, владельцев и клиентов повторяются в default data, vehicle rows, report rows и PTO rows.
- Auth/users UI крупный: `features/auth/LoginScreen.tsx`, `features/users/UserProfileSection.tsx`, `features/users/UserManagementPanel.tsx`.
- AI имеет два уровня connectors: feature-level dry-run connectors и domain dry-run registry. Это нормально для preview, но перед production надо оставить один backend-mediated contract.

## 9. Что можно оставить

- Единый Next.js проект и single app entrypoint.
- Тонкий `app/page.tsx`.
- `AppRoot` как composition shell.
- Lazy loading через `features/app/lazyPrimaryContent.tsx`.
- `lib/domain` как pure domain слой.
- Единый `/api/database` router.
- MySQL как основной production backend, Supabase как legacy/fallback только при осознанной политике.
- Текущие ПТО date tables и matrix UI как рабочую базу.
- Admin Vehicles inline grid и Excel transfer как базу справочника техники.
- Reports UI и print layout как базу для будущих prepared reports.
- Архитектурные guardrail tests и module catalogs.

## 10. Что нужно аккуратно переработать

- Сменные и суточные сводки: вынести из общего app_state в нормализованные документы.
- Техника: перейти от snapshot/JSON карточки к справочнику плюс событиям перемещения, ремонта, простоя.
- ПТО: добавить версии, workflow, нормализованные справочники и более явные matrix namespaces.
- Отчетность: перевести heavy calculations в prepared aggregates.
- Админка: сделать видимой базу, укрепить roles/permissions, подключить серверную access matrix.
- Журнал: перейти к server audit trail по всем изменяемым сущностям.
- LocalStorage recovery: оставить только как backup/restore flow с явным действием администратора.

## 11. Что нужно создать заново

- Справочник участков.
- Путевые листы.
- Топливный учет и периоды 1С.
- Договоры/контрагенты/долги/акты.
- GPS/Wialon integration и сущности СМТС.
- Ремонты и простои как документы/события.
- ТБ/безопасное вождение на реальных GPS/driver событиях.
- Общие процессы: переработки, командировки, согласования.
- Production AI backend connector и persistence.

## 12. Срочные исправления перед масштабированием

1. Зафиксировать production source of truth: MySQL, explicit migrations, backup/restore policy.
2. Подключить полноценную серверную авторизацию для всех write/read модулей, не только tab permissions.
3. Сделать `database` раздел видимым или явно удалить недоступный UI branch.
4. Не добавлять новые модули в `useAppStateBundle`; делать module-level hooks/providers.
5. Начать нормализацию со справочников: техника, участки, пользователи, роли.
6. Перевести сменные сводки в нормализованный workflow-документ до развития оперучета, топлива и отчетов.
