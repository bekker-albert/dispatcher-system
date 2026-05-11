# ERP section mapping draft

Status: draft, manual review required.

This document prepares the future `sections` directory without changing runtime behavior. The current UI, PTO, reports, vehicles, Excel import/export, and auth continue to use their existing data paths.

## Source policy

PTO may be a source of section candidates, because current plans contain areas, locations, and work structures. PTO must not be the ERP source of truth.

Production rule: the ERP source of truth must be the `sections` directory. If PTO contains a value that is missing from `sections`, analyzer may show it as a candidate, but production must not create a section automatically without administrator confirmation.

Allowed candidate sources:

- `vehicles.area`;
- PTO plan rows and PTO fact rows;
- report rows;
- existing default/reference data;
- `data/erp-section-mapping.draft.json`;
- future manual review sheets.

## Draft mapping format

`data/erp-section-mapping.draft.json` is intentionally manual. Every raw value can be classified without touching runtime:

| Field | Purpose |
|---|---|
| `raw_value` | Original text from vehicles, PTO, reports, or manual mapping. |
| `normalized_section_code` | Future stable code, only for values classified as `section`. |
| `normalized_section_name` | Future display name, only after review. |
| `value_type` | `section`, `location`, `work_structure`, `work_type`, or `unknown`. |
| `customer` | Customer/project if the section requires it. |
| `timezone` | Section timezone for shift boundaries. |
| `day_shift_start` | Day shift start, nullable until confirmed. |
| `night_shift_start` | Night shift start, nullable until confirmed. |
| `cut_off_time` | Reporting cut-off, nullable until confirmed. |
| `schedule_mode` | Shift schedule mode, nullable until confirmed. |
| `active` | Future active flag. Draft only. |
| `confidence` | Confidence of the classification. |
| `notes` | Manual notes. |
| `requires_manual_review` | Explicit gate before migration/backfill. |

## Candidate sections from PTO

| Raw PTO/report value | Recommended normalized section | Proposed code | Confidence | Manual review |
|---|---|---|---|---|
| `Уч_Аксу` | `Аксу` | `AKSU` | medium | Yes: confirm whether `Уч_` is a legacy UI prefix. |
| `Аксу` | `Аксу` | `AKSU` | medium | Yes: confirm customer/project and code. |
| `Уч_Акбакай` | `Акбакай` | `AKBAKAI` | medium | Yes: confirm whether `Уч_` is a legacy UI prefix. |
| `Акбакай` | `Акбакай` | `AKBAKAI` | medium | Yes: confirm customer/project and code. |

## Candidate locations from PTO

These values must not become `sections` automatically. They describe places/routes inside a section.

| Raw PTO value | Value type | Notes |
|---|---|---|
| `Котенко_Подача` | location | Place or route inside a section. |
| `Котенко_Перевозка` | location | Place or route inside a section. |
| `Дамба` | location | Production location. |
| `Карьер_ОГР` | location | Quarry/OGR location. |
| `Перевозка_Подача_руды` | location | Route-like label; classify manually before using. |

## Candidate work structures from PTO

These values belong to PTO plan rows or future reporting lines, not to `sections`.

| Raw PTO/report value | Value type | Notes |
|---|---|---|
| `Подача руды в бункер ЗИФ КАТех` | work_structure | Accounting direction, not a section. |
| `Перевозка руды с карьера Котенко на ЗИФ КАТех` | work_structure | Accounting direction, not a section. |
| `Отсыпка тела дамбы 2 секция ААМ` | work_structure | Accounting direction, not a section. |
| `Перевозка горной массы с карьера` | work_structure | Accounting direction, not a section. |
| `Подача руды на ЗИФ` | work_structure | Accounting direction, not a section. |

## Values requiring manual review

| Value | Why review is required | Expected action |
|---|---|---|
| `Уч_Аксу` | Prefix may be a UI convention, not part of the section name. | Confirm canonical section `AKSU`. |
| `Уч_Акбакай` | Prefix may be a UI convention, not part of the section name. | Confirm canonical section `AKBAKAI`. |
| `Перевозка_Подача_руды` | Could be a route/location label, not a section. | Classify as location/work structure before migration. |
| Any empty `vehicles.area` | Empty values cannot map to `section_id`. | Keep `section_id = null` until assignment is known. |
| Any mixed value containing quarry/phase/block/dump/work direction | It may be location or structure, not section. | Split into section, location, work structure, and work type. |

## Recommended normalized sections

| section_code | section_name | short_name | source | Status |
|---|---|---|---|---|
| `AKSU` | `Аксу` | `Аксу` | PTO/report candidate | Draft, requires manual review. |
| `AKBAKAI` | `Акбакай` | `Акбакай` | PTO/report candidate | Draft, requires manual review. |

No other sections are added to `data/erp-sections.seed.draft.json` because they were not found as current PTO/report candidates in this data pass.

## What must not be treated as a section automatically

Do not auto-classify the following as `sections`:

- locations: quarry, dump, phase, block, dam, route, loading point, unloading point;
- work structures: accounting directions such as transportation from a quarry or ore feed to ZIF;
- work types: transportation, stripping, mining, grading, loading;
- empty values;
- combined labels that include section plus location or work direction.

## Why seed vehicles do not provide sections

The seed dry-run for `data/default-vehicles.json` found `area` empty for all 881 vehicle rows. This means seed vehicle data cannot safely populate `section_id`.

Until manual mapping is approved:

- vehicle rows may keep `section_id = null` in future preview/backfill output;
- empty `area` must not be converted to a default section;
- section assignment for vehicles must be handled through `vehicle_section_history` after mapping.

## Why shift reports must wait for section_id

The normalized shift report cannot be a stable production workflow until section identity is stable. Without `section_id`, reports cannot safely scope plans, facts, responsibility, approvals, access rights, and corrections.

Future tables depending on `section_id`:

- `vehicle_section_history`;
- `shift_reports`;
- `shift_report_lines`;
- `section_schedules`;
- `section_user_scope`;
- reports;
- PTO;
- GPS reconciliation;
- fuel;
- downtime/repair events.

## Future PTO relationship

Future `pto_plans` / `pto_rows` should store:

- `section_id`;
- location;
- work structure;
- work type;
- planned volume;
- period;
- customer/project when needed.

Current text values can be used for draft mapping and comparison only. They must remain backward compatible until the ERP model is introduced with a reviewed migration and rollback plan.
