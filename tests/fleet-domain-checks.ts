import assert from "node:assert/strict";
import {
  createVehicleMovementActionCommand,
  createVehicleMovementHistoryCommands,
  getCurrentVehicleSectionHistory,
  validateVehicleMovementDocument,
} from "../lib/domain/fleet/vehicleMovements";
import {
  buildServiceVehicleReminders,
  summarizeServiceVehicleReminders,
} from "../lib/domain/fleet/serviceVehicleReminders";
import {
  createServiceVehicleRepairPatchCommand,
  validateServiceVehicleRepair,
} from "../lib/domain/fleet/serviceVehicleRepairs";
import type {
  ServiceVehicleCard,
  ServiceVehicleInsurance,
  ServiceVehicleMaintenance,
  ServiceVehicleRepair,
  ServiceVehicleTireSet,
  VehicleMovementDocument,
  VehicleSectionHistoryEntry,
} from "../lib/domain/fleet/service-contracts";

const currentVehicleSection: VehicleSectionHistoryEntry = {
  id: "history-current",
  version: 5,
  vehicleId: "truck-101",
  sectionId: "baktay",
  validFrom: "2026-04-01",
};

const previousVehicleSection: VehicleSectionHistoryEntry = {
  id: "history-previous",
  version: 2,
  vehicleId: "truck-101",
  sectionId: "central",
  validFrom: "2026-03-01",
  validTo: "2026-04-01",
};

assert.equal(getCurrentVehicleSectionHistory(
  [previousVehicleSection, currentVehicleSection],
  "truck-101",
)?.id, "history-current");

const movementDraft: VehicleMovementDocument = {
  id: "movement-1",
  version: 3,
  vehicleId: "truck-101",
  fromSectionId: "baktay",
  toSectionId: "akbakay",
  departureDate: "2026-05-08",
  arrivalDate: "2026-05-09",
  reason: "production need",
  basis: "order-12",
  senderResponsibleId: "sender-1",
  receiverResponsibleId: "receiver-1",
  status: "draft",
};

assert.deepEqual(validateVehicleMovementDocument(movementDraft, currentVehicleSection), []);
assert.deepEqual(validateVehicleMovementDocument({
  ...movementDraft,
  fromSectionId: "baktay",
  toSectionId: "baktay",
  reason: "",
  basis: "",
  arrivalDate: "2026-05-07",
}, currentVehicleSection).map((issue) => issue.code), [
  "same_section",
  "basis_required",
  "reason_required",
  "arrival_before_departure",
]);

const fleetAccess = {
  canView: true,
  canEdit: true,
  canApprove: true,
  canDelete: false,
  canExport: true,
  canAdmin: false,
  matchedGrantIds: ["grant-fleet"],
};

const submitMovement = createVehicleMovementActionCommand(
  movementDraft,
  "submit",
  fleetAccess,
);
assert.equal(submitMovement.ok, true);
if (submitMovement.ok) {
  assert.deepEqual(submitMovement.command.changes, [{
    field: "status",
    previousValue: "draft",
    nextValue: "approval",
  }]);
}

const approveWithoutReason = createVehicleMovementActionCommand(
  { ...movementDraft, status: "approval" },
  "approve",
  fleetAccess,
);
assert.equal(approveWithoutReason.ok, false);
if (!approveWithoutReason.ok) {
  assert.equal(approveWithoutReason.rejection.code, "reason_required");
}

const approveWithoutRight = createVehicleMovementActionCommand(
  { ...movementDraft, status: "approval" },
  "approve",
  { ...fleetAccess, canApprove: false },
  "approved by chief",
);
assert.equal(approveWithoutRight.ok, false);
if (!approveWithoutRight.ok) {
  assert.equal(approveWithoutRight.rejection.code, "approval_permission_required");
}

const acceptedMovement = {
  ...movementDraft,
  status: "accepted" as const,
};
const historyCommands = createVehicleMovementHistoryCommands(
  acceptedMovement,
  currentVehicleSection,
);
assert.equal(historyCommands.ok, true);
if (historyCommands.ok) {
  assert.equal(historyCommands.closePreviousSectionCommand.entity.version, 5);
  assert.deepEqual(historyCommands.closePreviousSectionCommand.changes, [{
    field: "validTo",
    previousValue: undefined,
    nextValue: "2026-05-09",
  }]);
  assert.deepEqual(historyCommands.openNextSectionCommand, {
    entityType: "vehicle_section_history",
    vehicleId: "truck-101",
    sectionId: "akbakay",
    validFrom: "2026-05-09",
    movementDocumentId: "movement-1",
  });
}

const rejectedHistoryUpdate = createVehicleMovementHistoryCommands(
  movementDraft,
  currentVehicleSection,
);
assert.equal(rejectedHistoryUpdate.ok, false);
if (!rejectedHistoryUpdate.ok) {
  assert.equal(rejectedHistoryUpdate.rejection.code, "movement_not_accepted");
}

const serviceVehicle: ServiceVehicleCard = {
  id: "service-car-1",
  version: 4,
  vehicleId: "vehicle-service-1",
  brand: "Toyota",
  model: "Land Cruiser",
  plateNumber: "001DSP",
  vin: "VIN-SERVICE-1",
  manufactureYear: "2022",
  responsibleUserId: "dispatcher-chief",
  currentMileage: 151_000,
  status: "active",
  location: "central-office",
};

const latestMaintenance: ServiceVehicleMaintenance = {
  id: "maintenance-1",
  version: 2,
  serviceVehicleId: "service-car-1",
  maintenanceDate: "2026-04-01",
  mileage: 145_000,
  maintenanceKind: "regular",
  nextMileage: 150_000,
  nextDate: "2026-05-01",
};

const insurance: ServiceVehicleInsurance = {
  id: "insurance-1",
  version: 1,
  serviceVehicleId: "service-car-1",
  policyNumber: "POLICY-1",
  company: "AA Insurance",
  startsAt: "2025-05-10",
  endsAt: "2026-05-10",
  status: "valid",
};

const winterTires: ServiceVehicleTireSet = {
  id: "tires-1",
  version: 1,
  serviceVehicleId: "service-car-1",
  tireType: "winter",
  brand: "Nokian",
  size: "265/65 R17",
  installedAt: "2025-11-01",
  installedMileage: 105_000,
  condition: "usable",
};

const serviceVehicleReminders = buildServiceVehicleReminders({
  currentDate: "2026-05-08",
  vehicles: [serviceVehicle],
  maintenance: [latestMaintenance],
  insurance: [insurance],
  tireSets: [winterTires],
  expiringSoonDays: 7,
  tireMileageLimitKm: 50_000,
  tireWarningKm: 5_000,
});

assert.ok(serviceVehicleReminders.some((reminder) => (
  reminder.kind === "maintenance_mileage_due" && reminder.severity === "critical"
)));
assert.ok(serviceVehicleReminders.some((reminder) => (
  reminder.kind === "maintenance_date_due" && reminder.severity === "critical"
)));
assert.ok(serviceVehicleReminders.some((reminder) => (
  reminder.kind === "insurance_expiring" && reminder.severity === "warning"
)));
assert.ok(serviceVehicleReminders.some((reminder) => (
  reminder.kind === "tire_resource_low" && reminder.severity === "warning"
)));
assert.deepEqual(summarizeServiceVehicleReminders(serviceVehicleReminders), {
  total: 4,
  critical: 2,
  warning: 2,
  info: 0,
});

const repairDraft: ServiceVehicleRepair = {
  id: "repair-1",
  version: 7,
  serviceVehicleId: "service-car-1",
  repairDate: "2026-05-08",
  mileage: 151_000,
  reason: "steering vibration",
  faultDescription: "Steering vibration during inspection trip.",
  status: "planned",
};

assert.deepEqual(validateServiceVehicleRepair({
  ...repairDraft,
  repairDate: "",
  mileage: -1,
  reason: "",
  faultDescription: "",
  cost: -10,
  status: "completed",
}).map((issue) => issue.code), [
  "repair_date_required",
  "reason_required",
  "fault_description_required",
  "mileage_negative",
  "cost_negative",
  "work_performed_required",
]);

const repairPatch = createServiceVehicleRepairPatchCommand(
  repairDraft,
  {
    ...repairDraft,
    workPerformed: "Steering rack inspected and tie rod replaced.",
    cost: 85_000,
    documentIds: ["repair-act-1"],
    status: "completed",
  },
  fleetAccess,
);
assert.equal(repairPatch.ok, true);
if (repairPatch.ok) {
  assert.deepEqual(repairPatch.command.changes.map((change) => change.field), [
    "workPerformed",
    "cost",
    "documentIds",
    "status",
  ]);
  assert.equal(repairPatch.command.entity.version, 7);
}

const closeRepairWithoutReason = createServiceVehicleRepairPatchCommand(
  repairDraft,
  { ...repairDraft, status: "closed" },
  fleetAccess,
);
assert.equal(closeRepairWithoutReason.ok, false);
if (!closeRepairWithoutReason.ok) {
  assert.equal(closeRepairWithoutReason.rejection.code, "reason_required");
}

const repairPatchWithoutEditRight = createServiceVehicleRepairPatchCommand(
  repairDraft,
  { ...repairDraft, comment: "diagnostic appointment moved" },
  { ...fleetAccess, canEdit: false },
);
assert.equal(repairPatchWithoutEditRight.ok, false);
if (!repairPatchWithoutEditRight.ok) {
  assert.equal(repairPatchWithoutEditRight.rejection.code, "edit_permission_required");
}

console.log("Fleet domain checks passed");
