# Fleet Operations Roadmap

## Purpose

The main `Техника` tab is an operational daily view. It must not store daily status, driver assignments, repair dates, or notes directly in the permanent vehicle card.

Permanent vehicle data answers: what the equipment is.
Daily fleet state answers: what happened with this equipment on a specific working date.

## Current Preparation

The date-keyed domain model lives in `lib/domain/fleet/daily-state.ts`.

The key is:

```text
vehicleId + workDate
```

Prepared fields:

- `status`: `В работе`, `В ремонте`, `В простое`.
- `repairStartedAt`: date the equipment went into repair.
- `repairReason`: repair reason.
- `note`: operational note for the working date.
- `driverAssignments`: four shift slots:
  - `watch1Shift1`
  - `watch1Shift2`
  - `watch2Shift1`
  - `watch2Shift2`

The main fleet table can already consume these records through `createFleetVehicleListRows`, but the app does not yet persist or edit them.

## Next Data Modules

### 1. Fleet Daily State

Target table/module:

```text
fleet_daily_states
```

Recommended unique key:

```text
vehicle_id + work_date
```

This module owns:

- daily status;
- repair date and reason;
- daily note;
- daily driver assignment snapshot.

### 2. Fleet Movements

Target table/module:

```text
fleet_movements
```

Purpose:

- move equipment between projects, areas, and locations;
- keep movement history;
- avoid losing previous project attribution.

Recommended fields:

- `vehicle_id`
- `from_project_id`
- `to_project_id`
- `from_area`
- `to_area`
- `from_location`
- `to_location`
- `effective_from`
- `effective_to`
- `basis_document_id`
- `comment`

### 3. Driver Assignments

Target table/module:

```text
fleet_driver_assignments
```

Purpose:

- long-term assignment of drivers to equipment;
- generate waybills by assignment;
- allow daily overrides in `fleet_daily_states`.

Recommended fields:

- `vehicle_id`
- `driver_id`
- `slot`
- `effective_from`
- `effective_to`
- `assignment_type`
- `comment`

### 4. Waybills

Target table/module:

```text
waybills
```

Purpose:

- batch issue by driver assignment;
- one-time issue by petition;
- connect shifts, drivers, vehicles, and fuel.

Recommended modes:

- `batch_by_assignment`
- `single_by_petition`

### 5. Petitions

Target table/module:

```text
petitions
```

Purpose:

- request one-time equipment/driver use;
- provide basis for waybill issue or equipment movement.

### 6. Fuel Documents

Target modules:

```text
fuel_issue_statements
fuel_reconciliation_acts
fuel_transfer_acts
```

Purpose:

- fuel issue statements;
- fuel reconciliation acts;
- fuel acceptance/transfer acts.

These documents should reference vehicles, drivers, contractors, dates, and source waybills where applicable.

## Implementation Rule

Do not add these operational fields to `VehicleRow` as permanent properties unless they describe the equipment itself.

Use separate date/effective-period records for:

- current status;
- repair state;
- driver assignment;
- project/location movement;
- waybill issue;
- fuel documents.

This keeps history intact and prevents one day's edit from corrupting another day's view.
