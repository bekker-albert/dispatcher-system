import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const performanceDoc = readFileSync(resolve(root, "docs", "PERFORMANCE_2GB_RAM.md"), "utf8");
const localSmokeSource = readFileSync(resolve(root, "scripts", "local-smoke.mjs"), "utf8");
const productionSmokeSource = readFileSync(resolve(root, "scripts", "production-smoke.mjs"), "utf8");

const smokeSources = [
  { name: "local-smoke.mjs", source: localSmokeSource },
  { name: "production-smoke.mjs", source: productionSmokeSource },
] as const;

assert.equal(packageJson.scripts["smoke:local"], "node scripts/local-smoke.mjs");
assert.equal(packageJson.scripts["smoke:production"], "node scripts/production-smoke.mjs");

for (const { name, source } of smokeSources) {
  assert.doesNotMatch(source, /\bfrom\s+["'](?:mysql2|@supabase\/supabase-js)["']/, `${name} must not import database clients.`);
  assert.doesNotMatch(source, /\brequire\(["'](?:mysql2|@supabase\/supabase-js)["']\)/, `${name} must not require database clients.`);
  assert.doesNotMatch(source, /scripts\/migrate|migrate:supabase-to-mysql/, `${name} must not run migrations.`);
  assert.doesNotMatch(source, /\bfrom\s+["'](?:node:)?child_process["']/, `${name} must not spawn child processes.`);
  assert.doesNotMatch(source, /\bfrom\s+["'](?:node:)?worker_threads["']/, `${name} must not start workers.`);
  assert.doesNotMatch(source, /\bsetInterval\s*\(/, `${name} must not add resident polling.`);
  assert.doesNotMatch(source, /resource:\s*"vehicles"[\s\S]*action:\s*"load"/, `${name} must not use the legacy wide vehicles/load smoke path.`);
  assert.doesNotMatch(source, /action:\s*"load"/, `${name} must not call unbounded load actions.`);
  assert.match(source, /AbortSignal\.timeout/, `${name} must keep a bounded network timeout.`);
}

assert.match(localSmokeSource, /LOCAL_SMOKE_TIMEOUT_MS/);
assert.match(localSmokeSource, /method: "HEAD"/);
assert.match(localSmokeSource, /action: "list-waybills"/);
assert.match(localSmokeSource, /response\.status === 501/);
assert.match(localSmokeSource, /serverPaginated/);
assert.match(localSmokeSource, /noClientFullScan/);

assert.match(productionSmokeSource, /PRODUCTION_SMOKE_TIMEOUT_MS/);
assert.match(productionSmokeSource, /checkAuthenticatedPlannedModuleAction/);
assert.match(productionSmokeSource, /authenticated planned module action/);
assert.match(productionSmokeSource, /action: "list-waybills"/);
assert.match(productionSmokeSource, /response\.status !== 501/);
assert.match(productionSmokeSource, /serverPaginated/);
assert.match(productionSmokeSource, /noClientFullScan/);
assert.doesNotMatch(productionSmokeSource, /PRODUCTION_SMOKE_MIN_VEHICLE_ROWS/);
assert.doesNotMatch(productionSmokeSource, /vehicles data/);

assert.match(performanceDoc, /Smoke runtime guardrail/);
assert.match(performanceDoc, /tests\/smoke-runtime-guardrails-checks\.ts/);
assert.match(performanceDoc, /Smoke scripts must stay lightweight/);
assert.match(performanceDoc, /must not call legacy broad `load` actions/);
assert.match(performanceDoc, /bounded planned action/);

console.log("Smoke runtime guardrails checks passed");
