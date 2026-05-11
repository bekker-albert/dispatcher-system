# Vehicle compatibility read model

Дата: 2026-05-10
Статус: план, без переключения production UI

## Цель

Старый UI должен продолжать получать `VehicleRow`, даже если данные постепенно переезжают из legacy `vehicles.data` в `vehicle_cards` и связанные таблицы. Это обязательный слой совместимости для ПТО, отчетов, техники, Excel import/export и fleet view.

## Текущий контракт `VehicleRow`

Старые экраны ожидают поля:

- паспортные: `id`, `name`, `brand`, `model`, `plateNumber`, `garageNumber`, `vehicleType`, `equipmentType`, `manufactureYear`, `vin`;
- нормы/тип расчета: `fuelNormWinter`, `fuelNormSummer`, `fuelCalcType`;
- принадлежность/участок: `owner`, `contractor`, `area`, `location`;
- производственный контекст: `workType`, `excavator`, `work`, `rent`, `repair`, `downtime`, `trips`;
- flags: `active`, `visible`.

Этот формат нельзя менять до полной совместимости.

## Как собрать `VehicleRow` из новой модели

| `VehicleRow` поле | Источник новой модели | Правило |
|---|---|---|
| `id` | `vehicle_cards.legacy_vehicle_id` или `vehicle_cards.vehicle_id` | На переходном этапе отдавать legacy id, если есть. |
| `name` | computed from card | Строить из `brand`, `model`, `garage_number`/`plate_number`; fallback `display_name`. |
| `brand` | `vehicle_cards.brand` | Прямое поле. |
| `model` | `vehicle_cards.model` | Прямое поле, nullable -> empty string. |
| `plateNumber` | `vehicle_cards.plate_number` | Прямое поле, nullable -> empty string. |
| `garageNumber` | `vehicle_cards.garage_number` | Прямое поле, nullable -> empty string. |
| `vehicleType` | `vehicle_cards.vehicle_type_code` | Пока код/строка, позже справочник. |
| `equipmentType` | `vehicle_cards.equipment_type_code` | Пока код/строка, fallback `vehicleType`. |
| `manufactureYear` | `vehicle_cards.manufacture_year` | Nullable -> empty string. |
| `vin` | `vehicle_cards.vin` | Nullable -> empty string. |
| `fuelNormWinter` | `vehicle_cards.fuel_norm_winter` | Nullable -> 0. |
| `fuelNormSummer` | `vehicle_cards.fuel_norm_summer` | Nullable -> 0. |
| `fuelCalcType` | `vehicle_cards.fuel_calc_type` | Fallback current default `Моточасы`. |
| `active` | `vehicle_cards.active` and `lifecycle_status` | `active=false` if lifecycle archived/inactive. |
| `visible` | `vehicle_cards.visible` | Fallback true. |

## Временное получение участка

До production сменных сводок и section assignments:

1. Найти активную строку `vehicle_section_history` по `vehicle_id`, где `ended_at IS NULL`.
2. Если активных несколько, брать последнюю по `started_at DESC, history_id DESC`.
3. Подтянуть `sections.name` или legacy display name.
4. Вернуть:
   - `area = sections.name`;
   - `location = vehicle_status_history.reason/location`, если отдельное поле появится позже, иначе empty string.
5. Если истории участка нет, вернуть legacy `vehicles.data.area`, пока legacy table остается доступной.

Для dual-read compare нужно отдельно фиксировать:

- `legacyArea`;
- `readModelArea`;
- mismatch reason: `missing_section_history`, `section_name_diff`, `legacy_empty`.

## Временное получение owner/contractor

До production договоров:

1. Найти активный `vehicle_contract_links` по `vehicle_id`, где `active=1` и `ended_at IS NULL`.
2. Если `party_id/contract_id` еще не связаны, использовать:
   - `legacy_owner_name -> owner`;
   - `legacy_contractor_name -> contractor`.
3. Если link отсутствует, брать legacy `vehicles.data.owner` и `vehicles.data.contractor`.

Важно: этот слой не запускает модуль договоров. Он только сохраняет совместимость текущей карточки техники.

## Legacy-only поля

Поля, которые нельзя считать master data новой ERP-модели:

- `name`: display/computed fallback;
- `workType`: до сменных сводок остается legacy-only;
- `excavator`: до assignments/shift reports остается legacy-only;
- `work`, `rent`, `repair`, `downtime`, `trips`: нельзя переносить в `vehicle_cards` как постоянные свойства;
- любые UI-only сортировки/видимость старого grid до отдельного UI state.

## Поля, которые нельзя удалять до сменных сводок

Нельзя удалять из `VehicleRow`:

- `area` - используется фильтрами и отчетами;
- `workType` - нужен текущим диспетчерским/preview представлениям;
- `excavator` - нужен текущим связкам;
- `work`, `rent`, `repair`, `downtime`, `trips` - используются fleet/summary UI как переходные показатели;
- `owner`, `contractor` - нужны фильтрам, отчетам и технике;
- `fuelNormWinter`, `fuelNormSummer`, `fuelCalcType` - нужны будущему топливу, но сейчас остаются в карточке.

## Сравнение legacy `vehicles.data` и новой read model

Dual-read checker должен:

1. Прочитать legacy rows из `vehicles`.
2. Собрать compatibility rows из `vehicle_cards` и связанных таблиц.
3. Нормализовать оба набора тем же `normalizeVehicleRow`.
4. Сравнить:
   - row count;
   - ids;
   - `brand/model/plateNumber/garageNumber/vin`;
   - `area`;
   - `owner/contractor`;
   - `active/visible`;
   - production fields как legacy-only.
5. Посчитать mismatch counts и примеры.
6. Не менять источник данных и не писать diff в production tables.

Разрешенные mismatch на первом этапе:

- `name`, если новая модель строит display иначе;
- пустой `vin`;
- пустой `area`, если section mapping еще не утвержден;
- `owner_party_id` absent при наличии legacy owner text.

## Dual-read только в dev/staging

Включение должно быть только через server-side env flag, например:

```text
ERP_VEHICLE_DUAL_READ_CHECK=true
ERP_VEHICLE_DUAL_READ_MODE=compare-only
```

Ограничения:

- запрещено включать в production без отдельного release checklist;
- сравнение не должно блокировать legacy UI;
- результат писать в лог/отчет, не в `useAppStateBundle`;
- никаких automatic writes в `vehicle_cards` из dual-read.

## Rollback

Rollback простой, пока UI не переключен:

1. Отключить `ERP_VEHICLE_DUAL_READ_CHECK`.
2. Продолжить читать legacy `vehicles` через текущий `/api/database` resource.
3. Не удалять `vehicle_cards` сразу; оставить для forensic compare.
4. Если draft tables мешают staging, удалить только новые ERP core tables по rollback section из `docs/ERP_CORE_DRAFT_MIGRATIONS.md`.
5. Текущий `vehicles` остается рабочим источником до полного acceptance.

## Acceptance перед переключением UI

Переключать UI на compatibility read model можно только если:

- backfill прошел на staging;
- row count совпадает;
- все legacy ids представлены;
- нет неожиданных расхождений по brand/model/plate/garage;
- section mapping утвержден;
- ПТО, отчеты, техника и Excel import/export прошли regression tests;
- есть rollback flag на legacy `vehicles`.
