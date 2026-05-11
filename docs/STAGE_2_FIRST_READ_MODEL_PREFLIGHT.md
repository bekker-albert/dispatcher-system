# Stage 2 First Read Model Preflight

Date: May 9, 2026.
Branch: `feature/dispatch-service-architecture`.

This note records the first read-only backend candidate after the workspace
architecture scaffold. It is not a live-handler activation and it does not
change runtime behavior.

## Candidate

- Workspace: `taxation`.
- Module: `taxation-waybills`.
- Database action: `list-waybills`.
- Contract kind: `list`.
- Capability: `view`.
- Scope: section-scoped.
- Expected route: one shared `/api/database` router.
- Expected pre-live response: HTTP `501`, code
  `planned_module_database_action`, live handler status `planned-only`.

The planner command was:

```powershell
npm run plan:stage2-read-models -- --requested-by codex --summary-only
```

Result: ready planning summary with `totalActions: 4`, `issueCount: 0`, and
first action `taxation/list-waybills`.

## Local Preflight Result

The schema preflight command was:

```powershell
npm run check:read-model-schema -- --workspace taxation
```

Result: blocked by local environment configuration.

```text
Error: MySQL is not configured: DB_NAME, DB_USER and DB_PASSWORD are required
```

The dry-run requirements command can still be used without MySQL:

```powershell
npm run check:read-model-schema -- --workspace taxation --dry-run
```

For the first one-action candidate, use the narrower module dry-run:

```powershell
npm run check:read-model-schema -- --module taxation-waybills --dry-run
```

This prints only the planned table and column contract for
`taxation-waybills`, but it does not query `information_schema.COLUMNS` and
does not prove that the target schema exists.

The activation preflight command was:

```powershell
npm run review:live-handler -- --resource taxation --action list-waybills --requested-by codex --reason "Connect bounded taxation-waybills list-waybills read model" --implementation-path lib/server/database/module-live-handlers.ts --rollback-plan "Remove the live registry key and guarded registration"
```

Result: blocked by the same local MySQL configuration requirement.

The contract-only activation review can be used without MySQL:

```powershell
npm run review:live-handler -- --resource taxation --action list-waybills --requested-by codex --reason "Connect bounded taxation-waybills list-waybills read model" --implementation-path lib/server/database/module-live-handlers.ts --rollback-plan "Remove the live registry key and guarded registration" --contract-only
```

This mode checks `reviewModuleHandlerActivation` and the guarded registration
candidate, but it must return `ready: false`, `schemaChecked: false`, and
`mysql_schema_not_checked`. Do not register a live handler from contract-only
output.

## Latest Local Recheck

Date: May 10, 2026.

The next-action planner still selects exactly one read-model candidate:
`taxation/list-waybills`. It reports `liveActivationAllowedNow: false`,
`maxParallelLiveRegistrations: 1`, no MySQL connection, no live registry
mutation, and no handler registration mutation.

The module dry-run command was rerun:

```powershell
npm run check:read-model-schema -- --module taxation-waybills --dry-run
```

Result: contract requirements printed successfully with `issues: []`,
`schemaChecked: false`, and `ready: false`. This confirms the static contract
is still coherent, but it still does not prove the target MySQL table exists.

The contract-only activation review was rerun:

```powershell
npm run review:live-handler -- --resource taxation --action list-waybills --requested-by codex --reason "Connect bounded taxation-waybills list-waybills read model" --implementation-path lib/server/database/module-live-handlers.ts --rollback-plan "Remove the live registry key and guarded registration" --contract-only
```

Result: expected blocked status. The registration candidate is
`ready-to-register`, but the overall review remains `ready: false` and
`liveActivationReady: false` because `schemaChecked: false` and
`mysql_schema_not_checked` are still present. No live handler was registered.

## Decision

Do not register a live handler in this branch until the target MySQL schema can
be checked. The live registry must stay empty, and the local smoke must keep
confirming `planned-only` for `taxation/list-waybills`.

Next safe backend step:

1. Configure read-only MySQL connection environment for the target schema.
2. Run `npm run check:read-model-schema -- --module taxation-waybills`.
3. Run the single-action `npm run review:live-handler` command above.
4. Continue only if both preflights pass.
5. Register exactly one guarded list handler.
6. Run `npm run verify`.
7. Run `npm run smoke:local` and smoke at least one still-planned action.

Stop if the implementation needs a new process, another database, a broad table
scan, a write endpoint, an export/import path, or new document arrays in
`useAppStateBundle`.
