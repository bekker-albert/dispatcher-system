# Stage 2 Read Model Rollout

This is the handoff plan for the first real data-backed implementation after
the architecture scaffold. It intentionally limits the next step to read-only
server handlers.

## Goal

Connect the first bounded read models without changing existing PTO, reports,
fleet, fuel, auth, admin, or AI behavior.

The first implementation pass must:

- keep one Next.js project;
- keep one shared `/api/database` route;
- keep the current authorization/session layer;
- use the access matrix capability contract before the handler;
- use server pagination, server filters, server sort, and bounded search;
- return detail rows with `version` where the module is versioned;
- keep planned actions at `501 planned_module_database_action` until their live
  handler is explicitly registered;
- avoid write, export, import, workflow, Excel/PDF, and UI edit mode work.

## Recommended First Batch

Start with one workspace and one or two modules. The preferred first candidate
is taxation because it has clear list/detail boundaries and can prove the
future workflow safely:

- `taxation-waybills`
  - `list-waybills`
  - `get-waybill`
  - required filters: `date`, `section_id`, `status`
  - optional filters: `shift`, `driver_id`, `vehicle_id`
  - max page size: `100`
  - no create/patch/print/export in this batch

Second candidate after the first module is stable:

- `mining-shift-reports`
  - `list-shift-reports`
  - `get-shift-report`
  - required filters: `date`, `section_id`, `shift`, `status`
  - max page size: `100`
  - no submit/accept/return workflow in this batch

Do not connect more than two modules in one pull request.

## First Batch Contract

The first backend batch is also represented in code by
`createStage2FirstReadModelBatch` in
`lib/domain/workspaces/implementationRoadmap.ts`. It is deliberately limited to
a maximum of two modules:

- `taxation-waybills`
- `mining-shift-reports`

The contract exposes only read-model `list` and `detail` actions. It must keep
no write, export or import actions in the first batch, require access matrix
checks, require section scope, require server pagination, and keep the maximum
page size at `100`.

The activation order is represented by
`createStage2FirstReadModelActivationChecklist` in
`lib/domain/workspaces/stage2ReadModelActivationChecklist.ts`. It turns the
same first batch into one action-at-a-time backend steps: schema preflight,
activation preflight, verify, smoke, then the next action. The checklist is a
planning artifact only; it does not register a live handler and does not query
production rows.
The read-model checklist, `nextAction`, audit target, and evidence validator
carry the same `implementationPath` value:
`lib/server/database/module-live-handlers.ts`.

The public planned API payload for every first-batch action must stay safe for
the frontend: it may expose workspace/module/action readiness, access
requirements and server query policy, but it must not expose table names,
column names, write pipelines, export pipelines or import pipelines.

## Backend Acceptance Criteria

For every live read handler:

- `reviewModuleHandlerActivation` returns `ready-to-register`;
- list/detail requests use `createServerListQueryEnvelope` and
  `createServerDetailQueryEnvelope`;
- list/detail responses use `createPublicReadModelListResponse` and
  `createPublicReadModelDetailResponse`;
- the live registry adds exactly one action at a time;
- the handler uses a guarded factory from `module-handler-factories`;
- authorization runs before the handler;
- section scope is enforced for section-scoped modules;
- list response includes only the requested page;
- detail response requires `id` and returns at most one row;
- public responses do not expose `query`, `cacheKey`, table names, column names
  SQL text, SQL params or persistence metadata;
- internal table and column names are not exposed in public payloads;
- unknown or not-yet-live actions still return planned-only `501`;
- rollback is removing the live registry key.

## Frontend Acceptance Criteria

The first UI pass is read-only:

- keep the existing workspace shell and lazy loading;
- open the section without loading all workspaces;
- show filters before fetching data;
- keep page size to `25`, `50`, or `100`;
- no global React state for full tables;
- no edit button wired to a write endpoint;
- no Excel/PDF generation;
- no client-side recalculation of reports.

## Verification

Before opening a pull request:

```powershell
npm run verify
```

To print the one-action-at-a-time checklist for the first batch:

```powershell
npm run plan:stage2-read-models -- --requested-by backend-engineer
```

For a compact terminal check without the full per-action checklist:

```powershell
npm run plan:stage2-read-models -- --requested-by backend-engineer --summary-only
```

This planning command is read-only. It does not query MySQL, does not register
live handlers, and does not mutate the live registry. The JSON output includes
a compact `summary` with the first action, total action count, readiness, and
issue count for quick review before running schema preflight.

The compact summary also exposes `nextActivationGate` for the first read-model
candidate. It must list the exact `requiredCommands` to run before live
registration: schema preflight, activation preflight, and `npm run verify`.
The gate must keep `maxParallelActivations = 1`,
`requiresSchemaPreflightBeforeActivation = true`,
`requiresGreenVerifyBeforeActivation = true`, and
`noLiveRegistrationFromSummary = true`.

## Stage 2 Activation Overview

The rollout order is also represented by `createStage2ActivationOverview`.
It combines the read-model and write-handler summaries without connecting to
MySQL and without mutating the live registry. The overview must keep
`currentActivationStep = `read-model`` while the first read models are still
the active live-registration target.

To print this combined order from the command line:

```powershell
npm run plan:stage2-overview -- --requested-by backend-engineer
```

This command is also read-only: it does not query MySQL, does not register live
handlers, and does not mutate the live registry.

Even when the write-handler plan is internally ready, the overview must keep
`writeHandlers.blockedUntilReadModelsLive = true` and
`writeHandlers.liveActivationAllowedNow = false`. This prevents a future
implementation branch from promoting a write handler before the bounded
read-model path is live, verified, and smoke-tested.

The pure live-readiness snapshot is represented by
`createStage2LiveReadinessSnapshot`. It accepts the current live-handler keys
and reports `firstBatchReadModelsReady`, `pendingReadModelActions`,
`writeHandlersBlockedUntilReadModelsLive`, and `liveActivationAllowedNow`
without querying MySQL and without mutating the live registry. Until all first
batch list/detail handlers are live, the snapshot must keep write activation
blocked even if one module already has its own read models connected.

To print that status from the command line:

```powershell
npm run plan:stage2-live-readiness
```

For a dry simulation after a candidate live registration, pass the planned live
keys explicitly. This does not register anything; it only shows how the gate
would read if those handlers were already live:

```powershell
npm run plan:stage2-live-readiness -- --live-handler taxation/list-waybills --live-handler taxation/get-waybill
```

To print the next single activation candidate and its `nextAction.requiredCommands`:

```powershell
npm run plan:stage2-next-action -- --requested-by backend-engineer
```

The next-action planner must keep `liveRegistrationAllowedFromPlan = false`.
It is a read-only routing aid for the team, not approval to register the handler.

Before registering a live MySQL read handler, run the read-only schema preflight
for the target workspace:

```powershell
npm run check:read-model-schema -- --workspace taxation
```

If MySQL environment variables are not configured yet, print the planned table
and column requirements without connecting to MySQL:

```powershell
npm run check:read-model-schema -- --workspace taxation --dry-run
```

For the first one-action activation candidate, narrow the contract to the
single read-model module:

```powershell
npm run check:read-model-schema -- --module taxation-waybills --dry-run
```

The dry-run mode is a planning aid only. It does not prove that the target
schema exists, does not query `information_schema.COLUMNS`, and must not be used
as approval to register a live handler.

The one-action packet from `plan:live-handler-activation` must also expose
`schemaPreflightGate`. While `schemaChecked = false`, it must keep
`liveActivationReady = false`, `databaseConnection = false`,
`handlerRegistrationMutation = false`, and
`noLiveRegistrationFromPacket = true`. The packet may show SQL planning output,
but it is not approval for live registration.

The preflight checks `information_schema.COLUMNS` against the planned
read-model table and column requirements. A missing table or column blocks live
activation until the schema is migrated or the read-model contract is corrected.

Then run the single-action activation preflight:

```powershell
npm run review:live-handler -- --resource taxation --action list-waybills --requested-by backend-engineer --reason "Connect bounded taxation waybill list read model" --implementation-path lib/server/database/module-live-handlers.ts --rollback-plan "Remove the live registry key and guarded registration"
```

If MySQL is not configured yet, the same command can be run with
`--contract-only` to review activation metadata and the guarded registration
candidate without connecting to MySQL:

```powershell
npm run review:live-handler -- --resource taxation --action list-waybills --requested-by backend-engineer --reason "Connect bounded taxation waybill list read model" --implementation-path lib/server/database/module-live-handlers.ts --rollback-plan "Remove the live registry key and guarded registration" --contract-only
```

Contract-only output must report `ready: false`, `schemaChecked: false`, and
`mysql_schema_not_checked`. It is a planning aid only; do not register a live
handler from contract-only output.

Both contract-only and full preflight output must expose `liveActivationGate`.
The preflight may report that activation metadata and registration candidate
are correct, but it must also report `appliesChanges = false`,
`liveRegistryMutation = false`, `handlerRegistrationMutation = false`, and
`noLiveRegistrationFromPreflight = true`. Contract-only output must keep
`liveActivationReady = false` until the real MySQL schema preflight has run and
passed.

The command combines the activation review and the module-specific MySQL schema
preflight. Continue only when it reports `ready: true` and the registration
candidate summary matches the single action being activated.

After verify, restart the local dev server and confirm:

```powershell
curl.exe -I --max-time 30 http://127.0.0.1:3000
```

Expected result: `HTTP/1.1 200 OK`.

Also smoke a planned action that was not activated. It must still return
`501 planned_module_database_action` and `planned-only`.

## Stop Conditions

Stop and split the work if:

- the implementation needs a new backend process;
- the handler needs a new database outside the shared data layer;
- the UI needs to load thousands of rows;
- the change starts touching write workflow or exports;
- `useAppStateBundle` needs new document arrays;
- `AppRoot` needs business logic;
- `npm run verify` fails for reasons unrelated to an already-known local dev
  server lock.
