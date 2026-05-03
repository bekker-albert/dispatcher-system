# Project Audit

## 2026-05-03 Audit Update

Проверка выполнена по текущему рабочему дереву `D:\ddd\system\dispatcher`. `app/page.tsx` остается тонким entry-point и не содержит продуктовую логику. Основная зона риска сейчас находится не в маршруте страницы, а в тяжелых feature-модулях ПТО, отчетности и слое сохранения.

### Технический диагноз

- Структура проекта в целом правильная: `app/` используется как entry/API слой, основная логика лежит в `features/`, доменные правила в `lib/domain`, серверная база в `lib/server`, клиентские data-adapter функции в `lib/data`.
- Самая опасная зона роста — ПТО-матрицы `buckets`, `cycle`, `bodies`, `performance`: классификация вкладок, render routing, Excel actions, persistence gating и tests/source-checks сейчас требуют синхронных изменений в нескольких местах.
- Бизнес-правила отчетности частично спрятаны в fallback-ах, ключах и regex-правилах: customer inheritance, факт без customer code, накопление причин, рабочая дата по cutoff.
- `/api/database` имеет origin/same-site guard, но не имеет полноценной серверной авторизации по пользователю/роли.
- Runtime MySQL schema bootstrap удобен на раннем этапе, но для production лучше перейти к явным миграциям.
- README отставал от реальной команды `npm run verify`; `.env.example` не показывал `DATABASE_ALLOWED_ORIGINS`.

### Самые опасные проблемы

1. Нет полноценной авторизации записи в `/api/database`.
2. Возможность потери данных при автоматическом выборе между localStorage и базой по клиентскому времени.
3. Неявные бизнес-правила заказчиков/факта/замера могут сломаться при новых отчетных сценариях.
4. ПТО-матрицы продолжают расти через несколько параллельных условий вместо единого registry.
5. Тяжелые таблицы `bodies/performance` еще не используют полноценную виртуализацию.

### Приоритетный план

1. Ввести серверную авторизацию и роли для `/api/database`; origin guard оставить как дополнительную защиту.
2. Убрать автоматическое продвижение локальных данных поверх базы без явного подтверждения администратора.
3. Сделать единый PTO tab registry: тип вкладки, источник данных, Excel label/file, потребность в базе, режим матрицы.
4. Описать бизнес-словарь и расчетные правила отчетности отдельным документом.
5. Разделить production migration step и runtime DML-доступ MySQL.
6. Добавить virtualization/active-only render для всех новых тяжелых матриц.

### Безопасные исправления этого прохода

- Обновлен `AGENTS.md` под постоянный командный режим.
- Исправлена высота readonly-таблицы ПТО: теперь readonly layout не резервирует пустую строку под formula bar.
- Мемоизирован объединенный источник строк производительности ПТО, чтобы не пересоздавать массив при каждом render.
- Обновлены README и `.env.example` по реальным проверкам и дополнительным origin-настройкам API.

Date: 2026-04-28

## Pages And Entry Points

- `/` is the main dispatcher application route. `app/page.tsx` is thin and delegates to `features/app/AppRoot`.
- `/manifest.webmanifest` is generated from `app/manifest.ts`.
- `/api/database` is the server database gateway for status, PTO, vehicles, app settings, and client snapshots.

## Current Architecture State

The project is no longer a single-page prototype. The main product areas are split into feature modules:

- `features/reports` owns report screen, report table, report print CSS, reason editing, and report admin settings.
- `features/pto` owns PTO date tables, bucket tables, import/export flows, and PTO persistence models.
- `features/admin/vehicles` owns equipment administration and inline grid editing.
- `features/dispatch` owns shift summary and dispatch input flows.
- `features/app` owns only app-level composition, navigation wiring, state bundles, persistence controllers, and prop adapters.
- `lib/domain` owns pure calculations and business rules.
- `lib/data` and `lib/server` own provider-neutral client calls and server-side MySQL/Supabase adapters.
- `shared` and `components` own reusable UI and layout primitives.

## Main Problems Found

- `features/app/AppRoot.tsx` is now a thin composition shell. It must stay that way and must not receive feature internals again.
- Heavy table features still need a strict pattern: view mode by default, edit mode behind an explicit action, feature-owned grid hooks, and domain helpers outside React.
- Some large modules remain valid but should be split only when touched by a related task:
  - `features/pto/ptoDatabaseLoadRunner.ts`
  - `lib/server/mysql/pto-writes.ts`
  - `lib/domain/reports/pto-index.ts`
  - PTO bucket/report table modules when their behavior changes.
- Production data must not be reset by deployment or local seed data. Save/load logic must stay provider-neutral through `lib/data/*`.

## Fixes Applied In This Audit Pass

- Runtime side effects and controllers were moved out of `AppRoot` into `features/app/useAppRuntimeControllers.ts`.
- `AppRoot` now delegates undo, initial data loading, PTO persistence, shared persistence, report reason editing, header editing, and table resize wiring to a named app-level hook.
- Derived screen models were moved out of `AppRoot` into `features/app/useAppDerivedModels.ts`.
- `AppRoot` now delegates report, PTO, vehicle, dispatch, and fleet model calculation to a named app-level hook.
- Screen prop assembly was moved out of `AppRoot` into `features/app/useAppScreenProps.tsx`.
- `AppRoot` now renders the header and primary content from prepared props instead of manually wiring every section.
- Admin screen prop assembly was moved out of the common screen adapter into `features/app/useAppAdminScreenProps.tsx`.
- Admin navigation, vehicle, database, log, and report settings wiring now stays behind one admin-owned adapter.
- Report screen prop assembly was moved out of the common screen adapter into `features/app/useAppReportsScreenProps.ts`.
- Report table, print, reason editing, and report-area wiring now stays behind one report-owned adapter.
- Dispatch screen prop assembly was moved out of the common screen adapter into `features/app/useAppDispatchScreenProps.ts`.
- Dispatch filters, row editing callbacks, totals, and shift context now stay behind one dispatch-owned adapter.
- PTO screen prop assembly was moved out of the common screen adapter into `features/app/useAppPtoScreenProps.ts`.
- PTO date table, year/month controls, bucket table, import/export, and row editing wiring now stays behind one PTO-owned adapter.
- Admin database, vehicles, and report settings props were moved out of `useAppAdminScreenProps.tsx` into dedicated admin adapter hooks.
- `useAppAdminScreenProps.tsx` now only coordinates admin content, structure, navigation, logs, and the already prepared admin feature props.
- Feature controller wiring is split into focused app-level controllers such as `useAppNavigationControllers`, `useAppPtoControllers`, and `useAppVehicleControllers`.
- `AppRoot` is now a thin composition shell instead of the owner of individual PTO, admin, vehicle, and navigation hooks.
- PTO date table toolbar, editable header renderers, and active formula-cell scrolling were moved out of `PtoDateTableContainer`.
- `PtoDateTableContainer` now keeps the table assembly while the reusable interaction helpers live behind PTO-owned hooks.
- PTO editable table body was moved into `features/pto/PtoDateEditableTableBody.tsx`.
- PTO row rendering, drag/drop handling, text cells, formula cells, and draft-row rendering are now isolated from the table container.
- PTO header editor controls were moved into `features/pto/PtoDateHeaderEditors.tsx`.
- PTO formula bar was moved into `features/pto/PtoFormulaBar.tsx`, leaving `PtoDateTableParts.tsx` focused on reusable cell primitives.
- `app/page.tsx` stayed thin and did not receive product logic.
- PTO database loading was decoupled from general app bootstrap so PTO can start loading earlier without enabling premature local writes.
- PTO year-scoped loads preserve already loaded bucket data unless the bucket tab explicitly requests bucket rows and values.
- Shared app localStorage bootstrap no longer treats PTO storage keys as general app state.
- PTO startup no longer performs a separate freshness request before the year snapshot load.
- PTO year-scoped MySQL conflict checks skip bucket tables because year saves do not write buckets.
- PTO inline day/bucket writes patch the saved baseline for the affected cells only, reducing duplicate full-snapshot saves without marking unrelated edits as saved.
- PTO date-table props are split into editable and readonly builders, leaving the container props model as a thin composition function.
- PTO date tables now mount a light readonly container by default. Editable table, formula controller, draft row logic, and drag/drop code load only after edit mode is enabled.
- PTO primary content is split by active subtab: date tables, buckets, and static informational tabs no longer share the same heavy controller path.
- PTO Excel import/export helpers are loaded only when the user runs an Excel action, not during normal PTO tab rendering.
- Main app sections are preloaded in the browser idle period after first render, improving later tab switches without blocking startup.
- Initial app load no longer creates an automatic client snapshot before reading the database. Manual snapshots and delayed post-change snapshots remain available.
- Client-side database conflict detection now recognizes `DATABASE_CONFLICT`, HTTP 409, and Russian server conflict messages.
- PTO row value editing now delegates pure row/carryover/day/month mutations to `lib/domain/pto/date-row-edits.ts`.
- Report year reasons now render and print from the calculated accumulated value instead of stale raw overrides.
- Report reason accumulation builds a per-row reason index once per recalculation instead of scanning the full reason map for every row.
- Esc in report reason editing is a true local cancel and does not mutate `reportReasons`.

## Development Rules From Here

- New feature behavior goes into its feature folder first.
- Cross-feature coordination can live in `features/app/useApp*` hooks, but not as inline blocks inside `AppRoot`.
- Domain calculations stay in `lib/domain` and must be testable without React.
- Database and persistence code stays in `lib/data`, `lib/server`, or API routes.
- Large editable tables should use shared editing primitives and feature-owned models instead of custom one-off table logic.
- Before every commit, run `npm run verify` and `git diff --check` unless the change is documentation-only.

## Next Recommended Work

- Keep splitting only touched large files; current audit has no blocking architecture warnings.
- Split report print/screen concerns further only when working on report output behavior.
- Add integration-level database tests once the final MySQL schema and deployment workflow stabilize.
- Keep local MySQL testing explicit with environment flags; production-domain browser detection enables the server database on `aam-dispatch.kz`.
