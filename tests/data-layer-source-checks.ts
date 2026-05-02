import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const dataSettingsSource = readFileSync(resolve(testDir, "../lib/data/settings.ts"), "utf8");
const dataVehiclesSource = readFileSync(resolve(testDir, "../lib/data/vehicles.ts"), "utf8");

assert.doesNotMatch(dataSettingsSource, /from ["']@\/lib\/supabase\/settings["']/);
assert.match(dataSettingsSource, /serverDatabaseConfigured/);
assert.match(dataSettingsSource, /databaseRequest<DataSettingRecord\[]>\("settings", "load", \{ keys \}\)/);
assert.match(dataSettingsSource, /databaseRequest<DataSettingRecord\[]>\("settings", "save", \{/);
assert.match(dataSettingsSource, /expectedUpdatedAt: options\.expectedUpdatedAt/);
assert.match(dataSettingsSource, /import\("@\/lib\/supabase\/settings"\)/);

assert.doesNotMatch(dataVehiclesSource, /from ["']@\/lib\/supabase\/vehicles["']/);
assert.match(dataVehiclesSource, /databaseRequest<DataVehiclesState \| null>\("vehicles", "load"\)/);
