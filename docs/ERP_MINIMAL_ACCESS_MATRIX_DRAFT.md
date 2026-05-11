# ERP minimal access matrix draft

Status: draft only. This document is not connected to runtime authorization. Current tab permissions remain a legacy navigation layer and must not be treated as ERP authorization.

## Actions

ERP server-side actions:

- `read`
- `create`
- `update`
- `delete`
- `approve`
- `close`
- `export`
- `import`
- `admin`

## Modules

ERP modules:

- `vehicles`
- `sections`
- `users`
- `access-matrix`
- `dispatch`
- `daily-reports`
- `pto`
- `reports`
- `gps`
- `fuel`
- `contracts`
- `repairs`
- `safety`
- `ai-assistant`
- `admin`

## Draft role intent

| Role | Intended scope | Draft permissions |
|---|---|---|
| `dispatch-chief` | Dispatch leadership across sections. | read/create/update/approve/close/export for dispatch, reports, daily-reports, vehicles, sections; read PTO. |
| `admin` | Technical and functional administration. | admin across users, access-matrix, admin; read/export operational modules; no silent production data rewrite. |
| `mountain-dispatcher` | Operational dispatch by section. | read/create/update for dispatch and daily-reports inside assigned section scope. |
| `dispatcher-taxer` | Dispatch tax/accounting operator. | read/update/export for dispatch, reports, daily-reports inside assigned section scope. |
| `senior-dispatcher-taxer` | Senior dispatch tax/accounting operator. | read/create/update/approve/export for dispatch, reports, daily-reports inside assigned section scope. |
| `pto` | Planning and PTO fact reconciliation. | read/create/update/import/export for PTO; read reports and sections. |
| `safety-specialist` | Safety and driving control. | read/create/update/export for safety; read vehicles and users in scope. |
| `gps-specialist` | GPS reconciliation and monitoring. | read/create/update/export for gps; read vehicles and sections. |
| `section-chief` | Section owner. | read/approve/close/export for assigned section reports and dispatch data. |
| `section-foreman` | Shift/site foreman. | read/create/update for assigned section dispatch facts. |
| `viewer` | Read-only observer. | read only for explicitly assigned modules and sections. |

## Draft module matrix

| Role | vehicles | sections | users | access-matrix | dispatch | daily-reports | pto | reports | gps | fuel | contracts | repairs | safety | ai-assistant | admin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `dispatch-chief` | read/export | read/export | read | read | read/create/update/approve/close/export | read/create/update/approve/close/export | read | read/export | read | read | read | read | read | read | read |
| `admin` | read/export | read/export | read/create/update/admin | read/create/update/admin | read/export | read/export | read/export | read/export | read/export | read/export | read/export | read/export | read/export | read/admin | admin |
| `mountain-dispatcher` | read | read | none | none | read/create/update | read/create/update | read | read | none | none | none | none | none | none | none |
| `dispatcher-taxer` | read | read | none | none | read/update/export | read/update/export | read | read/export | none | none | none | none | none | none | none |
| `senior-dispatcher-taxer` | read | read | none | none | read/create/update/approve/export | read/create/update/approve/export | read | read/export | none | none | none | none | none | none | none |
| `pto` | read | read | none | none | read | read | read/create/update/import/export | read/export | none | none | none | none | none | none | none |
| `safety-specialist` | read | read | read | none | read | read | none | read | none | none | none | none | read/create/update/export | none | none |
| `gps-specialist` | read | read | none | none | read | read | none | read | read/create/update/export | none | none | none | none | none | none |
| `section-chief` | read | read | read | none | read/approve/close/export | read/approve/close/export | read | read/export | read | read | read | read | read | none | none |
| `section-foreman` | read | read | none | none | read/create/update | read/create/update | read | read | none | none | none | read | read | none | none |
| `viewer` | read | read | none | none | read | read | read | read | read | read | read | read | read | none | none |

## Server-side rule

Future checks must evaluate:

- authenticated user from the session cookie;
- role and explicit user grants;
- `section_id` scope;
- module;
- action;
- audit-friendly allow/deny reason.

This draft must not be imported into authorization runtime. The actual ERP authorization layer should be implemented later through `/api/database` handlers with access, query, and audit policy tests.
