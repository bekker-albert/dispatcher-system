import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createFleetVehicleExportRows } from "../features/fleet/fleetVehicleExcelExport";
import { createFleetVehicleListRows, deriveFleetVehicleStatus } from "../features/fleet/fleetVehicleModel";
import type { VehicleRow } from "../lib/domain/vehicles/types";
import { resetVehicleInteractionState } from "../shared/editable-grid/resetVehicleInteractionState";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(testDir, "..");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const appPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/AppPrimaryContent.tsx"), "utf8");
const fleetPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/FleetPrimaryContent.tsx"), "utf8");
const fleetPlacementSource = readFileSync(resolve(testDir, "../features/fleet/FleetPlacementSection.tsx"), "utf8");
const lazyPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/lazyPrimaryContent.tsx"), "utf8");
const resetVehicleInteractionStateSource = readFileSync(resolve(testDir, "../shared/editable-grid/resetVehicleInteractionState.ts"), "utf8");
const useAppDerivedModelsSource = readFileSync(resolve(testDir, "../features/app/useAppDerivedModels.ts"), "utf8");
const useSectionSelectionStateSource = readFileSync(resolve(testDir, "../features/navigation/useSectionSelectionState.ts"), "utf8");
const vehicleTablePrimaryContentSource = readFileSync(resolve(testDir, "../features/app/VehicleTablePrimaryContent.tsx"), "utf8");
const adminVehiclesPrimaryContentSource = readFileSync(resolve(testDir, "../features/app/AdminVehiclesPrimaryContent.tsx"), "utf8");
const adminVehiclesSectionSource = readFileSync(resolve(testDir, "../features/admin/vehicles/AdminVehiclesSection.tsx"), "utf8");
const adminVehiclesToolbarSource = readFileSync(resolve(testDir, "../features/admin/vehicles/AdminVehiclesToolbar.tsx"), "utf8");
const fleetVehiclesSectionSource = [
  readFileSync(resolve(testDir, "../features/fleet/FleetVehiclesSection.tsx"), "utf8"),
  readFileSync(resolve(testDir, "../features/fleet/fleetVehicleColumnControls.tsx"), "utf8"),
  readFileSync(resolve(testDir, "../features/fleet/fleetVehicleTableStyles.ts"), "utf8"),
  readFileSync(resolve(testDir, "../features/fleet/fleetVehicleVirtualRows.ts"), "utf8"),
].join("\n");
const fleetVehicleModelSource = readFileSync(resolve(testDir, "../features/fleet/fleetVehicleModel.ts"), "utf8");
const fleetVehicleExcelExportSource = readFileSync(resolve(testDir, "../features/fleet/fleetVehicleExcelExport.ts"), "utf8");
const fleetDailyStateSource = readFileSync(resolve(testDir, "../lib/domain/fleet/daily-state.ts"), "utf8");

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
  fuelCardNumber: "FC-1",
  manufactureYear: "2020",
  fuelNormWinter: 0,
  fuelNormSummer: 0,
  fuelCalcType: "" as VehicleRow["fuelCalcType"],
  vin: "VIN123",
  owner: "AA Mining",
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
assert.equal(fleetListRows[0].vehicleType, "Транспорт");
assert.equal(fleetListRows[0].fuelCardNumber, "FC-1");
assert.equal(fleetListRows[0].manufactureYear, "2020");
assert.equal(fleetListRows[0].vin, "VIN123");
assert.equal(fleetListRows[0].owner, "AA Mining");
assert.equal(fleetListRows[1].status, "В ремонте");

const fleetListRowsWithDrivers = createFleetVehicleListRows([baseFleetVehicle], {
  workDate: "2026-05-20",
  dailyStates: [{
    vehicleId: 1,
    workDate: "2026-05-20",
    status: "В работе",
    repairStartedAt: "",
    repairReason: "",
    note: "",
    driverAssignments: {
      watch1Shift1: { driverId: "driver-1", driverName: "Иванов И.И." },
      watch2Shift2: { driverId: "driver-4", driverName: "Петров П.П." },
    },
  }],
});
const fleetExportRows = createFleetVehicleExportRows(fleetListRowsWithDrivers);
assert.deepEqual(fleetExportRows[0].slice(11, 15), [
  "1 вахта / 1 смена",
  "1 вахта / 2 смена",
  "2 вахта / 1 смена",
  "2 вахта / 2 смена",
]);
assert.equal(fleetExportRows[1][11], "Иванов И.И.");
assert.equal(fleetExportRows[1][14], "Петров П.П.");

assert.match(lazyPrimaryContentSource, /import\("\.\/FleetPrimaryContent"\)/);
assert.match(vehicleTablePrimaryContentSource, /return <AdminVehiclesSection \{\.\.\.adminVehiclesProps\} \/>;/);
assert.match(appPrimaryContentSource, /renderedTopTab === "fleet"[\s\S]*<FleetPrimaryContent[\s\S]*appState=\{appState\}[\s\S]*models=\{models\}[\s\S]*runtime=\{runtime\}/);
assert.match(useAppDerivedModelsSource, /const vehicleTableActive = renderedTopTab === "fleet"/);
assert.doesNotMatch(appPrimaryContentSource, /rows=\{filteredFleet\}/);
assert.doesNotMatch(useAppDerivedModelsSource, /useFleetRows/);
assert.match(useSectionSelectionStateSource, /\bfleetTab\b/);
assert.match(useSectionSelectionStateSource, /\bsetFleetTab\b/);
assert.match(vehicleTablePrimaryContentSource, /mode:\s*"readonly"\s*\|\s*"admin"/);
assert.match(vehicleTablePrimaryContentSource, /const canManageVehicles = true/);
assert.match(vehicleTablePrimaryContentSource, /canManageVehicles,/);
assert.match(fleetPrimaryContentSource, /fleetTab === "placement"/);
assert.match(fleetPrimaryContentSource, /<FleetPlacementSection[\s\S]*vehicleRows=\{models\.filteredVehicleRows\}/);
assert.match(fleetPrimaryContentSource, /ptoPlanRows=\{appState\.ptoPlanRows\}/);
assert.doesNotMatch(fleetPrimaryContentSource, /setVehicleRows=\{appState\.setVehicleRows\}/);
assert.match(fleetPrimaryContentSource, /useAppVehicleControllers/);
assert.match(fleetPrimaryContentSource, /useAppAdminVehiclesScreenProps/);
assert.match(fleetPrimaryContentSource, /AdminVehiclesSection/);
assert.match(fleetPrimaryContentSource, /exportFleetVehiclesToExcel/);
assert.match(fleetPrimaryContentSource, /<FleetVehiclesSection[\s\S]*filterControls=\{adminVehiclesProps\}[\s\S]*vehicleRows=\{models\.filteredVehicleRows\}[\s\S]*workDate=\{appState\.reportDate\}[\s\S]*onExportVehiclesToExcel=\{exportFleetVehiclesToExcel\}/);
assert.match(fleetPlacementSource, /<SectionCard title=""/);
assert.doesNotMatch(fleetPlacementSource, /Draft UI|источник выбора техники/);
assert.match(fleetPlacementSource, /Редактировать/);
assert.match(fleetPlacementSource, /fleetPlacementStorageKey/);
assert.match(fleetPlacementSource, /downloadFleetPlacementRowsToExcel/);
assert.match(fleetPlacementSource, /parseFleetPlacementImportFile/);
assert.match(fleetPlacementSource, /updateVehiclePlacement/);
assert.match(fleetPlacementSource, /locationsByArea/);
assert.doesNotMatch(fleetPlacementSource, /setVehicleRows\(\(currentRows\)|updateVehicleIdentity|vehicleSelectLabel|buildVehicleDisplayName/);
assert.match(fleetPrimaryContentSource, /resetVehicleInteractionState/);
assert.match(fleetPrimaryContentSource, /showEditableDirectory/);
assert.match(appPrimaryContentSource, /<FleetPrimaryContent[\s\S]*mode="readonly"/);
assert.match(resetVehicleInteractionStateSource, /setAdminVehiclesEditing/);
assert.match(resetVehicleInteractionStateSource, /setPendingVehicleFocus/);
assert.match(resetVehicleInteractionStateSource, /setSelectedVehicleCellKeys/);
assert.match(resetVehicleInteractionStateSource, /setVehicleCellInitialDraft/);

type VehicleInteractionResetFixture = {
  activeVehicleCell: string | null;
  adminVehiclesEditing: boolean;
  editingVehicleCell: string | null;
  pendingVehicleFocus: { id: number } | null;
  selectedVehicleCellKeys: string[];
  vehicleCellDraft: string;
  vehicleCellInitialDraft: string;
  vehicleSelectionAnchorCell: { id: number; field: string } | null;
};

function fixtureSetter<K extends keyof VehicleInteractionResetFixture>(
  fixture: VehicleInteractionResetFixture,
  key: K,
) {
  return (
    update: VehicleInteractionResetFixture[K] |
      ((current: VehicleInteractionResetFixture[K]) => VehicleInteractionResetFixture[K]),
  ) => {
    fixture[key] = typeof update === "function"
      ? (update as (current: VehicleInteractionResetFixture[K]) => VehicleInteractionResetFixture[K])(fixture[key])
      : update;
  };
}

const vehicleInteractionResetFixture: VehicleInteractionResetFixture = {
  activeVehicleCell: "1::brand",
  adminVehiclesEditing: true,
  editingVehicleCell: "1::model",
  pendingVehicleFocus: { id: 1 },
  selectedVehicleCellKeys: ["1::brand", "1::model"],
  vehicleCellDraft: "draft",
  vehicleCellInitialDraft: "initial",
  vehicleSelectionAnchorCell: { id: 1, field: "brand" },
};

resetVehicleInteractionState({
  setActiveVehicleCell: fixtureSetter(vehicleInteractionResetFixture, "activeVehicleCell"),
  setAdminVehiclesEditing: fixtureSetter(vehicleInteractionResetFixture, "adminVehiclesEditing"),
  setEditingVehicleCell: fixtureSetter(vehicleInteractionResetFixture, "editingVehicleCell"),
  setPendingVehicleFocus: fixtureSetter(vehicleInteractionResetFixture, "pendingVehicleFocus"),
  setSelectedVehicleCellKeys: fixtureSetter(vehicleInteractionResetFixture, "selectedVehicleCellKeys"),
  setVehicleCellDraft: fixtureSetter(vehicleInteractionResetFixture, "vehicleCellDraft"),
  setVehicleCellInitialDraft: fixtureSetter(vehicleInteractionResetFixture, "vehicleCellInitialDraft"),
  setVehicleSelectionAnchorCell: fixtureSetter(vehicleInteractionResetFixture, "vehicleSelectionAnchorCell"),
});
assert.deepEqual(vehicleInteractionResetFixture, {
  activeVehicleCell: null,
  adminVehiclesEditing: false,
  editingVehicleCell: null,
  pendingVehicleFocus: null,
  selectedVehicleCellKeys: [],
  vehicleCellDraft: "",
  vehicleCellInitialDraft: "",
  vehicleSelectionAnchorCell: null,
});
assert.match(adminVehiclesPrimaryContentSource, /<VehicleTablePrimaryContent[\s\S]*mode="admin"/);
assert.match(adminVehiclesSectionSource, /canManageVehicles\?: boolean/);
assert.match(adminVehiclesSectionSource, /canManageVehicles = false/);
assert.match(adminVehiclesSectionSource, /<AdminVehiclesToolbar[\s\S]*canManageVehicles=\{canManageVehicles\}/);
assert.match(adminVehiclesToolbarSource, /canManageVehicles: boolean/);
assert.match(adminVehiclesToolbarSource, /\{canManageVehicles \? \([\s\S]*onStartEditing[\s\S]*onAddVehicleRow[\s\S]*\) : null\}/);
assert.match(adminVehiclesToolbarSource, /\{!adminVehiclesEditing \? \([\s\S]*onExportVehiclesToExcel[\s\S]*\) : null\}/);
assert.doesNotMatch(adminVehiclesToolbarSource, /RotateCcw/);
assert.match(adminVehiclesToolbarSource, /\{canManageVehicles \? \([\s\S]*<input[\s\S]*onImportVehiclesFromExcel[\s\S]*\) : null\}/);
assert.match(fleetVehiclesSectionSource, /firstWatchFirstShiftDriver[\s\S]*secondWatchSecondShiftDriver/);
assert.match(fleetVehiclesSectionSource, /filterKey="vehicleType"[\s\S]*filterKey="equipmentType"[\s\S]*filterKey="brand"/);
assert.doesNotMatch(fleetVehiclesSectionSource, /filterKey="area"|filterKey="location"/);
assert.match(fleetVehiclesSectionSource, /AdminVehicleFilterHeader/);
assert.match(fleetVehiclesSectionSource, /filterControls\?: FleetVehicleFilterControls/);
assert.match(fleetVehiclesSectionSource, /filterKey="manufactureYear"/);
assert.match(fleetVehiclesSectionSource, /filterKey="vin"/);
assert.match(fleetVehiclesSectionSource, /filterKey="owner"/);
assert.match(fleetVehiclesSectionSource, /filterKey="fuelCardNumber"/);
assert.match(fleetVehiclesSectionSource, /collapsibleFleetVehicleColumns[\s\S]*fuelCardNumber[\s\S]*manufactureYear[\s\S]*vin[\s\S]*owner/);
assert.match(fleetVehiclesSectionSource, /fuelCardNumber: true[\s\S]*manufactureYear: true[\s\S]*vin: true[\s\S]*owner: true/);
assert.match(fleetVehiclesSectionSource, /printExpandedColumns[\s\S]*fuelCardNumber: false[\s\S]*manufactureYear: false[\s\S]*vin: false[\s\S]*owner: false/);
assert.match(fleetVehiclesSectionSource, /displayedCollapsedColumns = isPreparingPrint \? printExpandedColumns : collapsedColumns/);
assert.match(fleetVehiclesSectionSource, /displayedDriversExpanded = isPreparingPrint \|\| driversExpanded/);
assert.match(fleetVehiclesSectionSource, /displayedFilterControls = isPreparingPrint \? undefined : filterControls/);
assert.match(fleetVehiclesSectionSource, /columnToggleButtonActiveStyle/);
assert.match(fleetVehiclesSectionSource, /toggleColumnCollapsed/);
assert.match(fleetVehiclesSectionSource, /activeVehicleFilterCount/);
assert.match(fleetVehiclesSectionSource, /onClearAllVehicleFilters/);
assert.match(fleetVehiclesSectionSource, /height: "calc\(100vh - 150px\)"/);
assert.match(fleetVehiclesSectionSource, /flex: "1 1 auto"[\s\S]*overflow: "hidden"/);
assert.match(fleetVehiclesSectionSource, /onOpenVehicleImportFilePicker/);
assert.match(fleetVehiclesSectionSource, /onExportVehiclesToExcel\?: \(rows: FleetVehicleListRow\[\]\) => void \| Promise<void>/);
assert.match(fleetVehiclesSectionSource, /onStartEditing/);
assert.match(fleetVehiclesSectionSource, /<Pencil size=\{16\} aria-hidden \/>[\s\S]*<Printer size=\{16\} aria-hidden \/>/);
assert.match(fleetVehiclesSectionSource, /dailyStates = \[\]/);
assert.match(fleetVehiclesSectionSource, /createFleetVehicleListRows\(vehicleRows, \{ workDate, dailyStates \}\)/);
assert.match(fleetVehiclesSectionSource, /driversExpanded/);
assert.match(fleetVehiclesSectionSource, /createFleetVehicleVirtualRows/);
assert.match(fleetVehiclesSectionSource, /shouldDisableFleetVehicleVirtualizationForRows/);
assert.match(fleetVehiclesSectionSource, /hasVariableHeightRows/);
assert.match(fleetVehiclesSectionSource, /isPreparingPrint/);
assert.match(fleetVehiclesSectionSource, /afterprint/);
assert.match(fleetVehiclesSectionSource, /classList\.add\("fleet-print-mode"\)/);
assert.match(fleetVehiclesSectionSource, /classList\.remove\("fleet-print-mode"\)/);
assert.match(fleetVehiclesSectionSource, /window\.requestAnimationFrame\(\(\) => window\.print\(\)\)/);
assert.match(fleetVehiclesSectionSource, /className="fleet-print-toolbar"/);
assert.match(fleetVehiclesSectionSource, /@media print/);
assert.match(fleetVehiclesSectionSource, /size: A3 landscape/);
assert.match(fleetVehiclesSectionSource, /margin: 0\.5cm/);
assert.match(fleetVehiclesSectionSource, /html\.fleet-print-mode body \*/);
assert.match(fleetVehiclesSectionSource, /body:has\(\.fleet-print-area\) \*/);
assert.match(fleetVehiclesSectionSource, /html\.fleet-print-mode \.erp-shell[\s\S]*grid-template-columns: none !important/);
assert.match(fleetVehiclesSectionSource, /\.erp-sidebar[\s\S]*\.erp-topbar[\s\S]*display: none !important/);
assert.match(fleetVehiclesSectionSource, /\.fleet-print-toolbar[\s\S]*display: none !important/);
assert.match(fleetVehiclesSectionSource, /width: 100% !important[\s\S]*min-width: 0 !important[\s\S]*max-width: 100% !important/);
assert.match(fleetVehiclesSectionSource, /page-break-inside: auto !important/);
assert.match(fleetVehiclesSectionSource, /display: table-header-group !important/);
assert.match(fleetVehiclesSectionSource, /break-inside: avoid !important/);
assert.match(fleetVehiclesSectionSource, /row\.fuelCardNumber[\s\S]*row\.manufactureYear[\s\S]*row\.vin[\s\S]*row\.owner/);
assert.match(fleetVehicleExcelExportSource, /createFleetVehicleExportRows/);
assert.match(fleetVehicleExcelExportSource, /firstWatchFirstShiftDriver[\s\S]*secondWatchSecondShiftDriver/);
assert.doesNotMatch(fleetVehicleExcelExportSource, /row\.status|row\.repairStartedAt|row\.note/);
assert.match(adminVehiclesSectionSource, /vehicleFilterColumns=\{vehicleFilterColumns\}/);
assert.match(fleetVehicleModelSource, /deriveFleetVehicleStatus/);
assert.match(fleetVehicleModelSource, /resolveFleetDailyState/);
assert.match(fleetDailyStateSource, /vehicle\.repair > 0[\s\S]*"В ремонте"/);
assert.match(fleetDailyStateSource, /vehicle\.downtime > 0 \|\| vehicle\.active === false[\s\S]*"В простое"/);
assert.match(fleetDailyStateSource, /fleetDailyStateKey/);
assert.match(fleetVehicleModelSource, /vehicle\.visible !== false/);
assert.doesNotMatch(productionSources, /useFleetRows/);
