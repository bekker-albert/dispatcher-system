import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSource(path: string) {
  return readFileSync(resolve(path), "utf8");
}

const envExampleSource = readSource(".env.example");
const schemaSource = readSource("lib/server/mysql/schema-definitions.ts");
const wialonClientSource = readSource("lib/server/wialon/client.ts");
const wialonServiceSource = readSource("lib/server/wialon/service.ts");
const wialonMysqlSource = readSource("lib/server/wialon/mysql.ts");
const wialonGuardSource = readSource("lib/server/wialon/route-guard.ts");
const adminWialonSource = readSource("features/admin/wialon/AdminWialonSection.tsx");
const adminScreenSource = readSource("features/app/useAppAdminScreenProps.tsx");
const lazySectionsSource = readSource("features/app/lazySections.ts");
const navigationModelSource = readSource("features/app-shell/navigationModel.ts");

for (const routePath of [
  "app/api/wialon/units/route.ts",
  "app/api/wialon/units/[id]/route.ts",
  "app/api/wialon/sync/units/route.ts",
  "app/api/wialon/sync/positions/route.ts",
]) {
  assert.equal(existsSync(resolve(routePath)), true, `${routePath} must exist.`);
}

assert.match(envExampleSource, /^WIALON_TOKEN=$/m);
assert.doesNotMatch(envExampleSource, /NEXT_PUBLIC_WIALON|WIALON_TOKEN=.+/);

assert.match(wialonClientSource, /https:\/\/wialon\.fleetbook\.kz\/wialon\/ajax\.html/);
assert.match(wialonClientSource, /process\.env\.WIALON_TOKEN/);
assert.match(wialonClientSource, /token\/login/);
assert.match(wialonClientSource, /core\/search_items/);
assert.match(wialonClientSource, /core\/search_item/);
assert.match(wialonClientSource, /response\.eid/);
assert.match(wialonClientSource, /body\.set\("sid", sid\)/);

assert.match(wialonServiceSource, /syncWialonUnits/);
assert.match(wialonServiceSource, /syncWialonPositions/);
assert.match(wialonServiceSource, /checkWialonConnection/);
assert.match(wialonServiceSource, /logWialonSync/);
assert.match(wialonMysqlSource, /wialon_units/);
assert.match(wialonMysqlSource, /wialon_positions/);
assert.match(wialonMysqlSource, /wialon_sync_logs/);
assert.match(wialonGuardSource, /canManageUsers/);

for (const tableName of ["wialon_units", "wialon_positions", "wialon_sync_logs"]) {
  assert.match(schemaSource, new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName}\\b`));
}

assert.match(adminScreenSource, /adminSection === "wialon"/);
assert.match(lazySectionsSource, /AdminWialonSection/);
assert.match(navigationModelSource, /admin-wialon/);
assert.match(navigationModelSource, /Wialon Local/);
assert.match(adminWialonSource, /\/api\/wialon\/units/);
assert.match(adminWialonSource, /\/api\/wialon\/sync\/units/);
assert.match(adminWialonSource, /\/api\/wialon\/sync\/positions/);
assert.doesNotMatch(adminWialonSource, /WIALON_TOKEN|wialon\.fleetbook\.kz|token\/login|core\/search_items|core\/search_item/);

console.log("Wialon integration checks passed");
