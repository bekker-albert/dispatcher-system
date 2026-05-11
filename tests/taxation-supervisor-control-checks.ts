import assert from "node:assert/strict";
import { buildTaxationSupervisorControlRows } from "../lib/domain/taxation/supervisorControl";
import type {
  ContractorFuelDebt,
  DriverVehicleAssignment,
  FuelAccountingPeriod,
  Waybill,
} from "../lib/domain/taxation/service-contracts";

const assignments: DriverVehicleAssignment[] = [
  {
    id: "assignment-1",
    version: 1,
    driverId: "driver-1",
    vehicleId: "truck-101",
    sectionId: "baktay",
    validFrom: "2026-05-01",
    priority: "primary",
  },
  {
    id: "assignment-2",
    version: 1,
    driverId: "driver-2",
    vehicleId: "truck-102",
    sectionId: "baktay",
    validFrom: "2026-05-01",
    priority: "primary",
  },
];

const waybills: Waybill[] = [
  {
    id: "waybill-1",
    version: 2,
    issueMode: "batch",
    workDate: "2026-05-08",
    sectionId: "baktay",
    shift: "day",
    driverId: "driver-1",
    vehicleId: "truck-101",
    status: "printed",
  },
];

const contractorDebts: ContractorFuelDebt[] = [{
  id: "debt-1",
  version: 1,
  contractorId: "contractor-1",
  sectionId: "baktay",
  periodId: "period-1",
  fuelType: "diesel",
  liters: 250,
  status: "open",
}];

const fuelPeriods: FuelAccountingPeriod[] = [{
  id: "period-1",
  version: 1,
  sectionId: "baktay",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  status: "reconciling",
}];

const [baktayControl] = buildTaxationSupervisorControlRows({
  workDate: "2026-05-08",
  rangeKind: "watch",
  sectionIds: ["baktay"],
  assignments,
  waybills,
  fuelIssues: [
    {
      id: "fuel-1",
      sectionId: "baktay",
      vehicleId: "truck-101",
      driverId: "driver-1",
      waybillId: "waybill-1",
      liters: 300,
    },
    {
      id: "fuel-without-waybill",
      sectionId: "baktay",
      vehicleId: "truck-999",
      liters: 100,
    },
  ],
  fuelNormRows: [
    { sectionId: "baktay", vehicleId: "truck-101", normLiters: 250, actualLiters: 300 },
    { sectionId: "baktay", vehicleId: "truck-102", normLiters: 500, actualLiters: 350 },
  ],
  contractorDebts,
  fuelPeriods,
});

assert.equal(baktayControl.sectionId, "baktay");
assert.equal(baktayControl.rangeKind, "watch");
assert.equal(baktayControl.assignedPairCount, 2);
assert.equal(baktayControl.issuedWaybillCount, 1);
assert.equal(baktayControl.missingWaybillCount, 1);
assert.equal(baktayControl.fuelWithoutWaybillCount, 1);
assert.equal(baktayControl.waybillWithoutFuelCount, 0);
assert.equal(baktayControl.overconsumptionLiters, 50);
assert.equal(baktayControl.suspiciousEconomyLiters, 150);
assert.equal(baktayControl.contractorDebtLiters, 250);
assert.equal(baktayControl.openFuelPeriodCount, 1);
assert.deepEqual(baktayControl.signals, [
  "missing_waybill_by_assignment",
  "fuel_issue_without_waybill",
  "overconsumption",
  "suspicious_economy",
  "contractor_debt_open",
  "fuel_period_not_closed",
]);

console.log("Taxation supervisor control checks passed");
