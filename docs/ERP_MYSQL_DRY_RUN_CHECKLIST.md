# ERP MySQL dry-run checklist

Status: operational checklist for read-only analysis. Do not paste passwords into this document.

## Required env variables

Required:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Optional depending on environment:

- `DB_SSL`
- `DB_CONNECTION_LIMIT`
- auth/session variables already described in `.env.example`

## Where to set env

Use local environment configuration that is already excluded from source control:

- local `.env.local`;
- CI/staging secret store;
- terminal session variables for one-time dry-run.

Never commit real credentials. Never paste `DB_PASSWORD` into docs, tickets, pull requests, or logs.

## Run analyzer in MySQL read-only mode

From the repository root:

```powershell
& 'C:\Users\albert.bekker\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/analyze-vehicle-core-migration.mjs --source mysql --write-report docs/ERP_VEHICLE_CORE_MIGRATION_DRY_RUN.md --write-json docs/ERP_VEHICLE_CORE_MIGRATION_DRY_RUN.json
```

Expected behavior:

- reads `vehicles`;
- prints/writes dry-run report;
- does not change database rows;
- does not apply migrations;
- does not switch UI/runtime.

## How to verify analyzer is read-only

Before running against staging or production-like data:

- inspect `scripts/analyze-vehicle-core-migration.mjs`;
- confirm it uses `SELECT ... FROM vehicles`;
- confirm there is no write SQL command;
- confirm it uses `connection.query` only for the read query;
- run guardrails:

```powershell
& 'C:\Users\albert.bekker\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\jiti\lib\jiti-cli.mjs tests/erp-core-prep-guardrails-checks.ts
```

## Commands to run

Run analyzer:

```powershell
& 'C:\Users\albert.bekker\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/analyze-vehicle-core-migration.mjs --source mysql --write-report docs/ERP_VEHICLE_CORE_MIGRATION_DRY_RUN.md --write-json docs/ERP_VEHICLE_CORE_MIGRATION_DRY_RUN.json
```

Run cleanup preview:

```powershell
& 'C:\Users\albert.bekker\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/preview-vehicle-data-cleanup.mjs --source mysql --write-report docs/ERP_VEHICLE_DATA_CLEANUP_PREVIEW.md --write-json docs/ERP_VEHICLE_DATA_CLEANUP_PREVIEW.json
```

Run backfill preview:

```powershell
& 'C:\Users\albert.bekker\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/preview-vehicle-core-backfill.mjs --source mysql --analyzer-json docs/ERP_VEHICLE_CORE_MIGRATION_DRY_RUN.json --cleanup-json docs/ERP_VEHICLE_DATA_CLEANUP_PREVIEW.json --write-report docs/ERP_VEHICLE_CORE_BACKFILL_PREVIEW.md
```

Run safety checks:

```powershell
& 'C:\Users\albert.bekker\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/check-project-health.mjs
& 'C:\Users\albert.bekker\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\jiti\lib\jiti-cli.mjs tests/erp-core-prep-guardrails-checks.ts
```

## Expected reports

The run should produce or refresh:

- `docs/ERP_VEHICLE_CORE_MIGRATION_DRY_RUN.md`
- `docs/ERP_VEHICLE_CORE_MIGRATION_DRY_RUN.json`
- `docs/ERP_VEHICLE_DATA_CLEANUP_PREVIEW.md`
- `docs/ERP_VEHICLE_DATA_CLEANUP_PREVIEW.json`
- `docs/ERP_VEHICLE_CORE_BACKFILL_PREVIEW.md`

## Compare seed and MySQL dry-run

Compare:

- total vehicle rows;
- active/visible counts;
- empty `model`, `plateNumber`, `garageNumber`, `vin`, `area`;
- placeholder plate/garage counts;
- duplicate plate/garage/VIN groups;
- owner/contractor spelling variants;
- vehicle type/category variants;
- section candidate coverage.

If MySQL differs from seed, treat MySQL as the future production-quality source for cleanup decisions, but still keep seed reports as a baseline.

## If MySQL is unavailable

If env is missing or the database cannot be reached:

- keep running seed dry-run;
- keep MySQL result marked as skipped;
- do not invent MySQL results;
- do not proceed to real backfill;
- request staging read credentials through the normal secure channel.

## What must not be done with production database

- Do not run backfill against production.
- Do not apply draft migrations.
- Do not change the `vehicles` table.
- Do not switch UI to `vehicle_cards` or `sections`.
- Do not run cleanup scripts that modify data.
- Do not log credential values.
- Do not use production as the first test target.

Minimum next safe target: staging MySQL dry-run with read credentials and full guardrail checks.
