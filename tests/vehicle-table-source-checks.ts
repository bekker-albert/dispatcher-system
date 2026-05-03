import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const appPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/AppPrimaryContent.tsx"), "utf8");
const lazyPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/lazyPrimaryContent.tsx"), "utf8");
const useAppDerivedModelsSource = readFileSync(resolve(testDir, "../features/app/useAppDerivedModels.ts"), "utf8");
const vehicleTablePrimaryContentSource = readFileSync(resolve(testDir, "../features/app/VehicleTablePrimaryContent.tsx"), "utf8");

assert.match(lazyPrimaryContentSource, /import\("\.\/VehicleTablePrimaryContent"\)/);
assert.match(vehicleTablePrimaryContentSource, /return <AdminVehiclesSection \{\.\.\.adminVehiclesProps\} \/>;/);
assert.match(appPrimaryContentSource, /renderedTopTab === "fleet"[\s\S]*<FleetPrimaryContent[\s\S]*appState=\{appState\}[\s\S]*models=\{models\}[\s\S]*runtime=\{runtime\}/);
assert.match(useAppDerivedModelsSource, /const vehicleTableActive = renderedTopTab === "fleet"/);
assert.doesNotMatch(appPrimaryContentSource, /rows=\{filteredFleet\}/);
assert.doesNotMatch(useAppDerivedModelsSource, /useFleetRows/);
