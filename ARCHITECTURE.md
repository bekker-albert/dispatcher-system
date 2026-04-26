# Architecture

This project is a production dispatcher system. It must stay modular because it will continue to grow across dispatch summaries, equipment, areas, shifts, GPS/Wialon, PTO, plans, operational accounting, survey measurements, reports, roles, references, Excel/PDF export, and database integration.

## Current State

The repository already has the right high-level direction:

- `app/` contains the Next.js application entry points and API routes.
- `features/` contains several feature modules: admin, auth, dispatch, PTO, reports.
- `lib/domain/` contains business/domain helpers for reports, PTO, vehicles, dispatch, navigation, admin, and references.
- `lib/data/`, `lib/server/`, and `lib/database/` contain storage and server adapters.
- `shared/` contains reusable UI and editable-grid helpers.
- `tests/domain-checks.ts` provides fast domain-level regression checks.

The main architectural problem is still `app/page.tsx`: it is too large and owns too much orchestration, state, persistence flow, and rendering. New work must reduce that file over time instead of adding to it.

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

- `app/page.tsx` remains too large and must be reduced progressively.
- Persistence orchestration for app settings, vehicles, PTO, and browser snapshots should move into dedicated hooks.
- Report header editing and admin report configuration should continue moving into `features/reports`.
- PTO editable row rendering should be split further after the current extraction work.
- Future heavy tabs such as bodies, performance, and cycle must follow the PTO/Buckets pattern: feature component, domain model, virtualization if table-like, view mode by default, edit mode behind an explicit action.
