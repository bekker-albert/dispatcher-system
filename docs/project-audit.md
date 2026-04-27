# Project Audit

Date: 2026-04-27

## Pages And Entry Points

- `/` is the main dispatcher application route. `app/page.tsx` is thin and delegates to `features/app/AppRoot`.
- `/manifest.webmanifest` is generated from `app/manifest.ts`.
- `/api/database` is the server database gateway for status, PTO, vehicles, app settings, and client snapshots.

## Current Architecture State

The project is no longer a single-page prototype. The main product areas are split into feature modules:

- `features/reports` owns report screen, report table, report print CSS, reason editing, and report admin settings.
- `features/pto` owns PTO date tables, bucket tables, import/export flows, and PTO persistence models.
- `features/admin/vehicles` owns equipment administration and inline grid editing.
- `features/dispatch` owns shift summary and dispatch input flows.
- `features/app` owns only app-level composition, navigation wiring, state bundles, persistence controllers, and prop adapters.
- `lib/domain` owns pure calculations and business rules.
- `lib/data` and `lib/server` own provider-neutral client calls and server-side MySQL/Supabase adapters.
- `shared` and `components` own reusable UI and layout primitives.

## Main Problems Found

- `features/app/AppRoot.tsx` remains the largest orchestration file. It is acceptable as a temporary composition shell, but it must keep shrinking and must not receive new feature internals.
- Heavy table features still need a strict pattern: view mode by default, edit mode behind an explicit action, feature-owned grid hooks, and domain helpers outside React.
- Some large modules remain valid but should be split only when touched by a related task:
  - `features/pto/PtoDateTableContainer.tsx`
  - `features/reports/ReportsSection.tsx`
  - `features/dispatch/DispatchSection.tsx`
  - `features/admin/vehicles/AdminVehiclesSection.tsx`
  - `lib/domain/reports/display.ts`
- Production data must not be reset by deployment or local seed data. Save/load logic must stay provider-neutral through `lib/data/*`.

## Fixes Applied In This Audit Pass

- Runtime side effects and controllers were moved out of `AppRoot` into `features/app/useAppRuntimeControllers.ts`.
- `AppRoot` now delegates undo, initial data loading, PTO persistence, shared persistence, report reason editing, header editing, and table resize wiring to a named app-level hook.
- Derived screen models were moved out of `AppRoot` into `features/app/useAppDerivedModels.ts`.
- `AppRoot` now delegates report, PTO, vehicle, dispatch, and fleet model calculation to a named app-level hook.
- Screen prop assembly was moved out of `AppRoot` into `features/app/useAppScreenProps.tsx`.
- `AppRoot` now renders the header and primary content from prepared props instead of manually wiring every section.
- Admin screen prop assembly was moved out of the common screen adapter into `features/app/useAppAdminScreenProps.tsx`.
- Admin navigation, vehicle, database, log, and report settings wiring now stays behind one admin-owned adapter.
- Report screen prop assembly was moved out of the common screen adapter into `features/app/useAppReportsScreenProps.ts`.
- Report table, print, reason editing, and report-area wiring now stays behind one report-owned adapter.
- Dispatch screen prop assembly was moved out of the common screen adapter into `features/app/useAppDispatchScreenProps.ts`.
- Dispatch filters, row editing callbacks, totals, and shift context now stay behind one dispatch-owned adapter.
- PTO screen prop assembly was moved out of the common screen adapter into `features/app/useAppPtoScreenProps.ts`.
- PTO date table, year/month controls, bucket table, import/export, and row editing wiring now stays behind one PTO-owned adapter.
- Admin database, vehicles, and report settings props were moved out of `useAppAdminScreenProps.tsx` into dedicated admin adapter hooks.
- `useAppAdminScreenProps.tsx` now only coordinates admin content, structure, navigation, logs, and the already prepared admin feature props.
- Feature controller wiring was moved out of `AppRoot` into `features/app/useAppFeatureControllers.ts`.
- `AppRoot` is now a thin composition shell instead of the owner of individual PTO, admin, vehicle, and navigation hooks.
- PTO date table toolbar, editable header renderers, and active formula-cell scrolling were moved out of `PtoDateTableContainer`.
- `PtoDateTableContainer` now keeps the table assembly while the reusable interaction helpers live behind PTO-owned hooks.
- `app/page.tsx` stayed thin and did not receive product logic.

## Development Rules From Here

- New feature behavior goes into its feature folder first.
- Cross-feature coordination can live in `features/app/useApp*` hooks, but not as inline blocks inside `AppRoot`.
- Domain calculations stay in `lib/domain` and must be testable without React.
- Database and persistence code stays in `lib/data`, `lib/server`, or API routes.
- Large editable tables should use shared editing primitives and feature-owned models instead of custom one-off table logic.
- Before every commit, run `npm run verify` and `git diff --check` unless the change is documentation-only.

## Next Recommended Work

- Continue shrinking `AppRoot` by extracting primary-content prop assembly only when a related feature change touches it.
- Split `PtoDateTableContainer` when working on PTO table behavior.
- Split report print/screen concerns further when working on report output.
- Add focused tests for database persistence once the final MySQL schema is stable.
