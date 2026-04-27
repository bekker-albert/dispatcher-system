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
- Imports/exports do not silently drop required columns.
- Database migrations or schema assumptions are documented when required.

## Checks

Run these when code changes affect TypeScript, React, domain logic, persistence, or build output:

```powershell
npm run refactor:audit
npm run verify
git diff --check
git status --ignored --short .env.local .env.example
```

If a check was not run, the final response must say why.

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
