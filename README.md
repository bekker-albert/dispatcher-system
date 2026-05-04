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

Release gate before push:

```bash
npm run release:check
```

This also checks whitespace in the current diff and shows whether local env
files are ignored. The command now fails if any repo-root `.env*` file except
`.env.example` is tracked or stops being ignored. Do not print or commit values
from `.env.local`.

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

## AI-ассистент

Главная вкладка `AI-ассистент` подключена как отдельный feature-модуль.

Внешние AI, WhatsApp, Documentolog, почтовые, календарные и push-интеграции должны подключаться только через серверный слой. Клиентские React-компоненты не должны читать provider-ключи, импортировать SDK внешних сервисов или отправлять запросы напрямую во внешние API.

Начальная версия содержит каркас данных, прав, задач, уведомлений, интеграций, базы знаний и журнала действий. Реальные записи в базе и внешние отправки добавляются отдельными этапами после схемы, прав доступа и серверных обработчиков.

Основной интерфейс общения находится в общем всплывающем AI-виджете в правом нижнем углу сайта. В этом же виджете открываются уведомления: заголовок меняется на `AI-ассистент` или `Уведомления`, поэтому панели не накладываются друг на друга. Нажатие на уведомление открывает `AI-ассистент -> Задачи`. В `Планировщике` можно заранее указать дату, время, получателя, канал, подготовленный текст и необходимость согласования перед выполнением.

## Деплой

Деплой идет через GitHub Actions после push в `main`.

На сервере workflow:

1. подключается по SSH;
2. проверяет и фиксирует нужный commit;
3. устанавливает production-зависимости через `npm ci --omit=dev`;
4. подменяет `.next` заранее собранным артефактом из GitHub Actions;
5. перезапускает `pm2`-процесс `aam-dispatch`;
6. запускает smoke-проверку сайта, статуса базы и загрузки техники без записи данных.

Required GitHub Actions secrets:

- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`

Optional smoke overrides:

- `PRODUCTION_SMOKE_URL`
- `PRODUCTION_SMOKE_API_URL`
- `PRODUCTION_SMOKE_MIN_VEHICLE_ROWS`

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
