# ERP access matrix server plan

Р”Р°С‚Р°: 2026-05-10
РЎС‚Р°С‚СѓСЃ: С‚РµС…РЅРёС‡РµСЃРєРёР№ РїР»Р°РЅ, Р±РµР· РїРѕРґРєР»СЋС‡РµРЅРёСЏ live handlers

## Р¦РµР»СЊ

РЎРґРµР»Р°С‚СЊ server-side authorization СЃР»РѕРµРј ERP, Р° С‚РµРєСѓС‰РёРµ tab permissions РѕСЃС‚Р°РІРёС‚СЊ С‚РѕР»СЊРєРѕ legacy navigation layer. Р’СЃРµ Р±СѓРґСѓС‰РёРµ module handlers РґРѕР»Р¶РЅС‹ РїСЂРѕС…РѕРґРёС‚СЊ РїСЂРѕРІРµСЂРєСѓ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ, СЂРѕР»Рё, СѓС‡Р°СЃС‚РєР°, РјРѕРґСѓР»СЏ Рё РґРµР№СЃС‚РІРёСЏ РІРЅСѓС‚СЂРё РµРґРёРЅРѕРіРѕ `/api/database`.

## РўРµРєСѓС‰РёР№ РІС…РѕРґ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ

РўРµРєСѓС‰РёР№ СЃРµСЂРІРµСЂРЅС‹Р№ РїРѕС‚РѕРє СѓР¶Рµ РѕРїРёСЂР°РµС‚СЃСЏ РЅР° session cookie:

1. Browser РѕС‚РїСЂР°РІР»СЏРµС‚ Р·Р°РїСЂРѕСЃ Рє `/api/database`.
2. Server С‡РёС‚Р°РµС‚ cookie `aam_dispatch_session`.
3. Session РїСЂРѕРІРµСЂСЏРµС‚СЃСЏ С‡РµСЂРµР· `lib/server/auth/session`.
4. User Р·Р°РіСЂСѓР¶Р°РµС‚СЃСЏ С‡РµСЂРµР· auth СЃР»РѕР№.
5. `authorizeDatabaseRequest` РїСЂРёРЅРёРјР°РµС‚ С‚РµРєСѓС‰РµРіРѕ `AuthUser` Рё resource/action/payload.

Р­С‚РѕС‚ РїРѕС‚РѕРє РЅСѓР¶РЅРѕ СЃРѕС…СЂР°РЅРёС‚СЊ. РќРѕРІР°СЏ ERP-РјР°С‚СЂРёС†Р° РґРѕР»Р¶РЅР° Р±С‹С‚СЊ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рј server-side СЃР»РѕРµРј, Р° РЅРµ Р·Р°РјРµРЅРѕР№ session/auth.

## Legacy navigation layer

`tab_permissions` РѕСЃС‚Р°СЋС‚СЃСЏ:

- РґР»СЏ РїРѕРєР°Р·Р°/СЃРєСЂС‹С‚РёСЏ РІРµСЂС…РЅРёС… РІРєР»Р°РґРѕРє;
- РґР»СЏ Р±Р°Р·РѕРІРѕР№ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё С‚РµРєСѓС‰РёС… `pto`, `vehicles`, `reports`, `admin`;
- РґР»СЏ СЃС‚Р°СЂС‹С… СЌРєСЂР°РЅРѕРІ РґРѕ РјРёРіСЂР°С†РёРё.

`tab_permissions` РЅРµ СЃС‡РёС‚Р°С‚СЊ ERP authorization. РћРЅРё РЅРµ Р·РЅР°СЋС‚ `section_id`, workflow status, approve/close/import/admin actions Рё entity scope.

## ERP authorization layer

РџСЂРѕРІРµСЂРєР° РґРѕР»Р¶РЅР° РїСЂРёРЅРёРјР°С‚СЊ:

| РџРѕР»Рµ | РСЃС‚РѕС‡РЅРёРє |
|---|---|
| `user_id` | session user |
| `role` / `role_id` | `erp_user_roles` + legacy role bridge |
| `section_id` | payload/query/entity scope |
| `module` | database resource/contract module id |
| `action` | normalized ERP action |
| `entity_id` | payload id РґР»СЏ update/delete/approve/close |
| `entity_version` | expected version РґР»СЏ write |
| `workflow_status` | detail read РёР»Рё payload context |

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

## РџСЂРѕРІРµСЂРєР° module/action/section_id

РђР»РіРѕСЂРёС‚Рј:

1. РќРѕСЂРјР°Р»РёР·РѕРІР°С‚СЊ request resource/action РІ `module` Рё ERP `action`.
2. РћРїСЂРµРґРµР»РёС‚СЊ, С‚СЂРµР±СѓРµС‚ Р»Рё module section scope.
3. РР·РІР»РµС‡СЊ `section_id` РёР· payload:
   - `section_id`;
   - `sectionId`;
   - `scope.section_id`;
   - `scope.sectionId`;
   - `query.filters.section_id`;
   - entity detail, РµСЃР»Рё action РїРѕ id.
4. Р•СЃР»Рё module section-scoped Рё `section_id` РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚, РІРµСЂРЅСѓС‚СЊ deny.
5. Р—Р°РіСЂСѓР·РёС‚СЊ effective permissions:
   - СЂРѕР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ;
   - РёРЅРґРёРІРёРґСѓР°Р»СЊРЅС‹Рµ allow/deny;
   - section scope;
   - active date windows.
6. Deny РёРјРµРµС‚ РїСЂРёРѕСЂРёС‚РµС‚ РЅР°Рґ allow.
7. Р’РµСЂРЅСѓС‚СЊ decision object:
   - `allowed`;
   - `reasonCode`;
   - `reason`;
   - `requiredAction`;
   - `module`;
   - `sectionId`;
   - `matchedRoleIds`;
   - `matchedPermissionIds`.

## Audit-friendly deny/allow

Р РµР·СѓР»СЊС‚Р°С‚ РїСЂРѕРІРµСЂРєРё РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РїСЂРёРіРѕРґРµРЅ РґР»СЏ audit Рё РґРёР°РіРЅРѕСЃС‚РёРєРё:

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

РќРµ РЅСѓР¶РЅРѕ РїРёСЃР°С‚СЊ audit entry РЅР° РєР°Р¶РґС‹Р№ read РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ. РќРѕ write/admin/import/export/deny РґР»СЏ sensitive actions РґРѕР»Р¶РЅС‹ РёРјРµС‚СЊ audit РёР»Рё security log.

## РўР°Р±Р»РёС†С‹

РњРёРЅРёРјР°Р»СЊРЅС‹Р№ РЅР°Р±РѕСЂ РѕРїРёСЃР°РЅ РІ `docs/ERP_CORE_DRAFT_MIGRATIONS.md`:

- `erp_roles`;
- `erp_user_roles`;
- `erp_role_permissions`;
- `erp_user_permissions`;
- `erp_user_section_scope`;
- `erp_access_audit`;
- `sections`.

## РРЅС‚РµРіСЂР°С†РёСЏ СЃ `/api/database`

Р’СЃРµ Р±СѓРґСѓС‰РёРµ handlers РїРѕРґРєР»СЋС‡Р°СЋС‚СЃСЏ С‚Р°Рє:

1. `/api/database` РїСЂРёРЅРёРјР°РµС‚ `{ resource, action, payload }`.
2. Router РѕРїСЂРµРґРµР»СЏРµС‚ legacy РёР»Рё module action.
3. Р”Рѕ handler execution РІС‹Р·С‹РІР°РµС‚СЃСЏ server-side ERP access check.
4. Handler РїРѕР»СѓС‡Р°РµС‚ С‚РѕР»СЊРєРѕ СѓР¶Рµ РїСЂРѕРІРµСЂРµРЅРЅС‹Р№ context:
   - user;
   - decision;
   - normalized scope;
   - query policy;
   - expected version policy.
5. Handler РїРёС€РµС‚ audit РґР»СЏ create/update/delete/approve/close/import/export/admin.

РќРµР»СЊР·СЏ РїРѕРґРєР»СЋС‡Р°С‚СЊ handler, РµСЃР»Рё РЅРµС‚:

- access policy РґР»СЏ module/action;
- query policy РґР»СЏ list/detail;
- expected version РёР»Рё workflow guard РґР»СЏ write;
- audit policy РґР»СЏ write/admin/import/export;
- С‚РµСЃС‚РѕРІ РЅР° allow/deny;
- rollback plan.

## РљР°РєРёРµ handlers РЅРµР»СЊР·СЏ РїРѕРґРєР»СЋС‡Р°С‚СЊ Р±РµР· access check

РќРµР»СЊР·СЏ РїРµСЂРµРІРѕРґРёС‚СЊ РІ live:

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
- Р»СЋР±С‹Рµ import/export handlers.

Р”Р»СЏ С‚РµРєСѓС‰РёС… legacy СЂРµСЃСѓСЂСЃРѕРІ (`pto`, `vehicles`, `settings`, `app-state`) server checks РѕСЃС‚Р°СЋС‚СЃСЏ РєР°Рє РµСЃС‚СЊ РґРѕ РѕС‚РґРµР»СЊРЅРѕР№ РјРёРіСЂР°С†РёРё, РЅРѕ РЅРѕРІС‹Рµ ERP endpoints РІРЅСѓС‚СЂРё `/api/database` РґРѕР»Р¶РЅС‹ РёРґС‚Рё С‚РѕР»СЊРєРѕ С‡РµСЂРµР· ERP matrix.

## Bridge СЃ С‚РµРєСѓС‰РёРјРё СЂРѕР»СЏРјРё

РџРµСЂРµС…РѕРґРЅС‹Р№ bridge:

| Legacy role | ERP bootstrap mapping |
|---|---|
| `dispatch-chief` | role `erp_dispatch_chief`, full read/update/admin on current sections until explicit scopes exist |
| `admin` | role `erp_admin`, admin/access rights |
| `dispatcher` | role `erp_dispatcher`, read/update С‚РѕР»СЊРєРѕ РїРѕ РЅР°Р·РЅР°С‡РµРЅРЅС‹Рј sections |

Bridge РЅСѓР¶РµРЅ С‚РѕР»СЊРєРѕ РґРѕ Р·Р°РїРѕР»РЅРµРЅРёСЏ `erp_user_roles`. РџРѕСЃР»Рµ СЌС‚РѕРіРѕ legacy role РѕСЃС‚Р°РµС‚СЃСЏ РґР»СЏ РЅР°РІРёРіР°С†РёРё Рё bootstrap fallback.

## Guardrails

- РќРµ РґРѕР±Р°РІР»СЏС‚СЊ ERP permissions arrays РІ `useAppStateBundle`.
- РќРµ С…СЂР°РЅРёС‚СЊ РјР°С‚СЂРёС†Сѓ РїСЂР°РІ РІ `localStorage`.
- РќРµ РґРµР»Р°С‚СЊ authorize РЅР° РєР»РёРµРЅС‚Рµ.
- РќРµ СЃРѕР·РґР°РІР°С‚СЊ `app/api/access` РёР»Рё РґСЂСѓРіРёРµ module routes.
- РќРµ РїРѕРґРєР»СЋС‡Р°С‚СЊ live handlers РїСЂРё РїСѓСЃС‚С‹С… `module`, `action`, `section_id` policies.
- РќРµ СЃС‡РёС‚Р°С‚СЊ `AdminAccessMatrixSection` production authorization UI РґРѕ live server-side handlers.

## Acceptance

РЎРµСЂРІРµСЂРЅСѓСЋ РјР°С‚СЂРёС†Сѓ РјРѕР¶РЅРѕ СЃС‡РёС‚Р°С‚СЊ РіРѕС‚РѕРІРѕР№ Рє РїРµСЂРІРѕРјСѓ live handler С‚РѕР»СЊРєРѕ РµСЃР»Рё:

- РµСЃС‚СЊ С‚Р°Р±Р»РёС†С‹ Рё seed СЂРѕР»РµР№ РІ staging;
- РµСЃС‚СЊ allow/deny С‚РµСЃС‚С‹ РЅР° РєР°Р¶РґРѕРµ action;
- РµСЃС‚СЊ section scope tests;
- РµСЃС‚СЊ audit РґР»СЏ РёР·РјРµРЅРµРЅРёСЏ РїСЂР°РІ;
- legacy superuser bridge РїСЂРѕС‚РµСЃС‚РёСЂРѕРІР°РЅ;
- `/api/database` РІРѕР·РІСЂР°С‰Р°РµС‚ consistent 403 СЃ reasonCode;
- planned handlers РѕСЃС‚Р°СЋС‚СЃСЏ planned-only РґРѕ РїСЂРѕС…РѕР¶РґРµРЅРёСЏ checklist.
