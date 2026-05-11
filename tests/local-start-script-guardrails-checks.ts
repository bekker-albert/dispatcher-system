import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const startScript = readFileSync(resolve(root, "start-local-server.cmd"), "utf8");
const runbook = readFileSync(resolve(root, "docs", "LOCAL_DEVELOPMENT_RUNBOOK.md"), "utf8");
const readme = readFileSync(resolve(root, "README.md"), "utf8");

assert.match(startScript, /set "PREFERRED_PORT=3000"/);
assert.match(startScript, /set "AUTH_REQUIRED=false"/);
assert.match(startScript, /http:\/\/127\.0\.0\.1:%PORT%/);
assert.match(startScript, /--hostname 127\.0\.0\.1 --port %PORT%/);
assert.match(startScript, /npm\.cmd run dev --/);
assert.match(startScript, /Get-NetTCPConnection/);
assert.match(startScript, /Keep this window open while you are working/);

assert.doesNotMatch(startScript, /PREFERRED_PORT=3011/);
assert.doesNotMatch(startScript, /--hostname localhost/);
assert.doesNotMatch(startScript, /http:\/\/localhost/);
assert.doesNotMatch(startScript, /\bnext\s+start\b/);
assert.doesNotMatch(startScript, /\bnpm\.cmd run build\b/);
assert.doesNotMatch(startScript, /\bnpm\.cmd run verify\b/);
assert.doesNotMatch(startScript, /migrate:supabase-to-mysql|scripts[\\/]migrate/);
assert.doesNotMatch(startScript, /\bmysql\b|\bsupabase\s+db\b/);
assert.doesNotMatch(startScript, /\bpm2\b|\bforever\b|\bnodemon\b|\bconcurrently\b/);

assert.match(packageJson.scripts["check:app-shell"], /local-start-script-guardrails-checks\.ts/);

assert.match(runbook, /start-local-server\.cmd/);
assert.match(runbook, /opens `http:\/\/127\.0\.0\.1:3000`/);
assert.match(runbook, /sets `AUTH_REQUIRED=false`/);
assert.match(runbook, /must not run\s+`build`, `verify`, migrations, database CLIs, PM2, Nodemon, or another backend/);

assert.match(readme, /\$env:AUTH_REQUIRED='false'/);
assert.match(readme, /npm run dev -- --hostname 127\.0\.0\.1 --port 3000/);
assert.match(readme, /http:\/\/127\.0\.0\.1:3000/);
assert.match(readme, /start-local-server\.cmd/);
assert.match(readme, /single Next\.js dev server/);
assert.match(readme, /must not start a second backend/);
assert.match(readme, /PRODUCTION_SMOKE_TIMEOUT_MS/);
assert.match(readme, /taxation\/list-waybills/);
assert.match(readme, /must not call legacy broad\s+`load` actions/);
assert.doesNotMatch(readme, /3011/);
assert.doesNotMatch(readme, /PRODUCTION_SMOKE_MIN_VEHICLE_ROWS/);
assert.doesNotMatch(readme, /vehicle load check/);
assert.doesNotMatch(readme, /vehicles data/);

console.log("Local start script guardrails checks passed");
