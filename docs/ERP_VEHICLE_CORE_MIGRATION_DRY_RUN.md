# Vehicle core migration dry-run

Generated at: 2026-05-11T03:21:16.213Z
Mode: dry-run-read-only
Requested source: auto

This report is read-only. It analyzes existing vehicle data quality for a future ERP core migration and does not change database data, runtime schema, or UI behavior.

## Seed dry-run result

Source: seed

| Metric | Value |
|---|---:|
| Rows | 881 |
| Active | 881 |
| Visible | 881 |
| Active and visible | 881 |
| Rows with at least one migration issue | 881 |

### Empty key fields

| Field | Empty rows |
|---|---:|
| brand | 0 |
| model | 5 |
| plateNumber | 135 |
| garageNumber | 14 |
| vin | 881 |

### Placeholder identifiers

| Field | Placeholder rows |
|---|---:|
| plateNumber | 239 |
| garageNumber | 17 |

### Duplicate identifiers

#### plateNumber
- 63TOA03: 3 rows (86, 548, 549)
- 41AEV03(99CBZ02): 2 rows (550, 551)
- АLD884C: 2 rows (546, 657)
- AHDA335: 2 rows (106, 107)
- S246AOD: 2 rows (860, 861)

#### garageNumber
- АА: 2 rows (263, 264)
- EMX02: 2 rows (109, 701)
- EMX03: 2 rows (110, 702)
- EX62: 2 rows (111, 703)
- EX63: 2 rows (112, 704)

#### vin
- none

### Potential duplicate combinations

#### brand + model + plateNumber
- Howo + 70 + S246AOD: 2 rows (860, 861)
- SDLG + LG953 + AHDA335: 2 rows (106, 107)

#### brand + model + garageNumber
- Hitachi + EX1200-7 + EMX02: 2 rows (109, 701)
- Hitachi + EX1200-7 + EMX03: 2 rows (110, 702)
- Hitachi + EX1200-7 + EX62: 2 rows (111, 703)
- Hitachi + EX1200-7 + EX63: 2 rows (112, 704)

#### plateNumber + garageNumber
- none

#### garageNumber without plateNumber
- 236 rows (49, 55, 56, 57, 58, 59, 60, 61, 62, 63, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 88, 89, 90, 91, 92, 93, 94, 95, 96, ...)

#### plateNumber without garageNumber
- 14 rows (591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604)

### Section and ownership

| Check | Rows |
|---|---:|
| Rows without section | 881 |
| Rows without owner | 1 |
| Rows without contractor | 1 |
| Suspicious owner values | 1 |
| Suspicious contractor values | 1 |

### Value spelling variants

#### owners
- none

#### contractors
- none

#### vehicle types / categories
- none

#### equipment types
- автомобилькомбинированныйуборочный: Автомобиль комбинированный уборочный (1); Автомобиль комбинированный-уборочный (1)

#### brands
- howo: Howo (100); HOWO (9)
- sany: SANY (10); Sany (8)

#### models
- zz3407s3867e: ZZ3407S3867E (12); ZZ3407S3867E. (3)

### Production fields inside vehicle cards

| Field | Rows with value |
|---|---:|
| work | 0 |
| rent | 0 |
| repair | 0 |
| downtime | 0 |
| trips | 0 |

### Target mapping

- vehicle_cards: id, brand, model, plateNumber, garageNumber, vehicleType, equipmentType, manufactureYear, vin, fuelNormWinter, fuelNormSummer, fuelCalcType, active, visible
- vehicle_section_history: area, location
- vehicle_contract_links: owner, contractor
- future shift reports: workType, excavator, work, rent, trips
- vehicle_status_history: repair, downtime, active
- legacy-only until compatibility read model: name


## MySQL dry-run skipped

MySQL mode skipped: missing DB_NAME, DB_USER, DB_PASSWORD.


## Section candidates from PTO plans

This section is a read-only candidate scan. PTO text values can seed a manual mapping, but they must not create production sections without administrator confirmation.

### Sections found in PTO

- Уч_Аксу: 10 hits; sources: PTO plan rows, manual draft mapping file; manual review
- Уч_Акбакай: 7 hits; sources: PTO plan rows, manual draft mapping file; manual review

### Locations found in PTO

- Дамба: 3 hits; sources: PTO plan rows
- Карьер_ОГР: 3 hits; sources: PTO plan rows
- Котенко_Перевозка: 3 hits; sources: PTO plan rows
- Котенко_Подача: 3 hits; sources: PTO plan rows
- Перевозка_Подача_руды: 3 hits; sources: PTO plan rows

### Work structures found in PTO

- Отсыпка тела дамбы 2 секция ААМ: 4 hits; sources: PTO plan rows, report rows
- Перевозка горной массы с карьера: 4 hits; sources: PTO plan rows, report rows
- Перевозка руды с карьера Котенко на ЗИФ КАТех: 4 hits; sources: PTO plan rows, report rows
- Подача руды в бункер ЗИФ КАТех: 4 hits; sources: PTO plan rows, report rows
- Подача руды на ЗИФ: 4 hits; sources: PTO plan rows, report rows

### Values that look like sections but need manual review

- Уч_Аксу: 10 hits; sources: PTO plan rows, manual draft mapping file; manual review
- Уч_Акбакай: 7 hits; sources: PTO plan rows, manual draft mapping file; manual review

### PTO values that are not sections

- Дамба: 3 hits; sources: PTO plan rows
- Карьер_ОГР: 3 hits; sources: PTO plan rows
- Котенко_Перевозка: 3 hits; sources: PTO plan rows
- Котенко_Подача: 3 hits; sources: PTO plan rows
- Перевозка_Подача_руды: 3 hits; sources: PTO plan rows
- Отсыпка тела дамбы 2 секция ААМ: 4 hits; sources: PTO plan rows, report rows
- Перевозка горной массы с карьера: 4 hits; sources: PTO plan rows, report rows
- Перевозка руды с карьера Котенко на ЗИФ КАТех: 4 hits; sources: PTO plan rows, report rows
- Подача руды в бункер ЗИФ КАТех: 4 hits; sources: PTO plan rows, report rows
- Подача руды на ЗИФ: 4 hits; sources: PTO plan rows, report rows

### Combined section candidates

- Уч_Аксу: 10 hits; sources: PTO plan rows, manual draft mapping file; manual review
- Уч_Акбакай: 7 hits; sources: PTO plan rows, manual draft mapping file; manual review
- Аксу: 6 hits; sources: report rows, manual draft mapping file
- Акбакай: 5 hits; sources: report rows, manual draft mapping file
- AKBAKAI: 1 hits; sources: manual draft mapping file
- AKSU: 1 hits; sources: manual draft mapping file


## Backfill readiness

Real write-backfill is not ready. A preview-only backfill can be prepared, but production write-backfill needs:

- staging MySQL dry-run;
- manual section mapping;
- cleanup rules for placeholder plate and garage numbers;
- accepted duplicate policy;
- nullable VIN policy;
- rollback and audit batch plan.
