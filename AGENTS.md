<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
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
- `data` or `mock`: temporary seed/demo data only.

Hard rules:

- Keep `app/page.tsx` thin. It should only route to the app root or compose route-level modules, not own product behavior.
- Keep reducing `features/app/AppRoot.tsx`; it is an orchestration shell, not a place for new feature internals.
- New wiring that coordinates existing feature hooks belongs in a named `features/app/useApp*` hook, not inline in `AppRoot`.
- Do not mix UI, persistence, business calculations, mock data, and table editing logic in one file.
- Extract repeated logic immediately.
- Split large components into named parts with clear ownership.
- If a feature needs refactoring first, refactor first.
- Do not break existing working behavior for visual cleanup.
- Do not commit `.env.local` or print secret values.

Background agent protocol:

- Use background agents only for independent work that can run in parallel.
- Give each agent a clear ownership zone: files/modules it may change and files/modules it must not touch.
- Keep write zones narrow. A coding agent may edit only the files named in its assignment.
- Tell every agent that other edits may exist and that it must not revert, overwrite, reformat, or "clean up" unrelated changes.
- Prefer concrete implementation tasks over vague "analyze everything" tasks.
- Preserve public APIs during refactors unless the assignment explicitly allows an API change. Keep exported names, prop contracts, route shapes, storage keys, and data formats stable.
- Require every coding agent to run targeted checks for its touched area, such as the closest domain check, unit-style script, lint/type check, or `npm run refactor:audit` when refactoring structure.
- Require every coding agent to list changed files, summarize behavior/API impact, and name the checks it ran.
- Do not assign two agents overlapping write access to the same files unless one is explicitly read-only.
- Treat agent output as a patch proposal: review it, integrate it, then run the project-level checks locally.
- Agents must not start/stop servers, edit env files, change database/server configuration, commit, push, deploy, or run Git history operations unless the user explicitly asks for that exact action.
- If an agent finds a risky business decision, it should report it instead of guessing.

For complex tasks use paired agents:

- Implementation agent: owns a small write set and produces a patch.
- Review agent: read-only, checks the same area for behavior, architecture, performance, and test gaps.
- The main developer integrates both results and runs final checks; agents do not decide final merge quality.
- If two implementation agents are needed, split by module boundary, not by line ranges inside one file.
- Prefer one strong checked change over several unverified partial changes.

Before finishing a task, report:

1. Changed files.
2. What changed in each file.
3. What was moved out of `app/page.tsx` or `features/app/AppRoot.tsx`.
4. Why the structure is better.
5. `git diff --stat`.
6. Checks that were run.
7. Remaining technical debt.
8. Logical next step.
