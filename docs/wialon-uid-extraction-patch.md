# Wialon UID / IMEI extraction

P128 in Wialon:

- Уникальный ID / IMEI: `867236070838513`
- Телефонный номер: `+77064674983`
- Тип устройства: `Wialon Retranslator`

Это значит, что объект Wialon заполнен корректно. Если сайт показывает `UID не получен из API`, проблема в обработчике ответа Wialon.

## Что нужно поправить

Файл:

`lib/server/wialon/client.ts`

Сейчас UID берется слишком узко:

```ts
const uniqueId = asString(unit.uid || unit.hw || unit.ph);
```

Нужно искать уникальный ID шире:

```ts
const props = asRecord(unit.prp);
const config = asRecord(unit.cnm);
const uniqueId = firstString(
  unit.uid,
  unit.hw,
  unit.hw_id,
  unit.hwId,
  unit.device_id,
  unit.deviceId,
  unit.unique_id,
  unit.uniqueId,
  unit.imei,
  props.uid,
  props.hw,
  props.hw_id,
  props.device_id,
  props.unique_id,
  props.imei,
  config.uid,
  config.hw,
  config.device_id,
  config.unique_id,
  config.imei,
);
```

Также телефон нужно брать не только из `unit.ph`:

```ts
const phone = firstString(
  unit.ph,
  unit.phone,
  props.ph,
  props.phone,
  config.ph,
  config.phone,
);
```

Добавить helper:

```ts
function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}
```

## Дополнительно

Для Wialon Retranslator может потребоваться увеличить flags в `core/search_items`, чтобы Wialon отдал свойства объекта:

```ts
const wialonUnitFlags = 1295;
```

После правки нужно:

1. Дождаться деплоя.
2. Открыть `Админка → Wialon Local`.
3. Нажать `Загрузить технику`.
4. Проверить P128: UID должен стать `867236070838513`, SIM — `+77064674983`.
