# Architecture Notes

## Core Rule

Heavy sections must not live directly inside `app/page.tsx`.

Database calls from UI code must go through `lib/data/*`. UI components must not import storage-provider modules directly. The current provider can be MySQL on the server or a legacy fallback, but feature code should use neutral database names.

Each new heavy tab or subtab should follow this pattern:

1. Separate module under `features/<section>/...`
2. Lazy mount only when the tab is active
3. Default mode is view-only
4. Edit mode is enabled explicitly by an edit action
5. Local UI state stays inside the section component
6. Shared business data stays in domain/state layer

## Performance Rules

- Hidden tabs must not calculate row lists, filters, widths, summaries, or Excel helpers.
- Hidden subtabs must not mount tables.
- Large tables must keep view mode lighter than edit mode.
- Selection state, drag state, inline editor state, and resize state should stay local to the table component.
- Derived report rows and auto-width calculations must be gated by the active report section.
- Future PTO tabs such as `Кузова`, `Произв.`, `Цикл`, and similar heavy grids should be implemented as separate active-only components, not as branches inside one giant page component.
- PTO date tabs, PTO bucket tabs, and static PTO tabs must stay as separate primary-content components. Do not reintroduce one shared PTO controller that mounts date editing, bucket editing, and static content together.
- Excel code must stay lazy. Do not import XLSX/export helpers into normal table render paths unless the user is actively importing or exporting.

## Editing Rules

- Inline editing logic should be reusable across tables.
- Import/export logic belongs in `lib/domain/...` or `lib/utils/...`, not in JSX blocks.
- Table-specific styles should live near the table component, not in the root page.
- Provider-specific names such as Supabase/MySQL should stay below `lib/data` and `lib/server`; user-facing UI should say "База данных".

## Delivery Rules

Before finishing non-documentation work, run:

- `npm run lint`
- `npm run build`
- `npm run check:domain`
- `npm run check:project`

For a full local gate, run `npm run verify`.

## Current Refactor Targets

1. Keep PTO bucket loading lazy: normal plan/oper/survey year loads must not fetch or overwrite bucket data.
2. Keep PTO inline writes and full snapshot saves separated by baseline patches, not by pretending the whole screen was saved.
3. Keep report print/screen concerns separated when report output changes.
4. Move new table behavior into feature-owned models before wiring it into UI.
5. Add direct test imports for every new model/grid/persistence module so `npm run check:project` remains meaningful.
6. Keep startup reads separate from backup writes. Do not add automatic database writes before the initial database/local state decision.
