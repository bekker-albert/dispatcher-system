import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectSelectedVehicleFieldsById,
  createVehicleGridKeys,
  resolveVehicleCellByOffset,
  vehicleCellKey,
  vehicleCellRangeKeys,
  vehicleKeyStartsInlineEdit,
} from "../features/admin/vehicles/vehicleInlineGridModel";
import { createAdminVehicleVirtualRows } from "../features/admin/vehicles/adminVehicleVirtualRows";
import {
  clearVehicleInlineFields,
  vehicleInlineCellValue,
  vehicleInlineClearLogEntry,
  vehicleInlineEditLogEntry,
} from "../features/admin/vehicles/vehicleInlineEditModel";
import { resolveInitialVehicleRowsSource } from "../features/admin/vehicles/initialVehicleRows";
import {
  createVehicleFilterSets,
  vehicleMatchesFilterSets,
} from "../lib/domain/vehicles/filtering";
import type { VehicleRow } from "../lib/domain/vehicles/types";
import { adminStorageKeys } from "../lib/storage/keys";

const testDir = dirname(fileURLToPath(import.meta.url));
const adminVehiclesTableSource = readFileSync(resolve(testDir, "../features/admin/vehicles/AdminVehiclesTable.tsx"), "utf8");
const adminVehicleFilterMenuSource = readFileSync(resolve(testDir, "../features/admin/vehicles/AdminVehicleFilterMenu.tsx"), "utf8");

const rows = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
] as VehicleRow[];

assert.equal(vehicleCellKey({ id: 1, field: "brand" }), "1:brand");
assert.deepEqual(createVehicleGridKeys(rows)[0], [
  "1:vehicleType",
  "1:equipmentType",
  "1:brand",
  "1:model",
  "1:plateNumber",
  "1:garageNumber",
  "1:manufactureYear",
  "1:vin",
  "1:owner",
]);
assert.deepEqual(vehicleCellRangeKeys(
  rows,
  { id: 1, field: "equipmentType" },
  { id: 2, field: "brand" },
), [
  "1:equipmentType",
  "1:brand",
  "2:equipmentType",
  "2:brand",
]);
assert.deepEqual(vehicleCellRangeKeys(
  rows,
  { id: 3, field: "owner" },
  { id: 2, field: "vin" },
), [
  "2:vin",
  "2:owner",
  "3:vin",
  "3:owner",
]);
assert.deepEqual(vehicleCellRangeKeys(
  rows,
  { id: 1, field: "brand" },
  { id: 404, field: "owner" },
), ["404:owner"]);
assert.deepEqual(resolveVehicleCellByOffset(rows, { id: 1, field: "brand" }, 1, 0), {
  id: 2,
  field: "brand",
});
assert.deepEqual(resolveVehicleCellByOffset(rows, { id: 1, field: "vehicleType" }, 0, -1), {
  id: 1,
  field: "vehicleType",
});
assert.deepEqual(resolveVehicleCellByOffset(rows, { id: 1, field: "owner" }, 10, 10), {
  id: 3,
  field: "owner",
});
assert.equal(resolveVehicleCellByOffset(rows, { id: 404, field: "brand" }, 1, 0), null);
assert.equal(resolveVehicleCellByOffset([], { id: 1, field: "brand" }, 1, 0), null);

const fieldsById = collectSelectedVehicleFieldsById(["1:brand", "1:model", "2:vin", "bad", "2:vin", "NaN:brand"]);
assert.deepEqual(Array.from(fieldsById.get(1) ?? []), ["brand", "model"]);
assert.deepEqual(Array.from(fieldsById.get(2) ?? []), ["vin"]);
assert.equal(fieldsById.has(Number.NaN), false);

assert.equal(vehicleKeyStartsInlineEdit("brand", "K"), true);
assert.equal(vehicleKeyStartsInlineEdit("brand", "x"), true);
assert.equal(vehicleKeyStartsInlineEdit("manufactureYear", "2"), true);
assert.equal(vehicleKeyStartsInlineEdit("manufactureYear", "A"), false);
assert.equal(vehicleKeyStartsInlineEdit("manufactureYear", "."), false);
assert.equal(vehicleKeyStartsInlineEdit("brand", "Enter"), false);
assert.equal(vehicleKeyStartsInlineEdit("brand", ""), false);
assert.match(adminVehiclesTableSource, /createAdminVehicleVirtualRows\(visibleVehicleRows, vehicleRowsViewport, !adminVehiclesEditing\)/);
assert.match(adminVehiclesTableSource, /onScroll=\{scheduleVehicleRowsViewportUpdate\}/);
assert.match(adminVehiclesTableSource, /virtualVehicleRows\.topSpacerHeight/);

const virtualSourceRows = Array.from({ length: 120 }, (_, index) => index);
assert.deepEqual(
  createAdminVehicleVirtualRows(virtualSourceRows, { height: 120, scrollTop: 600 }, false),
  { rows: virtualSourceRows, topSpacerHeight: 0, bottomSpacerHeight: 0 },
);

const virtualVehicleRows = createAdminVehicleVirtualRows(virtualSourceRows, { height: 120, scrollTop: 600 }, true);
assert.equal(virtualVehicleRows.rows[0], 12);
assert.equal(virtualVehicleRows.topSpacerHeight, 360);
assert.equal(virtualVehicleRows.rows.length < virtualSourceRows.length, true);
assert.equal(virtualVehicleRows.bottomSpacerHeight > 0, true);

const vehicleRows = [
  {
    id: 10,
    name: "Old",
    vehicleType: "Transport",
    equipmentType: "Truck",
    brand: "Howo",
    model: "A7",
    plateNumber: "123",
    garageNumber: "55",
    manufactureYear: "2022",
    fuelNormWinter: 0,
    fuelNormSummer: 0,
    fuelCalcType: "Пробег",
    vin: "VIN-1",
    owner: "Owner",
    contractor: "Owner",
    area: "",
    location: "",
    workType: "",
    excavator: "",
    work: 0,
    rent: 0,
    repair: 0,
    downtime: 0,
    trips: 0,
    active: true,
  },
] as VehicleRow[];
const vehicleFilterColumns = [
  { key: "brand", getValue: (vehicle: VehicleRow) => vehicle.brand ?? "" },
  { key: "owner", getValue: (vehicle: VehicleRow) => vehicle.owner ?? "" },
];
const vehicleFilterSets = createVehicleFilterSets({ brand: ["Howo"] });

assert.equal(vehicleMatchesFilterSets(vehicleRows[0], vehicleFilterSets, vehicleFilterColumns), true);
assert.equal(vehicleMatchesFilterSets({ ...vehicleRows[0], brand: "Shacman" }, vehicleFilterSets, vehicleFilterColumns), false);
assert.equal(vehicleMatchesFilterSets({ ...vehicleRows[0], brand: "Shacman" }, vehicleFilterSets, vehicleFilterColumns, "brand"), true);
assert.match(adminVehicleFilterMenuSource, /const visibleOptions = useMemo\(\(\) => \{/);
assert.match(adminVehicleFilterMenuSource, /const selectedSet = useMemo\(\(\) => new Set\(draftSelectedValues \?\? \[\]\), \[draftSelectedValues\]\);/);
assert.match(adminVehicleFilterMenuSource, /vehicleFilterOptionLabel\(option\);/);

const vehicleClearFields = new Map([[10, new Set(["brand", "owner"] as const)]]);
const clearedVehicleRows = clearVehicleInlineFields(vehicleRows, vehicleClearFields);
assert.equal(vehicleInlineCellValue(vehicleRows, 10, "brand"), "Howo");
assert.equal(vehicleInlineCellValue(vehicleRows, 404, "brand"), "");
assert.equal(clearedVehicleRows[0].brand, "");
assert.equal(clearedVehicleRows[0].owner, "");
assert.equal(clearedVehicleRows[0].contractor, "");
assert.equal(vehicleInlineClearLogEntry(3).details, "Очищены выбранные ячейки: 3.");
assert.match(vehicleInlineEditLogEntry(vehicleRows, 10, "brand").details, /Изменено поле/);

assert.equal(adminStorageKeys.vehiclesLocalUpdatedAt, "dispatcher:vehicles-local-updated-at");
assert.equal(resolveInitialVehicleRowsSource({
  savedVehicles: [],
  databaseUpdatedAt: "2026-04-24T10:00:00.000Z",
  vehicleLocalUpdatedAt: "2026-04-24T12:00:00.000Z",
  appLocalUpdatedAt: null,
}), "local");
assert.equal(resolveInitialVehicleRowsSource({
  savedVehicles: rows,
  databaseUpdatedAt: "2026-04-24T12:00:00.000Z",
  vehicleLocalUpdatedAt: "2026-04-24T10:00:00.000Z",
  appLocalUpdatedAt: "2026-04-24T13:00:00.000Z",
}), "database");
assert.equal(resolveInitialVehicleRowsSource({
  savedVehicles: rows,
  databaseUpdatedAt: "2026-04-24T10:00:00.000Z",
  vehicleLocalUpdatedAt: null,
  appLocalUpdatedAt: "2026-04-24T12:00:00.000Z",
}), "local");
assert.equal(resolveInitialVehicleRowsSource({
  savedVehicles: null,
  databaseUpdatedAt: "2026-04-24T10:00:00.000Z",
  vehicleLocalUpdatedAt: "2026-04-24T12:00:00.000Z",
  appLocalUpdatedAt: null,
}), "database");
