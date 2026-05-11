# ERP access matrix server plan

Дата: 2026-05-10
Статус: технический план, без подключения live handlers

## Цель

Сделать server-side authorization слоем ERP, а текущие tab permissions оставить только legacy navigation layer. Все будущие module handlers должны проходить проверку пользователя, роли, участка, модуля и действия внутри единого `/api/database`.

## Текущий вход пользователя

Текущий серверный поток уже опирается на session cookie:

1. Browser отправляет запрос к `/api/database`.
2. Server читает cookie `aam_dispatch_session`.
3. Session проверяется через `lib/server/auth/session`.
4. User загружается через auth слой.
5. `authorizeDatabaseRequest` принимает текущего `AuthUser` и resource/action/payload.

Этот поток нужно сохранить. Новая ERP-матрица должна быть дополнительным server-side слоем, а не заменой session/auth.

## Legacy navigation layer

`tab_permissions` остаются:

- для показа/скрытия верхних вкладок;
- для базовой совместимости текущих `pto`, `vehicles`, `reports`, `admin`;
- для старых экранов до миграции.

`tab_permissions` не считать ERP authorization. Они не знают `section_id`, workflow status, approve/close/import/admin actions и entity scope.

## ERP authorization layer

Проверка должна принимать:

| Поле | Источник |
|---|---|
| `user_id` | session user |
| `role` / `role_id` | `erp_user_roles` + legacy role bridge |
| `section_id` | payload/query/entity scope |
| `module` | database resource/contract module id |
| `action` | normalized ERP action |
| `entity_id` | payload id для update/delete/approve/close |
| `entity_version` | expected version для write |
| `workflow_status` | detail read или payload context |

ERP actions:

- `read`;
- `create`;
- `update`;
- `delete`;
- `approve`;
- `close`;
- `export`;
- `import`;
- `admin`.

## Проверка module/action/section_id

Алгоритм:

1. Нормализовать request resource/action в `module` и ERP `action`.
2. Определить, требует ли module section scope.
3. Извлечь `section_id` из payload:
   - `section_id`;
   - `sectionId`;
   - `scope.section_id`;
   - `scope.sectionId`;
   - `query.filters.section_id`;
   - entity detail, если action по id.
4. Если module section-scoped и `section_id` отсутствует, вернуть deny.
5. Загрузить effective permissions:
   - роли пользователя;
   - индивидуальные allow/deny;
   - section scope;
   - active date windows.
6. Deny имеет приоритет над allow.
7. Вернуть decision object:
   - `allowed`;
   - `reasonCode`;
   - `reason`;
   - `requiredAction`;
   - `module`;
   - `sectionId`;
   - `matchedRoleIds`;
   - `matchedPermissionIds`.

## Audit-friendly deny/allow

Результат проверки должен быть пригоден для audit и диагностики:

```ts
type ErpAccessDecision = {
  allowed: boolean;
  reasonCode:
    | "allowed_by_role"
    | "allowed_by_user_override"
    | "denied_by_user_override"
    | "missing_session"
    | "missing_section_scope"
    | "missing_module_permission"
    | "inactive_user"
    | "unsupported_action";
  reason: string;
  userId: string;
  module: string;
  action: "read" | "create" | "update" | "delete" | "approve" | "close" | "export" | "import" | "admin";
  sectionId?: string;
};
```

Не нужно писать audit entry на каждый read по умолчанию. Но write/admin/import/export/deny для sensitive actions должны иметь audit или security log.

## Таблицы

Минимальный набор описан в `docs/ERP_CORE_DRAFT_MIGRATIONS.md`:

- `erp_roles`;
- `erp_user_roles`;
- `erp_role_permissions`;
- `erp_user_permissions`;
- `erp_user_section_scope`;
- `erp_access_audit`;
- `sections`.

## Интеграция с `/api/database`

Все будущие handlers подключаются так:

1. `/api/database` принимает `{ resource, action, payload }`.
2. Router определяет legacy или module action.
3. До handler execution вызывается server-side ERP access check.
4. Handler получает только уже проверенный context:
   - user;
   - decision;
   - normalized scope;
   - query policy;
   - expected version policy.
5. Handler пишет audit для create/update/delete/approve/close/import/export/admin.

Нельзя подключать handler, если нет:

- access policy для module/action;
- query policy для list/detail;
- expected version или workflow guard для write;
- audit policy для write/admin/import/export;
- тестов на allow/deny;
- rollback plan.

## Какие handlers нельзя подключать без access check

Нельзя переводить в live:

- `mining-shift-reports`;
- `mining-operational-accounting`;
- `vehicle-core`;
- `sections`;
- `access-matrix`;
- `taxation-waybills`;
- `taxation-fuel-periods`;
- `smts-vehicle-cards`;
- `smts-fuel-drains`;
- `fleet-movements`;
- любые import/export handlers.

Для текущих legacy ресурсов (`pto`, `vehicles`, `settings`, `app-state`) server checks остаются как есть до отдельной миграции, но новые ERP endpoints внутри `/api/database` должны идти только через ERP matrix.

## Bridge с текущими ролями

Переходный bridge:

| Legacy role | ERP bootstrap mapping |
|---|---|
| `dispatch-chief` | role `erp_dispatch_chief`, full read/update/admin on current sections until explicit scopes exist |
| `admin` | role `erp_admin`, admin/access rights |
| `dispatcher` | role `erp_dispatcher`, read/update только по назначенным sections |

Bridge нужен только до заполнения `erp_user_roles`. После этого legacy role остается для навигации и bootstrap fallback.

## Guardrails

- Не добавлять ERP permissions arrays в `useAppStateBundle`.
- Не хранить матрицу прав в `localStorage`.
- Не делать authorize на клиенте.
- Не создавать `app/api/access` или другие module routes.
- Не подключать live handlers при пустых `module`, `action`, `section_id` policies.
- Не считать `AdminAccessMatrixSection` production authorization UI до live server-side handlers.

## Acceptance

Серверную матрицу можно считать готовой к первому live handler только если:

- есть таблицы и seed ролей в staging;
- есть allow/deny тесты на каждое action;
- есть section scope tests;
- есть audit для изменения прав;
- legacy superuser bridge протестирован;
- `/api/database` возвращает consistent 403 с reasonCode;
- planned handlers остаются planned-only до прохождения checklist.
