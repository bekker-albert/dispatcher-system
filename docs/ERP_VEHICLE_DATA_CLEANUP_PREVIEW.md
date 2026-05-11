# Vehicle data cleanup preview

Generated at: 2026-05-11T03:22:03.265Z
Mode: cleanup-preview-read-only
Source: seed

This report is write-free. It prepares cleanup proposals for future ERP backfill and does not change database data, runtime schema, vehicles, PTO, reports, Excel import/export, or auth.

## MySQL dry-run skipped

MySQL mode skipped: missing DB_NAME, DB_USER, DB_PASSWORD.

## Summary

| Metric | Rows |
|---|---:|
| Total rows | 881 |
| Rows with safe cleanup candidates | 102 |
| Rows requiring manual review | 881 |
| Rows without section | 881 |

## plateNumber

| Check | Rows |
|---|---:|
| Placeholder or empty values | 239 |
| Can be proposed as null | 102 |
| Manual review | 13 |
| Duplicate groups | 5 |

### plateNumber duplicates

- 63TOA03: 3 rows (86, 548, 549)
- 41AEV03(99CBZ02): 2 rows (550, 551)
- АLD884C: 2 rows (546, 657)
- AHDA335: 2 rows (106, 107)
- S246AOD: 2 rows (860, 861)

### plateNumber placeholder values found

- (empty): 135 rows (55, 56, 57, 58, 59, 60, 61, 62, 63, 66, 67, 88)
- -: 69 rows (49, 68, 69, 70, 71, 72, 73, 74, 75, 76, 146, 148)
- б/н: 33 rows (624, 625, 626, 627, 628, 629, 684, 685, 686, 687, 688, 689)
- Заказчик: 2 rows (265, 266)

### plateNumber values proposed as null

- -: 69 rows (49, 68, 69, 70, 71, 72, 73, 74, 75, 76, 146, 148)
- б/н: 33 rows (624, 625, 626, 627, 628, 629, 684, 685, 686, 687, 688, 689)

## garageNumber

| Check | Rows |
|---|---:|
| Placeholder or empty values | 17 |
| Can be proposed as null | 0 |
| Manual review | 13 |
| Duplicate groups | 5 |

### garageNumber duplicates

- АА: 2 rows (263, 264)
- EMX02: 2 rows (109, 701)
- EMX03: 2 rows (110, 702)
- EX62: 2 rows (111, 703)
- EX63: 2 rows (112, 704)

### garageNumber placeholder values found

- (empty): 14 rows (591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602)
- Заказчик: 3 rows (265, 266, 267)

### garageNumber values proposed as null

- none

## VIN

- VIN nullable: yes
- Non-empty VIN rows: 0
- Empty VIN rows: 881
- Unique constraint recommended now: no

## owner / contractor

No contractor directory is created automatically.

### owner spelling variants

- none

### contractor spelling variants

- none

## vehicle type / category

No vehicle type or category text is changed automatically.

### vehicleType variants

- none

### equipmentType variants

- Автомобиль комбинированный уборочный: Автомобиль комбинированный уборочный (1); Автомобиль комбинированный-уборочный (1)

## Values that must not be touched automatically

- duplicate plate or garage numbers;
- rows without section;
- owner/contractor spelling variants;
- vehicle type/category spelling variants;
- any value that looks like a real identifier but conflicts with another row.

## Decision

Staging backfill dry-run may be prepared only after MySQL dry-run is available and manual review closes section mapping, duplicate policy, and placeholder cleanup rules. Real backfill remains blocked.
