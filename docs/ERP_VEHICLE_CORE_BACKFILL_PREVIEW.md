# Vehicle core backfill preview

Generated at: 2026-05-11T03:22:03.265Z
Mode: preview-read-only
Source: seed

This preview does not change database data, runtime schema, migrations, UI behavior, PTO, reports, or Excel import/export.

Analyzer JSON: loaded from C:\Users\albert.bekker\OneDrive - AA Mining LLP\Разработка программы\dispatcher-system\docs\ERP_VEHICLE_CORE_MIGRATION_DRY_RUN.json

Cleanup preview: loaded from C:\Users\albert.bekker\OneDrive - AA Mining LLP\Разработка программы\dispatcher-system\docs\ERP_VEHICLE_DATA_CLEANUP_PREVIEW.json

## MySQL dry-run skipped

MySQL mode skipped: missing DB_NAME, DB_USER, DB_PASSWORD.

## Preview totals

| Target preview bucket | Rows |
|---|---:|
| vehicle_cards | 881 |
| vehicle_section_history | 0 |
| vehicle_contract_links | 880 |
| vehicle_gps_links | 0 |
| skipped_rows | 0 |
| warnings | 984 |

## Backfill readiness

Decision: backfill blocked

## Blocking issues

- 881 rows require manual cleanup review.
- Section mapping is incomplete; many rows cannot produce vehicle_section_history.
- 984 preview warnings remain.

## Manual cleanup required

| Check | Rows / groups |
|---|---:|
| Safe cleanup candidate rows | 102 |
| Manual review rows | 881 |
| Placeholder plate rows | 239 |
| Placeholder garage rows | 17 |
| Duplicate plate groups | 5 |
| Duplicate garage groups | 5 |

## Section mapping required

| Check | Rows |
|---|---:|
| Source rows | 881 |
| vehicle_section_history preview rows | 0 |
| Rows still missing section mapping | 881 |

Empty area values still cannot become section_id.

## Safe-to-map fields

- brand
- model
- vehicleType
- equipmentType
- manufactureYear
- fuelNormWinter
- fuelNormSummer
- fuelCalcType
- active
- visible
- vin nullable
- plateNumber only after placeholder cleanup
- garageNumber only after placeholder cleanup

## vehicle_cards fields

- id
- brand
- model
- plateNumber
- garageNumber
- vehicleType
- equipmentType
- manufactureYear
- vin
- fuelNormWinter
- fuelNormSummer
- fuelCalcType
- active
- visible

Additional preview metadata: legacy_vehicle_id, display_name, status, version.

## Fields excluded from vehicle_cards

Production fields are not part of vehicle_cards:

- none found with non-zero values

Additional excluded fields:

- area
- location
- owner
- contractor
- workType
- excavator
- work
- rent
- repair
- downtime
- trips

## Manual mapping required

- Empty area values cannot become section_id.
- Owner/contractor text requires a future parties/contractors directory.
- GPS links stay empty until GPS/Wialon mapping is designed.

## Sample skipped rows

- none

## Sample warnings

- {"legacy_vehicle_id":1,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":2,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":3,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":4,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":5,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":6,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":7,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":8,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":9,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":10,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":11,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":12,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":13,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":14,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":15,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":16,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":17,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":18,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":19,"field":"area","reason":"Manual section mapping required."}
- {"legacy_vehicle_id":20,"field":"area","reason":"Manual section mapping required."}

## Decision: backfill allowed / backfill blocked

Decision: backfill blocked. Real backfill is not ready while cleanup, duplicate policy, section mapping, and MySQL dry-run are incomplete.
