import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const preflightPath = resolve(testDir, "..", "docs", "STAGE_2_FIRST_READ_MODEL_PREFLIGHT.md");
const liveRegistrySource = readFileSync(
  resolve(testDir, "..", "lib", "domain", "data-access", "moduleLiveHandlerRegistry.ts"),
  "utf8",
);

assert.equal(existsSync(preflightPath), true);

const preflight = readFileSync(preflightPath, "utf8");

assert.match(preflight, /Stage 2 First Read Model Preflight/);
assert.match(preflight, /feature\/dispatch-service-architecture/);
assert.match(preflight, /taxation-waybills/);
assert.match(preflight, /list-waybills/);
assert.match(preflight, /Contract kind: `list`/);
assert.match(preflight, /one shared `\/api\/database` router/);
assert.match(preflight, /HTTP `501`/);
assert.match(preflight, /planned_module_database_action/);
assert.match(preflight, /planned-only/);
assert.match(preflight, /npm run plan:stage2-read-models -- --requested-by codex --summary-only/);
assert.match(preflight, /totalActions: 4/);
assert.match(preflight, /issueCount: 0/);
assert.match(preflight, /npm run check:read-model-schema -- --workspace taxation/);
assert.match(preflight, /npm run check:read-model-schema -- --workspace taxation --dry-run/);
assert.match(preflight, /npm run check:read-model-schema -- --module taxation-waybills --dry-run/);
assert.match(preflight, /npm run check:read-model-schema -- --module taxation-waybills/);
assert.match(preflight, /first one-action candidate/);
assert.match(preflight, /does not query `information_schema\.COLUMNS`/);
assert.match(preflight, /does not prove that the\s+target schema exists/);
assert.match(preflight, /npm run review:live-handler -- --resource taxation --action list-waybills/);
assert.match(preflight, /--contract-only/);
assert.match(preflight, /reviewModuleHandlerActivation/);
assert.match(preflight, /ready: false/);
assert.match(preflight, /schemaChecked: false/);
assert.match(preflight, /mysql_schema_not_checked/);
assert.match(preflight, /Do not register a live handler from contract-only\s+output/);
assert.match(preflight, /Latest Local Recheck/);
assert.match(preflight, /May 10, 2026/);
assert.match(preflight, /liveActivationAllowedNow: false/);
assert.match(preflight, /maxParallelLiveRegistrations: 1/);
assert.match(preflight, /issues: \[\]/);
assert.match(preflight, /liveActivationReady: false/);
assert.match(preflight, /No live handler was registered/);
assert.match(preflight, /DB_NAME, DB_USER and DB_PASSWORD are required/);
assert.match(preflight, /Do not register a live handler/);
assert.match(preflight, /live registry must stay empty/);
assert.match(preflight, /Register exactly one guarded list handler/);
assert.match(preflight, /npm run verify/);
assert.match(preflight, /npm run smoke:local/);
assert.match(preflight, /Stop if the implementation needs a new process/);
assert.match(preflight, /useAppStateBundle/);

assert.match(liveRegistrySource, /const configuredLiveModuleHandlers: readonly ModuleLiveHandlerKey\[\] = \[\];/);

console.log("Stage 2 first read-model preflight checks passed");
