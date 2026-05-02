import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const dataAppStateSource = readFileSync(resolve(testDir, "../lib/data/app-state.ts"), "utf8");
const dataSettingsSource = readFileSync(resolve(testDir, "../lib/data/settings.ts"), "utf8");
const dataVehiclesSource = readFileSync(resolve(testDir, "../lib/data/vehicles.ts"), "utf8");

assert.doesNotMatch(dataAppStateSource, /from ["']\.\.\/supabase\/app-state["']/);
assert.match(dataAppStateSource, /serverDatabaseConfigured/);
assert.match(dataAppStateSource, /databaseRequest<DataAppState \| null>\("app-state", "load"\)/);
assert.match(dataAppStateSource, /databaseRequest<DataAppState>\("app-state", "save", \{/);
assert.match(dataAppStateSource, /databaseRequest\("app-state", "save-client-snapshot", \{ clientId, storage, meta \}\)/);
assert.match(dataAppStateSource, /databaseRequest<DataClientSnapshot\[]>\("app-state", "load-client-snapshots"\)/);
assert.match(dataAppStateSource, /import\("\.\.\/supabase\/app-state"\)/);

assert.doesNotMatch(dataSettingsSource, /from ["']@\/lib\/supabase\/settings["']/);
assert.match(dataSettingsSource, /serverDatabaseConfigured/);
assert.match(dataSettingsSource, /databaseRequest<DataSettingRecord\[]>\("settings", "load", \{ keys \}\)/);
assert.match(dataSettingsSource, /databaseRequest<DataSettingRecord\[]>\("settings", "save", \{/);
assert.match(dataSettingsSource, /expectedUpdatedAt: options\.expectedUpdatedAt/);
assert.match(dataSettingsSource, /import\("@\/lib\/supabase\/settings"\)/);

assert.doesNotMatch(dataVehiclesSource, /from ["']@\/lib\/supabase\/vehicles["']/);
assert.match(dataVehiclesSource, /databaseRequest<DataVehiclesState \| null>\("vehicles", "load"\)/);
