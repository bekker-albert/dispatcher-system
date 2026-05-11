# ERP core model plan

Р”Р°С‚Р°: 2026-05-10
РџСЂРѕРµРєС‚: `dispatcher-system`
РћР±Р»Р°СЃС‚СЊ: Р­С‚Р°Рї 3 РёР· `docs/ERP_IMPLEMENTATION_PLAN.md`

## РљСЂР°С‚РєРёР№ РІС‹РІРѕРґ

РўРµРєСѓС‰РёР№ СЃРїСЂР°РІРѕС‡РЅРёРє С‚РµС…РЅРёРєРё СѓР¶Рµ РїРѕР»РµР·РµРЅ Рё СЂР°Р±РѕС‡РёР№, РЅРѕ СЌС‚Рѕ РµС‰Рµ РЅРµ ERP-РјРѕРґРµР»СЊ. РЎРµР№С‡Р°СЃ `VehicleRow` СЃРѕРІРјРµС‰Р°РµС‚ РїР°СЃРїРѕСЂС‚ С‚РµС…РЅРёРєРё, С‚РµРєСѓС‰СѓСЋ РїСЂРёРЅР°РґР»РµР¶РЅРѕСЃС‚СЊ Рє СѓС‡Р°СЃС‚РєСѓ, РїСЂРѕРёР·РІРѕРґСЃС‚РІРµРЅРЅС‹Рµ РїРѕРєР°Р·Р°С‚РµР»Рё СЃРјРµРЅС‹, СЃРѕСЃС‚РѕСЏРЅРёРµ СЂРµРјРѕРЅС‚Р°/РїСЂРѕСЃС‚РѕСЏ Рё РІСЂРµРјРµРЅРЅС‹Рµ СЂР°СЃС‡РµС‚РЅС‹Рµ РїРѕР»СЏ. Р”Р»СЏ ERP РЅСѓР¶РЅРѕ СЃРѕС…СЂР°РЅРёС‚СЊ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚СЊ С‚РµРєСѓС‰РµРіРѕ `vehicles` read/write path Рё РїР°СЂР°Р»Р»РµР»СЊРЅРѕ РїРѕРґРіРѕС‚РѕРІРёС‚СЊ РЅРѕСЂРјР°Р»РёР·РѕРІР°РЅРЅС‹Рµ С‚Р°Р±Р»РёС†С‹: `vehicle_cards`, РёСЃС‚РѕСЂРёРё СЃС‚Р°С‚СѓСЃРѕРІ Рё СѓС‡Р°СЃС‚РєРѕРІ, РґРѕРєСѓРјРµРЅС‚С‹, РґРѕРіРѕРІРѕСЂРЅС‹Рµ Рё GPS-СЃРІСЏР·Рё, СЃРїСЂР°РІРѕС‡РЅРёРє СѓС‡Р°СЃС‚РєРѕРІ, РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№, СЂРѕР»РµР№ Рё server-side access matrix.

Р Р°Р·СЂСѓС€РёС‚РµР»СЊРЅР°СЏ РјРёРіСЂР°С†РёСЏ РІ СЌС‚РѕРј СЃРїСЂРёРЅС‚Рµ РЅРµ РІС‹РїРѕР»РЅСЏР»Р°СЃСЊ.

## РўРµРєСѓС‰Р°СЏ РјРѕРґРµР»СЊ С‚РµС…РЅРёРєРё

РћСЃРЅРѕРІРЅРѕР№ С‚РёРї: `VehicleRow` РІ `lib/domain/vehicles/types.ts`.
РўРµРєСѓС‰Р°СЏ MySQL С‚Р°Р±Р»РёС†Р°: `vehicles` РІ `lib/server/mysql/schema-definitions.ts`.

РўРµРєСѓС‰РёР№ storage pattern:

- `vehicles.vehicle_id` - С‡РёСЃР»РѕРІРѕР№ id;
- РёРЅРґРµРєСЃРёСЂСѓРµРјС‹Рµ РїРѕР»СЏ: `sort_index`, `visible`, `category`, `equipment_type`, `brand`, `model`, `plate_number`, `garage_number`, `owner`;
- РїРѕР»РЅР°СЏ РєР°СЂС‚РѕС‡РєР° С…СЂР°РЅРёС‚СЃСЏ РІ `data JSON`;
- РєР»РёРµРЅС‚СЃРєРёРµ РѕРїРµСЂР°С†РёРё РёРґСѓС‚ С‡РµСЂРµР· `/api/database` resource `vehicles`: `load`, `save`, `savePatch`, `replace`, `delete`;
- fallback/seed: `data/default-vehicles.json`, `lib/domain/vehicles/defaults.ts`.

## РљР»Р°СЃСЃРёС„РёРєР°С†РёСЏ РїРѕР»РµР№ `VehicleRow`

| РџРѕР»Рµ | РўРµРєСѓС‰Р°СЏ СЂРѕР»СЊ | Р¦РµР»РµРІР°СЏ ERP-РєР°С‚РµРіРѕСЂРёСЏ | РљРѕРјРјРµРЅС‚Р°СЂРёР№ |
|---|---|---|---|
| `id` | РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ СЃС‚СЂРѕРєРё | РџР°СЃРїРѕСЂС‚/primary key РёР»Рё legacy id | РќСѓР¶РЅР° СЃС‚Р°Р±РёР»СЊРЅР°СЏ СЃРІСЏР·РєР° СЃ Р±СѓРґСѓС‰РёРј `vehicle_cards.vehicle_id`. |
| `name` | Display name | Р’СЂРµРјРµРЅРЅРѕРµ/СЂР°СЃС‡РµС‚РЅРѕРµ РїРѕР»Рµ | Р›СѓС‡С€Рµ СЃС‚СЂРѕРёС‚СЊ РёР· brand/model/garage/plate, РЅРµ С…СЂР°РЅРёС‚СЊ РєР°Рє source of truth. |
| `brand`, `model`, `manufactureYear`, `vin` | РўРµС…РЅРёС‡РµСЃРєРёРµ СЃРІРµРґРµРЅРёСЏ | РџР°СЃРїРѕСЂС‚РЅС‹Рµ РґР°РЅРЅС‹Рµ | РћСЃС‚Р°СЋС‚СЃСЏ РІ `vehicle_cards`. |
| `plateNumber`, `garageNumber` | РЈС‡РµС‚РЅС‹Рµ РЅРѕРјРµСЂР° | РџР°СЃРїРѕСЂС‚РЅС‹Рµ/СЂРµРіРёСЃС‚СЂР°С†РёРѕРЅРЅС‹Рµ РґР°РЅРЅС‹Рµ | РќСѓР¶РЅС‹ СѓРЅРёРєР°Р»СЊРЅС‹Рµ РёРЅРґРµРєСЃС‹ СЃ СѓС‡РµС‚РѕРј РїСѓСЃС‚С‹С… Р·РЅР°С‡РµРЅРёР№ Рё РёСЃС‚РѕСЂРёРё СЃРјРµРЅС‹ РЅРѕРјРµСЂРѕРІ. |
| `vehicleType`, `equipmentType` | РљР°С‚РµРіРѕСЂРёСЏ/С‚РёРї | РџР°СЃРїРѕСЂС‚ + РєР»Р°СЃСЃРёС„РёРєР°С‚РѕСЂС‹ | Р’ Р±СѓРґСѓС‰РµРј РІС‹РЅРµСЃС‚Рё РІ СЃРїСЂР°РІРѕС‡РЅРёРєРё vehicle categories/equipment types. |
| `fuelNormWinter`, `fuelNormSummer`, `fuelCalcType` | РќРѕСЂРјС‹ С‚РѕРїР»РёРІР° | РџСЂРѕРёР·РІРѕРґСЃС‚РІРµРЅРЅС‹Р№ РЅРѕСЂРјР°С‚РёРІ | РќРµ Р·Р°РїСѓСЃРєР°С‚СЊ С‚РѕРїР»РёРІРЅС‹Р№ РјРѕРґСѓР»СЊ СЃРµР№С‡Р°СЃ; СЃРѕС…СЂР°РЅРёС‚СЊ РєР°Рє РїРѕР»СЏ РєР°СЂС‚РѕС‡РєРё РёР»Рё РѕС‚РґРµР»СЊРЅС‹Рµ РЅРѕСЂРјС‹ РїРѕ РїРµСЂРёРѕРґР°Рј РїРѕР·Р¶Рµ. |
| `owner`, `contractor` | Р’Р»Р°РґРµР»РµС†/РїРѕРґСЂСЏРґС‡РёРє | Р”РѕРіРѕРІРѕСЂРЅР°СЏ РїСЂРёРЅР°РґР»РµР¶РЅРѕСЃС‚СЊ | Р”РѕР»Р¶РЅРѕ РїРµСЂРµР№С‚Рё РІ `vehicle_contract_links` Рё СЃРїСЂР°РІРѕС‡РЅРёРє РєРѕРЅС‚СЂР°РіРµРЅС‚РѕРІ. |
| `area` | РЈС‡Р°СЃС‚РѕРє | РўРµРєСѓС‰РµРµ СЃРѕСЃС‚РѕСЏРЅРёРµ + РёСЃС‚РѕСЂРёСЏ | Р”РѕР»Р¶РЅРѕ РїРµСЂРµР№С‚Рё РІ `vehicle_section_history`. |
| `location` | РњРµСЃС‚Рѕ/РїРѕР·РёС†РёСЏ | РўРµРєСѓС‰РµРµ СЃРѕСЃС‚РѕСЏРЅРёРµ РёР»Рё СЃРѕР±С‹С‚РёРµ | Р”Р»СЏ ERP Р»СѓС‡С€Рµ С…СЂР°РЅРёС‚СЊ РєР°Рє status/location event, РЅРµ РєР°Рє РІРµС‡РЅРѕРµ РїРѕР»Рµ РєР°СЂС‚РѕС‡РєРё. |
| `workType` | Р’РёРґ СЂР°Р±РѕС‚С‹ | РџСЂРѕРёР·РІРѕРґСЃС‚РІРµРЅРЅС‹Рµ РґР°РЅРЅС‹Рµ | Р”РѕР»Р¶РЅРѕ Р±С‹С‚СЊ С‡Р°СЃС‚СЊСЋ СЃРјРµРЅРЅРѕР№ СЃРІРѕРґРєРё/РЅР°Р·РЅР°С‡РµРЅРёСЏ, РЅРµ master data. |
| `excavator` | РЎРІСЏР·РєР° СЃ СЌРєСЃРєР°РІР°С‚РѕСЂРѕРј | РџСЂРѕРёР·РІРѕРґСЃС‚РІРµРЅРЅРѕРµ РЅР°Р·РЅР°С‡РµРЅРёРµ/СЃРѕР±С‹С‚РёРµ | Р”РѕР»Р¶РЅРѕ Р±С‹С‚СЊ assignment/event, РѕСЃРѕР±РµРЅРЅРѕ РґР»СЏ СЃР°РјРѕСЃРІР°Р»РѕРІ. |
| `work`, `rent`, `repair`, `downtime`, `trips` | Р§Р°СЃС‹/СЂРµР№СЃС‹/СЃРѕСЃС‚РѕСЏРЅРёСЏ | Р’СЂРµРјРµРЅРЅС‹Рµ/СЃРјРµРЅРЅС‹Рµ Р°РіСЂРµРіР°С‚С‹ | РќРµ РґРѕР»Р¶РЅС‹ Р¶РёС‚СЊ РІ РєР°СЂС‚РѕС‡РєРµ С‚РµС…РЅРёРєРё. РќСѓР¶РЅС‹ shift report lines, status events, downtime/repair events. |
| `active`, `visible` | Р¤Р»Р°РіРё РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ/Р°РєС‚РёРІРЅРѕСЃС‚Рё | РўРµРєСѓС‰РµРµ СЃРѕСЃС‚РѕСЏРЅРёРµ РєР°СЂС‚РѕС‡РєРё | `active` РѕСЃС‚Р°РІРёС‚СЊ РєР°Рє lifecycle status; `visible` РєР°Рє UI/archive flag РёР»Рё Р·Р°РјРµРЅРёС‚СЊ СЃС‚Р°С‚СѓСЃРѕРј. |

## РџСЂРѕР±Р»РµРјС‹ С‚РµРєСѓС‰РµР№ РјРѕРґРµР»Рё

1. РљР°СЂС‚РѕС‡РєР° С‚РµС…РЅРёРєРё СЃРјРµС€Р°РЅР° СЃ РѕРїРµСЂР°С‚РёРІРЅРѕР№ СЃРјРµРЅРЅРѕР№ РёРЅС„РѕСЂРјР°С†РёРµР№.
2. РСЃС‚РѕСЂРёСЏ СѓС‡Р°СЃС‚РєРѕРІ, СЃС‚Р°С‚СѓСЃРѕРІ, РґРѕРіРѕРІРѕСЂРѕРІ, СЂРµРјРѕРЅС‚РѕРІ Рё РїСЂРѕСЃС‚РѕРµРІ РЅРµ РЅРѕСЂРјР°Р»РёР·РѕРІР°РЅР°.
3. `data JSON` РїРѕРјРѕРіР°РµС‚ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё, РЅРѕ РѕРіСЂР°РЅРёС‡РёРІР°РµС‚ СЃРµСЂРІРµСЂРЅС‹Рµ С„РёР»СЊС‚СЂС‹, audit Рё РїСЂР°РІР°.
4. `area`, `contractor`, `workType`, `excavator` РјРѕРіСѓС‚ РјРµРЅСЏС‚СЊСЃСЏ РІРѕ РІСЂРµРјРµРЅРё, РЅРѕ СЃРµР№С‡Р°СЃ РІС‹РіР»СЏРґСЏС‚ РєР°Рє РїРѕСЃС‚РѕСЏРЅРЅС‹Рµ СЃРІРѕР№СЃС‚РІР°.
5. РџСЂРѕРёР·РІРѕРґСЃС‚РІРµРЅРЅС‹Рµ Р°РіСЂРµРіР°С‚С‹ (`work`, `rent`, `repair`, `downtime`, `trips`) РјРѕРіСѓС‚ РєРѕРЅС„Р»РёРєС‚РѕРІР°С‚СЊ СЃ Р±СѓРґСѓС‰РёРјРё СЃРјРµРЅРЅС‹РјРё СЃРІРѕРґРєР°РјРё.
6. РќРµС‚ РѕС‚РґРµР»СЊРЅРѕР№ С‚Р°Р±Р»РёС†С‹ РґРѕРєСѓРјРµРЅС‚РѕРІ С‚РµС…РЅРёРєРё.
7. РќРµС‚ server-side section scope РґР»СЏ С‚РµС…РЅРёРєРё.
8. Excel import/export Рё С‚РµРєСѓС‰РёР№ inline grid Р·Р°РІСЏР·Р°РЅС‹ РЅР° `VehicleRow`, РїРѕСЌС‚РѕРјСѓ РјРёРіСЂР°С†РёСЏ РґРѕР»Р¶РЅР° Р±С‹С‚СЊ СЃРѕРІРјРµСЃС‚РёРјРѕР№.

## Р¦РµР»РµРІР°СЏ ERP-РјРѕРґРµР»СЊ С‚РµС…РЅРёРєРё

| РўР°Р±Р»РёС†Р° | РќР°Р·РЅР°С‡РµРЅРёРµ | РљР»СЋС‡РµРІС‹Рµ РїРѕР»СЏ |
|---|---|---|
| `vehicle_cards` | РћСЃРЅРѕРІРЅР°СЏ РєР°СЂС‚РѕС‡РєР° С‚РµС…РЅРёРєРё | `vehicle_id`, `legacy_vehicle_id`, `display_name`, `brand`, `model`, `plate_number`, `garage_number`, `vehicle_type_id`, `equipment_type_id`, `manufacture_year`, `vin`, `owner_party_id`, `fuel_calc_type`, `fuel_norm_winter`, `fuel_norm_summer`, `lifecycle_status`, `visible`, `created_at`, `updated_at`, `version` |
| `vehicle_status_history` | РСЃС‚РѕСЂРёСЏ СЃРѕСЃС‚РѕСЏРЅРёСЏ С‚РµС…РЅРёРєРё | `status_id`, `vehicle_id`, `status`, `reason`, `started_at`, `ended_at`, `section_id`, `source_module`, `source_entity_id`, `created_by_user_id`, `created_at` |
| `vehicle_section_history` | РСЃС‚РѕСЂРёСЏ Р·Р°РєСЂРµРїР»РµРЅРёСЏ Р·Р° СѓС‡Р°СЃС‚РєР°РјРё | `history_id`, `vehicle_id`, `section_id`, `started_at`, `ended_at`, `assignment_kind`, `comment`, `created_by_user_id`, `created_at` |
| `vehicle_documents` | Р”РѕРєСѓРјРµРЅС‚С‹ С‚РµС…РЅРёРєРё | `document_id`, `vehicle_id`, `document_type`, `number`, `issued_at`, `expires_at`, `file_ref`, `status`, `created_by_user_id`, `created_at`, `updated_at` |
| `vehicle_contract_links` | РЎРІСЏР·СЊ С‚РµС…РЅРёРєРё СЃ РїРѕРґСЂСЏРґС‡РёРєР°РјРё/РґРѕРіРѕРІРѕСЂР°РјРё | `link_id`, `vehicle_id`, `party_id`, `contract_id`, `started_at`, `ended_at`, `rate_policy_id`, `active`, `created_at` |
| `vehicle_gps_links` | РЎРІСЏР·СЊ С‚РµС…РЅРёРєРё СЃ GPS/Wialon СЃСѓС‰РЅРѕСЃС‚СЏРјРё | `link_id`, `vehicle_id`, `provider`, `external_unit_id`, `terminal_id`, `started_at`, `ended_at`, `active`, `created_at` |
| `vehicle_import_batches` | РљРѕРЅС‚СЂРѕР»СЊ Excel/import РјРёРіСЂР°С†РёР№ | `batch_id`, `source`, `created_by_user_id`, `created_at`, `accepted_rows`, `rejected_rows`, `status` |

Р’Р°Р¶РЅРѕ: `vehicle_contract_links` Рё `vehicle_gps_links` РїСЂРѕРµРєС‚РёСЂСѓСЋС‚СЃСЏ РєР°Рє СЃРІСЏР·Рё СЏРґСЂР°, РЅРѕ РІ СЌС‚РѕРј СЃРїСЂРёРЅС‚Рµ РЅРµ Р·Р°РїСѓСЃРєР°СЋС‚ РјРѕРґСѓР»Рё РґРѕРіРѕРІРѕСЂРѕРІ РёР»Рё GPS/Wialon.

## РџСЂРѕРµРєС‚ СЃРїСЂР°РІРѕС‡РЅРёРєР° СѓС‡Р°СЃС‚РєРѕРІ

| РўР°Р±Р»РёС†Р° | РќР°Р·РЅР°С‡РµРЅРёРµ | РљР»СЋС‡РµРІС‹Рµ РїРѕР»СЏ |
|---|---|---|
| `sections` | РЎРїСЂР°РІРѕС‡РЅРёРє СѓС‡Р°СЃС‚РєРѕРІ | `section_id`, `code`, `name`, `short_name`, `parent_section_id`, `site_name`, `timezone`, `active`, `sort_order`, `created_at`, `updated_at` |
| `section_schedules` | Р“СЂР°С„РёРєРё СЃРјРµРЅ Рё cut-off | `schedule_id`, `section_id`, `schedule_code`, `shift_mode`, `day_shift_start`, `night_shift_start`, `cut_off_time`, `effective_from`, `effective_to`, `active` |
| `section_managers` | РћС‚РІРµС‚СЃС‚РІРµРЅРЅС‹Рµ РїРѕ СѓС‡Р°СЃС‚РєР°Рј | `manager_id`, `section_id`, `user_id`, `role_in_section`, `started_at`, `ended_at`, `active` |
| `section_vehicle_assignments` | РўРµРєСѓС‰РµРµ Р·Р°РєСЂРµРїР»РµРЅРёРµ С‚РµС…РЅРёРєРё | `assignment_id`, `section_id`, `vehicle_id`, `started_at`, `ended_at`, `assignment_kind`, `active` |
| `section_user_scope` | Р’РёРґРёРјРѕСЃС‚СЊ/РїСЂР°РІР° РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РїРѕ СѓС‡Р°СЃС‚РєР°Рј | `scope_id`, `user_id`, `section_id`, `scope_kind`, `started_at`, `ended_at`, `active` |

Р‘Р°Р·РѕРІС‹Рµ РїСЂР°РІРёР»Р°:

- СѓС‡Р°СЃС‚РѕРє РёРјРµРµС‚ `active/inactive` СЃС‚Р°С‚СѓСЃ;
- cut-off time С…СЂР°РЅРёС‚СЃСЏ РІ schedule, Р° РЅРµ РІ UI defaults;
- shift schedule РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ versioned РїРѕ `effective_from/effective_to`;
- СЃРІСЏР·СЊ С‚РµС…РЅРёРєРё СЃ СѓС‡Р°СЃС‚РєРѕРј С…СЂР°РЅРёС‚СЃСЏ РёСЃС‚РѕСЂРёС‡РµСЃРєРё;
- СЃРІСЏР·СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ СЃ СѓС‡Р°СЃС‚РєРѕРј РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ СЃРµСЂРІРµСЂРЅРѕР№ Р°РІС‚РѕСЂРёР·Р°С†РёРµР№, Р° РЅРµ С‚РѕР»СЊРєРѕ UI-С„РёР»СЊС‚СЂРѕРј.

## РўРµРєСѓС‰Р°СЏ СЃРёСЃС‚РµРјР° РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ Рё СЂРѕР»РµР№

РўРµРєСѓС‰РёРµ СЃСѓС‰РЅРѕСЃС‚Рё:

- `AuthUserRole`: `dispatch-chief`, `dispatcher`, `admin`;
- `auth_users`: login, Р¤РРћ, РєРѕРЅС‚Р°РєС‚С‹, role, `can_manage_users`, `tab_permissions`, active, password hash;
- `tab_permissions`: `{ view, edit }` РїРѕ РІРєР»Р°РґРєР°Рј;
- superuser logic: `dispatch-chief` Рё `admin` РїРѕР»СѓС‡Р°СЋС‚ view/edit РЅР° РІРєР»Р°РґРєРё;
- `/api/database` СѓР¶Рµ РїСЂРѕРІРµСЂСЏРµС‚ СЃРµСЂРІРµСЂРЅС‹Рµ РїСЂР°РІР°, РЅРѕ Р±СѓРґСѓС‰РёРµ module actions РїРѕРєР° СЃРѕРїРѕСЃС‚Р°РІР»СЏСЋС‚СЃСЏ СЃ С‚РµРєСѓС‰РёРјРё tab permissions.

РџСЂРѕР±Р»РµРјР°: tab permissions - СЌС‚Рѕ РЅР°РІРёРіР°С†РёРѕРЅРЅС‹Р№/UI СѓСЂРѕРІРµРЅСЊ. Р”Р»СЏ ERP РЅСѓР¶РЅС‹ server-side РїСЂР°РІР° РїРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЋ, СЂРѕР»Рё, СѓС‡Р°СЃС‚РєСѓ, РјРѕРґСѓР»СЋ, РґРµР№СЃС‚РІРёСЋ Рё workflow status.

## РџСЂРѕРµРєС‚ server-side РјР°С‚СЂРёС†С‹ РґРѕСЃС‚СѓРїР°

Р¦РµР»РµРІС‹Рµ РґРµР№СЃС‚РІРёСЏ:

`read`, `create`, `update`, `delete`, `approve`, `close`, `export`, `import`, `admin`.

| РўР°Р±Р»РёС†Р° | РќР°Р·РЅР°С‡РµРЅРёРµ | РљР»СЋС‡РµРІС‹Рµ РїРѕР»СЏ |
|---|---|---|
| `erp_roles` | Р РѕР»Рё ERP | `role_id`, `code`, `name`, `description`, `active`, `created_at`, `updated_at` |
| `erp_user_roles` | РќР°Р·РЅР°С‡РµРЅРёРµ СЂРѕР»РµР№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРј | `user_role_id`, `user_id`, `role_id`, `section_id`, `started_at`, `ended_at`, `active` |
| `erp_role_permissions` | РџСЂР°РІР° СЂРѕР»Рё | `permission_id`, `role_id`, `module`, `action`, `section_scoped`, `conditions_json`, `active` |
| `erp_user_permissions` | РРЅРґРёРІРёРґСѓР°Р»СЊРЅС‹Рµ РёСЃРєР»СЋС‡РµРЅРёСЏ | `permission_id`, `user_id`, `module`, `action`, `section_id`, `effect`, `reason`, `active` |
| `erp_user_section_scope` | РћР±Р»Р°СЃС‚СЊ РІРёРґРёРјРѕСЃС‚Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ | `scope_id`, `user_id`, `section_id`, `scope_kind`, `started_at`, `ended_at`, `active` |
| `erp_access_audit` | РСЃС‚РѕСЂРёСЏ РёР·РјРµРЅРµРЅРёСЏ РїСЂР°РІ | `audit_id`, `actor_user_id`, `target_user_id`, `entity_type`, `entity_id`, `old_value`, `new_value`, `reason`, `created_at` |

Server-side РїСЂРѕРІРµСЂРєР° РґРѕР»Р¶РЅР° РїСЂРёРЅРёРјР°С‚СЊ:

- С‚РµРєСѓС‰РµРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РёР· session cookie;
- `module`;
- `action`;
- `section_id` РёР»Рё РґСЂСѓРіРѕР№ scope РёР· payload/query;
- entity owner/status/version, РµСЃР»Рё action workflow-Р·Р°РІРёСЃРёРјС‹Р№;
- deny/allow СЃ audit-friendly reason.

## РљР°РєРёРµ РјРёРіСЂР°С†РёРё РЅСѓР¶РЅС‹

РњРёРіСЂР°С†РёРё РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ РЅРµСЂР°Р·СЂСѓС€РёС‚РµР»СЊРЅС‹РјРё Рё РЅРµ РїСЂРёРјРµРЅСЏС‚СЊСЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РІ СЌС‚РѕРј СЃРїСЂРёРЅС‚Рµ.

1. РЎРѕР·РґР°С‚СЊ РЅРѕРІС‹Рµ С‚Р°Р±Р»РёС†С‹ `sections`, `section_schedules`, `section_managers`, `section_user_scope`.
2. РЎРѕР·РґР°С‚СЊ РЅРѕРІС‹Рµ С‚Р°Р±Р»РёС†С‹ `vehicle_cards`, `vehicle_status_history`, `vehicle_section_history`, `vehicle_documents`, `vehicle_contract_links`, `vehicle_gps_links`.
3. РЎРѕР·РґР°С‚СЊ С‚Р°Р±Р»РёС†С‹ RBAC/ABAC: `erp_roles`, `erp_user_roles`, `erp_role_permissions`, `erp_user_permissions`, `erp_user_section_scope`, `erp_access_audit`.
4. Р”РѕР±Р°РІРёС‚СЊ nullable legacy links: `legacy_vehicle_id`, `legacy_snapshot_hash`, `source`.
5. РџРѕРґРіРѕС‚РѕРІРёС‚СЊ backfill script, РєРѕС‚РѕСЂС‹Р№ С‡РёС‚Р°РµС‚ С‚РµРєСѓС‰РёР№ `vehicles.data` Рё РїРёС€РµС‚ РІ РЅРѕРІС‹Рµ С‚Р°Р±Р»РёС†С‹ Р±РµР· СѓРґР°Р»РµРЅРёСЏ СЃС‚Р°СЂРѕР№ С‚Р°Р±Р»РёС†С‹.
6. РџРѕРґРіРѕС‚РѕРІРёС‚СЊ compatibility view/read model, РєРѕС‚РѕСЂС‹Р№ СЃРѕР±РёСЂР°РµС‚ `VehicleRow` РёР· РЅРѕРІС‹С… С‚Р°Р±Р»РёС† РґР»СЏ СЃС‚Р°СЂРѕРіРѕ UI.
7. РўРѕР»СЊРєРѕ РїРѕСЃР»Рµ СЃРІРµСЂРєРё РІРєР»СЋС‡Р°С‚СЊ dual-read РёР»Рё staged switch.

## РљР°РєРёРµ API handlers РЅСѓР¶РЅС‹ С‡РµСЂРµР· `/api/database`

РќРѕРІС‹Рµ `app/api/<module>` routes РЅРµ РЅСѓР¶РЅС‹. Р’СЃРµ РґРµР№СЃС‚РІРёСЏ РґРѕР»Р¶РЅС‹ СЃС‚Р°С‚СЊ resource/action РІРЅСѓС‚СЂРё С‚РµРєСѓС‰РµРіРѕ router.

| Resource | Actions | РЎС‚Р°С‚СѓСЃ |
|---|---|---|
| `vehicles` | legacy `load`, `save`, `savePatch`, `replace`, `delete` | РћСЃС‚Р°РІРёС‚СЊ РґР»СЏ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё. |
| `vehicle-core` | `list-vehicle-cards`, `get-vehicle-card`, `patch-vehicle-card`, `list-vehicle-status-history`, `list-vehicle-section-history` | РџР»Р°РЅ, РЅРµ РїРѕРґРєР»СЋС‡Р°С‚СЊ РґРѕ СЃС…РµРј Рё С‚РµСЃС‚РѕРІ. |
| `sections` | `list-sections`, `get-section`, `create-section`, `patch-section`, `archive-section`, `list-section-schedules`, `patch-section-schedule` | РџР»Р°РЅ. |
| `access-matrix` | `list-role-permissions`, `patch-role-permission`, `list-user-section-scope`, `patch-user-section-scope` | РЈР¶Рµ РµСЃС‚СЊ planned contract layer; РЅСѓР¶РµРЅ live handler РїРѕР·Р¶Рµ. |
| `audit` | `list-entity-changes`, `create-restore-audit-entry` | РџР»Р°РЅ РґР»СЏ server-side audit trail. |

РљР°Р¶РґС‹Р№ future handler РґРѕР»Р¶РµРЅ РёРјРµС‚СЊ:

- auth requirement;
- section scope validation;
- query policy СЃ bounded pagination;
- expected version РґР»СЏ update;
- audit trail;
- tests before live registration.

## РљР°РєРёРµ UI-СЌРєСЂР°РЅС‹ Р±СѓРґСѓС‚ Р·Р°С‚СЂРѕРЅСѓС‚С‹

| Р­РєСЂР°РЅ | РљР°Рє Р·Р°С‚СЂР°РіРёРІР°РµС‚СЃСЏ | РџСЂР°РІРёР»Рѕ Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё |
|---|---|---|
| Admin Vehicles inline grid | Р”РѕР»Р¶РµРЅ СЃРѕС…СЂР°РЅРёС‚СЊ `VehicleRow` compatibility РЅР° РїРµСЂРµС…РѕРґРЅС‹Р№ РїРµСЂРёРѕРґ | РќРµ РјРµРЅСЏС‚СЊ С„РѕСЂРјР°С‚ СЃРѕС…СЂР°РЅРµРЅРёСЏ Р±РµР· migration/read model. |
| Fleet/РўРµС…РЅРёРєР° readonly list | Р”РѕР»Р¶РµРЅ РїСЂРѕРґРѕР»Р¶Р°С‚СЊ С‡РёС‚Р°С‚СЊ СЃРѕРІРјРµСЃС‚РёРјС‹Рµ vehicle rows | РќРµ Р»РѕРјР°С‚СЊ С‚РµРєСѓС‰РёРµ С„РёР»СЊС‚СЂС‹ Рё СЃРїРёСЃРєРё. |
| PTO buckets/РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ | РСЃРїРѕР»СЊР·СѓРµС‚ С‚РµС…РЅРёРєСѓ РґР»СЏ РєРѕРІС€РµР№/РєСѓР·РѕРІРѕРІ/РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚Рё | РџРµСЂРµРґ РјРёРіСЂР°С†РёРµР№ РїСЂРѕРІРµСЂРёС‚СЊ Excel, С„РѕСЂРјСѓР»С‹, bucket columns. |
| Reports | РСЃРїРѕР»СЊР·СѓСЋС‚ С‚РµС…РЅРёРєСѓ Рё РџРўРћ РєР°Рє РёСЃС‚РѕС‡РЅРёРє РѕС‚С‡РµС‚РѕРІ | РќРµ РїРµСЂРµРєР»СЋС‡Р°С‚СЊ РЅР° РЅРѕРІСѓСЋ РјРѕРґРµР»СЊ Р±РµР· prepared aggregates. |
| Admin Structure | РњРѕР¶РµС‚ СЃС‚Р°С‚СЊ UI РґР»СЏ `sections` | РџРѕРєР° РЅРµ СЃС‡РёС‚Р°С‚СЊ С‚РµРєСѓС‰СѓСЋ СЃС‚СЂСѓРєС‚СѓСЂСѓ production СЃРїСЂР°РІРѕС‡РЅРёРєРѕРј СѓС‡Р°СЃС‚РєРѕРІ. |
| Users/Profile/UserManagement | РЎС‚Р°РЅСѓС‚ UI РґР»СЏ СЂРѕР»РµР№ Рё section scope | Tab permissions РѕСЃС‚Р°РІРёС‚СЊ РєР°Рє legacy navigation layer. |
| Admin Access Matrix | РЎРµР№С‡Р°СЃ preview | РќРµ СЃС‡РёС‚Р°С‚СЊ production authorization РґРѕ live server-side checks. |

## Р РёСЃРєРё РґР»СЏ С‚РµРєСѓС‰РµРіРѕ РџРўРћ Рё РѕС‚С‡РµС‚РѕРІ

1. Р•СЃР»Рё СѓР±СЂР°С‚СЊ РёР»Рё РїРµСЂРµРёРјРµРЅРѕРІР°С‚СЊ РїРѕР»СЏ `VehicleRow`, СЃР»РѕРјР°СЋС‚СЃСЏ Excel import/export, buckets Рё reports.
2. Р•СЃР»Рё `area` РїРµСЂРµРІРµСЃС‚Рё РІ РёСЃС‚РѕСЂРёСЋ Р±РµР· compatibility read model, С‚РµРєСѓС‰РёРµ С„РёР»СЊС‚СЂС‹ Рё РѕС‚С‡РµС‚С‹ РїРѕС‚РµСЂСЏСЋС‚ СѓС‡Р°СЃС‚РѕРє.
3. Р•СЃР»Рё `work/repair/downtime/trips` СѓРґР°Р»РёС‚СЊ РёР· РєР°СЂС‚РѕС‡РєРё Р±РµР· СЃРјРµРЅРЅС‹С… РґРѕРєСѓРјРµРЅС‚РѕРІ, С‚РµРєСѓС‰РёРµ preview/fleet РїРѕРєР°Р·Р°С‚РµР»Рё РёСЃС‡РµР·РЅСѓС‚.
4. Р•СЃР»Рё roles Р·Р°РјРµРЅРёС‚СЊ СЃСЂР°Р·Сѓ, РјРѕР¶РЅРѕ СЃР»РѕРјР°С‚СЊ РІС…РѕРґ, СЂРµРіРёСЃС‚СЂР°С†РёСЋ Рё РґРѕСЃС‚СѓРї Рє Р°РґРјРёРЅРєРµ.
5. Р•СЃР»Рё live handlers РїРѕРґРєР»СЋС‡РёС‚СЊ РґРѕ query policy Рё server auth, planned ERP modules СЃРѕР·РґР°РґСѓС‚ РёР»Р»СЋР·РёСЋ РіРѕС‚РѕРІРЅРѕСЃС‚Рё.

## РџР»Р°РЅ Р±РµР·РѕРїР°СЃРЅРѕР№ РјРёРіСЂР°С†РёРё Р±РµР· РїРѕС‚РµСЂРё РґР°РЅРЅС‹С…

1. Р—Р°С„РёРєСЃРёСЂРѕРІР°С‚СЊ С‚РµРєСѓС‰РёР№ MySQL backup Рё snapshot `vehicles`.
2. Р”РѕР±Р°РІРёС‚СЊ РЅРѕРІС‹Рµ С‚Р°Р±Р»РёС†С‹ РєР°Рє РїСѓСЃС‚С‹Рµ, nullable, Р±РµР· СѓРґР°Р»РµРЅРёСЏ `vehicles`.
3. РЎРѕР·РґР°С‚СЊ dry-run backfill report: СЃРєРѕР»СЊРєРѕ СЃС‚СЂРѕРє С‚РµС…РЅРёРєРё СЂР°СЃРїРѕР·РЅР°РЅРѕ, РєР°РєРёРµ РїРѕР»СЏ РїСѓСЃС‚С‹Рµ, РіРґРµ РµСЃС‚СЊ РґСѓР±Р»Рё garage/plate/vin.
4. Р—Р°РїСѓСЃС‚РёС‚СЊ backfill С‚РѕР»СЊРєРѕ РІ РѕС‚РґРµР»СЊРЅРѕРј migration script СЃ Р»РѕРіРѕРј batch id.
5. РЎРІРµСЂРёС‚СЊ counts Рё hashes РјРµР¶РґСѓ `vehicles.data` Рё `vehicle_cards`.
6. РЎРґРµР»Р°С‚СЊ compatibility read model `VehicleRow` РёР· РЅРѕРІС‹С… С‚Р°Р±Р»РёС†.
7. Р’РєР»СЋС‡РёС‚СЊ dual-read СЃСЂР°РІРЅРµРЅРёРµ РІ dev/staging, РЅРµ РјРµРЅСЏСЏ production write path.
8. РџРµСЂРµРІРµСЃС‚Рё UI С‡С‚РµРЅРёРµ РЅР° read model С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ С‚РµСЃС‚РѕРІ РџРўРћ/РѕС‚С‡РµС‚РѕРІ/С‚РµС…РЅРёРєРё.
9. РџРµСЂРµРІРµСЃС‚Рё write path РЅР° versioned patch С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ server audit Рё expected version.
10. РЎРѕС…СЂР°РЅРёС‚СЊ rollback: legacy `vehicles` РѕСЃС‚Р°РµС‚СЃСЏ РёСЃС‚РѕС‡РЅРёРєРѕРј РґРѕ РїРѕР»РЅРѕРіРѕ acceptance.

## Р§С‚Рѕ РјРѕР¶РЅРѕ РѕСЃС‚Р°РІРёС‚СЊ

- С‚РµРєСѓС‰РёР№ `VehicleRow` РєР°Рє compatibility DTO;
- С‚РµРєСѓС‰РёР№ `/api/database` resource `vehicles`;
- Admin Vehicles inline grid РєР°Рє СЂР°Р±РѕС‡РёР№ UI;
- MySQL table `vehicles` РґРѕ Р·Р°РІРµСЂС€РµРЅРёСЏ РјРёРіСЂР°С†РёРё;
- Supabase/localStorage fallback РєР°Рє recovery, РЅРѕ РЅРµ РєР°Рє ERP source of truth.

## Р§С‚Рѕ РЅСѓР¶РЅРѕ СЃРѕР·РґР°С‚СЊ Р·Р°РЅРѕРІРѕ

- РЅРѕСЂРјР°Р»РёР·РѕРІР°РЅРЅС‹Р№ СЃРїСЂР°РІРѕС‡РЅРёРє СѓС‡Р°СЃС‚РєРѕРІ;
- server-side role/user/section/module/action access matrix;
- РёСЃС‚РѕСЂРёРё СЃС‚Р°С‚СѓСЃРѕРІ Рё СѓС‡Р°СЃС‚РєРѕРІ С‚РµС…РЅРёРєРё;
- РґРѕРєСѓРјРµРЅС‚С‹ С‚РµС…РЅРёРєРё;
- РґРѕРіРѕРІРѕСЂРЅС‹Рµ Рё GPS-СЃРІСЏР·Рё РєР°Рє core links Р±РµР· Р·Р°РїСѓСЃРєР° СЃР°РјРёС… РјРѕРґСѓР»РµР№;
- server-side audit trail РґР»СЏ changes/restore/migration.

## РЎР»РµРґСѓСЋС‰РёР№ Р±РµР·РѕРїР°СЃРЅС‹Р№ С€Р°Рі

РџРµСЂРµРґ Р­С‚Р°РїРѕРј 4 РЅСѓР¶РЅРѕ РїРѕРґРіРѕС‚РѕРІРёС‚СЊ draft MySQL migration plan Рё dry-run analyzer РґР»СЏ `vehicles -> vehicle_cards`, Р° С‚Р°РєР¶Рµ РјРёРЅРёРјР°Р»СЊРЅСѓСЋ server-side РјР°С‚СЂРёС†Сѓ `role/user/section/module/action`. РўРѕР»СЊРєРѕ РїРѕСЃР»Рµ СЌС‚РѕРіРѕ РјРѕР¶РЅРѕ РЅР°С‡РёРЅР°С‚СЊ РЅРѕСЂРјР°Р»РёР·РѕРІР°РЅРЅСѓСЋ СЃРјРµРЅРЅСѓСЋ СЃРІРѕРґРєСѓ, РїРѕС‚РѕРјСѓ С‡С‚Рѕ РѕРЅР° РґРѕР»Р¶РЅР° СЃСЃС‹Р»Р°С‚СЊСЃСЏ РЅР° СЃС‚Р°Р±РёР»СЊРЅС‹Рµ `vehicle_id`, `section_id`, `user_id` Рё РїСЂР°РІР°.
