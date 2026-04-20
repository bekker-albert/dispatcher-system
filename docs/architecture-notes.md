# Architecture Notes

## Core rule

Heavy sections must not live directly inside `app/page.tsx`.

Each new heavy tab or subtab should follow this pattern:

1. Separate module under `features/<section>/...`
2. Lazy mount only when the tab is active
3. Default mode is view-only
4. Edit mode is enabled explicitly by pencil button
5. Local UI state stays inside the section component
6. Shared business data stays in domain/state layer

## Performance rules

- Hidden tabs must not calculate row lists, filters, widths, summaries, or Excel helpers.
- Hidden subtabs must not mount tables.
- Large tables must keep view mode lighter than edit mode.
- Selection state, drag state, inline editor state, and resize state should stay local to the table component.
- Derived report rows and auto-width calculations must be gated by active report section.
- Future PTO tabs (`Кузова`, `Произв.`, `Цикл` and others) should be implemented as separate components, not as branches inside one giant page component.

## Editing rules

- Inline editing logic should be reusable across tables.
- Import/export logic belongs in `lib/domain/...` or `lib/utils/...`, not in JSX blocks.
- Table-specific styles should live near the table component, not in the root page.

## Delivery rules

- Before finishing work, run:
  - `npm run lint`
  - `npm run build`
  - `npm run check:domain`
  - or one command: `npm run verify`

## Next refactor targets

1. PTO date tables (`План`, `Оперучет`, `Замер`) into separate lazy sections
2. Report section into separate lazy section
3. Admin report settings into separate lazy section
4. Shared table toolbar and edit/view shell
