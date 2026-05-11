# Stage 2 Taxation Waybills Schema Plan

Date: May 9, 2026.
Branch: `feature/dispatch-service-architecture`.

This is a reviewable schema plan for the first read-only Stage 2 candidate:
`taxation-waybills`. It is not an executed migration, not a live-handler
activation, and not a new database. The table belongs to the shared MySQL data
layer behind the existing `/api/database` route.

## Scope

- Workspace: `taxation`.
- Module: `taxation-waybills`.
- Table: `taxation_waybills`.
- First actions: `list-waybills`, `get-waybill`.
- First handler type: read-only list/detail.
- Status before activation: HTTP `501`, code `planned_module_database_action`,
  live handler status `planned-only`.

## Required Columns

The current read-model contract requires:

- `id`
- `work_date`
- `section_id`
- `shift`
- `status`
- `version`
- `updated_at`
- `updated_by`
- `driver_id`
- `driver_name`
- `vehicle_id`
- `vehicle_number`
- `waybill_number`

## Review DDL Draft

Review this draft with the DBA before applying it. It intentionally avoids
foreign keys, triggers, generated columns, stored procedures, and separate
databases for the first read-only handler.

```sql
CREATE TABLE `taxation_waybills` (
  `id` varchar(64) NOT NULL,
  `work_date` date NOT NULL,
  `section_id` varchar(64) NOT NULL,
  `shift` varchar(16) NOT NULL,
  `status` varchar(32) NOT NULL,
  `version` int unsigned NOT NULL DEFAULT 1,
  `updated_at` datetime(3) NOT NULL,
  `updated_by` varchar(64) NOT NULL,
  `driver_id` varchar(64) NOT NULL,
  `driver_name` varchar(255) NOT NULL,
  `vehicle_id` varchar(64) NOT NULL,
  `vehicle_number` varchar(64) NOT NULL,
  `waybill_number` varchar(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Required Indexes

The query policy requires server filters for date, section and status. The
planned first list handler also supports shift, driver and vehicle filters. The
current index contract requires:

```sql
ALTER TABLE `taxation_waybills` ADD INDEX `taxation_waybills_date_section_shift_status_idx` (`work_date`, `section_id`, `shift`, `status`);
ALTER TABLE `taxation_waybills` ADD INDEX `taxation_waybills_driver_date_idx` (`driver_id`, `work_date`);
ALTER TABLE `taxation_waybills` ADD INDEX `taxation_waybills_vehicle_date_idx` (`vehicle_id`, `work_date`);
```

## Activation Gate

Before applying anything manually, regenerate the review-only plan from the
current contracts:

```powershell
npm run plan:read-model-schema -- --module taxation-waybills --sql
```

This command does not connect to MySQL, does not create tables, and does not
activate live handlers. After the reviewed schema exists on the target MySQL
database, run:

```powershell
npm run check:read-model-schema -- --module taxation-waybills
```

Then run the one-action activation preflight:

```powershell
npm run review:live-handler -- --resource taxation --action list-waybills --requested-by backend-engineer --reason "Connect bounded taxation waybill list read model" --implementation-path lib/server/database/module-live-handlers.ts --rollback-plan "Remove the live registry key and guarded registration"
```

Continue only if both commands report readiness. Until then, the live registry
must stay empty for this action.

## Stop Conditions

Stop before migration or activation if the implementation needs:

- another backend process;
- another database;
- a full table scan for the first list screen;
- writes, exports, imports, print generation or workflow changes;
- new document arrays in `useAppStateBundle`;
- business logic in `AppRoot`;
- client-side report recalculation.
