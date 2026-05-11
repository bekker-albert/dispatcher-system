# Current Architecture Audit

This audit captures the current repository shape before deeper dispatch-service implementation. It is intentionally short and operational: what was checked, what is already healthy, where growth is risky, and what must remain true while modules are added.

## Scope Checked

- `app/page.tsx`
- `features/app/AppRoot.tsx`
- `features/app/AppPrimaryContent.tsx`
- `features/app/useAppStateBundle.ts`
- `features/app/lazyPrimaryContent.tsx`
- `features/navigation`
- `features/dispatch`
- `features/pto`
- `features/fleet`
- `features/fuel`
- `features/admin`
- `features/reports`
- `features/ai-assistant`
- `lib/domain`
- `lib/data`
- `lib/server/database`
- `tests`
- `scripts`

## What Is Already Good

- `app/page.tsx` is small. It only resolves auth/session and chooses `AppRoot` or `LoginScreen`.
- `AppRoot` is still a shell: auth provider, AI provider, page shell, header, and primary content.
- `AppPrimaryContent` is a top-tab router and delegates real sections to lazy primary content.
- `lazyPrimaryContent.tsx` already uses `dynamic(...)` for large primary areas.
- Existing business areas are split by feature folders rather than being embedded in `AppRoot`.
- `lib/domain` is the right place for pure business rules and future module contracts.
- `lib/server/database` remains the shared database router path, which supports the modular-monolith direction.
- The project already uses source-check tests, so architecture rules can be made executable.

## Current Risks

- `useAppStateBundle` aggregates many hooks. It is not currently a huge business-logic file, but it can become one if new modules add document arrays or workflow logic there.
- `AppPrimaryContent` must stay a router to lazy screens. It should not grow into full workspace UI.
- Existing heavy areas such as PTO, reports, fleet, fuel, admin, and AI must not be loaded from the home screen.
- Future list/detail handlers must not bypass server pagination, query policy, and section scope.
- Future write handlers must not save whole tables. They must use versioned patch/create contracts and change history.
- Future report and export work must stay queued or aggregate-based instead of recalculating large datasets in the browser.
- Planned API payloads must remain public guardrail contracts and must not expose internal table or column names.

## Reuse Candidates

- Current `dispatch` UI remains the starting point for mining dispatch screens.
- Current `fuel` UI maps to taxation/fuel operations and should be reused behind the taxation workspace.
- Current `fleet` UI maps to equipment cards, movement history, and service vehicle records.
- Current `pto` logic remains a separate production/accounting area and must not be broken while mining dispatch grows around it.
- Current `safety-driving` / `tb` UI maps to SMTS/GPS and eco-driving monitoring.
- Current `reports` UI remains the reports/control workspace, with future reports fed by prepared aggregates.
- Current `admin` UI remains the administrative entry point; the access-matrix placeholder is additive.
- Current `ai-assistant` remains on-demand and must not become a permanent background worker.

## Where New Work Should Go

- Workspace registry: `lib/domain/workspaces/workspaces.ts`.
- Module catalog and readiness: `lib/domain/workspaces/moduleCatalog.ts`, `lib/domain/workspaces/readiness.ts`, and `lib/domain/workspaces/guardrails.ts`.
- Access rules: `lib/domain/access-control`.
- Query and persistence contracts: `lib/domain/data-access`.
- Workflow rules: `lib/domain/workflows` and module-specific domain folders.
- UI screens: `features/<workspace-or-module>`, loaded through `features/app/lazyPrimaryContent.tsx`.
- Server integration: one shared `/api/database` route and `lib/server/database`, not a new backend process.

## Boundaries To Preserve

- One Next.js app.
- One shared authorization/session layer.
- One shared database/data layer.
- No separate Node.js app per module.
- No separate database per module.
- No global React state for large tables.
- No client-side full scans for reports, GPS/Wialon, Excel imports, or exports.
- No full-table saves when one row or one field changes.
- No permanent AI background analysis loop.

## First Implementation Bias

When real handlers are added later, start with read-only list/detail handlers that are small, server-paginated, and covered by query-policy tests. Add write handlers only after the matching create/patch/workflow contracts, access matrix requirements, change history, and aggregate side effects are in place.
