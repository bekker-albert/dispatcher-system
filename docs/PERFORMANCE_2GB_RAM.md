# Performance For 2 GB RAM

Next build worker budget: `next.config.ts` keeps the modular monolith inside the 2 GB RAM target with `experimental.cpus=2`, `memoryBasedWorkersCount=true`, `parallelServerBuildTraces=false`, `turbopackMemoryLimit` below total server RAM, and `webpackMemoryOptimizations=true`. Do not raise these limits until `npm run build` is checked on the target server.

Runtime memory budget: local helper startup and production PM2 reload set `NODE_OPTIONS=--max-old-space-size=1024` so the Next.js process cannot grow its V8 old heap past the 1 GB runtime budget. This is intentionally lower than the total server RAM because the OS, MySQL client buffers, native Next.js memory, PM2, and SSH/deploy work also need headroom on a 2-4 GB machine.

## Runtime process guardrail

Do not add child_process, worker_threads, cluster, Web Workers, or resident polling loops to app/module runtime code. AI and workspace work must stay manual, event-driven, or scheduled queued work with bounded context. `tests/runtime-process-guardrails-checks.ts` scans app, feature, shared, domain, and server runtime folders for process/worker primitives, and it separately blocks resident intervals in AI/workspace/server database code.

## Package script runtime guardrail

`dev`, `build`, `start`, `verify`, `release:check`, and `check:*` scripts must
not run migrations, database CLIs, permanent servers, or multi-process
orchestration. They stay lightweight and predictable for the 2 GB RAM server:
`dev` starts the single Next.js dev server, `build` runs `next build`, `start`
runs `next start`, and `verify` runs lint/typecheck/build/source checks only.

Migration scripts stay manual. `migrate:supabase-to-mysql` may exist as an
explicit operator action, but it must not be called by build, start, verify, or
release checks. `tests/package-script-runtime-guardrails-checks.ts` keeps this
executable and also keeps planning scripts passive.

## Smoke runtime guardrail

Smoke scripts must stay lightweight. They may check the home page, shared
`/api/database` status, auth blocking, and one bounded planned action, but they
must not call legacy broad `load` actions, run migrations, import database
clients directly, spawn workers, or add polling loops. Production smoke uses
`PRODUCTION_SMOKE_TIMEOUT_MS` and local smoke uses `LOCAL_SMOKE_TIMEOUT_MS` so
network checks cannot hang the release path.

Authenticated smoke checks should prove the route shape, not fetch operational
datasets. Use a bounded planned action such as `taxation/list-waybills` and
assert server pagination, `noClientFullScan`, and max page-size limits. The
shared source check `tests/smoke-runtime-guardrails-checks.ts` keeps both smoke
scripts aligned with the 2 GB RAM target.

## Dependency budget guardrail

Do not add Express, Fastify, NestJS, Prisma, TypeORM, Sequelize, BullMQ, Agenda,
PM2, Nodemon, Vite, Nx, or Lerna to this project. Those packages pull the
system toward a second backend, a heavier ORM/runtime, resident workers, or
multi-app orchestration, which conflicts with the one Next.js process and 2 GB
RAM target.

New dependencies must support the existing single Next.js process, shared auth,
shared `/api/database` router, and one data layer. `tests/package-dependency-guardrails-checks.ts`
keeps the dependency budget executable while still allowing small UI or utility
packages when they fit the modular monolith.

Index coverage is now an explicit architecture contract: `lib/domain/data-access/indexContracts.ts` lists future database indexes for every server-paginated, aggregate, and export module. Every required filter from a module query policy must be covered before a real handler or migration is added, so the 2 GB RAM server does not rely on wide table scans.

`lib/domain/data-access/indexMigrationPlan.ts` converts those contracts into a reviewable MySQL `ALTER TABLE ... ADD INDEX` plan, checks unsafe identifiers, empty field lists, and duplicate table/index names. It is intentionally passive: it does not connect to the database or run migrations from the app process.

`lib/server/database/list-query-builder.ts` prepares parameterized `WHERE`, `ORDER BY`, `LIMIT`, and `OFFSET` SQL fragments from a validated `ServerPageQuery`, so future handlers do not build unbounded or unsafe list queries by hand.

`lib/domain/data-access/listQueryEnvelope.ts` wraps future table reads as `server-only` list envelopes, caps `maxClientRows` to pageSize, creates a stable query cache key, and validates that API results do not return more rows than requested.

`lib/domain/data-access/moduleListQueryPlans.ts` maps each future server list action to allowed table names, filter columns, search columns, sort columns, and default sort. Every query-policy required filter must have a column mapping before a real handler is implemented.

`lib/domain/data-access/moduleDetailQueryPlans.ts` maps each future detail/open action to a single-row `id` lookup plan with explicit selected columns, scope columns, and version output for versioned entities. Detail screens must not load list datasets just to open one record.

`lib/domain/data-access/detailQueryEnvelope.ts` wraps future detail/open reads as `server-only` single-row envelopes: one `id`, at least one declared scope for scoped modules, `maxRows: 1`, and version checks for versioned records.

Planned `/api/database` list/detail actions return HTTP 501 with a compact `readQuery` payload. It exposes only safe guardrails such as server pagination, required filters, max page size, detail `maxRows: 1`, and `noClientFullScan`; it does not expose table names or column names.

Planned action payloads are also covered by source checks so future 501 responses remain public guardrail contracts and do not leak internal table names, column names, or persistence entity names.

Planned actions expose compact `authorization`, `handlerReadiness`, and `implementationPlan` blocks so the shared router can prove an action has access-matrix scope, section filters where required, rollout phase, and a matching list/detail/write/import/export contract before a real database handler is connected. This avoids speculative handlers that would bypass 2 GB RAM guardrails.

`lib/domain/data-access/moduleHandlerImplementationPlan.ts` keeps rollout order explicit: bounded read models come before exports/imports, and write/workflow handlers come last. That prevents the 2 GB RAM server from receiving heavy writes, whole-file imports, or report exports before the safe read path and access scope are proven.

The same plan reports dependency issues when export/import/write actions do not have a ready read-model handler in the same module. Workspace guardrails treat that as a blocker so large workflows cannot be added before bounded reads exist.

Planned 501 responses include `implementationPlan.readyToConnectHandler`. A true value means the action has the architecture contracts needed for a future handler; it does not mean the handler is live, and the router still returns 501 until a small backend implementation is added deliberately.

Planned 501 responses also include `runtimeContract.requirements`. These requirements keep future handlers bounded: list handlers must assert query policy and page-size limits, exports must be queued and file-by-reference, imports must use stored files and staged validation, and write handlers must use atomic versioned transactions with change history, post-commit side effects, and compact write responses.

`lib/domain/data-access/moduleLiveHandlerRegistry.ts` keeps all future module handlers `planned-only` until a deliberate small backend change promotes a single `resource/action` to `live`. This prevents contract-ready actions from becoming accidental runtime work on the 2 GB RAM server.

`lib/domain/data-access/moduleHandlerActivation.ts` blocks handler promotion unless the change is one action, has an implementation path, rollback plan, and `npm run verify` in the verification list. This keeps backend rollout small enough for a constrained server and easy to reverse.

`lib/server/database/module-live-handlers.ts` adds one dispatch point inside the existing database router, not a new process or endpoint. With an empty live map, planned module actions still return 501; when one handler is promoted later, it must run through the same auth, write-origin guard, and bounded runtime contract.

`lib/server/database/module-handler-execution.ts` makes future live read handlers start from bounded execution contexts. List handlers must pass query policy and page-size checks before SQL; detail handlers must request one `id`, one row, and an explicit scope filter before reading.

`lib/server/database/module-write-execution.ts` makes future live write handlers start from bounded mutation contexts. Create/patch/workflow handlers must validate one document, one expected version where required, one entity row write, change history, post-commit side-effect boundaries, and compact write response planning before they can touch SQL. It also exposes `createPostCommitSideEffectsPlan()` so report refresh queuing stays after transaction commit and outside inline request recalculation.

`lib/server/database/module-file-execution.ts` makes future live export/import handlers start from bounded file workflow contexts. Exports are queued and file-by-reference; imports require stored files, row limits, preview limits, issue page limits, and summary-only validation, with inline bytes/rows/table payloads rejected before parsing.

`lib/server/database/module-handler-factories.ts` keeps future handler implementations on these rails by wrapping the handler function with the correct guard first. Invalid payloads are rejected before the module callback runs, which prevents accidental full-table reads, whole-table saves, or inline file processing.

Live handler registrations must also carry `factoryKind` and `implementationPath`, they must be created through the matching guarded factory, and they must match configured live keys one-to-one. This keeps rollout reviewable on a 2 GB RAM server: one known `resource/action`, one guarded factory, one implementation file, no duplicate registrations, no dormant handler registration, and no live switch without a server handler.
Invalid registration metadata blocks the live handler map before runtime dispatch, preventing accidental full-table or unbounded handlers from reaching the shared database router.

`lib/server/database/write-handler-registration-review.ts` adds the write-specific preflight before any future create/patch registration is prepared. It checks the write pipeline, expected guarded factory, runtime requirements including `compact_write_response`, activation metadata, `npm run verify`, rollback plan, and keeps the review passive with no handler registration.

`npm run review:write-handler` wraps that write preflight without opening MySQL or mutating the live registry. Its output is a bounded JSON review packet, so future backend work can stop early when a write action would bypass transaction/history/post-commit/compact-response rules.

`npm run plan:write-handler-activation` is even more conservative: it builds a plan-only packet for one create/patch action and reports `databaseConnection = false`, `liveRegistryMutation = false`, `handlerRegistrationMutation = false`, and `write_handler_not_registered`. This keeps a 2 GB RAM deployment from accidentally turning a contract-ready write into runtime work.

Workspace guardrails fail when a planned handler has no runtime contract, when the implementation gate is blocked, when the base router/auth requirements disappear, or when a `live` handler is registered with activation issues. This keeps future backend work inside the modular monolith instead of drifting into ad hoc handlers.

Workspace rollout summaries are metadata-only. They count planned handler phases and blockers from static contracts, so the overview can guide implementation without querying large production tables or keeping module datasets in React state.

`lib/domain/data-access/moduleCreateMutationPlans.ts` maps future create actions to one-row insert contracts with initial version, audit columns, initial status, and duplicate-key checks. Batch creation must still write individual documents and reject duplicates through indexed operational keys, not by loading full tables into memory.

`lib/domain/data-access/moduleExportPlans.ts` maps future export actions to queued Excel/PDF/CSV requests with bounded filters, maximum date ranges, maximum row counts, and file references. Exports must not build large files in browser memory or recalculate full reports on each click.

`lib/domain/data-access/exportRequestEnvelope.ts` wraps those export plans as server-only queued requests. A future handler must accept only an allowed format/grain, a requester id, bounded server filters, and a row limit from the module plan; client-loaded `rows`, `table`, `dataset`, or `records` payloads are rejected.

Planned `/api/database` export actions return HTTP 501 with an `exportPipeline` payload: allowed formats/grains, required server filters, date and row limits, queued request requirement, file-by-reference storage, and a ban on inline file content.

`lib/domain/reports/exportArtifacts.ts` defines the lifecycle for generated Excel/PDF/CSV files. Ready exports must return a stored `fileId`, mime type, byte size, `generatedAt`, and `expiresAt`; inline bytes/base64/content are rejected so files are generated on demand and passed by reference.

`lib/domain/reports/aggregateRefresh.ts` keeps prepared aggregate refreshes as queued, bounded operations. A refresh must declare period, module, metrics, source ids or section scope, `sourceVersion`, row/runtime limits, and `upsert-affected-aggregates`; continuous background rebuilds and full-report rebuilds are blocked.

`lib/domain/reports/aggregateRefreshSources.ts` maps report refresh jobs to bounded source modules such as operational accounting, fuel periods, SMTS fuel drains, and vehicle movements. Each source must have a server list-query plan, mapped filters, allowed grains, row/runtime limits, and no continuous background trigger.

`lib/domain/reports/aggregateInvalidation.ts` turns one changed source entity into one bounded aggregate refresh plan. It requires entity id, actor, timestamp, affected period, `sourceVersion`, and source module plan; whole-table invalidation and continuous background refresh are rejected.

`lib/domain/reports/aggregateInvalidationPlans.ts` binds source create/patch/workflow/import actions to aggregate invalidation. Each mapped mutation must come from an existing versioned write/import plan and queue only an affected-entity refresh, preventing future handlers from saving source rows without refreshing prepared aggregates.

`lib/domain/data-access/writeSideEffectsEnvelope.ts` keeps write side effects post-commit and bounded. It requires change history inside the write transaction, queues aggregate invalidation when the mutation feeds reports, and rejects inline report rows or full rebuild side effects.

`lib/server/database/mutation-side-effects-plan.ts` keeps that rule executable in the server data layer. A future live write may queue prepared aggregate refresh only after an atomic transaction plan can commit, and the queued payload must be bounded, file/result-by-reference, non-resident, and free of client-side or inline report recalculation.

`lib/server/database/mutation-response-plan.ts` keeps write responses bounded for the 2 GB RAM server. Future create/patch handlers return compact entity/version metadata and queued refresh ids, while conflicts or duplicate creates return `409` with one-row reload or duplicate hints. They must not return full tables after a write.

`lib/domain/data-access/moduleWritePipelinePlans.ts` derives bounded write pipelines from module create/patch plans. Every future source handler must keep access preflight, payload validation, one-entity transaction, change history, and post-commit side effects instead of doing ad hoc multi-row writes or inline report recalculation.

`lib/domain/workspaces/queuedOperations.ts` defines a common policy for long workspace operations: exports, prepared aggregate refreshes, AI runs, GPS reconciliation, and import validation must be manual, event-driven, or scheduled queued jobs with bounded context, row/runtime limits, result references, and no resident background process.

`lib/domain/data-access/importBatchEnvelope.ts` keeps legacy Excel/CSV intake staged and bounded. Import handlers must receive a stored file reference, declared row count, preview limits, and validation mode; inline rows, table data, bytes, base64, or whole file content are rejected before parsing.

`lib/domain/data-access/importValidationEnvelope.ts` returns staged import validation as a summary plus one bounded issue page. Large row-level error lists stay on the server, and the UI receives `totalIssueCount`, `returnedIssueCount`, and `hasMoreIssues` instead of thousands of validation rows.

`lib/domain/data-access/moduleImportPlans.ts` maps future Excel/CSV intake to the same `/api/database` modular-monolith route. Every import plan requires a stored source file, staged validation, bounded preview rows, bounded validation issues, and individual accepted-row persistence instead of whole-table replacement.

Planned `/api/database` import actions return HTTP 501 with an `importPipeline` payload: allowed formats/modes, max row limits, preview/issue page limits, stored-file requirement, staged validation, summary-only validation output, and a hard ban on whole-table replacement.

## Текущие опорные контракты

- `lib/domain/data-access/pagination.ts` задает допустимые `pageSize` 25/50/100, server-side pagination query/result, список ключевых фильтров и рекомендуемых индексов.
- `lib/domain/data-access/queryPolicy.ts` задает проверяемые guard-правила для тяжелых таблиц: обязательный период/участок/статус, короткий диапазон GPS, запрет unbounded search и ограничение `pageSize`.
- `lib/domain/data-access/workspaceQueryPolicies.ts` связывает будущие модули с конкретной policy: сменные сводки, GPS-события, топливные периоды 1С, техника, отчеты и матрица доступа не должны открываться без своего bounded-query правила.
- `lib/domain/data-access/persistenceContracts.ts` задает, какие будущие сущности сохраняются patch-ами, где обязательны `version` и change history, какие отчеты читают prepared aggregates и какие операции идут только по запросу.
- `lib/domain/data-access/moduleCreateMutationPlans.ts` фиксирует duplicate-key groups для новых документов: сменные сводки, путевые листы, топливные периоды, перемещения, командировки и матрица доступа не должны искать дубли полным сканом в браузере.
- `lib/server/database/query-policy.ts` готовит серверный helper для будущих list-handlers: он нормализует payload, применяет query policy и возвращает `DatabasePayloadError` до обращения к базе.
- `lib/domain/dispatch/shiftReportQueries.ts` применяет этот контракт к будущему списку сменных сводок: период, участок, смена, статус и bounded query вместо загрузки всех сводок.
- `lib/domain/dispatch/gpsReconciliation.ts` принимает уже ограниченный набор GPS-рейсов за выбранные дату/смену/технику; полную историю GPS/Wialon нельзя тянуть в браузер или держать в памяти.
- `lib/domain/workspaces/subdomainRouting.ts` готовит будущую маршрутизацию поддоменов внутри того же Next.js проекта без отдельных приложений.
- `lib/domain/reports/aggregation-contracts.ts` фиксирует подготовленные агрегаты отчетов и Excel/PDF/CSV export requests по запросу.

## Ограничение

Production-сервер имеет 2 GB RAM. Это архитектурное ограничение первого класса. Система должна быть быстрым модульным монолитом, а не набором тяжелых приложений.

## Запрещено

- Создавать отдельное Node.js приложение под каждый модуль.
- Поднимать несколько постоянных backend-процессов.
- Делать отдельные базы под модули.
- Загружать все вкладки и все данные при старте.
- Держать большие массивы данных в глобальном React state.
- Делать Excel в браузере на тысячи строк без пагинации или virtualization.
- Пересчитывать большие отчеты на клиенте.
- Сохранять целые таблицы, если изменилась одна строка.
- Расширять `AppRoot`, `useAppStateBundle` или `page.tsx` до огромных файлов.
- Тянуть GPS/Wialon полностью.
- Держать AI-ассистента в постоянном фоне.

## Обязательно

- Один Next.js процесс.
- Один проект.
- Один data layer.
- Одна база данных.
- Lazy loading рабочих зон.
- server-side pagination для больших таблиц.
- Серверная фильтрация.
- Серверная сортировка.
- Серверный поиск.
- Лимиты выборок.
- Patch-сохранение измененных строк/полей.
- Отчеты через агрегаты или подготовленные данные.
- Excel/PDF генерация по запросу.
- AI по запросу, событию или расписанию, без постоянного анализа всего проекта.

## Лимиты данных

Стандартные размеры страницы:

- `pageSize=25` для тяжелых таблиц и мобильного режима;
- `pageSize=50` как обычный desktop default;
- `pageSize=100` только для опытных пользователей и легких таблиц;
- экспорт больших периодов только через backend job/request.

Каждый список обязан принимать:

- `limit`;
- `offset` или `cursor`;
- `date_from`;
- `date_to`;
- `section_id`;
- `status`;
- доменные фильтры: `vehicle_id`, `driver_id`, `contractor_id`, `period_id`, `terminal_id`.

## Таблицы

Таблица в режиме просмотра:

- не монтирует редактор;
- не хранит selection state для тысяч строк;
- не создает input для каждой ячейки;
- получает только текущую страницу;
- применяет фильтры на сервере.

Режим редактирования:

- включается кнопкой;
- работает с активной строкой или страницей;
- отправляет patch;
- проверяет `version`;
- пишет audit log.

## Индексы

Предусмотреть индексы:

- `date`;
- `section_id`;
- `shift`;
- `vehicle_id`;
- `driver_id`;
- `status`;
- `created_at`;
- `updated_at`;
- `contractor_id`;
- `period_id`;
- `terminal_id`;
- `date + section_id + shift`;
- `vehicle_id + date`;
- `contractor_id + period_id`.

## Lazy loading

Idle preloading is currently disabled for primary workspaces. If it is reintroduced, it must stay allowlisted and narrow, and it must not preload PTO date grids, reports, admin tools, fuel, fleet, SMTS, AI, Горная, or new workspace placeholders. `tests/section-preloader-guardrails-checks.ts` keeps this executable so a future navigation change cannot quietly turn the home screen into an eager workspace loader.

Крупные зоны должны грузиться по требованию:

- Горная диспетчеризация;
- Таксировка;
- СМТС / GPS;
- ПТО;
- Отчеты;
- Администрирование;
- AI-ассистент.

Главная не загружает данные этих зон. Она показывает карту и легкие статусы.

## Отчеты

Отчеты не должны пересчитывать весь год на клиенте при каждом открытии.

Правильный путь:

- хранить дневные/сменные факты структурно;
- готовить месячные, вахтовые и годовые агрегаты;
- пересчитывать только затронутый период после patch;
- строить отчет из агрегатов и ограниченного набора строк;
- экспортировать Excel/PDF по кнопке.

## GPS/Wialon

GPS/Wialon запросы всегда ограничиваются:

- периодом;
- участком;
- техникой;
- типом события;
- лимитом.

События сливов, простоев, экодрайвинга и терминалов не должны загружаться глобально.

## Excel/PDF

Excel/PDF создаются по запросу:

- пользователь выбирает период и фильтры;
- сервер или клиент получает только нужные данные;
- файл не хранится в памяти дольше генерации;
- большие выгрузки не запускаются при открытии страницы.

## AI-ассистент

AI-ассистент получает ограниченный runtime context:

- активная рабочая зона;
- выбранная дата;
- выбранная вкладка;
- краткие статусы.

Он не должен постоянно анализировать все вкладки, все таблицы, GPS и документы.

## Контрольные вопросы перед новой функцией

1. Загружается ли модуль лениво?
2. Есть ли limit/offset или cursor?
3. Где выполняются фильтр, поиск и сортировка?
4. Сохраняется ли только patch?
5. Есть ли `version` для конфликта?
6. Пишется ли audit log?
7. Не добавили ли мы большой массив в global React state?
8. Не появился ли отдельный backend-процесс?
9. Не появилась ли отдельная база под модуль?
