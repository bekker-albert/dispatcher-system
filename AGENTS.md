<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Dispatcher Project Rules

This is a long-lived dispatcher system, not a demo page. Do not add new core logic to `app/page.tsx`.

Before each task, make a short architecture check:

1. Which files need to change?
2. Can the task be done without worsening structure?
3. Should something be moved out of `app/page.tsx` first?
4. Is there duplication risk?
5. Does the task need a component, feature module, utility, type, config, or domain helper?

Folder ownership:

- `app/`: routes, pages, layout, server entry points, API routes.
- `features/`: large product areas such as dispatch, equipment, PTO, GPS, reports, users, references.
- `shared/` and `components/`: reusable UI and layout primitives.
- `lib/`: domain rules, calculations, formatting, validation, data adapters, server helpers.
- `types/`: shared TypeScript contracts that do not belong to one feature.
- `config/`: navigation, roles, section definitions, static application configuration.
- `data/` or `mock/`: temporary seed/demo data only.

Hard rules:

- Keep `app/page.tsx` thin. It should compose modules, not own all behavior.
- Do not mix UI, persistence, business calculations, mock data, and table editing logic in one file.
- Extract repeated logic immediately.
- Split large components into named parts with clear ownership.
- If a feature needs refactoring first, refactor first.
- Do not break existing working behavior for visual cleanup.
- Do not commit `.env.local` or print secret values.

Before finishing a task, report:

1. Changed files.
2. What changed in each file.
3. What was moved out of `app/page.tsx`.
4. Why the structure is better.
5. `git diff --stat`.
6. Checks that were run.
7. Remaining technical debt.
8. Logical next step.
