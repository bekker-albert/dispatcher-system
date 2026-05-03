# Release And Data Runbook

This note is for release checks and data recovery after the MySQL move. It does
not change business rules.

## Current Storage Rule

- Production should use the server database path through `/api/database`.
- Local development may use MySQL when `NEXT_PUBLIC_DATA_PROVIDER=mysql` and the
  MySQL variables are configured.
- The legacy Supabase path is only a fallback when the public Supabase variables
  are configured and MySQL is not forced.
- Browser `localStorage` can contain old workstation-only data. It is not a
  deployment source of truth.

## Safe Release Checks

Before treating a deploy as successful:

- Run `npm run release:check` before pushing to `main`.
- Confirm Git `main` and `origin/main` point at the intended commit.
- Confirm `.github/workflows/deploy.yml` ran for that commit, if GitHub Actions
  status is available.
- Run `npm run smoke:production` after deploy, or manually confirm the site
  loads and `GET /api/database` returns the expected database status without
  sending write requests.
- Confirm no local secret files were staged or printed.

If GitHub Actions status is unavailable, use only read-only checks first: Git
refs, workflow file contents, site availability, and a read-only API status
request.

## Data Recovery Rules

When a user reports that data was visible on one computer but empty after deploy
or on another computer:

- Do not clear browser storage.
- Do not run a migration script against production without a fresh backup and a
  confirmed source.
- Do not overwrite MySQL with an empty browser state.
- Do not treat an empty screen as proof that data was deleted.
- First identify the source that had the data: old browser `localStorage`,
  Supabase fallback, MySQL, or a client snapshot.

Facts needed before recovery:

- Which computer and browser profile showed the data.
- Exact page, tenant/customer context, and date range.
- Whether the data still exists in browser storage on that machine.
- Whether `/api/database` is reachable from the deployed site.
- Whether MySQL has matching vehicles, PTO rows, settings, and app state.
- Whether any client snapshots exist for the affected period.
- Which commit and deploy time introduced the empty view.

## Migration Script Safety

`scripts/migrate-supabase-to-mysql.ts` copies data from the configured Supabase
source into the configured MySQL target. Treat it as a write operation.

Before running it:

- Verify `.env.local` points to the intended source and target.
- Make a MySQL backup.
- Confirm the target is not production unless the release owner explicitly chose
  that target.
- Run from a clean, reviewed checkout.
- Keep logs to counts and status only. Do not print secret values.

After running it:

- Recheck `/api/database` with a read-only status request.
- Check the affected UI screens without editing rows.
- Keep the original browser storage and source database unchanged until the
  recovery is accepted.

## What Not To Do During An Incident

- Do not redeploy repeatedly before identifying whether this is a storage,
  environment, or visibility issue.
- Do not change PTO/customer/date business logic as part of a data recovery.
- Do not copy values from `.env.local` into tickets, chats, logs, or screenshots.
- Do not use destructive cleanup commands on the server or database as a first
  response.
