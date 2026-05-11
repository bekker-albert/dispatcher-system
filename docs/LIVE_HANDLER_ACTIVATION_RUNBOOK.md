# Live Handler Activation Runbook

This runbook describes how to move one future workspace action from
`planned-only` to `live` without changing the dispatcher-system architecture.
It is for the first real read-model handlers after the scaffold is green.

## Scope

Use this process only for one action at a time, for example:

- `taxation/list-waybills`
- `taxation/get-waybill`
- `dispatch/list-shift-reports`
- `dispatch/get-shift-report`

Do not activate write, export, import, workflow, Excel/PDF, AI background, or
multi-module work in the first read-model activation pull request.

When write handlers are activated in a later stage, their `runtimeContract`
must include `atomic_write_transaction`, `change_history_write`,
`post_commit_side_effects_only`, and `compact_write_response`. A write handler
must return compact success/conflict/duplicate responses instead of a full
table reload.

Use `reviewWriteLiveHandlerRegistrationCandidate` before preparing a future
write registration. It checks the write pipeline, expected guarded factory
(`create` for create actions, `patch` for patch/workflow actions), runtime
requirements, activation metadata, `npm run verify`, rollback plan, and keeps
the review passive with `doesNotRegisterHandler = true`.

The same passive check is available from the CLI:

```powershell
npm run review:write-handler -- --resource taxation --action create-waybill --factory-kind create --requested-by backend-engineer --reason "Connect one bounded create handler." --implementation-path lib/server/database/handlers/taxation/create-waybill.ts --rollback-plan "Remove the live registry key."
```

The CLI reports `databaseConnection = false`, `liveRegistryMutation = false`,
and `doesNotRegisterHandler = true`; it is a review packet, not an activation.

Before that review, operators may build a non-mutating write activation packet:

```powershell
npm run plan:write-handler-activation -- --resource taxation --action create-waybill --factory-kind create
```

The packet combines `reviewModuleHandlerActivation`,
`getModuleLiveHandlerStatus`, and
`reviewWriteLiveHandlerRegistrationCandidate`, but still reports
`appliesChanges = false`, `databaseConnection = false`,
`liveRegistryMutation = false`, and `handlerRegistrationMutation = false`.
It always includes `write_handler_not_registered` as a packet issue so nobody
treats the plan as permission to register the handler.

## Non-Negotiable Guardrails

- Keep one Next.js project.
- Keep one `/api/database` route.
- Keep one shared data layer.
- Do not start a separate backend process.
- Do not add a separate module database.
- Do not load full tables into memory.
- Do not bypass the access matrix requirement.
- Do not bypass section scope for section-scoped modules.
- Do not register more than one live handler key in one pull request.

## Activation Review

Before adding a live registry key, create an activation review with
`reviewModuleHandlerActivation` from
`lib/domain/data-access/moduleHandlerActivation.ts`.

The review command must include:

- `resource`
- `databaseAction`
- `requestedBy`
- `changeReason`
- `implementationPath`
- `verificationCommands` containing `npm run verify`
- `rollbackPlan`
- `activationScopeSize` equal to `1`

The review must return `ready-to-register`. If it returns `blocked`, do not add
the live registry key. Fix the blocker or split the work.

Before any live registry mutation, create the activation audit plan with
`createStage2ActivationAuditPlan`:

```powershell
npm run plan:stage2-activation-audit -- --requested-by backend-engineer --reason "Connect bounded taxation waybill list read model."
```

The audit plan is read-only. It must report
`auditRecordRequiredBeforeRegistryMutation = true`,
`liveRegistrationAllowedFromAuditPlan = false`, `activationScopeSize = 1`, and
required evidence fields for `rollbackPlan`, `preflightResult`, `verifyResult`,
and `smokeResult`. Treat it as the audit checklist that must be satisfied
before adding the registry key and guarded server registration.

After collecting evidence, validate it with `validateStage2ActivationEvidence`
through the CLI:

```powershell
npm run check:stage2-activation-evidence -- --requested-by backend-engineer --reason "Connect bounded taxation waybill list read model." --implementation-path lib/server/database/module-live-handlers.ts --verification-command "npm run check:read-model-schema -- --workspace taxation" --verification-command "npm run review:live-handler -- --resource taxation --action list-waybills --requested-by backend-engineer --reason `"Connect bounded taxation list-waybills read model`" --implementation-path lib/server/database/module-live-handlers.ts --rollback-plan `"Remove the live registry key and guarded registration`"" --verification-command "npm run verify" --verification-command "npm run smoke:local" --rollback-plan "Remove the single live registry key and guarded server registration" --activation-scope-size 1 --preflight-result passed --verify-result passed --smoke-result passed
```

The check must return `evidenceComplete = true` and
`manualRegistryChangeReviewAllowed = true` before the human review of the
single registry change. It still must keep
`liveRegistrationAllowedFromEvidence = false`; evidence validation is not an
automatic registry mutation. Pass every command from the audit plan
`requiredCommands` array as a `--verification-command`; `npm run verify` and
`npm run smoke:local` alone are not enough. The `implementationPath` must point
to the correct server path for the target phase: read-model activation uses
`lib/server/database/module-live-handlers.ts`; write-handler activation uses a
guarded `lib/server/database/handlers/...` `.ts` file without `..` traversal
segments. Never point evidence to AppRoot, workspace UI, docs or temporary
files. Verification commands must stay within read-only Stage 2 preflight,
review, verify and smoke commands; migrations, database CLIs, `next dev`,
`next start`, PM2, Nodemon, `concurrently`, `wait-on`, and `Start-Process` are
blocked. The `changeReason` and rollback plan must both be specific;
placeholders such as `TODO`, `TBD`, `n/a` or `none` are blocked by evidence
validation.

## Handler Implementation

The handler must use the guarded factory matching its contract kind:

- list handlers use `createGuardedLiveModuleListHandler`;
- detail handlers use `createGuardedLiveModuleDetailHandler`;
- write/export/import factories are out of scope for the first read-model pull
  request.

The guarded factory creates the execution context. Do not hand-roll query
policy parsing, page limits, detail id checks, or section scope checks inside a
loose handler.

For list handlers, use `execution.createSqlPlan()` to build the bounded SQL
plan. It uses the module's declared `selectColumns`, server filters, sort and
`LIMIT/OFFSET`. For detail handlers, use `execution.createSqlPlan()` to build
the `id` + scope query with `LIMIT 1`. Do not use `SELECT *` in read-model
handlers.

Prefer the read-model executor helpers in
`lib/server/database/read-model-executor.ts`:

- `executeLiveModuleListReadModel` for list handlers;
- `executeLiveModuleDetailReadModel` for detail handlers.
- `executeLiveModuleListReadModelWithRowsClient` when the handler uses a
  shared database rows adapter;
- `executeLiveModuleDetailReadModelWithRowsClient` when the handler uses a
  shared database rows adapter.

The executor receives the guarded execution context and a database query
callback. It creates the safe SQL plan, runs exactly that bounded query, and
returns the public response envelope. This keeps the first live handlers small
and prevents each module from re-implementing SQL planning, row limits or
public payload validation differently.

The rows-client variants pass only a `DatabaseReadModelRowsRequest` to the
adapter: query kind, module identity, SQL, params and max rows. Real handlers
should keep the database adapter shared in the server data layer and should not
open ad hoc connections or read full module tables directly.

For MySQL-backed read models, use the shared
`mysqlReadModelRowsClient` from `lib/server/mysql/read-model-rows.ts`. It wraps
the existing `dbRows` helper, validates that the request is a bounded `SELECT`,
rejects `SELECT *`, rejects multi-statement SQL, and enforces the approved list
page sizes or detail `maxRows = 1`. Do not create a second pool or a per-module
connection helper for live workspace handlers.

For standard MySQL read-model actions, register the handler through
`createMysqlLiveModuleListReadModelHandler` or
`createMysqlLiveModuleDetailReadModelHandler` from
`lib/server/database/mysql-read-model-handlers.ts`. These helpers combine the
guarded factory, MySQL rows client, read-model executor and JSON response
adapter. Use a custom guarded handler only when the action needs an explicit
server-side row mapping step.

Before adding the live registry key, run the schema preflight through
`reviewMysqlReadModelSchemaReadiness` from
`lib/server/mysql/read-model-schema-readiness.ts`. The preflight reads
`information_schema.COLUMNS` for the current database and compares it with
`listModuleReadModelSchemaRequirements`. Activation is blocked if a required
table or column is missing.

The same preflight is available as a read-only CLI:

```powershell
npm run check:read-model-schema -- --workspace taxation
```

Use the workspace flag for the module you are activating. The command exits
with code `1` when a required table or column is missing, so do not add the live
registry key until it reports `ready: true`.

For a single action, run the combined activation preflight:

```powershell
npm run plan:live-handler-activation -- --resource taxation --action list-waybills
```

This produces a non-mutating activation packet: current planned/live status,
contract-only activation review, registration candidate, schema plan, next
commands and stop conditions. It does not connect to MySQL, does not edit the
live registry, and must not be treated as approval to activate the handler.

After the schema has been reviewed and applied to the target database, run the
full combined activation preflight:

```powershell
npm run review:live-handler -- --resource taxation --action list-waybills --requested-by backend-engineer --reason "Connect bounded taxation waybill list read model" --implementation-path lib/server/database/module-live-handlers.ts --rollback-plan "Remove the live registry key and guarded registration"
```

This command is also read-only. It combines `reviewModuleHandlerActivation` with
the module-specific MySQL schema preflight and prints the exact blockers and
next actions. Add the live registry key only when the combined report returns
`ready: true`. The report also includes a registration candidate summary for
the guarded MySQL read-model handler. Use that summary as a checklist, not as
an automatic registry mutation.

After the executor returns, use `createLiveReadModelJsonResponse` to translate
the public read-model result into the `/api/database` response. Successful
responses should return `200`; blocked public envelope validation should return
`422` with the rejection payload, not a partially unsafe data result.

The runtime contract for `list` and `detail` read models includes
`public_read_model_response_envelope`. Return public payloads through
`createPublicReadModelListResponse` or `createPublicReadModelDetailResponse`
before calling `json`.

## List Handler Requirements

A live list handler must:

- execute after authorization;
- use `execution.createSqlPlan()` for the bounded database read;
- use the server query policy from the execution context;
- respect `pageSize` and never return more rows than requested;
- use server-side filters, sort and search;
- return only the requested page;
- wrap the result with `createPublicReadModelListResponse`;
- avoid client-side full scans;
- avoid exposing table names or column names in the public payload.

## Detail Handler Requirements

A live detail handler must:

- require an `id`;
- require section scope when the module is section-scoped;
- use `execution.createSqlPlan()` for the `id` + scope database read;
- return at most one row;
- return `version` for versioned business entities;
- wrap the result with `createPublicReadModelDetailResponse`;
- avoid exposing table names or column names in the public payload.

## Registry Change

Activation needs both pieces:

1. Add exactly one configured live handler key in
   `lib/domain/data-access/moduleLiveHandlerRegistry.ts`.
2. Add the matching guarded registration in
   `lib/server/database/module-live-handlers.ts`.

If either side is missing, the checks must fail. The registry key and the server
registration must use the same `resource` and `databaseAction`.

## Verification

Run the full verification:

```powershell
npm run verify
```

Then restart the local dev server and check:

```powershell
curl.exe -I --max-time 30 http://127.0.0.1:3000
```

Expected result: `HTTP/1.1 200 OK`.

Smoke the activated action and one still-planned action. The activated action
may return `200 OK` only after the live registry key and guarded registration
exist. The still-planned action must continue to return
`501 planned_module_database_action` with `planned-only`.

## Rollback

Rollback is intentionally small:

1. Remove the live registry key.
2. Remove the guarded server registration.
3. Keep the planned contract.
4. Re-run `npm run verify`.

After rollback, the action must again return the planned-only `501` response.
