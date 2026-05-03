import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(testDir, "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const appPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/AppPrimaryContent.tsx"), "utf8");
const lazyPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/lazyPrimaryContent.tsx"), "utf8");
const useAppDerivedModelsSource = readFileSync(resolve(testDir, "../features/app/useAppDerivedModels.ts"), "utf8");
const useSectionSelectionStateSource = readFileSync(resolve(testDir, "../features/navigation/useSectionSelectionState.ts"), "utf8");
const vehicleTablePrimaryContentSource = readFileSync(resolve(testDir, "../features/app/VehicleTablePrimaryContent.tsx"), "utf8");
const adminVehiclesPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/AdminVehiclesPrimaryContent.tsx"), "utf8");
const adminVehiclesSectionSource = readFileSync(resolve(testDir, "../features/admin/vehicles/AdminVehiclesSection.tsx"), "utf8");
const adminVehiclesToolbarSource = readFileSync(resolve(testDir, "../features/admin/vehicles/AdminVehiclesToolbar.tsx"), "utf8");

function collectProductionSources(dir: string, sources: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      collectProductionSources(fullPath, sources);
      continue;
    }

    const extensionStart = entry.name.lastIndexOf(".");
    const extension = extensionStart === -1 ? "" : entry.name.slice(extensionStart);
    if (sourceExtensions.has(extension) && statSync(fullPath).isFile()) {
      sources.push(readFileSync(fullPath, "utf8"));
    }
  }

  return sources;
}

const productionSources = ["app", "components", "features", "lib", "shared"]
  .flatMap((dir) => collectProductionSources(resolve(rootDir, dir)))
  .join("\n");

assert.match(lazyPrimaryContentSource, /import\("\.\/VehicleTablePrimaryContent"\)/);
assert.match(vehicleTablePrimaryContentSource, /return <AdminVehiclesSection \{\.\.\.adminVehiclesProps\} \/>;/);
assert.match(appPrimaryContentSource, /renderedTopTab === "fleet"[\s\S]*<FleetPrimaryContent[\s\S]*appState=\{appState\}[\s\S]*models=\{models\}[\s\S]*runtime=\{runtime\}/);
assert.match(useAppDerivedModelsSource, /const vehicleTableActive = renderedTopTab === "fleet"/);
assert.doesNotMatch(appPrimaryContentSource, /rows=\{filteredFleet\}/);
assert.doesNotMatch(useAppDerivedModelsSource, /useFleetRows/);
assert.doesNotMatch(useSectionSelectionStateSource, /\bfleetTab\b|\bsetFleetTab\b/);
assert.match(vehicleTablePrimaryContentSource, /mode:\s*"readonly"\s*\|\s*"admin"/);
assert.match(vehicleTablePrimaryContentSource, /mode === "readonly"[\s\S]*adminVehiclesEditing:\s*false/);
assert.match(vehicleTablePrimaryContentSource, /const canManageVehicles = mode === "admin"/);
assert.match(vehicleTablePrimaryContentSource, /canManageVehicles,/);
assert.match(vehicleTablePrimaryContentSource, /mode === "readonly"[\s\S]*onStartEditing:\s*\(\)\s*=>\s*undefined/);
assert.match(vehicleTablePrimaryContentSource, /mode === "readonly"[\s\S]*onAddVehicleRow:\s*\(\)\s*=>\s*undefined/);
assert.match(vehicleTablePrimaryContentSource, /mode === "readonly"[\s\S]*onImportVehiclesFromExcel:\s*\(\)\s*=>\s*undefined/);
assert.match(vehicleTablePrimaryContentSource, /mode === "readonly"[\s\S]*onOpenVehicleImportFilePicker:\s*\(\)\s*=>\s*undefined/);
assert.match(vehicleTablePrimaryContentSource, /mode === "readonly"[\s\S]*onToggleVehicleVisibility:\s*\(\)\s*=>\s*undefined/);
assert.match(vehicleTablePrimaryContentSource, /mode === "readonly"[\s\S]*onVehicleCellChange:\s*\(\)\s*=>\s*undefined/);
assert.match(vehicleTablePrimaryContentSource, /mode === "readonly"[\s\S]*onDeleteVehicle:\s*\(\)\s*=>\s*undefined/);
assert.match(appPrimaryContentSource, /<FleetPrimaryContent[\s\S]*mode="readonly"/);
assert.match(adminVehiclesPrimaryContentSource, /<VehicleTablePrimaryContent[\s\S]*mode="admin"/);
assert.match(adminVehiclesSectionSource, /canManageVehicles\?: boolean/);
assert.match(adminVehiclesSectionSource, /canManageVehicles = false/);
assert.match(adminVehiclesSectionSource, /<AdminVehiclesToolbar[\s\S]*canManageVehicles=\{canManageVehicles\}/);
assert.match(adminVehiclesToolbarSource, /canManageVehicles: boolean/);
assert.match(adminVehiclesToolbarSource, /\{canManageVehicles \? \([\s\S]*onStartEditing[\s\S]*onAddVehicleRow[\s\S]*onOpenVehicleImportFilePicker[\s\S]*\) : null\}/);
assert.match(adminVehiclesToolbarSource, /\{canManageVehicles \? \([\s\S]*<input[\s\S]*onImportVehiclesFromExcel[\s\S]*\) : null\}/);
assert.doesNotMatch(productionSources, /FleetSection/);
assert.doesNotMatch(productionSources, /useFleetRows/);
