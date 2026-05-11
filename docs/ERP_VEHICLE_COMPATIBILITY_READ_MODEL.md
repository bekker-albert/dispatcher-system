# Vehicle compatibility read model

Р”Р°С‚Р°: 2026-05-10
РЎС‚Р°С‚СѓСЃ: РїР»Р°РЅ, Р±РµР· РїРµСЂРµРєР»СЋС‡РµРЅРёСЏ production UI

## Р¦РµР»СЊ

РЎС‚Р°СЂС‹Р№ UI РґРѕР»Р¶РµРЅ РїСЂРѕРґРѕР»Р¶Р°С‚СЊ РїРѕР»СѓС‡Р°С‚СЊ `VehicleRow`, РґР°Р¶Рµ РµСЃР»Рё РґР°РЅРЅС‹Рµ РїРѕСЃС‚РµРїРµРЅРЅРѕ РїРµСЂРµРµР·Р¶Р°СЋС‚ РёР· legacy `vehicles.data` РІ `vehicle_cards` Рё СЃРІСЏР·Р°РЅРЅС‹Рµ С‚Р°Р±Р»РёС†С‹. Р­С‚Рѕ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ СЃР»РѕР№ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё РґР»СЏ РџРўРћ, РѕС‚С‡РµС‚РѕРІ, С‚РµС…РЅРёРєРё, Excel import/export Рё fleet view.

## РўРµРєСѓС‰РёР№ РєРѕРЅС‚СЂР°РєС‚ `VehicleRow`

РЎС‚Р°СЂС‹Рµ СЌРєСЂР°РЅС‹ РѕР¶РёРґР°СЋС‚ РїРѕР»СЏ:

- РїР°СЃРїРѕСЂС‚РЅС‹Рµ: `id`, `name`, `brand`, `model`, `plateNumber`, `garageNumber`, `vehicleType`, `equipmentType`, `manufactureYear`, `vin`;
- РЅРѕСЂРјС‹/С‚РёРї СЂР°СЃС‡РµС‚Р°: `fuelNormWinter`, `fuelNormSummer`, `fuelCalcType`;
- РїСЂРёРЅР°РґР»РµР¶РЅРѕСЃС‚СЊ/СѓС‡Р°СЃС‚РѕРє: `owner`, `contractor`, `area`, `location`;
- РїСЂРѕРёР·РІРѕРґСЃС‚РІРµРЅРЅС‹Р№ РєРѕРЅС‚РµРєСЃС‚: `workType`, `excavator`, `work`, `rent`, `repair`, `downtime`, `trips`;
- flags: `active`, `visible`.

Р­С‚РѕС‚ С„РѕСЂРјР°С‚ РЅРµР»СЊР·СЏ РјРµРЅСЏС‚СЊ РґРѕ РїРѕР»РЅРѕР№ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё.

## РљР°Рє СЃРѕР±СЂР°С‚СЊ `VehicleRow` РёР· РЅРѕРІРѕР№ РјРѕРґРµР»Рё

| `VehicleRow` РїРѕР»Рµ | РСЃС‚РѕС‡РЅРёРє РЅРѕРІРѕР№ РјРѕРґРµР»Рё | РџСЂР°РІРёР»Рѕ |
|---|---|---|
| `id` | `vehicle_cards.legacy_vehicle_id` РёР»Рё `vehicle_cards.vehicle_id` | РќР° РїРµСЂРµС…РѕРґРЅРѕРј СЌС‚Р°РїРµ РѕС‚РґР°РІР°С‚СЊ legacy id, РµСЃР»Рё РµСЃС‚СЊ. |
| `name` | computed from card | РЎС‚СЂРѕРёС‚СЊ РёР· `brand`, `model`, `garage_number`/`plate_number`; fallback `display_name`. |
| `brand` | `vehicle_cards.brand` | РџСЂСЏРјРѕРµ РїРѕР»Рµ. |
| `model` | `vehicle_cards.model` | РџСЂСЏРјРѕРµ РїРѕР»Рµ, nullable -> empty string. |
| `plateNumber` | `vehicle_cards.plate_number` | РџСЂСЏРјРѕРµ РїРѕР»Рµ, nullable -> empty string. |
| `garageNumber` | `vehicle_cards.garage_number` | РџСЂСЏРјРѕРµ РїРѕР»Рµ, nullable -> empty string. |
| `vehicleType` | `vehicle_cards.vehicle_type_code` | РџРѕРєР° РєРѕРґ/СЃС‚СЂРѕРєР°, РїРѕР·Р¶Рµ СЃРїСЂР°РІРѕС‡РЅРёРє. |
| `equipmentType` | `vehicle_cards.equipment_type_code` | РџРѕРєР° РєРѕРґ/СЃС‚СЂРѕРєР°, fallback `vehicleType`. |
| `manufactureYear` | `vehicle_cards.manufacture_year` | Nullable -> empty string. |
| `vin` | `vehicle_cards.vin` | Nullable -> empty string. |
| `fuelNormWinter` | `vehicle_cards.fuel_norm_winter` | Nullable -> 0. |
| `fuelNormSummer` | `vehicle_cards.fuel_norm_summer` | Nullable -> 0. |
| `fuelCalcType` | `vehicle_cards.fuel_calc_type` | Fallback current default `РњРѕС‚РѕС‡Р°СЃС‹`. |
| `active` | `vehicle_cards.active` and `lifecycle_status` | `active=false` if lifecycle archived/inactive. |
| `visible` | `vehicle_cards.visible` | Fallback true. |

## Р’СЂРµРјРµРЅРЅРѕРµ РїРѕР»СѓС‡РµРЅРёРµ СѓС‡Р°СЃС‚РєР°

Р”Рѕ production СЃРјРµРЅРЅС‹С… СЃРІРѕРґРѕРє Рё section assignments:

1. РќР°Р№С‚Рё Р°РєС‚РёРІРЅСѓСЋ СЃС‚СЂРѕРєСѓ `vehicle_section_history` РїРѕ `vehicle_id`, РіРґРµ `ended_at IS NULL`.
2. Р•СЃР»Рё Р°РєС‚РёРІРЅС‹С… РЅРµСЃРєРѕР»СЊРєРѕ, Р±СЂР°С‚СЊ РїРѕСЃР»РµРґРЅСЋСЋ РїРѕ `started_at DESC, history_id DESC`.
3. РџРѕРґС‚СЏРЅСѓС‚СЊ `sections.name` РёР»Рё legacy display name.
4. Р’РµСЂРЅСѓС‚СЊ:
   - `area = sections.name`;
   - `location = vehicle_status_history.reason/location`, РµСЃР»Рё РѕС‚РґРµР»СЊРЅРѕРµ РїРѕР»Рµ РїРѕСЏРІРёС‚СЃСЏ РїРѕР·Р¶Рµ, РёРЅР°С‡Рµ empty string.
5. Р•СЃР»Рё РёСЃС‚РѕСЂРёРё СѓС‡Р°СЃС‚РєР° РЅРµС‚, РІРµСЂРЅСѓС‚СЊ legacy `vehicles.data.area`, РїРѕРєР° legacy table РѕСЃС‚Р°РµС‚СЃСЏ РґРѕСЃС‚СѓРїРЅРѕР№.

Р”Р»СЏ dual-read compare РЅСѓР¶РЅРѕ РѕС‚РґРµР»СЊРЅРѕ С„РёРєСЃРёСЂРѕРІР°С‚СЊ:

- `legacyArea`;
- `readModelArea`;
- mismatch reason: `missing_section_history`, `section_name_diff`, `legacy_empty`.

## Р’СЂРµРјРµРЅРЅРѕРµ РїРѕР»СѓС‡РµРЅРёРµ owner/contractor

Р”Рѕ production РґРѕРіРѕРІРѕСЂРѕРІ:

1. РќР°Р№С‚Рё Р°РєС‚РёРІРЅС‹Р№ `vehicle_contract_links` РїРѕ `vehicle_id`, РіРґРµ `active=1` Рё `ended_at IS NULL`.
2. Р•СЃР»Рё `party_id/contract_id` РµС‰Рµ РЅРµ СЃРІСЏР·Р°РЅС‹, РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ:
   - `legacy_owner_name -> owner`;
   - `legacy_contractor_name -> contractor`.
3. Р•СЃР»Рё link РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚, Р±СЂР°С‚СЊ legacy `vehicles.data.owner` Рё `vehicles.data.contractor`.

Р’Р°Р¶РЅРѕ: СЌС‚РѕС‚ СЃР»РѕР№ РЅРµ Р·Р°РїСѓСЃРєР°РµС‚ РјРѕРґСѓР»СЊ РґРѕРіРѕРІРѕСЂРѕРІ. РћРЅ С‚РѕР»СЊРєРѕ СЃРѕС…СЂР°РЅСЏРµС‚ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚СЊ С‚РµРєСѓС‰РµР№ РєР°СЂС‚РѕС‡РєРё С‚РµС…РЅРёРєРё.

## Legacy-only РїРѕР»СЏ

РџРѕР»СЏ, РєРѕС‚РѕСЂС‹Рµ РЅРµР»СЊР·СЏ СЃС‡РёС‚Р°С‚СЊ master data РЅРѕРІРѕР№ ERP-РјРѕРґРµР»Рё:

- `name`: display/computed fallback;
- `workType`: РґРѕ СЃРјРµРЅРЅС‹С… СЃРІРѕРґРѕРє РѕСЃС‚Р°РµС‚СЃСЏ legacy-only;
- `excavator`: РґРѕ assignments/shift reports РѕСЃС‚Р°РµС‚СЃСЏ legacy-only;
- `work`, `rent`, `repair`, `downtime`, `trips`: РЅРµР»СЊР·СЏ РїРµСЂРµРЅРѕСЃРёС‚СЊ РІ `vehicle_cards` РєР°Рє РїРѕСЃС‚РѕСЏРЅРЅС‹Рµ СЃРІРѕР№СЃС‚РІР°;
- Р»СЋР±С‹Рµ UI-only СЃРѕСЂС‚РёСЂРѕРІРєРё/РІРёРґРёРјРѕСЃС‚СЊ СЃС‚Р°СЂРѕРіРѕ grid РґРѕ РѕС‚РґРµР»СЊРЅРѕРіРѕ UI state.

## РџРѕР»СЏ, РєРѕС‚РѕСЂС‹Рµ РЅРµР»СЊР·СЏ СѓРґР°Р»СЏС‚СЊ РґРѕ СЃРјРµРЅРЅС‹С… СЃРІРѕРґРѕРє

РќРµР»СЊР·СЏ СѓРґР°Р»СЏС‚СЊ РёР· `VehicleRow`:

- `area` - РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ С„РёР»СЊС‚СЂР°РјРё Рё РѕС‚С‡РµС‚Р°РјРё;
- `workType` - РЅСѓР¶РµРЅ С‚РµРєСѓС‰РёРј РґРёСЃРїРµС‚С‡РµСЂСЃРєРёРј/preview РїСЂРµРґСЃС‚Р°РІР»РµРЅРёСЏРј;
- `excavator` - РЅСѓР¶РµРЅ С‚РµРєСѓС‰РёРј СЃРІСЏР·РєР°Рј;
- `work`, `rent`, `repair`, `downtime`, `trips` - РёСЃРїРѕР»СЊР·СѓСЋС‚СЃСЏ fleet/summary UI РєР°Рє РїРµСЂРµС…РѕРґРЅС‹Рµ РїРѕРєР°Р·Р°С‚РµР»Рё;
- `owner`, `contractor` - РЅСѓР¶РЅС‹ С„РёР»СЊС‚СЂР°Рј, РѕС‚С‡РµС‚Р°Рј Рё С‚РµС…РЅРёРєРµ;
- `fuelNormWinter`, `fuelNormSummer`, `fuelCalcType` - РЅСѓР¶РЅС‹ Р±СѓРґСѓС‰РµРјСѓ С‚РѕРїР»РёРІСѓ, РЅРѕ СЃРµР№С‡Р°СЃ РѕСЃС‚Р°СЋС‚СЃСЏ РІ РєР°СЂС‚РѕС‡РєРµ.

## РЎСЂР°РІРЅРµРЅРёРµ legacy `vehicles.data` Рё РЅРѕРІРѕР№ read model

Dual-read checker РґРѕР»Р¶РµРЅ:

1. РџСЂРѕС‡РёС‚Р°С‚СЊ legacy rows РёР· `vehicles`.
2. РЎРѕР±СЂР°С‚СЊ compatibility rows РёР· `vehicle_cards` Рё СЃРІСЏР·Р°РЅРЅС‹С… С‚Р°Р±Р»РёС†.
3. РќРѕСЂРјР°Р»РёР·РѕРІР°С‚СЊ РѕР±Р° РЅР°Р±РѕСЂР° С‚РµРј Р¶Рµ `normalizeVehicleRow`.
4. РЎСЂР°РІРЅРёС‚СЊ:
   - row count;
   - ids;
   - `brand/model/plateNumber/garageNumber/vin`;
   - `area`;
   - `owner/contractor`;
   - `active/visible`;
   - production fields РєР°Рє legacy-only.
5. РџРѕСЃС‡РёС‚Р°С‚СЊ mismatch counts Рё РїСЂРёРјРµСЂС‹.
6. РќРµ РјРµРЅСЏС‚СЊ РёСЃС‚РѕС‡РЅРёРє РґР°РЅРЅС‹С… Рё РЅРµ РїРёСЃР°С‚СЊ diff РІ production tables.

Р Р°Р·СЂРµС€РµРЅРЅС‹Рµ mismatch РЅР° РїРµСЂРІРѕРј СЌС‚Р°РїРµ:

- `name`, РµСЃР»Рё РЅРѕРІР°СЏ РјРѕРґРµР»СЊ СЃС‚СЂРѕРёС‚ display РёРЅР°С‡Рµ;
- РїСѓСЃС‚РѕР№ `vin`;
- РїСѓСЃС‚РѕР№ `area`, РµСЃР»Рё section mapping РµС‰Рµ РЅРµ СѓС‚РІРµСЂР¶РґРµРЅ;
- `owner_party_id` absent РїСЂРё РЅР°Р»РёС‡РёРё legacy owner text.

## Dual-read С‚РѕР»СЊРєРѕ РІ dev/staging

Р’РєР»СЋС‡РµРЅРёРµ РґРѕР»Р¶РЅРѕ Р±С‹С‚СЊ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· server-side env flag, РЅР°РїСЂРёРјРµСЂ:

```text
ERP_VEHICLE_DUAL_READ_CHECK=true
ERP_VEHICLE_DUAL_READ_MODE=compare-only
```

РћРіСЂР°РЅРёС‡РµРЅРёСЏ:

- Р·Р°РїСЂРµС‰РµРЅРѕ РІРєР»СЋС‡Р°С‚СЊ РІ production Р±РµР· РѕС‚РґРµР»СЊРЅРѕРіРѕ release checklist;
- СЃСЂР°РІРЅРµРЅРёРµ РЅРµ РґРѕР»Р¶РЅРѕ Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ legacy UI;
- СЂРµР·СѓР»СЊС‚Р°С‚ РїРёСЃР°С‚СЊ РІ Р»РѕРі/РѕС‚С‡РµС‚, РЅРµ РІ `useAppStateBundle`;
- РЅРёРєР°РєРёС… automatic writes РІ `vehicle_cards` РёР· dual-read.

## Rollback

Rollback РїСЂРѕСЃС‚РѕР№, РїРѕРєР° UI РЅРµ РїРµСЂРµРєР»СЋС‡РµРЅ:

1. РћС‚РєР»СЋС‡РёС‚СЊ `ERP_VEHICLE_DUAL_READ_CHECK`.
2. РџСЂРѕРґРѕР»Р¶РёС‚СЊ С‡РёС‚Р°С‚СЊ legacy `vehicles` С‡РµСЂРµР· С‚РµРєСѓС‰РёР№ `/api/database` resource.
3. РќРµ СѓРґР°Р»СЏС‚СЊ `vehicle_cards` СЃСЂР°Р·Сѓ; РѕСЃС‚Р°РІРёС‚СЊ РґР»СЏ forensic compare.
4. Р•СЃР»Рё draft tables РјРµС€Р°СЋС‚ staging, СѓРґР°Р»РёС‚СЊ С‚РѕР»СЊРєРѕ РЅРѕРІС‹Рµ ERP core tables РїРѕ rollback section РёР· `docs/ERP_CORE_DRAFT_MIGRATIONS.md`.
5. РўРµРєСѓС‰РёР№ `vehicles` РѕСЃС‚Р°РµС‚СЃСЏ СЂР°Р±РѕС‡РёРј РёСЃС‚РѕС‡РЅРёРєРѕРј РґРѕ РїРѕР»РЅРѕРіРѕ acceptance.

## Acceptance РїРµСЂРµРґ РїРµСЂРµРєР»СЋС‡РµРЅРёРµРј UI

РџРµСЂРµРєР»СЋС‡Р°С‚СЊ UI РЅР° compatibility read model РјРѕР¶РЅРѕ С‚РѕР»СЊРєРѕ РµСЃР»Рё:

- backfill РїСЂРѕС€РµР» РЅР° staging;
- row count СЃРѕРІРїР°РґР°РµС‚;
- РІСЃРµ legacy ids РїСЂРµРґСЃС‚Р°РІР»РµРЅС‹;
- РЅРµС‚ РЅРµРѕР¶РёРґР°РЅРЅС‹С… СЂР°СЃС…РѕР¶РґРµРЅРёР№ РїРѕ brand/model/plate/garage;
- section mapping СѓС‚РІРµСЂР¶РґРµРЅ;
- РџРўРћ, РѕС‚С‡РµС‚С‹, С‚РµС…РЅРёРєР° Рё Excel import/export РїСЂРѕС€Р»Рё regression tests;
- РµСЃС‚СЊ rollback flag РЅР° legacy `vehicles`.
