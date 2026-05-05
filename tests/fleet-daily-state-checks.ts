import assert from "node:assert/strict";

import {
  createDefaultFleetDailyState,
  deriveFleetOperationalStatus,
  findFleetDailyState,
  fleetDailyStateKey,
  fleetDriverShiftSlots,
  isFleetWorkDate,
  normalizeFleetDailyState,
  normalizeFleetDailyStates,
  resolveFleetDailyState,
  upsertFleetDailyState,
  type FleetDailyState,
} from "../lib/domain/fleet/daily-state";
import { createFleetVehicleListRows } from "../features/fleet/fleetVehicleModel";
import {
  createFleetVehicleVirtualRows,
  fleetVehicleVirtualizationThreshold,
} from "../features/fleet/fleetVehicleVirtualRows";
import type { VehicleRow } from "../lib/domain/vehicles/types";

const vehicle = {
  id: 10,
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

const dailyState = {
  vehicleId: 10,
  workDate: "2026-05-03",
  status: "В ремонте",
  repairStartedAt: "2026-05-02",
  repairReason: "Ремонт ДВС",
  note: "Ожидает запчасти",
  driverAssignments: {
    watch1Shift1: { driverId: "driver-1", driverName: "Иванов И.И." },
    watch2Shift2: { driverId: "driver-4", driverName: "Петров П.П." },
  },
} satisfies FleetDailyState;

assert.deepEqual(fleetDriverShiftSlots.map((slot) => slot.key), [
  "watch1Shift1",
  "watch1Shift2",
  "watch2Shift1",
  "watch2Shift2",
]);
assert.equal(fleetDailyStateKey(10, "2026-05-03"), "10:2026-05-03");
assert.equal(isFleetWorkDate("2026-05-03"), true);
assert.equal(isFleetWorkDate("03.05.2026"), false);
assert.equal(deriveFleetOperationalStatus({ ...vehicle, repair: 1 }), "В ремонте");
assert.equal(deriveFleetOperationalStatus({ ...vehicle, downtime: 1 }), "В простое");
assert.equal(deriveFleetOperationalStatus({ ...vehicle, active: false }), "В простое");
assert.equal(deriveFleetOperationalStatus(vehicle), "В работе");

assert.deepEqual(createDefaultFleetDailyState(vehicle, "2026-05-03"), {
  vehicleId: 10,
  workDate: "2026-05-03",
  status: "В работе",
  repairStartedAt: "",
  repairReason: "",
  note: "",
  driverAssignments: {},
});

assert.deepEqual(normalizeFleetDailyState({
  ...dailyState,
  status: "Неизвестно",
  driverAssignments: {
    watch1Shift1: { driverId: "driver-1", driverName: "Иванов И.И." },
    badSlot: { driverId: "bad", driverName: "Bad" },
  },
}), {
  ...dailyState,
  status: "В работе",
  driverAssignments: {
    watch1Shift1: { driverId: "driver-1", driverName: "Иванов И.И." },
  },
});
assert.equal(normalizeFleetDailyState({ ...dailyState, workDate: "03.05.2026" }), null);
assert.deepEqual(normalizeFleetDailyStates([dailyState, { bad: true }]), [dailyState]);
assert.deepEqual(findFleetDailyState([dailyState], 10, "2026-05-03"), dailyState);
assert.equal(findFleetDailyState([dailyState], 10, "2026-05-04"), null);
assert.deepEqual(resolveFleetDailyState(vehicle, [dailyState], "2026-05-03"), dailyState);
assert.equal(resolveFleetDailyState(vehicle, [], "2026-05-03").status, "В работе");
assert.deepEqual(upsertFleetDailyState([], dailyState), [dailyState]);
assert.deepEqual(upsertFleetDailyState([{ ...dailyState, note: "" }], dailyState), [dailyState]);

const [fleetRow] = createFleetVehicleListRows([vehicle], {
  workDate: "2026-05-03",
  dailyStates: [dailyState],
});
assert.equal(fleetRow.status, "В ремонте");
assert.equal(fleetRow.repairStartedAt, "2026-05-02");
assert.equal(fleetRow.firstWatchFirstShiftDriver, "Иванов И.И.");
assert.equal(fleetRow.secondWatchSecondShiftDriver, "Петров П.П.");
assert.equal(fleetRow.note, "Ремонт ДВС; Ожидает запчасти");

const fleetVirtualRows = createFleetVehicleVirtualRows(
  Array.from({ length: fleetVehicleVirtualizationThreshold + 40 }, (_, index) => index),
  { height: 120, scrollTop: 680 },
  true,
);
assert.ok(fleetVirtualRows.rows.length < fleetVehicleVirtualizationThreshold + 40);
assert.ok(fleetVirtualRows.topSpacerHeight > 0);
assert.ok(fleetVirtualRows.bottomSpacerHeight > 0);
assert.equal(
  createFleetVehicleVirtualRows([1, 2, 3], { height: 120, scrollTop: 340 }, true).rows.length,
  3,
);
