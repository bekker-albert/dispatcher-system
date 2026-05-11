# ERP vehicle data normalization rules

Status: draft policy for future migration. These rules do not change runtime code, `VehicleRow`, `vehicles`, PTO, reports, or Excel import/export.

## VIN

- Do not require VIN at the first migration stage.
- Do not create a unique constraint while VIN is empty in all seed rows.
- Keep `vin` nullable in `vehicle_cards`.
- Treat future non-empty VIN values as quality signals, not as the only vehicle identity.

## plateNumber

- Do not create a unique constraint immediately.
- First clean placeholder values: empty, `-`, `б/н`, `без номера`, `Заказчик`, `нет`, `n/a`.
- Check uniqueness only for normalized, non-empty, non-placeholder values.
- Keep duplicate groups visible in dry-run reports until the fleet owner confirms which records are real duplicates and which are separate machines.

## garageNumber

- Do not create a unique constraint immediately.
- First clean placeholder values: empty, `-`, `б/н`, `без номера`, `Заказчик`, `нет`, `n/a`.
- Check uniqueness only for normalized, non-empty, non-placeholder values.
- Keep records with `garageNumber` but no `plateNumber` in manual review because they may still be valid production vehicles.

## area / section

- Do not move empty `area` into `section_id`.
- Use manual mapping from vehicles, PTO, reports, reference defaults, and `data/erp-section-mapping.draft.json`.
- Until mapping is confirmed, vehicles may have `section_id = null`.
- Use `vehicle_section_history` for assignment history after `sections` are confirmed.

## owner / contractor

- Do not start the contracts module as part of vehicle core cleanup.
- Normalize different spellings later into a separate parties/contractors directory.
- For now, keep raw owner/contractor values as legacy strings and use them only for preview `vehicle_contract_links`.

## work / rent / repair / downtime / trips

- Do not move these production fields into `vehicle_cards`.
- Future destinations:
  - `work`, `rent`, `trips` -> `shift_report_lines` or another production fact table;
  - `repair`, `downtime` -> status/event history;
  - repeated operational changes -> server-side audit trail.

## Backfill gate

Real write-backfill can start only after:

- MySQL dry-run is available in staging;
- duplicate and placeholder policy is accepted;
- section mapping is approved by an administrator;
- nullable/unique rules are captured in a migration plan;
- rollback and audit batch strategy is prepared.
