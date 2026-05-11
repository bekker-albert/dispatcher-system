# Stage 1 stabilization report

Р”Р°С‚Р°: 2026-05-10
РџСЂРѕРµРєС‚: `dispatcher-system`
РћР±Р»Р°СЃС‚СЊ: Р­С‚Р°Рї 1 РёР· `docs/ERP_IMPLEMENTATION_PLAN.md`

## РљСЂР°С‚РєРёР№ РІС‹РІРѕРґ

РўРµРєСѓС‰РёР№ СЃР°Р№С‚ СѓР¶Рµ РёРјРµРµС‚ СЂР°Р±РѕС‡РёР№ production data path С‡РµСЂРµР· РµРґРёРЅС‹Р№ `/api/database` Рё MySQL. Supabase Рё browser storage РѕСЃС‚Р°СЋС‚СЃСЏ РєР°Рє fallback/recovery СЃР»РѕРё, РЅРѕ РЅРµ РґРѕР»Р¶РЅС‹ СЃС‡РёС‚Р°С‚СЊСЃСЏ ERP source of truth. Р’ СЌС‚РѕРј СЃРїСЂРёРЅС‚Рµ РЅРµ РјРµРЅСЏР»РёСЃСЊ СЂР°Р±РѕС‡РёРµ С„РѕСЂРјР°С‚С‹ РџРўРћ, РѕС‚С‡РµС‚РѕРІ Рё С‚РµС…РЅРёРєРё; РґРѕР±Р°РІР»РµРЅС‹ С‚РѕР»СЊРєРѕ guardrails РІРѕРєСЂСѓРі Р°РґРјРёРЅСЃРєРѕРіРѕ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ browser snapshot Рё РІРёРґРёРјРѕСЃС‚СЊ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµРіРѕ СЌРєСЂР°РЅР° Р±Р°Р·С‹.

## Р§С‚Рѕ РїСЂРѕРІРµСЂРµРЅРѕ

| Р—РѕРЅР° | РџСЂРѕРІРµСЂРµРЅРЅС‹Рµ С„Р°Р№Р»С‹ | Р’С‹РІРѕРґ |
|---|---|---|
| Production data source | `.env.example`, `lib/supabase/config.ts`, `lib/data/config.ts`, `app/api/database/route.ts`, `lib/server/database/router.ts` | MySQL РІС‹Р±СЂР°РЅ РѕСЃРЅРѕРІРЅС‹Рј РёСЃС‚РѕС‡РЅРёРєРѕРј РїСЂРё `NEXT_PUBLIC_DATA_PROVIDER=mysql` РёР»Рё server DB config. Р’СЃРµ СЂР°Р±РѕС‡РёРµ РјРѕРґСѓР»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ РёРґСѓС‚ С‡РµСЂРµР· `/api/database`. |
| MySQL schema | `lib/server/mysql/schema-definitions.ts`, `lib/server/auth/schema.ts` | Р•СЃС‚СЊ runtime schema РґР»СЏ `vehicles`, `app_settings`, `app_state`, PTO tables, `audit_logs`, auth users/requests/reset codes. Р”Р»СЏ ERP РЅСѓР¶РЅС‹ СЏРІРЅС‹Рµ РјРёРіСЂР°С†РёРё, РЅРѕ С‚РµРєСѓС‰СѓСЋ СЃС…РµРјСѓ РЅРµ Р»РѕРјР°РµРј. |
| Supabase fallback | `lib/data/app-state.ts`, `lib/supabase/config.ts`, Supabase SQL files | Fallback СЃРѕС…СЂР°РЅРµРЅ. Р’ production Supabase Р±Р»РѕРєРёСЂСѓРµС‚СЃСЏ Р±РµР· СЏРІРЅРѕРіРѕ `NEXT_PUBLIC_ALLOW_PRODUCTION_SUPABASE_FALLBACK=true`. |
| Browser storage | `features/app/initialAppStorage.ts`, `features/app/initialAppDatabaseBootstrap.ts`, `features/app/sharedAppStorage.ts`, `features/pto/ptoDatabaseLoadRunner.ts`, `lib/storage/client-snapshots.ts` | РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РєР°Рє Р»РѕРєР°Р»СЊРЅС‹Р№ cache/recovery СЃР»РѕР№: initial bootstrap, PTO backup, app settings cache, client snapshots. Р­С‚Рѕ РЅРµ ERP Р±Р°Р·Р°. |
| Admin database screen | `features/admin/database/*`, `features/app/useAppAdminScreenProps.tsx`, `features/app/useAppAdminDatabaseProps.ts`, `lib/domain/admin/navigation.ts` | Р­РєСЂР°РЅ СѓР¶Рµ Р±С‹Р» РїРѕРґРєР»СЋС‡РµРЅ Р»РµРЅРёРІРѕ Рё Р°РєС‚РёРІРёСЂРѕРІР°Р»СЃСЏ С‚РѕР»СЊРєРѕ РґР»СЏ `adminSection === "database"`, РЅРѕ РїСѓРЅРєС‚ РјРµРЅСЋ РѕС‚СЃСѓС‚СЃС‚РІРѕРІР°Р». Р’РєР»Р°РґРєР° РІРєР»СЋС‡РµРЅР°. |
| Restore flow | `features/admin/database/useClientSnapshotsPanel.ts`, `features/pto/ptoPersistenceLoadResolution.ts` | Browser snapshot restore РјРѕР¶РµС‚ РїСЂРёРІРµСЃС‚Рё Рє СЃРѕС…СЂР°РЅРµРЅРёСЋ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРЅС‹С… Р»РѕРєР°Р»СЊРЅС‹С… РґР°РЅРЅС‹С… С‡РµСЂРµР· СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ recovery path. Р”РѕР±Р°РІР»РµРЅРѕ СЏРІРЅРѕРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР° РїРµСЂРµРґ restore. |
| Server authorization | `lib/server/database/authorization.ts`, `lib/server/database/module-authorization.ts`, `lib/domain/auth/types.ts` | Р•СЃС‚СЊ server-side РїСЂРѕРІРµСЂРєРё РґР»СЏ `/api/database`, РЅРѕ Р±СѓРґСѓС‰Р°СЏ ERP-Р°РІС‚РѕСЂРёР·Р°С†РёСЏ РїРѕРєР° РѕРїРёСЂР°РµС‚СЃСЏ РЅР° tab permissions Рё planned access contracts. РќСѓР¶РЅР° РїРѕР»РЅРѕС†РµРЅРЅР°СЏ RBAC/ABAC РјР°С‚СЂРёС†Р°. |
| Future module handlers | `lib/server/database/module-live-handlers.ts`, `lib/domain/data-access/moduleLiveHandlerRegistry.ts` | Registry Рё server dispatcher РµСЃС‚СЊ, РЅРѕ live registrations РїСѓСЃС‚С‹Рµ. Р­С‚Рѕ РїСЂР°РІРёР»СЊРЅРѕ РґР»СЏ С‚РµРєСѓС‰РµРіРѕ СЃРїСЂРёРЅС‚Р°: РЅРѕРІС‹Рµ ERP handlers РЅРµ РїРѕРґРєР»СЋС‡Р°Р»РёСЃСЊ. |

## РџРѕР»РёС‚РёРєР° РёСЃС‚РѕС‡РЅРёРєРѕРІ РґР°РЅРЅС‹С…

| РСЃС‚РѕС‡РЅРёРє | РЎС‚Р°С‚СѓСЃ | РџРѕР»РёС‚РёРєР° |
|---|---|---|
| MySQL С‡РµСЂРµР· `/api/database` | РћСЃРЅРѕРІРЅРѕР№ production source of truth | Р’СЃРµ production-РґР°РЅРЅС‹Рµ ERP РґРѕР»Р¶РЅС‹ С‡РёС‚Р°С‚СЊСЃСЏ Рё РїРёСЃР°С‚СЊСЃСЏ С‡РµСЂРµР· РµРґРёРЅС‹Р№ router `/api/database`. Р”Р»СЏ РЅРѕРІС‹С… РјРѕРґСѓР»РµР№ РЅРµ СЃРѕР·РґР°РІР°С‚СЊ `app/api/<module>` routes. |
| Supabase fallback | Legacy/dev/emergency fallback | Р”РѕРїСѓСЃС‚РёРј С‚РѕР»СЊРєРѕ РµСЃР»Рё MySQL РЅРµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РёР»Рё РїСЂРё РѕСЃРѕР·РЅР°РЅРЅРѕРј emergency СЂРµР¶РёРјРµ. Р’ production РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РІС‹РєР»СЋС‡РµРЅ, РєСЂРѕРјРµ СЂСѓС‡РЅРѕРіРѕ `NEXT_PUBLIC_ALLOW_PRODUCTION_SUPABASE_FALLBACK=true` РїРѕСЃР»Рµ РїСЂРѕРІРµСЂРєРё RLS. |
| `localStorage` | Cache/recovery only | Р”РѕРїСѓСЃС‚РёРј РґР»СЏ Р»РѕРєР°Р»СЊРЅРѕРіРѕ UI СЃРѕСЃС‚РѕСЏРЅРёСЏ, РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ СЃС‚Р°СЂРѕРіРѕ Р±СЂР°СѓР·РµСЂР°, РІСЂРµРјРµРЅРЅРѕРіРѕ draft/cache Рё offline safety backup. РќРµ СЏРІР»СЏРµС‚СЃСЏ ERP source of truth. |
| `sessionStorage` | Runtime flag only | Р”РѕРїСѓСЃС‚РёРј РґР»СЏ РѕРґРЅРѕСЂР°Р·РѕРІС‹С… С„Р»Р°РіРѕРІ РІСЂРѕРґРµ `dispatcher:restore-client-snapshot` Рё РІСЂРµРјРµРЅРЅС‹С… UI overrides. РќРµ С…СЂР°РЅРёС‚ production РґР°РЅРЅС‹Рµ. |
| JSON/default data | Seed/demo/fallback | РњРѕР¶РЅРѕ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґР»СЏ РїРµСЂРІРёС‡РЅРѕРіРѕ seed Рё preview. РќРµР»СЊР·СЏ СЃС‡РёС‚Р°С‚СЊ production-СЃРїСЂР°РІРѕС‡РЅРёРєРѕРј Р±РµР· РјРёРіСЂР°С†РёРё РІ MySQL. |

## РџСЂР°РІРёР»Р° РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ РґР°РЅРЅС‹С…

1. РќРѕСЂРјР°Р»СЊРЅР°СЏ Р·Р°РіСЂСѓР·РєР° РґРѕР»Р¶РЅР° Р±СЂР°С‚СЊ РґР°РЅРЅС‹Рµ РёР· MySQL, РµСЃР»Рё РѕРЅ РЅР°СЃС‚СЂРѕРµРЅ.
2. Р›РѕРєР°Р»СЊРЅС‹Рµ PTO/app snapshots РјРѕРіСѓС‚ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊСЃСЏ С‚РѕР»СЊРєРѕ РґР»СЏ recovery, РєРѕРіРґР° Р»РѕРєР°Р»СЊРЅР°СЏ РєРѕРїРёСЏ СЏРІРЅРѕ РЅРѕРІРµРµ РёР»Рё Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ РІСЂСѓС‡РЅСѓСЋ РІРѕСЃСЃС‚Р°РЅР°РІР»РёРІР°РµС‚ browser snapshot.
3. РџРµСЂРµРґ Р·Р°РіСЂСѓР·РєРѕР№ РґР°РЅРЅС‹С… РёР· Р±Р°Р·С‹ С‚РµРєСѓС‰РёР№ Р»РѕРєР°Р»СЊРЅС‹Р№ PTO backup СЃРѕС…СЂР°РЅСЏРµС‚СЃСЏ, С‡С‚РѕР±С‹ РЅРµ РїРѕС‚РµСЂСЏС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёР№ state.
4. Browser snapshot restore С‚РµРїРµСЂСЊ С‚СЂРµР±СѓРµС‚ СЏРІРЅРѕРіРѕ `window.confirm` РІ `useClientSnapshotsPanel`.
5. РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ Р·Р°С‚РёСЂР°РЅРёРµ MySQL Р»РѕРєР°Р»СЊРЅС‹Рј snapshot Р±РµР· РґРµР№СЃС‚РІРёСЏ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР° Р·Р°РїСЂРµС‰РµРЅРѕ РїРѕР»РёС‚РёРєРѕР№. РўРµРєСѓС‰РёР№ recovery path РІСЃРµ РµС‰Рµ РјРѕР¶РµС‚ РІС‹РїРѕР»РЅРёС‚СЊ full save РїРѕСЃР»Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРЅРѕРіРѕ restore, РїРѕСЌС‚РѕРјСѓ СЃР»РµРґСѓСЋС‰РёР№ С€Р°Рі - server-side restore workflow СЃ audit entry, expected version Рё РѕС‚РґРµР»СЊРЅС‹Рј РїСЂР°РІРѕРј `admin`.

## AdminDatabaseSection

Р­РєСЂР°РЅ Р±Р°Р·С‹ РґР°РЅРЅС‹С… РѕСЃС‚Р°РІР»РµРЅ РєР°Рє СЂР°Р±РѕС‡РёР№ recovery/admin СЌРєСЂР°РЅ Рё СЃРґРµР»Р°РЅ РІРёРґРёРјС‹Рј РІ Р°РґРјРёРЅРєРµ:

- РѕРЅ lazy-loaded С‡РµСЂРµР· `features/app/lazySections.ts`;
- props СЂР°СЃСЃС‡РёС‚С‹РІР°СЋС‚СЃСЏ С‚РѕР»СЊРєРѕ РґР»СЏ `adminSection === "database"`;
- СЃРїРёСЃРѕРє snapshots РіСЂСѓР·РёС‚СЃСЏ С‚РѕР»СЊРєРѕ РїСЂРё `active`;
- restore С‚РµРїРµСЂСЊ С‚СЂРµР±СѓРµС‚ СЏРІРЅРѕРіРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ;
- СЌРєСЂР°РЅ РЅРµ РјРµРЅСЏРµС‚ РїРѕРІРµРґРµРЅРёРµ РџРўРћ, РѕС‚С‡РµС‚РѕРІ Рё С‚РµС…РЅРёРєРё РґРѕ РІС‹Р±РѕСЂР° РІРєР»Р°РґРєРё.

РћСЃС‚Р°РІС€РёР№СЃСЏ СЃС‚Р°С‚СѓСЃ: `production recovery utility`, РЅРѕ РЅРµ РїРѕР»РЅРѕС†РµРЅРЅР°СЏ DB admin console. РќР° СЃР»РµРґСѓСЋС‰РµРј СЌС‚Р°РїРµ РЅСѓР¶РЅРѕ РґРѕР±Р°РІРёС‚СЊ СЃРµСЂРІРµСЂРЅС‹Р№ audit restore, health details, СЂРѕР»Рё РґРѕСЃС‚СѓРїР° Рё Р·Р°РїСЂРµС‚ restore Р±РµР· РѕС‚РґРµР»СЊРЅРѕРіРѕ ERP permission.

## Runtime config Рё `.env.example`

РџСЂРѕРІРµСЂРµРЅРѕ:

- СЃРµРєСЂРµС‚С‹ РЅРµ Р·Р°РїРѕР»РЅРµРЅС‹;
- MySQL РїРµСЂРµРјРµРЅРЅС‹Рµ СѓРєР°Р·Р°РЅС‹ СЏРІРЅРѕ: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`;
- production data policy РѕРїРёСЃР°РЅР° СЂСЏРґРѕРј СЃ `NEXT_PUBLIC_DATA_PROVIDER=mysql`;
- auth/session РїРµСЂРµРјРµРЅРЅС‹Рµ СѓРєР°Р·Р°РЅС‹ СЏРІРЅРѕ: `AUTH_REQUIRED`, `AUTH_SESSION_SECRET`, initial admin credentials placeholders;
- СЃРѕС…СЂР°РЅРµРЅ guardrail: `AUTH_REQUIRED=false is blocked in production`;
- СЃРѕС…СЂР°РЅРµРЅ guardrail: `NEXT_PUBLIC_ALLOW_PRODUCTION_SUPABASE_FALLBACK=false`.

## Р§С‚Рѕ РёР·РјРµРЅРµРЅРѕ

| Р¤Р°Р№Р» | РР·РјРµРЅРµРЅРёРµ |
|---|---|
| `.env.example` | РЈС‚РѕС‡РЅРµРЅС‹ РєРѕРјРјРµРЅС‚Р°СЂРёРё: MySQL С‡РµСЂРµР· `/api/database` РєР°Рє production source of truth, `localStorage` С‚РѕР»СЊРєРѕ cache/recovery, production auth С‚СЂРµР±СѓРµС‚ session secret. |
| `lib/domain/admin/navigation.ts` | Р”РѕР±Р°РІР»РµРЅР° РІРёРґРёРјР°СЏ РІРєР»Р°РґРєР° `database` РІ `adminSectionTabs`. |
| `features/admin/database/useClientSnapshotsPanel.ts` | Р”РѕР±Р°РІР»РµРЅРѕ СЏРІРЅРѕРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР° РїРµСЂРµРґ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµРј browser snapshot. |
| `tests/app-shell-architecture-checks.ts` | Р”РѕР±Р°РІР»РµРЅ guardrail, С‡С‚Рѕ admin navigation СЃРѕС…СЂР°РЅСЏРµС‚ РІРєР»Р°РґРєСѓ `database`. |
| `docs/ERP_STAGE_1_STABILIZATION_REPORT.md` | РЎРѕР·РґР°РЅ РѕС‚С‡РµС‚ СЃС‚Р°Р±РёР»РёР·Р°С†РёРё. |
| `docs/ERP_CORE_MODEL_PLAN.md` | РЎРѕР·РґР°РЅ РїР»Р°РЅ СЏРґСЂР° ERP. |

## Р§С‚Рѕ РЅРµ С‚СЂРѕРіР°Р»РѕСЃСЊ СЃРїРµС†РёР°Р»СЊРЅРѕ

- СЂР°Р±РѕС‡РёРµ С‚Р°Р±Р»РёС†С‹ РџРўРћ Рё С„РѕСЂРјР°С‚ СЃРѕС…СЂР°РЅРµРЅРёСЏ РџРўРћ;
- С‚РµРєСѓС‰РёР№ С„РѕСЂРјР°С‚ `VehicleRow` Рё MySQL table `vehicles`;
- Supabase fallback;
- localStorage recovery;
- `/api/database` contract РґР»СЏ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёС… СЂРµСЃСѓСЂСЃРѕРІ;
- GPS/Wialon, С‚РѕРїР»РёРІРѕ, РґРѕРіРѕРІРѕСЂС‹, РїСѓС‚РµРІС‹Рµ Р»РёСЃС‚С‹, AI, СЂРµРјРѕРЅС‚С‹/РїСЂРѕСЃС‚РѕРё РєР°Рє РѕС‚РґРµР»СЊРЅС‹Рµ РјРѕРґСѓР»Рё.

## РћСЃС‚Р°РІС€РёРµСЃСЏ СЂРёСЃРєРё

| Р РёСЃРє | Р’Р»РёСЏРЅРёРµ | Р§С‚Рѕ РґРµР»Р°С‚СЊ РґР°Р»СЊС€Рµ |
|---|---|---|
| `app_state` Рё С‡Р°СЃС‚СЊ browser storage РѕСЃС‚Р°СЋС‚СЃСЏ snapshot-СЃР»РѕРµРј | РЎР»РѕР¶РЅРѕ РјР°СЃС€С‚Р°Р±РёСЂРѕРІР°С‚СЊ, РЅРµС‚ РЅРѕСЂРјР°Р»СЊРЅРѕРіРѕ audit/permissions per entity | РџРѕСЃС‚РµРїРµРЅРЅРѕ РІС‹РІРѕРґРёС‚СЊ СЃРїСЂР°РІРѕС‡РЅРёРєРё Рё РґРѕРєСѓРјРµРЅС‚С‹ РІ РЅРѕСЂРјР°Р»РёР·РѕРІР°РЅРЅС‹Рµ MySQL tables. |
| Restore browser snapshot РјРѕР¶РµС‚ РїРѕСЃР»Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РїРѕРїР°СЃС‚СЊ РІ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ full-save recovery path | РќСѓР¶РµРЅ Р±РѕР»РµРµ СЃС‚СЂРѕРіРёР№ СЃРµСЂРІРµСЂРЅС‹Р№ РєРѕРЅС‚СЂРѕР»СЊ | РЎРѕР·РґР°С‚СЊ server-side restore endpoint РІРЅСѓС‚СЂРё `/api/database` СЃ expected version, audit trail Рё РѕС‚РґРµР»СЊРЅС‹Рј РїСЂР°РІРѕРј. |
| Supabase fallback Р¶РёРІРѕР№ | Р’РѕР·РјРѕР¶РµРЅ СЂР°Р·РЅРѕР±РѕР№ РѕРєСЂСѓР¶РµРЅРёР№ | РћСЃС‚Р°РІРёС‚СЊ С‚РѕР»СЊРєРѕ dev/emergency, production РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ MySQL. |
| `module-live-handlers` РїСѓСЃС‚РѕР№ | Р‘СѓРґСѓС‰РёРµ РјРѕРґСѓР»Рё РїРѕРєР° planned-only | РџРѕРґРєР»СЋС‡Р°С‚СЊ live handlers С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ СЃС…РµРј, query policies, server auth Рё С‚РµСЃС‚РѕРІ. |
| Tab permissions РЅРµ СЂР°РІРЅС‹ ERP authorization | РќРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕ РґР»СЏ section-scoped workflows | Р РµР°Р»РёР·РѕРІР°С‚СЊ СЃРµСЂРІРµСЂРЅСѓСЋ РјР°С‚СЂРёС†Сѓ role/user/section/module/action. |

## РџСЂРѕРІРµСЂРєРё

Р’СЃРµ РїСЂРѕРІРµСЂРєРё Р·Р°РїСѓСЃРєР°Р»РёСЃСЊ С‡РµСЂРµР· bundled Node:

`C:\Users\albert.bekker\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

| РљРѕРјР°РЅРґР° | Р РµР·СѓР»СЊС‚Р°С‚ |
|---|---|
| `scripts/check-project-health.mjs` | passed |
| `scripts/refactor-audit.mjs` | passed; blocking architecture issues: none; warnings РїРѕ РєСЂСѓРїРЅС‹Рј С„Р°Р№Р»Р°Рј РѕСЃС‚Р°Р»РёСЃСЊ. |
| `tests/database-router-checks.ts` | passed |
| `tests/database-rpc-checks.ts` | passed |
| `tests/security-runtime-config-checks.ts` | passed |
| `tests/release-safety-checks.ts` | passed |
| `tests/app-shell-architecture-checks.ts` | passed |
| `tests/modular-monolith-guardrails-checks.ts` | passed |
| `tests/single-data-layer-boundary-checks.ts` | passed |
| `tests/module-data-routes-checks.ts` | passed |
| `tests/domain-purity-guardrails-checks.ts` | passed |

РќРµРґРѕСЃС‚СѓРїРЅС‹С… РєРѕРјР°РЅРґ РІ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРј СЃРїРёСЃРєРµ РЅРµ Р±С‹Р»Рѕ. РЎРёСЃС‚РµРјРЅС‹Р№ `rg` РІ С‚РµРєСѓС‰РµРј PowerShell РІРѕР·РІСЂР°С‰Р°Р» `Access is denied`, РїРѕСЌС‚РѕРјСѓ РїРѕРёСЃРє РїРѕ РїСЂРѕРµРєС‚Сѓ РІС‹РїРѕР»РЅСЏР»СЃСЏ С‡РµСЂРµР· `Get-ChildItem` + `Select-String`.

## Р§С‚Рѕ РґРµР»Р°С‚СЊ РґР°Р»СЊС€Рµ

1. РЈС‚РІРµСЂРґРёС‚СЊ РїРѕР»РёС‚РёРєСѓ MySQL as source of truth Рё emergency-only Supabase fallback.
2. Р”РѕР±Р°РІРёС‚СЊ server-side restore workflow СЃ audit Рё РїСЂР°РІРѕРј `admin`.
3. РџРµСЂРµР№С‚Рё Рє Р±РµР·РѕРїР°СЃРЅРѕР№ РїРѕРґРіРѕС‚РѕРІРєРµ ERP core model РёР· `docs/ERP_CORE_MODEL_PLAN.md`.
4. РџРµСЂРµРґ Р­С‚Р°РїРѕРј 4 РЅРµ РЅР°С‡РёРЅР°С‚СЊ СЃРјРµРЅРЅСѓСЋ СЃРІРѕРґРєСѓ РєР°Рє production workflow, РїРѕРєР° РЅРµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ `vehicle_cards`, `sections`, users/roles/section scopes Рё access matrix.
