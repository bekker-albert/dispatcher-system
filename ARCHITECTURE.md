# Architecture

This project is a production dispatcher system. It must stay modular because it will continue to grow across dispatch summaries, equipment, areas, shifts, GPS/Wialon, PTO, plans, operational accounting, survey measurements, reports, roles, references, Excel/PDF export, and database integration.

## Current State

The repository already has the right high-level direction:

- `app/` contains the Next.js application entry points and API routes. `app/page.tsx` is intentionally thin and delegates to `features/app/AppRoot.tsx`.
- `features/` contains several feature modules: admin, auth, dispatch, PTO, reports.
- `lib/domain/` contains business/domain helpers for reports, PTO, vehicles, dispatch, navigation, admin, and references.
- `lib/data/`, `lib/server/`, and `lib/database/` contain storage and server adapters.
- `shared/` contains reusable UI and editable-grid helpers.
- `tests/domain-checks.ts` provides fast domain-level regression checks.

`features/app/AppRoot.tsx` is now a thin app composition shell. It creates the state bundle, runtime controllers, derived models, feature controllers, screen props, and renders the shell/header/content. Product logic must stay in feature modules, domain helpers, or named `features/app/*` orchestration hooks, not in `app/page.tsx` or inline inside `AppRoot`.

## Target Structure

```text
app/
  page.tsx
  layout.tsx
  api/

components/
  ui/
  layout/
  shared/

features/
  dispatch-summary/
    components/
    lib/
    types.ts
    data.ts
  equipment/
    components/
    lib/
    types.ts
    data.ts
  pto/
    components/
    lib/
    types.ts
    data.ts
  gps/
    components/
    lib/
    types.ts
    data.ts
  safety-driving/
    components/
    lib/
    types.ts
    data.ts
  reports/
    components/
    lib/
    types.ts
    data.ts
  users/
    components/
    lib/
    types.ts
    data.ts
  references/
    components/
    lib/
    types.ts
    data.ts

lib/
  utils/
  validation/
  calculations/
  formatters/

types/
  common.ts

config/
  navigation.ts
  roles.ts
  sections.ts

data/
  mock/
```

The existing project does not need a disruptive rename just to match this tree. Use the target structure for new modules and migrate old modules gradually when a task touches them.

## Ownership Rules

### `app/`

Use only for route-level composition, layouts, metadata, and server/API entry points. A page can wire feature modules together, but it should not own table internals, domain calculations, persistence rules, or large style blocks.

### `features/`

Each feature owns its UI, local hooks, feature-specific models, and feature-specific types. Examples:

- `features/pto`: PTO date tables, bucket tables, PTO toolbar, PTO persistence model.
- `features/reports`: report view, report table, print CSS, report admin settings.
- `features/admin/vehicles`: vehicle administration grid.
- `features/dispatch`: shift summary and dispatch forms.
- `features/app`: app-level composition hooks only. These hooks may wire feature hooks together, but they must not become a new home for domain calculations or table internals.

### `lib/domain/`

Use for pure business rules. These modules should not depend on React. They should be easy to test through `tests/domain-checks.ts`.

### `lib/data/` and `lib/server/`

Use for persistence adapters and server-only database logic. Client code should call provider-neutral functions from `lib/data/*`, not direct MySQL or Supabase implementations.

### `shared/`

Use for reusable UI primitives and generic behavior that is not tied to one business feature.

## Refactoring Policy

Refactor in safe, reviewable steps:

1. Extract pure domain logic first.
2. Extract reusable UI components second.
3. Extract feature hooks and persistence flows third.
4. Keep each commit understandable and reversible.
5. Run `npm run verify` after behavior-affecting changes.

Avoid large rewrites that change data shape, persistence, UI, and calculations at the same time.

## Technical Debt Register

- `features/app/AppRoot.tsx` is a thin app-level composition shell; recent extractions moved feature controllers, report, dispatch, PTO date/supplemental, PTO screen props, report screen props, dispatch screen props, admin feature screen props, admin screen props, screen props, derived screen models, runtime controllers, PTO persistence, shared persistence, PTO section props, vehicle editing/view, primary content, admin content, and page-shell wiring into named app hooks/components.
- Persistence orchestration for app settings, vehicles, and PTO is now behind app-level hooks; browser snapshot administration should continue moving out of `AppRoot` when the database admin panel is touched again.
- `/api/database` is a thin Next.js route. Resource routing and server database behavior live in `lib/server/database/router.ts`, while provider-specific table code stays in `lib/server/mysql/*`.
- MySQL and Supabase PTO adapters share the same PTO persistence record contract in `lib/domain/pto/persistence-shared.ts`. Storage adapters should not duplicate row/day/bucket mapping rules.
- Report screen props are behind `useAppReportsScreenProps`; report header editing and admin report configuration should continue moving into `features/reports`.
- Report display rules are split by concern: keys, formatting, column sizing, aggregation, and PTO status. Keep `lib/domain/reports/display.ts` as the compatibility export surface rather than growing it again.
- Report calculation rules are split by concern: PTO indexes in `lib/domain/reports/pto-index.ts`, row normalization in `lib/domain/reports/row-normalization.ts`, and fact derivation in `lib/domain/reports/pto-facts.ts`. Keep `lib/domain/reports/calculation.ts` as the compatibility export surface instead of adding new formulas there.
- Report customer administration separates customer tabs, customer summary fields, and settings tab controls from the report settings content panes. Keep future report admin logic inside the specific pane component rather than expanding `AdminReportSettingsSection`.
- Summary-row report administration uses a feature-local view-model helper for derived row state, keeping selection and plan-source calculations out of JSX.
- Admin section rendering is coordinated by `useAppAdminScreenProps` and rendered through `AdminPrimaryContent`; database, vehicles, and report settings props use smaller feature-owned adapters. Vehicle administration keeps its toolbar, filter header, autocomplete datalists, and table body in dedicated feature components so the section container only wires props together.
- PTO editable table shell has moved internals into feature hooks (`usePtoDateToolbar`, `usePtoDateHeaderRenderers`, `usePtoFormulaCellScroller`), `PtoDateEditableTable`, `PtoDateEditableTableBody`, `PtoDateHeaderEditors`, and `PtoFormulaBar`. Formula-cell selection actions live in `features/pto/ptoDateFormulaSelectionActions.ts`; keep keyboard/mouse selection behavior out of JSX.
- PTO table rendering is split by runtime cost: `PtoDateReadonlyTableContainer` is the default view path, while `PtoDateEditableTableContainer` owns edit-only formula, draft, and drag/drop behavior.
- PTO primary content is split into `PtoDatePrimaryContent`, `PtoBucketsPrimaryContent`, and `PtoStaticPrimaryContent`; future heavy PTO subtabs should follow the same active-only component pattern.
- PTO Excel import/export logic is loaded through action-time dynamic imports in `usePtoDateExcelTransfer`; normal rendering must not pull XLSX helpers into the active tab path.
- PTO database loading is a thin hook plus runner/apply helpers. Normal year loads do not fetch buckets unless the bucket tab requests them, and inline day/bucket writes patch only the affected save-baseline cells.
- Initial database reads must not trigger automatic backup writes before the app decides whether local state or database state wins.
- Report accumulated reasons are calculated in the report model and must be consumed through the calculated row value in screen and print code. UI code must not re-read raw year override keys when a calculated reason is already available.
- Future heavy tabs such as bodies, performance, and cycle must follow the PTO/Buckets pattern: feature component, domain model, virtualization if table-like, view mode by default, edit mode behind an explicit action.
