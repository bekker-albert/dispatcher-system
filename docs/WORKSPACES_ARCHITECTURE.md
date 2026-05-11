# Workspaces Architecture

## Current App Shell Audit

- `app/page.tsx` is intentionally small: it only resolves auth/session and renders `AppRoot` or `LoginScreen`.
- `features/app/AppRoot.tsx` is the shell: auth provider, AI provider, page shell, header, and `AppPrimaryContent`.
- `features/app/useAppStateBundle.ts` aggregates existing shared hooks, but new workspace business state must stay in workspace-level hooks/providers.
- `features/app/AppPrimaryContent.tsx` is a router to lazy primary content, not a place for large JSX screens.
- `features/app/lazyPrimaryContent.tsx` is the boundary for large workspaces through `dynamic(...)`.
- `tests/app-shell-architecture-checks.ts` keeps these constraints executable so `AppRoot`, `useAppStateBundle`, and primary content do not grow into one large module host.
- `tests/modular-monolith-guardrails-checks.ts` keeps the filesystem modular-monolith rule executable: one Next.js project, one root package manifest, and no per-workspace app/runtime configs.
- `lib/domain/data-access/moduleHandlerReadiness.ts` is the checklist for future `/api/database` handlers: single router, authorization requirement, and the matching read/write/import/export contract must all exist before implementation.
- `lib/domain/data-access/moduleHandlerImplementationPlan.ts` turns handler readiness into a phased rollout order: read-model handlers first, queued exports/import staging next, and versioned workflow writes last.

## Modular monolith filesystem guardrail

Do not add package.json, next.config, lockfiles, Dockerfiles, or separate dev/start/build scripts inside workspace folders. Workspaces live under the same repository, the same Next.js app, the same auth layer, and the same data layer. If a module needs setup code, add it as a shared script or domain/data-access contract in the existing project rather than creating a nested application.

Do not add root `apps`, `packages`, `services`, Docker Compose, PM2, Nx, Turborepo, Vite, Remix, Astro, or NestJS entrypoints. Subdomains and workspaces must route into this same Next.js project and shared `/api/database` layer, not into another app tree or resident process.

`tests/modular-monolith-guardrails-checks.ts` scans `app`, `components`, `features`, `lib/domain`, and `shared` for nested app/runtime configs. It also checks the repository root for multi-app/runtime entrypoints and keeps root `dev`, `build`, and `start` scripts pointed at the single Next.js project.

## Navigation topology guardrail

Every visible top-level tab must have an architectural owner. Normal tabs map to
one registered workspace in `dispatchServiceWorkspaces`; temporary old tabs
such as `pto` and `contractors` must be listed in
`legacyWorkspaceTopTabBridges` with an explanation of their future workspace.
Do not add visible navigation tabs that bypass the workspace map, access
matrix, lazy primary content, or shared data-layer guardrails.

`tests/workspace-subdomain-routing-checks.ts` keeps this executable alongside
subdomain validation: a visible top tab is valid only when it is either a
workspace top tab or an explicit legacy bridge.

## Navigation render coverage guardrail

Every visible top-level tab must have an `AppPrimaryContent` render branch and
must render its lazy primary content export through `lazyPrimaryContent`.
Workspace tabs and explicit legacy bridges follow the same rule, so a future
navigation item cannot appear in the header while rendering nothing or importing
a heavy screen directly into the app shell.

Custom tabs remain the only generic fallback: they render through
`CustomTabPrimaryContent` and do not create new workspace ownership by
themselves. `tests/navigation-render-guardrails-checks.ts` keeps this executable
by checking visible navigation, workspace routes, legacy bridges, dynamic
exports, and the custom-tab fallback together.

## Single app entrypoint

Do not add `app/<workspace>/page.tsx` route trees for dispatch, taxation,
SMTS/GPS, fleet, reports, admin, AI, or future workspace modules. The public
application entrypoint stays `app/page.tsx`: it resolves auth/session and opens
`AppRoot`, which then selects the active workspace through navigation state and
lazy primary content.

Subdomains may select a workspace, but they still enter through `app/page.tsx`
inside the same Next.js project. `tests/single-app-entrypoint-checks.ts` keeps
this executable by allowing only the known top-level app files, the shared
`api` folder, and the single page shell.

## Subdomain middleware guardrail

Middleware may read `host` and select a workspace intent through
`lib/domain/workspaces/subdomainRouting.ts`, but it must stay a lightweight
same-project selector. It must not rewrite, redirect, proxy, fetch, or call
`/api/database`, and it must not use per-module backend URLs or hosts. A
subdomain such as `gd.aam-dispatch.kz` may choose the mining dispatch
workspace, but the request still lands in the same Next.js app, the same auth
session, and the same shared data layer.

`tests/subdomain-middleware-guardrails-checks.ts` keeps this future middleware
contract executable. If `middleware.ts` is added later, the test requires the
shared workspace routing helper and blocks external app rewrites, proxy code,
database calls, direct fetches, and per-module service env vars.

## App state bundle boundary

`features/app/useAppStateBundle.ts` may aggregate existing shared hooks, but it
must not become the host for future workspace business state. Do not put
taxation waybills, SMTS terminal rows, GPS events, common-process workflow
documents, access-matrix table rows, report aggregates, or import/export state
directly into the app bundle.

`tests/app-state-bundle-guardrails-checks.ts` keeps this executable:
`useAppStateBundle` must not add `useState`, `useEffect`, `fetch`, or
`/api/database`; it must not import future workspace modules, data layer code,
server database code, service contracts, or access-matrix previews. New
workspace business state belongs in workspace-level hooks/providers that are
loaded only when the lazy workspace screen opens.

## Domain purity boundary

`lib/domain` stays pure TypeScript. Workspace modules put calculations,
validation, status transitions, query policy, persistence contracts, readiness
checks, and patch command builders there, but not React components, hooks,
feature screens, browser APIs, server database clients, `lib/data`, or direct
`/api/database` calls.

Domain code receives bounded inputs from UI/data layers and returns plain
objects. This keeps future mining dispatch, taxation, SMTS/GPS, fleet, common
process, reports, access, and AI policy logic reusable without loading UI chunks
or opening database connections from the 2 GB RAM app shell.

## Single data layer boundary

UI and workspace screens must not import server database clients, MySQL helpers, Supabase clients, or server database routers. Do not call `/api/database` directly from features. Existing and future screens should go through shared data helpers, module request builders, and domain preflight contracts so authorization, section scope, pagination, version checks, and planned-only/live-handler status stay centralized.

`tests/single-data-layer-boundary-checks.ts` scans `features`, `components`, and `shared` for direct database/server-client imports and direct `/api/database` calls. Auth endpoints stay separate because login, password reset, registration requests, and user administration are not workspace data handlers.

## Access policy catalog guardrail

Every module in `lib/domain/workspaces/moduleCatalog.ts` must have an access
policy in `lib/domain/access-control/moduleAccessPolicies.ts` before UI/API
implementation. The policy workspace must match the module catalog workspace,
`open` and `list` must require `can_view`, versioned patch modules must require
`can_edit`, workflow modules must require `can_approve`, and readonly modules
must not expose create/edit/approve/delete/admin actions.

`validateWorkspaceModuleAccessPolicies()` keeps this source-checkable and feeds
the workspace guardrail report, so future rights work stays aligned with the
single access matrix instead of drifting into per-screen permissions.

## Module catalog source path guardrail

`currentSource` and `contractSource` in `lib/domain/workspaces/moduleCatalog.ts`
must point to real repository files or directories. Use relative forward-slash
paths only; do not use absolute paths, URLs, runtime config files, nested app
manifests, or external documentation links as module source references.

`currentSource` may point to existing `features/*` screens or `lib/domain/*`
support code. `contractSource` must point to a TypeScript file under
`lib/domain/*`, because future implementation should start from domain
contracts before UI/API work. `tests/module-catalog-source-path-checks.ts`
keeps these references executable so the workspace catalog cannot drift into
dead links as modules are added.

## Single workspace API router

Do not add `app/api/<workspace>` route folders for dispatch, taxation, SMTS/GPS,
fleet, reports, admin workspaces, or future modules. Workspace reads and writes
must be expressed as `resource/action` contracts behind the shared
`/api/database` router, with authorization, section scope, pagination,
version-based editing, conflict checks, and audit history kept in the existing
data-access layer.

`app/api/database/route.ts` must remain a thin wrapper around
`lib/server/database/router.ts`: it exports `OPTIONS`, `GET`, and `POST`, uses
the Node runtime, and does not import MySQL, Supabase, or low-level query
helpers directly. Auth routes stay separate because login, logout, password
reset, registration requests, sessions, and user administration are not
workspace module data handlers.

`tests/single-workspace-api-router-checks.ts` keeps this rule executable. It
allows only the existing top-level `auth` and `database` API folders, rejects
workspace module names as API route segments outside auth, and protects the
database route as the single module router entry point.

## Data route identifier guardrail

`resource` and `action` names in module data-route contracts must be plain
lower-kebab identifiers such as `taxation/list-waybills`. Do not use URLs,
slashes inside identifiers, camelCase, uppercase names, file paths, host names,
or names that imply a separate backend route.

`validateModuleDataRouteIdentifiers()` and
`tests/module-data-routes-checks.ts` keep this executable. Unsafe identifiers
also feed the workspace guardrail report as `data_route_unsafe_identifier`, so
future `/api/database` growth stays inside the single router vocabulary.

Data route actions must also match the module strategy from
`moduleCatalog.ts`. A non-`none` table strategy needs `list` and `open`
actions, a `versioned-patch` module needs an `edit` action, a `workflow` module
needs an `approve` action, and a `readonly` module must not expose write/admin
actions. `validateModuleDataRouteStrategyAlignment()` feeds
`data_route_strategy_mismatch` into the workspace guardrail report when a future
contract drifts away from its catalog strategy.

List/detail read-model plans must stay attached to the same workspace and
resource as the data-route contract. A plan can only reuse the `list` or `open`
database action from its own module route; it must not point a taxation query at
the fleet resource or silently move a detail query under another workspace.
`getListQueryPlansWithRouteMetadataMismatch()` and
`getDetailQueryPlansWithRouteMetadataMismatch()` feed those problems into the
workspace guardrail report before a live handler can be connected.

Write, export, and import plans follow the same rule. Create, patch, export,
and import contracts may only use the workspace and resource owned by their
module data-route contract. Metadata mismatch checks prevent a future write
pipeline or queued file workflow from accidentally using another workspace's
resource while keeping the same action name. Import plans also feed the
workspace guardrail report: every future file upload must stay under the single
database router, require an access policy, stage files by reference, validate
rows before acceptance, and keep strict row/preview/issue limits.

## Light placeholder screens

Stage-1 workspace placeholders and overview screens must stay metadata-only.
They may show registry, readiness, rollout, roadmap, and static access-matrix
information, but they must not call `fetch`, must not import heavy legacy
modules, must not import `lib/data` or server database code, and must not add
`useState` or `useEffect` for module business state.

`tests/workspace-placeholder-guardrails-checks.ts` keeps the current light
screens on that path: `WorkspaceOverviewSection`, `CommonProcessesSection`, and
the readonly `AdminAccessMatrixSection`. A future placeholder can render static
module intent, links, and guardrail summaries, but production rows must wait for
the real lazy workspace screen plus bounded `/api/database` read models.
The workspace guardrail report also includes handler implementation readiness:
a future action may stay planned, but it must have a ready implementation plan
before live wiring begins, and export/import/write phases remain blocked until
the module has a ready bounded read-model phase.
Section-scoped access policies must also line up with server filters: a module
that grants access by section must declare `section_id` as a required filter, so
future list/read handlers can enforce the same boundary in `/api/database`.
For open/detail screens, the same boundary must be present in
`scopeColumns.section_id`; otherwise a user could open a row outside the section
that the list view allowed them to see.

For patch and workflow writes, section-scoped modules must also declare
`scopeColumns.section_id` in the mutation plan. Runtime preflight checks that
the request carries a section, and the future SQL handler must use the mapped
column with `id` and `version` before updating one row.

For create writes, section-scoped modules follow the same rule. The create
mutation plan must declare `scopeColumns.section_id` so duplicate checks,
initial document scope, and access-matrix checks stay aligned.

Future live write handlers should use `lib/server/database/mutation-sql-builder.ts`
for the guarded SQL shape: patch writes get a one-row `WHERE` clause with
`id`, opened `version`, and declared scope columns; create duplicate checks use
declared duplicate keys and `LIMIT 1`.

Patch writes also get their `SET` clause from
`createDatabasePatchMutationSetSqlPlan()`. The future handler must map
validated patch fields to backend column values first, then let the helper add
next `version`, `updated_at`, and `updated_by`; reserved columns such as `id`,
`version`, audit columns, and scope columns are not user-editable patch fields.

Audit history writes get their insert shape from
`createDatabaseChangeHistoryInsertSqlPlan()`. It writes one row per changed
field, keeps old/new values as JSON payloads, verifies the expected history row
count, caps a single history batch at 100 rows, and uses the module's declared
history table such as `change_history_entries`.

Create entity writes get their insert shape from
`createDatabaseCreateEntityInsertSqlPlan()`. The future handler must generate
the entity id on the server, map validated create payload fields to backend
columns, and let the helper add `version = 1`, initial `status`,
`created_at/created_by`, `updated_at/updated_by`, section scope checks, and
reserved-column protection.

Create entity insert results must go through
`evaluateDatabaseCreateEntityInsertResult()`. Exactly one affected entity row
allows history writing and returning the created id; zero rows blocks success,
and more than one row is a hard error.

Change-history insert results must go through
`evaluateDatabaseChangeHistoryInsertResult()`. The history insert must affect
exactly the planned per-field `expectedRowCount`, otherwise the write
transaction cannot commit.

Create handlers should evaluate duplicate-check results with
`evaluateDatabaseCreateDuplicateCheckResults()`. Insert is allowed only after
every duplicate query returns zero rows; a matching row means "already exists",
not a second insert.

The guarded write execution context already exposes this shape through
`createEntityInsertSqlPlan()`, `createDuplicateCheckSqlPlans()`, `createPatchWhereSqlPlan()`, and
`createPatchSetSqlPlan()`, plus `createChangeHistoryInsertSqlPlan()`, and exposes
the matching result evaluators through `evaluateEntityInsertResult()`,
`evaluateDuplicateCheckResults()`, `evaluateChangeHistoryInsertResult()`, and
`evaluatePatchResult()`. A new live handler should consume those helpers
instead of rebuilding mutation SQL or interpreting duplicate/affected-row
results from raw request payloads.

The SQL shape builders and result evaluators stay split across
`mutation-sql-builder.ts`, `mutation-sql-builder-types.ts`, and
`mutation-sql-evaluators.ts`, while `mutation-sql-builder.ts` keeps the public
re-export path. Keep this split when extending write handlers so the shared
database helper does not become another oversized root file.

`lib/server/database/mutation-transaction-plan.ts` composes those pieces into
the future atomic write order without executing SQL. Create writes are
duplicate-check, entity-insert, change-history. Patch writes are entity-patch,
change-history. Each plan requires `commitCondition = all_steps_ok`, rollback
on any failed step, `maxEntityRowWrites = 1`, and no post-commit report
side-effects before the transaction commits.

`lib/server/database/mutation-side-effects-plan.ts` is the next post-commit
adapter. It does not execute reports; it verifies the committed transaction
guard, then turns a validated `writeSideEffectsEnvelope` into a queued
prepared-aggregate refresh plan with `noResidentProcess`, result-by-reference,
and no inline report recalculation.

`lib/server/database/mutation-response-plan.ts` keeps future write responses
small. Success returns entity id/version/status plus post-commit queue metadata;
conflicts return `409` and a single-row detail reload hint; duplicate creates
return duplicate key metadata. It is not allowed to return full tables from a
write request.

The guarded write execution context exposes this composition as
`createWriteTransactionSqlPlan()` and exposes post-commit work through
`createPostCommitSideEffectsPlan()`. It also exposes compact response planners
for success, conflict, and duplicate-create results. Future live handlers should
use those context methods after building individual SQL plans and the matching
`writeTransactionEnvelope`/`writeSideEffectsEnvelope`, so the transaction order,
report refresh boundary, and API response shape remain centralized and
source-checkable.

After a patch statement runs, the handler should call
`evaluateDatabasePatchMutationResult()` through the execution-context helper.
One affected row is the only successful path; zero rows becomes a version/scope
conflict; more than one row is a blocker because patch writes are limited to a
single entity row.

## Текущие опорные файлы

- `lib/domain/workspaces/workspaces.ts` — реестр рабочих зон, связь с текущими `topTab` и будущими поддоменами.
- `features/workspaces/WorkspaceOverviewSection.tsx` — легкая главная зона без загрузки производственных таблиц.
- `features/workspaces/CommonProcessesSection.tsx` — placeholder общих процессов без добавления state в `AppRoot`.
- `features/app/lazyPrimaryContent.tsx` — ленивое подключение крупных рабочих зон и placeholder-экранов.
- `lib/domain/workspaces/readiness.ts` — pure-модель готовности каркаса рабочих зон без запросов к данным.
- `lib/domain/workspaces/guardrails.ts` — общий guardrail-отчет по модулям: access policy, bounded query policy, persistence contract, prepared aggregates и patch/history требования.
- `lib/domain/workspaces/moduleActionPreflight.ts` — pure preflight для будущих UI/API действий: проверяет access capability, bounded query и persistence contract до чтения/записи.
- `lib/domain/workspaces/moduleCatalog.ts` — каталог будущих модулей, их статусов, фильтров, table strategy и editing strategy.
- `lib/domain/data-access/moduleDataRoutes.ts` — будущие `resource/action` contracts для единого `/api/database` без отдельных backend-приложений.
- `lib/domain/data-access/moduleDatabaseRequests.ts` — builder совместимого `/api/database` request envelope после успешного preflight; patch-only действия требуют versioned patch payload.
- `lib/domain/data-access/moduleDatabaseAuthorization.ts` — pure mapping future `resource/action` -> module access capability для последующей серверной проверки через матрицу доступа.
- `lib/server/database/module-authorization.ts` — compatibility helper for future module actions: maps workspace/module capabilities to current tab permissions while preserving section-scope checks until the full access matrix is wired into the live router.
- `features/admin/access/AdminAccessMatrixSection.tsx` — read-only preview of the future access matrix. In stage 1 it must not render forms, save buttons, click handlers, or grant mutation commands; current authorization remains unchanged.
- `lib/domain/data-access/indexContracts.ts` — future database index contracts per module; required filters from query policies must be covered before handler/migration work starts.
- `lib/domain/data-access/moduleListQueryPlans.ts` — allowed table/filter/search/sort mappings for future list handlers; every query-policy required filter must have a mapped SQL column before implementation.
- `lib/domain/data-access/moduleDetailQueryPlans.ts` — bounded single-row `id` lookup contracts for future open/detail handlers; versioned entities must return `version` before editing.
- `lib/domain/data-access/moduleReadModelSchemaReadiness.ts` — static read-model schema requirements for future MySQL preflight; workspace guardrails reject list/detail table drift before a live read handler is connected.
- `lib/domain/data-access/modulePatchMutationPlans.ts` — allowed table/version/audit mappings for future edit, approve, delete, and admin handlers; every versioned write action must require expected version and change history.
- `lib/domain/data-access/moduleWritePipelinePlans.ts` — write-side pipeline contracts for create, patch and workflow transitions; workspace guardrails require access preflight, payload envelopes, atomic single-entity transactions, change history and bounded aggregate invalidation instead of inline report rebuilds.
- `lib/domain/data-access/moduleWorkflowTransitions.ts` — workflow modules must bind approve/transition actions to explicit status transitions; guardrails reject workflow modules without a binding, bindings to missing modules, unknown workflows, or workflow/workspace mismatches.
- `lib/domain/reports/aggregateRefreshSources.ts` and `lib/domain/reports/aggregateInvalidationPlans.ts` — prepared report aggregates must have bounded source queries and event-driven invalidation plans; workspace guardrails reject missing source plans, action mismatches, missing invalidation coverage, full-report rebuilds and unmapped server filters.
- `lib/domain/data-access/moduleCreateMutationPlans.ts` — allowed create mappings for future document creation; every create action starts at `version = 1`, writes audit metadata, and checks duplicate operational keys.
- `lib/domain/data-access/moduleExportPlans.ts` — allowed export mappings for future Excel/PDF/CSV generation; every export action must use server filters, create a queued request, and store files by reference instead of building large files in browser state.
- `lib/domain/data-access/indexMigrationPlan.ts` — passive future SQL index migration plan builder; it creates reviewable MySQL `ALTER TABLE ... ADD INDEX` statements from contracts without running database migrations in runtime.
- `lib/domain/*/service-contracts.ts` — будущие документы рабочих зон без React state и без побочных эффектов.
- `lib/domain/workspaces/subdomainRouting.ts` — helper будущего открытия workspace по поддомену.
- `resolveWorkspaceNavigationIntent()` always returns a same-project navigation intent: one Next.js app, no separate backend, no separate database, even when the host is `gd.aam-dispatch.kz`, `dt.aam-dispatch.kz`, `smts.aam-dispatch.kz`, `pto.aam-dispatch.kz`, `reports.aam-dispatch.kz`, or `admin.aam-dispatch.kz`.
- `validateWorkspaceTopTabRoutes()` keeps every workspace attached to an existing visible top tab, so future workspace additions cannot drift away from the app shell navigation.
- `validateDispatchWorkspaceRegistry()` keeps the stage-1 workspace list complete and unique, and its issues feed the workspace guardrail report: all nine top-level zones must exist, each workspace owns one visible top tab, and every workspace declares current context, future scope, and a performance rule.
- `validateWorkspaceModuleCatalog()` keeps module catalog growth bounded and feeds the workspace guardrail report: module ids are unique, every non-home workspace has catalog coverage, every module belongs to a registered workspace, heavy tables declare filters, scaffold modules point to current screens, and planned modules point to domain contracts before UI/API work starts.
- `lib/domain/data-access/pagination.ts` — общий контракт server-side pagination для крупных таблиц.
- `lib/domain/data-access/queryPolicy.ts` — guard-слой для bounded queries: обязательные фильтры, лимиты периода, запрет поиска без фильтров и защита GPS/Wialon от широких выборок.
- `lib/domain/data-access/workspaceQueryPolicies.ts` — связь будущих модулей с query-policy, чтобы каждая серверная таблица имела явный bounded-query контракт.
- `lib/domain/data-access/persistenceContracts.ts` — связь модулей с будущими persistent entities, versioned patch save, change history и prepared aggregates.
- `lib/server/database/query-policy.ts` — серверный helper для будущих list-handlers в едином database router без отдельного backend-процесса.
- `lib/domain/access-control/moduleAccessPolicies.ts` — связь future module action -> required access capability, чтобы UI и API не расходились в правах.

## Что такое workspace

Workspace - это верхняя рабочая зона диспетчерской службы: Главная, Горная диспетчеризация, Таксировка, СМТС / GPS, Техника, Общие процессы, Отчеты, Администрирование, AI-ассистент.

Workspace не является отдельным приложением. Он является lazy-loaded экраном внутри одного Next.js проекта и использует общий auth/session/data layer.

## Текущий слой

- `app/page.tsx` отвечает только за auth gate.
- `features/app/AppRoot.tsx` собирает состояние, runtime и shell.
- `features/app/AppPrimaryContent.tsx` выбирает активную рабочую зону.
- `features/app/lazyPrimaryContent.tsx` подключает тяжелые зоны через `dynamic`.
- `lib/domain/workspaces/workspaces.ts` хранит карту рабочих зон, их текущее соответствие старым вкладкам и будущие доменные блоки.
- `features/workspaces/WorkspaceOverviewSection.tsx` показывает Главную без загрузки производственных таблиц.
- `features/workspaces/CommonProcessesSection.tsx` дает placeholder для будущих общих процессов.

## Как добавлять новую рабочую зону

1. Добавить id в `BaseTopTab` в `lib/domain/navigation/tabs.ts`.
2. Добавить `TopTabDefinition` в `defaultTopTabs`.
3. Добавить запись в `dispatchServiceWorkspaces`.
4. Создать feature folder: `features/<workspace>/`.
5. Экспортировать экран через `features/app/lazyPrimaryContent.tsx`.
6. Добавить ветку рендера в `features/app/AppPrimaryContent.tsx`.
7. Добавить source-check тест, если новая зона вводит архитектурное правило.

Нельзя добавлять крупный JSX прямо в `AppRoot`, `AppPrimaryContent` или `useAppStateBundle`.

## Как подключать вкладку

Легкая вкладка:

- маленький компонент в `features/<module>`;
- состояние локальное, если оно не нужно другим зонам;
- доменные функции в `lib/domain/<module>`.

Тяжелая вкладка:

- dynamic import;
- отдельный screen props hook;
- данные грузятся только при открытии;
- таблица имеет серверную пагинацию или virtualization;
- edit-mode подключает дополнительные handlers только после кнопки `Редактировать`.

## Где хранить state

State делится на уровни:

- local UI state: внутри компонента таблицы/формы;
- workspace UI state: внутри `features/<workspace>/use...State.ts`;
- shared app state: только то, что нужно нескольким рабочим зонам;
- persistent state: через `lib/data` и серверный database router;
- audit/history: отдельные записи, не localStorage snapshots.

`useAppStateBundle` может агрегировать hooks, но не должен становиться местом новой бизнес-логики.

## Где хранить domain logic

Правила расчетов, нормализации, статусы, ключи строк, conflicts и агрегаты хранятся в `lib/domain/<module>`.

Примеры:

- рейсы, коэффициенты, сменные статусы -> `lib/domain/dispatch`;
- автоматический оперучет из принятых сводок -> `lib/domain/dispatch/operationalAccounting.ts`;
- plan/fact по утвержденным версиям плана -> `lib/domain/dispatch/planFact.ts`;
- причины невыполнения плана -> `lib/domain/dispatch/nonCompletionReasons.ts`;
- готовность диспетчерского отчета к закрытию -> `lib/domain/dispatch/reportReadiness.ts`;
- закрытие диспетчерского отчета через readiness и versioned patch -> `lib/domain/dispatch/reportClosure.ts`;
- контроль сдачи сменных сводок -> `lib/domain/dispatch/submissionControl.ts`;
- GPS-сверка рейсов -> `lib/domain/dispatch/gpsReconciliation.ts`;
- строка сменной сводки участка -> `lib/domain/dispatch/shiftReportLineModel.ts`;
- команды статуса сменной сводки -> `lib/domain/dispatch/shiftReportCommands.ts`;
- планы, оперучет, маркшейдерский замер -> `lib/domain/pto`;
- выдача путевых листов, защита от дублей и одиночная выдача с основанием -> `lib/domain/taxation/waybillIssuance.ts`;
- ходатайства на временное закрепление и проверка пересечений -> `lib/domain/taxation/assignmentPetitions.ts`;
- топливные периоды и баланс топливозаправщиков по ограниченному periodId -> `lib/domain/taxation/fuelAccounting.ts`;
- топливные периоды, накладные, акты -> будущий `lib/domain/fuel`;
- монтаж/снятие терминалов и SIM-карт с историей событий -> `lib/domain/smts/equipmentLifecycle.ts`;
- терминалы, SIM, ДУТ, GPS events -> будущий `lib/domain/smts`;
- перемещение техники и versioned history участка -> `lib/domain/fleet/vehicleMovements.ts`;
- переработки, командировки и задачи командировок -> `lib/domain/common-processes/processCommands.ts`;
- подготовленные агрегаты отчетов и queued export requests -> `lib/domain/reports/preparedReports.ts`;
- права доступа -> `lib/domain/auth`, `lib/domain/access-control/accessMatrix.ts` и `lib/domain/access-control/effectivePermissions.ts`.
- команды создания и patch-изменения grant матрицы прав -> `lib/domain/access-control/grantCommands.ts`.
- policy version-based patch save, conflict response и audit batch -> `lib/domain/editing/patchSavePolicy.ts`.
- общие переходы workflow-статусов -> `lib/domain/workflows/statusTransitions.ts`.
- bounded query policies для тяжелых таблиц и GPS/Wialon -> `lib/domain/data-access/queryPolicy.ts`.

Статусы и переходы не должны жить в React-компонентах. Компонент показывает доступные действия, а domain/data слой проверяет workflow, права и `version` перед сохранением.

## Где хранить API/data layer

Клиентские вызовы идут через `lib/data`. Серверная маршрутизация остается в `app/api/database/route.ts` и `lib/server/database`.

Модули не должны импортировать Supabase/MySQL напрямую из UI. UI вызывает доменные helpers и `lib/data`, а data layer решает, какой backend использовать.

Новые модули не получают отдельный endpoint или отдельный backend. Для каждого будущего модуля `lib/domain/data-access/moduleDataRoutes.ts` фиксирует `resource/action` внутри единого `/api/database`; реальные handlers добавляются позже маленькими PR/коммитами и только после preflight/query/persistence contracts. Пара `resource/action` должна быть уникальной во всем module route catalog, иначе server router и authorization mapping становятся неоднозначными.

Когда UI или future data helper готовит действие модуля, он должен использовать `createWorkspaceModuleDatabaseRequest` из `lib/domain/data-access/moduleDatabaseRequests.ts`. Builder сначала вызывает module preflight, затем возвращает совместимый `{ resource, action, payload }` для `/api/database`. Для section-scoped модулей payload обязан содержать `sectionId`/`section_id` в явном scope, query filters или data, чтобы будущая серверная матрица доступа могла ограничить участок. Для `edit`, `approve`, `delete` и `admin` в patch-only модулях builder требует `PatchSaveCommand` с `entity.id`, `entity.version` и непустыми `changes`, чтобы не протащить сохранение всей таблицы.

Для будущей серверной авторизации modular actions используется `getModuleDatabaseAuthorizationRequirement` из `lib/domain/data-access/moduleDatabaseAuthorization.ts`. Сейчас он не переключает существующий `lib/server/database/authorization.ts`, чтобы не ломать текущие tabPermissions, но уже фиксирует, какой `resource/action` требует `view`, `edit`, `approve`, `delete`, `export` или `admin` capability из матрицы доступа.

`lib/domain/data-access/moduleDatabaseAuthorizationEnvelope.ts` is the future access-matrix authorization envelope for those actions. It accepts an already calculated `EffectiveAccessDecision`, rejects missing section scope and missing capability, and keeps `matchedGrantIds` so future handlers can audit exactly which grant allowed a database action.

Тот же файл содержит `createModuleDatabaseAuthorizationContext` и `resolveModuleDatabaseSectionId`: будущий server handler должен извлекать участок из единого payload-формата так же, как UI/data helper. Это важно для section-scoped модулей, где доступ ограничивается не только вкладкой, но и участком.

`lib/server/database/module-authorization.ts` is the compatibility bridge for that future step. It is already called from the live `authorizeDatabaseRequest` for actions listed in `moduleDataRoutes.ts`: legacy resources keep their existing checks, while future module actions must pass the current tab-permission fallback and section-scope requirement before a handler is added.

Future module actions that have a route contract but no real handler return a deliberate 501 from `lib/server/database/planned-module-actions.ts`. This keeps the shared router honest during rollout: the action is known, access was checked, but the database behavior is still planned rather than silently falling through as an unknown endpoint.

The planned 501 payload also includes compact `authorization`, `handlerReadiness`, and `implementationPlan`: required capability, section-scope requirements, contract kind, authorization coverage, matching handler contract coverage, rollout phase, and readiness issues. This is a deployment checklist, not a live handler; it keeps the next backend step small without adding another API process.

Real handlers should follow `listModuleHandlerImplementationPlan`: begin with bounded list/detail/on-demand read models, then queued export/import handlers, and only after that connect create/patch/transition handlers with version checks and change history. This preserves the existing site while the modular monolith grows.

`getModuleHandlerImplementationDependencyIssues` blocks export/import/write rollout when a module has no ready read-model handler. This keeps every new heavy action anchored to a cheap, inspectable list/detail path before writes or file workflows are connected.

`evaluateModuleHandlerImplementationGate` is the final pre-handler check for a single `resource/action`. Planned 501 responses expose its `readyToConnectHandler` result so the API can say “known and contract-ready, but still not implemented” without silently activating data writes.

`lib/domain/data-access/moduleHandlerRuntimeContracts.ts` defines the runtime wrappers required by each phase. Planned 501 responses include `runtimeContract.requirements`, such as authorization before handler, server query policy assertion, page-size enforcement, queued exports, stored import files, atomic write transactions, change-history writes, post-commit side effects, and compact write responses.

`lib/domain/data-access/moduleLiveHandlerRegistry.ts` is the explicit switchboard between planned actions and live handlers. At this stage every future module handler stays `planned-only`; moving one action to `live` must be a small backend change with a green implementation gate and runtime contract. Planned 501 payloads expose `liveHandler.status` so UI/tests can tell “contract-ready” from “actually implemented”.

`lib/domain/data-access/moduleHandlerActivation.ts` is the review envelope for that promotion. It allows exactly one `resource/action` per activation, requires requester, reason, implementation path, `npm run verify`, and rollback plan, then returns the registry key that may be moved to `live`. It does not mutate the registry by itself.

`lib/server/database/write-handler-registration-review.ts` is the passive write-registration preflight. It checks that a future write action has a write pipeline, uses the expected guarded factory (`create` or `patch`), carries the write runtime requirements including `compact_write_response`, passes activation review, and still reports `doesNotRegisterHandler = true`.

`scripts/review-write-handler-registration.ts` exposes that preflight as `npm run review:write-handler`. The CLI returns a JSON review packet with `databaseConnection = false` and `liveRegistryMutation = false`, so operators can check readiness without touching MySQL, the registry, or the live handler map.

`scripts/plan-write-handler-activation-packet.ts` exposes the earlier planning step as `npm run plan:write-handler-activation`. It combines activation review, planned/live status and write-registration readiness for one `resource/action`, reports `handlerRegistrationMutation = false`, and keeps `write_handler_not_registered` in the packet so a plan cannot be confused with a live registration.

`lib/server/database/module-live-handlers.ts` is the single server dispatch point for promoted module handlers. The router checks it before planned 501 responses, but the handler map is empty until a reviewed activation adds exactly one bounded implementation. Missing live implementations return an explicit configuration error instead of falling through silently.

`lib/server/database/module-handler-execution.ts` provides the first execution guard for those handlers. A live list handler must create a bounded list execution context before touching data; a live detail handler must create a single-row detail context with `id` and scope. This keeps future handler code from bypassing query policy, page-size limits, detail `maxRows: 1`, or section/vehicle scope.

`lib/server/database/module-write-execution.ts` provides the matching guard for future live create/patch/workflow handlers. Create handlers must pass the server create envelope with duplicate checks and initial version; patch/workflow handlers must pass versioned patch validation, expected version, allowed field groups, one-row write limits, change-history/post-commit requirements, and compact response planning before any database mutation code can run.

`lib/server/database/module-file-execution.ts` provides the guard for future live export/import handlers. Export handlers must create queued file-by-reference requests from bounded filters; import handlers must use stored source files, staged validation, limited preview/issue pages, and validation summaries instead of inline bytes, parsed rows, or whole-table replacement.

`lib/server/database/module-handler-factories.ts` provides the preferred wrapper API for future live handlers. A handler should be registered through the matching factory (`list`, `detail`, `create`, `patch`, `export`, `import-batch`, `import-validation`) so guard context is created before module business logic can run.

Live handler registration uses metadata in `lib/server/database/module-live-handlers.ts`: each future registration must declare `resource`, `databaseAction`, `factoryKind`, `implementationPath`, and the guarded handler. Duplicate registrations, missing implementation paths, unknown factory kinds, factory/handler mismatches, unguarded handlers, live keys without registrations, or registrations without matching live keys are source-checkable errors before runtime.
The same issues also block runtime handler-map creation, so a bad registration cannot silently replace another handler or bypass the guarded factory path.

Workspace guardrails also verify these runtime contracts and live-handler activation issues. A future module action is not implementation-ready unless every planned handler keeps the shared database router and authorization as base runtime requirements, and no `live` handler is registered while its gate is blocked.

`lib/domain/workspaces/handlerRolloutSummary.ts` provides a lightweight rollout summary per workspace: phase counts, ready action counts, blockers, runtime blockers, dependency issues, the next safe batch, and write-planning counters. The write counters must show planned write actions separately from live write actions, so the overview can say that write workflows exist without implying they are activated. The workspace overview can show this without loading any production rows.

Для крупных списков future list-handler должен сначала вызвать `assertDatabaseListQueryPolicy` из `lib/server/database/query-policy.ts`, а уже потом обращаться к базе. Это оставляет один database router, но не дает случайно выполнить широкий GPS/Wialon или отчетный запрос без периода, участка и лимита.

Перед добавлением нового server-paginated или aggregate модуля нужно добавить binding в `lib/domain/data-access/workspaceQueryPolicies.ts`. Source-check `workspace-query-policy-checks.ts` должен оставаться зеленым: если модуль требует серверной выборки и не имеет policy, это архитектурная ошибка.

Перед добавлением записи в базу для нового модуля нужно добавить contract в `lib/domain/data-access/persistenceContracts.ts`. Для `versioned-patch` и `workflow-patch` обязательны `version`, patch-only save и change history; отчеты используют prepared aggregates и export requests, а AI работает on-demand.

Для create-действий нужно добавить plan в `lib/domain/data-access/moduleCreateMutationPlans.ts`: таблица, `version = 1`, статус, audit columns, required field groups и duplicate-key groups должны быть известны до handler-реализации. `createWorkspaceModuleDatabaseRequest` обязан отклонять create payload без обязательных групп данных до попадания в `/api/database`.

Для export-действий нужно добавить plan в `lib/domain/data-access/moduleExportPlans.ts`: source kind (`bounded-list-query` или `prepared-aggregate`), обязательные фильтры, допустимые форматы, лимит периода, лимит строк и export request entity. Export handler не должен пересчитывать большие отчеты на клиенте и не должен держать файл в React state.

`lib/domain/workspaces/guardrails.ts` собирает эти правила вместе. Если future module добавлен в каталог, но не имеет access-policy, query-policy, index-contract, persistence-contract, data-route contract, уникального database action, create/patch/detail/export plan или mapping database action -> access capability, guardrail тест должен падать до начала UI/API реализации. `lib/domain/workspaces/readiness.ts` использует этот отчет в легкой главной зоне, поэтому готовность workspace отражает не только placeholder-экран, но и наличие архитектурных предохранителей.

SQL indexes are planned from `lib/domain/data-access/indexMigrationPlan.ts`: the helper quotes only safe MySQL identifiers, rejects empty field lists, and checks duplicate table/index names. Real migrations must be applied later as explicit DevOps/database work, not from a persistent Next.js process.

Future UI/API handler перед действием `list`, `edit`, `approve`, `export` должен использовать `preflightWorkspaceModuleAction` из `lib/domain/workspaces/moduleActionPreflight.ts`: сначала проверяется capability, затем query policy, persistence contract и registered database action. Это не заменяет серверную авторизацию, а дает единый доменный preflight для экранов и будущих route handlers.

## Как не перегружать AppRoot

`AppRoot` должен оставаться shell-компонентом:

- auth provider;
- AI provider;
- page shell;
- header;
- primary content.

Новые workflow, таблицы, формы, dialogs и business rules не добавляются в `AppRoot`.

## Как не перегружать useAppStateBundle

Разрешено:

- агрегировать уже выделенные hooks;
- передавать shared state между существующими зонами;
- держать только действительно общий state.

Запрещено:

- добавлять массивы документов целиком;
- хранить GPS/Wialon события глобально;
- держать тысячи строк таблицы в общем React state;
- добавлять workflow-логику прямо в bundle;
- сохранять целые таблицы при изменении одной строки.

Для новых рабочих зон создаются отдельные hooks/providers, например:

- `features/taxation/useWaybillState.ts`;
- `features/smts/useSmtsFilters.ts`;
- `features/common-processes/useApprovalQueue.ts`.

## Lazy loading

Каждая крупная зона должна открываться через lazy loading:

- `dynamic(() => import(...), { ssr: false })` для тяжелых client screens;
- не preloading PTO, GPS, reports и больших таблиц при старте;
- idle preload допустим только для легких разделов и только после первичной загрузки.

Главная и placeholder-экраны легкие: они показывают карту модулей и не грузят данные.

## Поддомены

Поддомен открывает workspace, но не меняет физическую архитектуру:

- `gd.aam-dispatch.kz` -> `topTab=dispatch`;
- `dt.aam-dispatch.kz` -> `topTab=fuel`;
- `smts.aam-dispatch.kz` -> `topTab=tb`;
- `pto.aam-dispatch.kz` -> `topTab=pto`;
- `reports.aam-dispatch.kz` -> `topTab=reports`;
- `admin.aam-dispatch.kz` -> `topTab=admin`.

`workspaceSubdomainRoutes` stores only plain lower-case `*.aam-dispatch.kz`
hosts. Do not put schemes, ports, paths, comma-separated proxy headers,
localhost values, or external domains into the route registry; normalization is
only for reading incoming `host` values.

Реализация будущего этапа:

1. Middleware читает `host`.
2. Host сопоставляется с `workspaceSubdomainRoutes`.
3. Пользователь остается в том же приложении и той же сессии.
4. Если нет `can_view`, показывается отказ доступа.
5. Data layer остается единым.

Legacy tabs are bridged explicitly. `pto` continues to open the existing PТО
screens, but architecture tooling treats it as part of the future
`mining-dispatch` workspace. `contractors` continues to open the existing
contractor screens, but architecture tooling treats it as part of the future
`taxation` workspace. This preserves current functionality while avoiding a
separate application or database for old tabs.

## Правило роста

Новый модуль добавляется сначала как:

- domain model;
- data contract;
- versioned service contracts;
- server-side pagination contract;
- lazy screen;
- source-check;
- документация.

Только после этого подключаются таблицы, workflow и миграции.

## Verification groups

`check:domain` stays a coordinator, not a long inline list of every source-check.
New checks should be added to the nearest group:

- `check:app-shell` for auth, shell, preload and shared app boundaries;
- `check:dispatch-architecture` for architecture docs, audit docs and script structure;
- `check:workspaces` for workspace UI, routing, readiness and guardrails;
- `check:dispatch-modules` for future dispatch service module contracts;
- `check:data-access` for query policies, route contracts, handlers and persistence plans;
- `check:legacy-domain` for existing PTO, fleet, reports, database and migration checks.

If a new module needs many checks, create a new grouped script and call it from
`check:domain`. Do not append many `jiti tests/...` entries directly to
`check:domain`; the script must remain easy to scan during release checks.

## Stage 2 implementation roadmap

The next implementation stage is planned through
`lib/domain/workspaces/implementationRoadmap.ts`. It reads the existing handler
implementation contracts and produces a safe rollout order:

1. `read-model`: connect bounded list/detail handlers first.
2. `export-queue`: generate Excel/PDF only on demand and from bounded queries.
3. `import-staging`: stage uploaded files by reference, without keeping large
   spreadsheets in memory.
4. `write-workflow`: enable versioned patch saves, conflict handling and audit
   history only after read handlers for that module are ready.

The roadmap deliberately keeps future work inside one Next.js project, the
shared `/api/database` route and the shared access matrix. It is not a runtime
background job and does not load production data; it is a planning guardrail for
small implementation batches.

For the first real backend pass, use `createWorkspaceReadModelRolloutPlan`.
It groups only read-model actions by module, so the first batch connects
bounded `list`/`detail`/on-demand handlers before any write, export or import
handler. A good first batch is one or two modules with list/detail actions,
server filters, access checks, and no UI edit mode.

The concrete handoff for that pass is `docs/STAGE_2_READ_MODEL_ROLLOUT.md`.
It names the first candidate modules and the backend/frontend acceptance
criteria for a read-only rollout.

## Live handler activation runbook

Every future move from `planned-only` to `live` must be a single small backend
change. Use `reviewModuleHandlerActivation` from
`lib/domain/data-access/moduleHandlerActivation.ts` before adding a live handler
registry key.

Required activation record:

- `resource` and `databaseAction`;
- `requestedBy`;
- `changeReason`;
- `implementationPath`;
- `verificationCommands` containing `npm run verify`;
- `rollbackPlan`;
- `activationScopeSize` equal to `1`.

Activation is blocked when the action is unknown, already live, missing the
implementation gate, missing the runtime contract, missing the verify command,
or trying to register a batch. The live handler must still use the shared
`/api/database` router, authorization-before-handler, server query policy and
the guarded handler factory for its kind. Rollback is always removing the live
registry key and returning the action to the `planned-only` 501 response.

The detailed operational checklist lives in
`docs/LIVE_HANDLER_ACTIVATION_RUNBOOK.md`. Keep that runbook aligned with
`reviewModuleHandlerActivation`, the live handler registry and the guarded
handler factories before connecting the first read-model handler.

The later write-handler checklist lives in
`docs/STAGE_2_WRITE_HANDLER_ROLLOUT.md`. It must stay a planning document until
the matching read-model path is ready, `plan:stage2-write-handlers`,
`plan:write-handler-activation` and `review:write-handler` are green, and the
implementation can keep version checks, change history, post-commit side
effects and compact write responses inside the shared `/api/database` route.
