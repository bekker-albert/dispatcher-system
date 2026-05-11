# Stage 2 Write Handler Rollout

This document is a planning checklist for the later stage when one create or
patch action is promoted from `planned-only` to `live`. It does not authorize a
write handler by itself. Read-model rollout must come first.

## Scope

Use this process only after the module already has bounded list/detail read
models, verified schema, green `npm run verify`, and a passing local smoke
check. The first write candidates are small one-document actions such as:

- `taxation/create-waybill`
- `taxation/patch-waybill`
- `dispatch/patch-shift-report`
- `fleet/create-vehicle-movement`

Do not activate batch writes, whole-table saves, Excel/PDF import, long exports,
AI background work, GPS full-range reconciliation, or any action that needs a
separate process.

## Required Architecture

- One Next.js project.
- One shared `/api/database` router.
- One shared data layer and one database boundary.
- No separate Node.js app per workspace.
- No separate database per module.
- No permanent worker process.
- No full table loaded into React state.
- No client-side report recalculation.
- No write response that returns a full table.

## Preconditions

Before a write action can be considered:

- the module has a route contract in `moduleDataRoutes.ts`;
- the module has access-matrix authorization and section scope where required;
- a list/detail read model for the same module is ready and inspectable;
- `moduleCreateMutationPlans.ts` or `modulePatchMutationPlans.ts` describes the
  target table, scope columns, allowed fields, version fields, audit columns and
  duplicate keys where applicable;
- `moduleWritePipelinePlans.ts` derives a write pipeline for the action;
- `moduleHandlerRuntimeContracts.ts` includes `atomic_write_transaction`,
  `expected_version_check`, `change_history_write`,
  `post_commit_side_effects_only`, and `compact_write_response`;
- the implementation gate reports `readyToConnectHandler`;
- rollback is only removing the live registry key and guarded registration.

## Planning Commands

Start with the batch planner. It reads static contracts only and does not query
MySQL or register live handlers:

```powershell
npm run plan:stage2-write-handlers -- --requested-by backend-engineer --summary-only
```

The full output lists the first write candidates, expected guarded factory,
read-model prerequisites (`listAction`, `detailAction`, `listReady`,
`detailReady`), current `planned-only` live status, per-action
`plan:write-handler-activation` command, passive `review:write-handler`
command, `npm run verify`, rollback plan, and a flag that write smoke after
activation needs a test database. The planner itself must report
`appliesChanges = false`, `databaseConnection = false`,
`liveRegistryMutation = false`, `handlerRegistrationMutation = false`, and
`doesNotRegisterHandlers = true`. Its JSON also includes `stopConditions`:
do not register from planner output, stop when `readModelPrerequisites.ready`
is false, stop when `plan:write-handler-activation` or `review:write-handler`
is not green, stop when `compact_write_response` is missing, stop when a write
would affect more than one entity row, and stop when the change needs a new API
route, database, backend process, `AppRoot` state or `useAppStateBundle`
business state.

The compact summary also exposes `nextActivationGate` for the first candidate.
It must list the exact `requiredCommands` to run before live registration:
`plan:write-handler-activation`, `review:write-handler`, and `npm run verify`.
The gate must keep `maxParallelActivations = 1`,
`requiresReadModelsLiveBeforeActivation = true`,
`blockedUntilReadModelsLive = true`,
`liveActivationAllowedNow = false`,
`requiresGreenVerifyBeforeActivation = true`,
`requiresTestDatabaseForWriteSmoke = true`, and
`noLiveRegistrationFromSummary = true`.

Before treating that summary as an implementation candidate, check the pure
Stage 2 live-readiness snapshot from `createStage2LiveReadinessSnapshot`. It
must report `firstBatchReadModelsReady = true` before any write promotion can
proceed. While `writeHandlersBlockedUntilReadModelsLive = true`, the rollout
keeps `liveActivationAllowedNow = false` even when the same-module list/detail
read models are already live.

Use the read-only planner to inspect the current gate:

```powershell
npm run plan:stage2-live-readiness
```

After all first-batch read models are live, the next-action planner may show a
single write-handler candidate with `plan:write-handler-activation`,
`review:write-handler`, and `npm run verify` in `nextAction.requiredCommands`.
The command remains read-only and still keeps `liveRegistrationAllowedFromPlan`
false:

```powershell
npm run plan:stage2-next-action -- --requested-by backend-engineer
```

Then build a plan-only packet for exactly one action:

```powershell
npm run plan:write-handler-activation -- --resource taxation --action create-waybill --factory-kind create
```

The packet must report:

- `appliesChanges = false`;
- `databaseConnection = false`;
- `liveRegistryMutation = false`;
- `handlerRegistrationMutation = false`;
- `write_handler_not_registered`.

For write actions, the packet must also expose
`readModelLivePrerequisites`. The same module list/detail read models must be
`live` before a write handler can be promoted. While those handlers are still
`planned-only`, the packet must include `read_model_live_prerequisite_missing`
and the rollout must stop before live write registration.
The prerequisite calculation lives in `createWriteReadModelLivePrerequisites`
so `plan:write-handler-activation` and `review:write-handler` use the same
read-model live gate.

Then run the passive write registration review:

```powershell
npm run review:write-handler -- --resource taxation --action create-waybill --factory-kind create --requested-by backend-engineer --reason "Connect one bounded create handler." --implementation-path lib/server/database/handlers/taxation/create-waybill.ts --rollback-plan "Remove the live registry key."
```

Write handler implementation paths must live under
`lib/server/database/handlers/<resource>/<action>.ts`. The shared
`module-live-handlers.ts` file is only for read-model registration and must not
be used as a write-handler implementation path.
The path must match the requested resource and action exactly, so
`taxation/create-waybill` cannot be reviewed with a different action file.
The review and activation packet expose `expectedImplementationPath` so a
blocked run shows the exact file path to use.
The packet's generated `review:write-handler` command must use that expected
path instead of repeating an invalid user-supplied path.
When `handler_key_invalid` is present, the packet must not print a
`review:write-handler` next command.
Activation evidence must also use the exact implementation path for the target
write handler, not merely any file under `lib/server/database/handlers/`.
The evidence validator JSON prints `expectedImplementationPath` so the operator
can copy the target path before preparing evidence.
The write-handler checklist, `nextAction`, audit target, and evidence validator
must carry the same `implementationPath` value through the rollout.
The packet default and review validation must both use the same
`createExpectedWriteImplementationPath` helper.
Resource and action segments must stay lowercase path segments with digits or
hyphens only; traversal, slashes, and backslashes collapse to an invalid marker
and remain blocked.
Packet and review CLI output must also surface `handler_key_invalid` for unsafe
resource/action keys, and their `stopConditions` must tell the operator to stop
when `handler_key_invalid` is present.

The review must report `ready = true` before any implementation branch can add a
live registration. A `ready = true` review is still not an automatic registry
mutation.

The review also reports `liveActivationReady`. For the current Stage 2 state it
must remain `false` until `readModelLivePrerequisites.requiredActions` are all
`live`. This keeps the passive review useful for implementation planning while
still blocking actual write-handler live activation.

## Handler Shape

The live handler must use the guarded factory for its pipeline:

- create actions use the guarded `create` factory;
- patch and workflow-transition actions use the guarded `patch` factory.

The handler must start from `module-write-execution.ts` and use the shared
context helpers:

- duplicate checks for create actions;
- entity insert with `version = 1`;
- patch `WHERE id = ? AND version = ?` plus declared scope columns;
- patch `SET` generated from backend-mapped changed fields only;
- per-field change-history insert;
- atomic transaction plan with `commitCondition = all_steps_ok`;
- post-commit side-effect plan only after commit;
- compact success, conflict, or duplicate response plan.

## Conflict And History Rules

Every write must be one document at a time:

- client sends `id`, opened `version`, and changed fields only;
- server verifies access before the handler;
- server verifies section scope before the mutation;
- server compares the opened `version`;
- one affected entity row is the only successful patch path;
- zero affected rows becomes a `409` conflict or scope mismatch;
- more than one affected row is a hard error;
- change history writes one row per changed field;
- undo must be built from history and must not overwrite newer edits.

## 2 GB RAM Rules

The 2 GB RAM server must not do wide work in the request path:

- no full-table duplicate detection;
- no client-side report rebuild after save;
- no inline aggregate recalculation;
- no inline Excel/PDF generation;
- no resident background analysis;
- no whole-table response after a write;
- no global React state for created or patched rows beyond the current page.

Report-affecting writes may only queue bounded prepared-aggregate refreshes
after the transaction commits.

## Stop Conditions

Stop the rollout if any of these happen:

- the module has no ready read-model path;
- `plan:write-handler-activation` reports a registration blocker;
- `review:write-handler` reports `ready = false`;
- expected guarded factory does not match the write pipeline;
- `compact_write_response` is missing;
- access-matrix or section-scope requirement is missing;
- the handler would save more than one entity row;
- the handler needs a new API route, new database, or new backend process;
- the handler needs `AppRoot` or `useAppStateBundle` business state changes.

## Verification

Before and after the small implementation branch:

```powershell
npm run verify
npm run smoke:local
```

Smoke should include one activated action and one still-planned action. The
still-planned action must continue to return `501 planned_module_database_action`
with `planned-only` live status.
