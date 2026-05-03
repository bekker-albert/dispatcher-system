import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createFleetVehicleListRows, deriveFleetVehicleStatus } from "../features/fleet/fleetVehicleModel";
import type { VehicleRow } from "../lib/domain/vehicles/types";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(testDir, "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const appPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/AppPrimaryContent.tsx"), "utf8");
const fleetPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/FleetPrimaryContent.tsx"), "utf8");
const lazyPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/lazyPrimaryContent.tsx"), "utf8");
const useAppDerivedModelsSource = readFileSync(resolve(testDir, "../features/app/useAppDerivedModels.ts"), "utf8");
const useSectionSelectionStateSource = readFileSync(resolve(testDir, "../features/navigation/useSectionSelectionState.ts"), "utf8");
const vehicleTablePrimaryContentSource = readFileSync(resolve(testDir, "../features/app/VehicleTablePrimaryContent.tsx"), "utf8");
const adminVehiclesPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/AdminVehiclesPrimaryContent.tsx"), "utf8");
const adminVehiclesSectionSource = readFileSync(resolve(testDir, "../features/admin/vehicles/AdminVehiclesSection.tsx"), "utf8");
const adminVehiclesToolbarSource = readFileSync(resolve(testDir, "../features/admin/vehicles/AdminVehiclesToolbar.tsx"), "utf8");
const fleetVehiclesSectionSource = readFileSync(resolve(testDir, "../features/fleet/FleetVehiclesSection.tsx"), "utf8");
const fleetVehicleModelSource = readFileSync(resolve(testDir, "../features/fleet/fleetVehicleModel.ts"), "utf8");

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

const baseFleetVehicle = {
  id: 1,
  name: "",
  brand: "Howo",
  model: "A7",
  plateNumber: "123",
  garageNumber: "55",
  vehicleType: "Транспорт",
  equipmentType: "Самосвал",
  manufactureYear: "",
  fuelNormWinter: 0,
  fuelNormSummer: 0,
  fuelCalcType: "" as VehicleRow["fuelCalcType"],
  vin: "",
  owner: "",
  area: "Аксу",
  location: "Карьер",
  workType: "",
  excavator: "",
  work: 0,
  rent: 0,
  repair: 0,
  downtime: 0,
  trips: 0,
  active: true,
} satisfies VehicleRow;

assert.equal(deriveFleetVehicleStatus({ ...baseFleetVehicle, repair: 2 }), "В ремонте");
assert.equal(deriveFleetVehicleStatus({ ...baseFleetVehicle, downtime: 2 }), "В простое");
assert.equal(deriveFleetVehicleStatus({ ...baseFleetVehicle, active: false }), "В простое");
assert.equal(deriveFleetVehicleStatus(baseFleetVehicle), "В работе");

const fleetListRows = createFleetVehicleListRows([
  baseFleetVehicle,
  { ...baseFleetVehicle, id: 2, visible: false },
  { ...baseFleetVehicle, id: 3, repair: 1, area: "Акбакай" },
]);
assert.deepEqual(fleetListRows.map((row) => row.id), [1, 3]);
assert.deepEqual(fleetListRows.map((row) => row.index), [1, 2]);
assert.equal(fleetListRows[0].equipmentType, "Самосвал");
assert.equal(fleetListRows[1].status, "В ремонте");

assert.match(lazyPrimaryContentSource, /import\("\.\/FleetPrimaryContent"\)/);
assert.match(vehicleTablePrimaryContentSource, /return <AdminVehiclesSection \{\.\.\.adminVehiclesProps\} \/>;/);
assert.match(appPrimaryContentSource, /renderedTopTab === "fleet"[\s\S]*<FleetPrimaryContent[\s\S]*appState=\{appState\}[\s\S]*models=\{models\}[\s\S]*runtime=\{runtime\}/);
assert.match(useAppDerivedModelsSource, /const vehicleTableActive = renderedTopTab === "fleet"/);
assert.doesNotMatch(appPrimaryContentSource, /rows=\{filteredFleet\}/);
assert.doesNotMatch(useAppDerivedModelsSource, /useFleetRows/);
assert.doesNotMatch(useSectionSelectionStateSource, /\bfleetTab\b|\bsetFleetTab\b/);
assert.match(vehicleTablePrimaryContentSource, /mode:\s*"readonly"\s*\|\s*"admin"/);
assert.match(vehicleTablePrimaryContentSource, /const canManageVehicles = true/);
assert.match(vehicleTablePrimaryContentSource, /canManageVehicles,/);
assert.match(fleetPrimaryContentSource, /return <FleetVehiclesSection vehicleRows=\{appState\.vehicleRows\} \/>;/);
assert.match(fleetPrimaryContentSource, /setAdminVehiclesEditing/);
assert.match(fleetPrimaryContentSource, /setSelectedVehicleCellKeys/);
assert.match(fleetPrimaryContentSource, /setEditingVehicleCell/);
assert.doesNotMatch(fleetPrimaryContentSource, /AdminVehiclesSection|useAppAdminVehiclesScreenProps|useAppVehicleControllers/);
assert.match(appPrimaryContentSource, /<FleetPrimaryContent[\s\S]*mode="readonly"/);
assert.match(adminVehiclesPrimaryContentSource, /<VehicleTablePrimaryContent[\s\S]*mode="admin"/);
assert.match(adminVehiclesSectionSource, /canManageVehicles\?: boolean/);
assert.match(adminVehiclesSectionSource, /canManageVehicles = false/);
assert.match(adminVehiclesSectionSource, /<AdminVehiclesToolbar[\s\S]*canManageVehicles=\{canManageVehicles\}/);
assert.match(adminVehiclesToolbarSource, /canManageVehicles: boolean/);
assert.match(adminVehiclesToolbarSource, /\{canManageVehicles \? \([\s\S]*onStartEditing[\s\S]*onAddVehicleRow[\s\S]*onOpenVehicleImportFilePicker[\s\S]*\) : null\}/);
assert.match(adminVehiclesToolbarSource, /\{canManageVehicles \? \([\s\S]*<input[\s\S]*onImportVehiclesFromExcel[\s\S]*\) : null\}/);
assert.match(fleetVehiclesSectionSource, /Закрепление водителей за техникой/);
assert.match(fleetVehiclesSectionSource, /Дата выхода в ремонт/);
assert.match(fleetVehiclesSectionSource, /Примечание/);
assert.match(fleetVehiclesSectionSource, /driversExpanded/);
assert.doesNotMatch(fleetVehiclesSectionSource, /Год выпуска|VIN|Собственник|manufactureYear|owner|vin/);
assert.match(fleetVehicleModelSource, /deriveFleetVehicleStatus/);
assert.match(fleetVehicleModelSource, /vehicle\.repair > 0[\s\S]*"В ремонте"/);
assert.match(fleetVehicleModelSource, /vehicle\.downtime > 0 \|\| vehicle\.active === false[\s\S]*"В простое"/);
assert.match(fleetVehicleModelSource, /vehicle\.visible !== false/);
assert.doesNotMatch(productionSources, /useFleetRows/);
