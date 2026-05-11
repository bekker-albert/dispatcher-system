import assert from "node:assert/strict";
import {
  createTemporaryAssignmentCommandFromPetition,
  doAssignmentPeriodsOverlap,
  findAssignmentPetitionOverlapConflicts,
} from "../lib/domain/taxation/assignmentPetitions";
import {
  buildFuelTruckBalanceRows,
  createFuelAccountingPeriodDraft,
  summarizeFuelTruckBalanceRows,
} from "../lib/domain/taxation/fuelAccounting";
import {
  buildWaybillDuplicateKey,
  createBatchWaybillIssuePlan,
  createSingleWaybillIssueCommand,
  isDriverVehicleAssignmentActiveOnDate,
  selectEffectiveWaybillAssignments,
} from "../lib/domain/taxation/waybillIssuance";
import type {
  AssignmentPetition,
  DriverVehicleAssignment,
  FuelAccountingPeriod,
  FuelMovement,
  Waybill,
} from "../lib/domain/taxation/service-contracts";

const primaryAssignment: DriverVehicleAssignment = {
  id: "assignment-primary",
  version: 1,
  driverId: "driver-1",
  vehicleId: "truck-101",
  sectionId: "baktay",
  validFrom: "2026-05-01",
  priority: "primary",
};

const temporaryAssignment: DriverVehicleAssignment = {
  id: "assignment-temp",
  version: 1,
  driverId: "driver-1",
  vehicleId: "truck-101",
  sectionId: "baktay",
  validFrom: "2026-05-08",
  validTo: "2026-05-09",
  priority: "temporary",
  petitionId: "petition-1",
};

const secondAssignment: DriverVehicleAssignment = {
  id: "assignment-second",
  version: 1,
  driverId: "driver-2",
  vehicleId: "truck-102",
  sectionId: "baktay",
  validFrom: "2026-05-01",
  priority: "primary",
};

const request = {
  workDate: "2026-05-08",
  sectionId: "baktay",
  shift: "day" as const,
  watchId: "watch-1",
};

assert.equal(isDriverVehicleAssignmentActiveOnDate(primaryAssignment, request.workDate), true);
assert.equal(isDriverVehicleAssignmentActiveOnDate({
  ...primaryAssignment,
  validTo: "2026-05-07",
}, request.workDate), false);

const selectedAssignments = selectEffectiveWaybillAssignments(
  request,
  [primaryAssignment, temporaryAssignment, secondAssignment],
);
assert.deepEqual(
  selectedAssignments.effectiveAssignments.map((assignment) => assignment.id),
  ["assignment-temp", "assignment-second"],
);
assert.equal(selectedAssignments.skipped[0].reason, "superseded_by_temporary_assignment");
assert.equal(selectedAssignments.conflicts.length, 0);

const conflictSelection = selectEffectiveWaybillAssignments(
  request,
  [
    primaryAssignment,
    {
      ...secondAssignment,
      id: "assignment-conflict",
      driverId: primaryAssignment.driverId,
    },
  ],
);
assert.equal(conflictSelection.conflicts[0].kind, "driver_has_multiple_vehicles");

const existingWaybill: Waybill = {
  id: "waybill-existing",
  version: 3,
  issueMode: "batch",
  workDate: request.workDate,
  sectionId: request.sectionId,
  shift: request.shift,
  watchId: request.watchId,
  driverId: temporaryAssignment.driverId,
  vehicleId: temporaryAssignment.vehicleId,
  status: "printed",
};

const batchPlan = createBatchWaybillIssuePlan({
  ...request,
  assignments: [primaryAssignment, temporaryAssignment, secondAssignment],
  existingWaybills: [existingWaybill],
});
assert.equal(batchPlan.commands.length, 1);
assert.equal(batchPlan.commands[0].driverId, "driver-2");
assert.equal(batchPlan.commands[0].issueMode, "batch");
assert.ok(batchPlan.skipped.some((item) => item.reason === "already_created" && item.canReprint));
assert.equal(buildWaybillDuplicateKey(existingWaybill), "2026-05-08|baktay|day|driver-1|truck-101");

const rejectedSingleWaybill = createSingleWaybillIssueCommand({
  ...request,
  driverId: "driver-extra",
  vehicleId: "truck-extra",
  assignments: [primaryAssignment],
  existingWaybills: [],
});
assert.equal(rejectedSingleWaybill.ok, false);
if (!rejectedSingleWaybill.ok) {
  assert.equal(rejectedSingleWaybill.rejection.code, "basis_required");
}

const acceptedSingleWaybill = createSingleWaybillIssueCommand({
  ...request,
  driverId: "driver-extra",
  vehicleId: "truck-extra",
  assignments: [primaryAssignment],
  existingWaybills: [],
  basis: "replacement trip",
});
assert.equal(acceptedSingleWaybill.ok, true);
if (acceptedSingleWaybill.ok) {
  assert.equal(acceptedSingleWaybill.command.issueMode, "single");
  assert.equal(acceptedSingleWaybill.command.basis, "replacement trip");
}

const approvedPetition: AssignmentPetition = {
  id: "petition-1",
  version: 1,
  sectionId: "baktay",
  driverId: "driver-3",
  vehicleId: "truck-103",
  validFrom: "2026-05-08",
  validTo: "2026-05-10",
  status: "approved",
  requestedBy: "chief-1",
  approvedBy: "dispatch-chief",
  reason: "temporary replacement",
};
assert.equal(doAssignmentPeriodsOverlap(
  approvedPetition,
  { ...primaryAssignment, validFrom: "2026-05-09", validTo: "2026-05-12" },
), true);
const temporaryAssignmentCommand = createTemporaryAssignmentCommandFromPetition(
  approvedPetition,
  [primaryAssignment],
);
assert.equal(temporaryAssignmentCommand.ok, true);
if (temporaryAssignmentCommand.ok) {
  assert.equal(temporaryAssignmentCommand.command.priority, "temporary");
  assert.equal(temporaryAssignmentCommand.command.petitionId, "petition-1");
}

const conflictingPetition = {
  ...approvedPetition,
  id: "petition-conflict",
  driverId: primaryAssignment.driverId,
  vehicleId: "truck-999",
};
const petitionConflicts = findAssignmentPetitionOverlapConflicts(conflictingPetition, [primaryAssignment]);
assert.equal(petitionConflicts[0].kind, "driver_has_overlapping_assignment");
const rejectedTemporaryAssignment = createTemporaryAssignmentCommandFromPetition(
  conflictingPetition,
  [primaryAssignment],
);
assert.equal(rejectedTemporaryAssignment.ok, false);
if (!rejectedTemporaryAssignment.ok) {
  assert.equal(rejectedTemporaryAssignment.rejection.code, "overlap_conflict");
}

assert.deepEqual(createFuelAccountingPeriodDraft("baktay", "2026-05-15"), {
  sectionId: "baktay",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  periodKind: "first_half",
});
assert.deepEqual(createFuelAccountingPeriodDraft("baktay", "2026-02-16"), {
  sectionId: "baktay",
  periodStart: "2026-02-16",
  periodEnd: "2026-02-28",
  periodKind: "second_half",
});

const fuelPeriod: FuelAccountingPeriod = {
  id: "fuel-period-1",
  version: 1,
  sectionId: "baktay",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  status: "open",
};
const fuelMovements: FuelMovement[] = [
  {
    id: "fuel-receipt",
    version: 1,
    periodId: fuelPeriod.id,
    movementKind: "fuel_truck_receipt",
    fuelType: "diesel",
    liters: 1000,
    fuelTruckVehicleId: "fuel-truck-1",
    supplierInvoiceId: "invoice-1",
  },
  {
    id: "fuel-vehicle",
    version: 1,
    periodId: fuelPeriod.id,
    movementKind: "vehicle_issue",
    fuelType: "diesel",
    liters: 300,
    fuelTruckVehicleId: "fuel-truck-1",
    vehicleId: "truck-101",
    driverId: "driver-1",
    waybillId: "waybill-1",
  },
  {
    id: "fuel-contractor",
    version: 1,
    periodId: fuelPeriod.id,
    movementKind: "contractor_transfer",
    fuelType: "diesel",
    liters: 120,
    fuelTruckVehicleId: "fuel-truck-1",
    contractorId: "contractor-1",
  },
  {
    id: "fuel-write-off",
    version: 1,
    periodId: fuelPeriod.id,
    movementKind: "write_off",
    fuelType: "diesel",
    liters: 10,
    fuelTruckVehicleId: "fuel-truck-1",
  },
  {
    id: "fuel-correction",
    version: 1,
    periodId: fuelPeriod.id,
    movementKind: "correction",
    fuelType: "diesel",
    liters: 5,
    fuelTruckVehicleId: "fuel-truck-1",
  },
  {
    id: "fuel-other-period",
    version: 1,
    periodId: "fuel-period-2",
    movementKind: "vehicle_issue",
    fuelType: "diesel",
    liters: 999,
    fuelTruckVehicleId: "fuel-truck-1",
  },
];
const fuelTruckBalances = buildFuelTruckBalanceRows(
  fuelPeriod,
  fuelMovements,
  [{
    periodId: fuelPeriod.id,
    fuelTruckVehicleId: "fuel-truck-1",
    fuelType: "diesel",
    openingLiters: 500,
  }],
  [{
    periodId: fuelPeriod.id,
    fuelTruckVehicleId: "fuel-truck-1",
    fuelType: "diesel",
    actualClosingLiters: 1070,
  }],
);
assert.equal(fuelTruckBalances[0].supplierReceiptLiters, 1000);
assert.equal(fuelTruckBalances[0].vehicleIssueLiters, 300);
assert.equal(fuelTruckBalances[0].contractorTransferLiters, 120);
assert.equal(fuelTruckBalances[0].calculatedClosingLiters, 1075);
assert.equal(fuelTruckBalances[0].discrepancyLiters, -5);
assert.deepEqual(summarizeFuelTruckBalanceRows(fuelTruckBalances), {
  rowCount: 1,
  openingLiters: 500,
  supplierReceiptLiters: 1000,
  vehicleIssueLiters: 300,
  contractorTransferLiters: 120,
  writeOffLiters: 10,
  correctionLiters: 5,
  calculatedClosingLiters: 1075,
  actualClosingLiters: 1070,
  discrepancyLiters: -5,
});

console.log("Taxation domain checks passed");
