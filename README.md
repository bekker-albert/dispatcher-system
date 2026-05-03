# Dispatcher System

Рабочая диспетчерская система на Next.js.

## Локальный запуск

```bash
npm install
npm run dev
```

Открыть локально:

```text
http://localhost:3000
```

Для обычной работы на этом компьютере можно запускать `start-local-server.cmd`: он откроет уже запущенный локальный сервер или стартует свободный порт, начиная с `3011`.

## Проверка перед сохранением

```bash
npm run verify
```

Команда выполняет:

- `npm run lint`
- `npm run build`
- `npm run check:domain`
- `npm run check:project`

## База данных

Production использует серверную MySQL-базу через Next.js API route `/api/database`.
Пароль хранится только в `.env.local` на сервере и не должен попадать в Git.

```bash
NEXT_PUBLIC_DATA_PROVIDER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aam_dispatch
DB_USER=dispatcher_ad
DB_PASSWORD=
DATABASE_ALLOWED_ORIGINS=
```

Таблицы создаются автоматически при первом обращении к базе, если пользователь MySQL имеет права внутри своей базы.

## Деплой

Деплой идет через GitHub Actions после push в `main`.

На сервере workflow:

1. подключается по SSH;
2. обновляет код до `origin/main`;
3. устанавливает зависимости;
4. собирает проект;
5. перезапускает `pm2`-процесс `aam-dispatch`.

Рабочий сайт:

```text
https://aam-dispatch.kz
```

## Архитектурное правило

Новые тяжелые вкладки не добавлять напрямую в `app/page.tsx`.

Правильный порядок:

1. отдельный модуль в `features/<section>`;
2. доменная логика в `lib/domain`;
3. сохранение через нейтральный слой `lib/data`;
4. серверная работа с MySQL через `lib/server/mysql`;
5. тяжелые таблицы открывать в режиме просмотра, редактирование включать отдельно.
