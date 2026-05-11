# Local Development Runbook

This runbook keeps local verification and the Next.js dev server predictable on
the dispatcher-system workstation. It does not change production deployment or
business logic.

## Default Local Target

- Repository: `C:\codex-dispatcher-system`
- Local URL: `http://127.0.0.1:3000`
- Local dev command: `npm run dev -- --hostname 127.0.0.1 --port 3000`
- Local auth override for manual UI checks only: `AUTH_REQUIRED=false`

Use one local Next.js dev server. Do not start separate backend processes for
workspaces such as mining dispatch, taxation, SMTS/GPS, reports, admin, or AI.

The Windows helper `start-local-server.cmd` uses the same local target. It
opens `http://127.0.0.1:3000`, sets `AUTH_REQUIRED=false`, and runs only
`npm run dev -- --hostname 127.0.0.1 --port 3000`. The helper must not run
`build`, `verify`, migrations, database CLIs, PM2, Nodemon, or another backend.
If a dispatcher dev server is already running for this repository, the helper
opens the existing listener instead of starting a second server.

## Before Running Full Verify

`npm run verify` includes `next build`. On Windows, a running dev server can
hold `.next` files and make the build unreliable. Before a full verify:

1. Check whether port `3000` has a listener.
2. Stop only the process that is listening on `127.0.0.1:3000`.
3. Run `npm run verify`.
4. Restart the dev server after verify finishes.

Do not delete unrelated processes. Do not use destructive git or filesystem
cleanup commands as a first response.

## Expected Verification Order

The required full check is:

```powershell
npm run verify
```

That runs:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run check:domain`
- `npm run check:project`

If `verify` fails because the dev server locked build output, stop the local
dev server, rerun the failing command, and restart the dev server. If it fails
because a real test or type check failed, localize with the smaller script named
in the output.

## OneDrive And `.next` Locks

On this workstation `C:\codex-dispatcher-system` may be a junction to the
OneDrive repository folder. A failed `next build` can therefore report an error
from the real path, for example:

```text
EPERM: operation not permitted, unlink ...dispatcher-system\.next\static\...
```

Treat this as a local generated-cache lock only after `npm run lint` and
`npm run typecheck` have passed. The safe recovery is:

1. Stop the process listening on `127.0.0.1:3000`.
2. Confirm the resolved `.next` path is inside the repository.
3. Delete only the generated `.next` directory.
4. Re-run `npm run verify`.
5. Restart the local dev server and confirm `HTTP/1.1 200 OK`.

Do not delete `node_modules`, source files, uploaded data, database files, or
any parent OneDrive folder to fix this cache lock.

## Restarting The Local Site

After verification, start the local site with:

```powershell
$env:AUTH_REQUIRED='false'
npm run dev -- --hostname 127.0.0.1 --port 3000
```

The expected local health check is:

```powershell
curl.exe -I --max-time 30 http://127.0.0.1:3000
```

Expected result: `HTTP/1.1 200 OK`.

For a repeatable local smoke check, run:

```powershell
npm run smoke:local
```

The smoke check expects one local Next.js server at
`http://127.0.0.1:3000`. It first runs a `HEAD` health check against the home
page, then verifies that the home page returns HTML without application error
markers, and finally checks that a future workspace action still returns
`501 planned_module_database_action` with `planned-only` live-handler status,
server pagination, and no client full scan.

## Planned API Smoke

Future workspace module actions should stay safe until a live handler is
registered through the activation runbook. A planned action such as
`taxation/list-waybills` must return:

- HTTP status `501`
- code `planned_module_database_action`
- live handler status `planned-only`
- server pagination/query policy details for list actions

If a planned action returns `200 OK` without a live registry entry, treat that as
an architecture failure and inspect `lib/server/database/module-live-handlers.ts`
and `lib/domain/data-access/moduleLiveHandlerRegistry.ts`.

## Local Troubleshooting

If the site does not open:

1. Confirm a process is listening on `127.0.0.1:3000`.
2. Check the dev server stdout/stderr logs.
3. Re-run the `curl.exe -I` health check.
4. If the port is free, start the dev server again.
5. If the port is occupied by a stale Node process, stop that listener and
   restart the dev server.

Keep the local loop small: one dev server, one Next.js app, one shared
`/api/database` route, and no background AI or report generation process.
