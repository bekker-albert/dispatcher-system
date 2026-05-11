import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const runbookPath = resolve(testDir, "..", "docs", "LOCAL_DEVELOPMENT_RUNBOOK.md");

assert.equal(existsSync(runbookPath), true);

const runbook = readFileSync(runbookPath, "utf8");

assert.match(runbook, /http:\/\/127\.0\.0\.1:3000/);
assert.match(runbook, /npm run dev -- --hostname 127\.0\.0\.1 --port 3000/);
assert.match(runbook, /AUTH_REQUIRED=false/);
assert.match(runbook, /Use one local Next\.js dev server/);
assert.match(runbook, /Do not start separate backend processes/);
assert.match(runbook, /start-local-server\.cmd/);
assert.match(runbook, /opens `http:\/\/127\.0\.0\.1:3000`/);
assert.match(runbook, /sets `AUTH_REQUIRED=false`/);
assert.match(runbook, /runs only\s+`npm run dev -- --hostname 127\.0\.0\.1 --port 3000`/);
assert.match(runbook, /must not run\s+`build`, `verify`, migrations, database CLIs, PM2, Nodemon, or another backend/);
assert.match(runbook, /Before Running Full Verify/);
assert.match(runbook, /npm run verify/);
assert.match(runbook, /npm run lint/);
assert.match(runbook, /npm run typecheck/);
assert.match(runbook, /npm run build/);
assert.match(runbook, /npm run check:domain/);
assert.match(runbook, /npm run check:project/);
assert.match(runbook, /OneDrive And `\.next` Locks/);
assert.match(runbook, /C:\\codex-dispatcher-system/);
assert.match(runbook, /junction to the\s+OneDrive repository folder/);
assert.match(runbook, /EPERM: operation not permitted, unlink/);
assert.match(runbook, /generated-cache lock/);
assert.match(runbook, /Confirm the resolved `\.next` path is inside the repository/);
assert.match(runbook, /Delete only the generated `\.next` directory/);
assert.match(runbook, /Do not delete `node_modules`, source files, uploaded data, database files/);
assert.match(runbook, /curl\.exe -I --max-time 30 http:\/\/127\.0\.0\.1:3000/);
assert.match(runbook, /HTTP\/1\.1 200 OK/);
assert.match(runbook, /npm run smoke:local/);
assert.match(runbook, /`HEAD` health check/);
assert.match(runbook, /without application error\s+markers/);
assert.match(runbook, /planned_module_database_action/);
assert.match(runbook, /planned-only/);
assert.match(runbook, /server pagination\/query policy/);
assert.match(runbook, /one shared\s+`\/api\/database` route/);

console.log("Local development runbook checks passed");
