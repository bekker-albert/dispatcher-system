# Code Review Checklist

Use this checklist before every commit.

## Architecture

- `app/page.tsx` did not receive new business logic, table internals, mock data, or large UI blocks.
- New functionality lives in the correct feature folder or domain module.
- App-level orchestration moved into a named `features/app/useApp*` hook when it would otherwise bloat `AppRoot`.
- Repeated code was extracted instead of copied.
- Large components were split into named, reviewable pieces.
- Types are close to their owner, or in `types/` when shared across features.
- Constants and navigation/role configuration are not hardcoded into page rendering.

## Behavior

- Existing working flows still work.
- Save/load behavior was not changed accidentally.
- Database writes are explicit and provider-neutral through `lib/data/*` where possible.
- Next.js API routes stay thin; request routing and server database behavior belong in `lib/server/*`.
- PTO storage adapters reuse `lib/domain/pto/persistence-shared.ts` for row/day/bucket mapping.
- Report formulas stay in focused domain modules such as `pto-index`, `pto-facts`, and `row-normalization`; compatibility files must not start growing new logic again.
- User-entered production data is not replaced by seed/mock data.
- Keyboard behavior remains consistent for spreadsheet-like tables.

## UI

- View mode remains lightweight by default for heavy grids.
- Edit mode is explicit where tables are large or expensive.
- Headers and cells keep readable wrapping/alignment.
- Print styles remain separate from screen styles where practical.
- No unnecessary visual redesign was mixed into logic changes.

## Data And Security

- `.env.local` is not staged.
- Secrets are not printed in logs or committed to docs.
- Public keys are treated as public only when the provider explicitly defines them that way.
- AI prompts, model outputs, request identifiers, and provider errors do not include `.env.local`, database credentials, raw customer secrets, or full production snapshots.
- Imports/exports do not silently drop required columns.
- Database migrations or schema assumptions are documented when required.

## Text Encoding

- Run `npm run check:project` before handing off any package that changes UI text or documentation with Russian text.
- Treat Cyrillic mojibake as a P1 blocker; do not accept or hand off the package until the intended UTF-8 text is restored.

## Checks

Run these when code changes affect TypeScript, React, domain logic, persistence, or build output:

```powershell
npm run refactor:audit
npm run verify
git diff --check
git status --ignored --short .env.local .env.example
```

Before pushing to `main`, run the combined release gate:

```powershell
npm run release:check
```

After the deploy workflow finishes, run the read-only production smoke check:

```powershell
npm run smoke:production
```

The smoke check must stay read-only. Do not use migration scripts, browser
storage cleanup, or database writes as a deploy verification step.

For larger architecture tasks, run the AI review agent before coding:

```powershell
npm run refactor:ai -- --mode plan --target path/to/file.tsx --task "Describe the area to review"
```

After a risky refactor, review the current diff before committing:

```powershell
npm run refactor:ai -- --mode review --include-diff --task "Review current refactor diff"
```

If a check was not run, the final response must say why.

## Background Agents

For large work, use agents in pairs where useful:

- One implementation agent with a clear write set.
- One read-only review agent for the same area.
- No overlapping write access unless the second agent is explicitly read-only.
- Main thread must still run the final verification and inspect the result.
- Agents must not commit, push, deploy, or touch production data.

## Final Report Format

After each task, report:

1. Changed files.
2. What changed in each file.
3. What was moved out of `app/page.tsx`.
4. Why this structure is correct.
5. `git diff --stat`.
6. Checks run.
7. Remaining technical debt.
8. Next logical step.
