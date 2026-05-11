import assert from "node:assert/strict";
import {
  buildContractorMonitoringAccessIssues,
  isContractorMonitoringAccessActiveOnDate,
} from "../lib/domain/smts/contractorAccess";
import {
  buildEcoDrivingViolationRows,
  createEcoDrivingMailingDraft,
} from "../lib/domain/smts/ecoDriving";
import {
  buildFuelDrainReviewRows,
  createFuelDrainStatusPatchCommand,
  getFuelDrainRiskLevel,
} from "../lib/domain/smts/fuelDrainChecks";
import {
  buildSmtsEquipmentTimeline,
  createSmtsInstallLifecycleCommand,
  createSmtsRemovalLifecycleCommand,
  isSmtsSimCardAvailableForInstall,
  isSmtsTerminalAvailableForInstall,
  summarizeSmtsInventory,
} from "../lib/domain/smts/equipmentLifecycle";
import type {
  ContractorMonitoringAccess,
  EcoDrivingEvent,
  FuelDrainEvent,
  SmtsMountingEvent,
  SmtsSimCard,
  SmtsTerminal,
  SmtsVehicleCard,
} from "../lib/domain/smts/service-contracts";

const editAccess = {
  canView: true,
  canEdit: true,
  canApprove: false,
  canDelete: false,
  canExport: false,
  canAdmin: false,
  matchedGrantIds: ["edit"],
};

const emptyVehicleCard: SmtsVehicleCard = {
  id: "smts-card-1",
  version: 4,
  vehicleId: "truck-101",
  terminalInstalled: false,
  lightsConnected: false,
  seatbeltConnected: false,
  fuelSensorInstalled: false,
  canConnected: false,
  rpmConnected: false,
  engineHoursReadable: false,
  mileageReadable: false,
  ecoDrivingConfigured: false,
  buzzerInstalled: false,
};

const warehouseTerminal: SmtsTerminal = {
  id: "terminal-1",
  version: 2,
  imei: "868000000001",
  model: "Galileosky",
  status: "warehouse",
};

const activeSimCard: SmtsSimCard = {
  id: "sim-1",
  version: 3,
  phoneNumber: "+77000000001",
  provider: "Kcell",
  status: "active",
};

assert.equal(isSmtsTerminalAvailableForInstall(warehouseTerminal), true);
assert.equal(isSmtsTerminalAvailableForInstall({
  ...warehouseTerminal,
  status: "installed",
  currentVehicleId: "truck-999",
}), false);
assert.equal(isSmtsSimCardAvailableForInstall(activeSimCard), true);
assert.equal(isSmtsSimCardAvailableForInstall({
  ...activeSimCard,
  status: "installed",
  currentTerminalId: "terminal-old",
}), false);

const installCommand = createSmtsInstallLifecycleCommand({
  vehicleCard: emptyVehicleCard,
  terminal: warehouseTerminal,
  simCard: activeSimCard,
  installerId: "installer-1",
  eventDate: "2026-05-08",
  wialonId: "wialon-101",
  comment: "initial install",
});
assert.equal(installCommand.ok, true);
if (installCommand.ok) {
  assert.equal(installCommand.bundle.patchCommands.length, 3);
  assert.equal(installCommand.bundle.mountingEvent.eventType, "install");
  assert.ok(installCommand.bundle.patchCommands.some((command) => (
    command.entityType === "smts_terminal"
    && command.changes.some((change) => change.field === "status" && change.nextValue === "installed")
  )));
}

assert.equal(createSmtsInstallLifecycleCommand({
  vehicleCard: { ...emptyVehicleCard, terminalInstalled: true, terminalId: "terminal-old" },
  terminal: warehouseTerminal,
  installerId: "installer-1",
  eventDate: "2026-05-08",
}).ok, false);

const installedVehicleCard: SmtsVehicleCard = {
  ...emptyVehicleCard,
  terminalInstalled: true,
  terminalId: warehouseTerminal.id,
  imei: warehouseTerminal.imei,
  terminalModel: warehouseTerminal.model,
  simCardId: activeSimCard.id,
  installedAt: "2026-05-08",
};
const installedTerminal: SmtsTerminal = {
  ...warehouseTerminal,
  status: "installed",
  currentVehicleId: emptyVehicleCard.vehicleId,
  currentSimCardId: activeSimCard.id,
};
const installedSimCard: SmtsSimCard = {
  ...activeSimCard,
  status: "installed",
  currentTerminalId: warehouseTerminal.id,
};
const removalCommand = createSmtsRemovalLifecycleCommand({
  vehicleCard: installedVehicleCard,
  terminal: installedTerminal,
  simCard: installedSimCard,
  installerId: "installer-2",
  eventDate: "2026-05-10",
});
assert.equal(removalCommand.ok, true);
if (removalCommand.ok) {
  assert.equal(removalCommand.bundle.mountingEvent.eventType, "remove");
  assert.ok(removalCommand.bundle.patchCommands.some((command) => (
    command.entityType === "smts_vehicle_card"
    && command.changes.some((change) => change.field === "terminalInstalled" && change.nextValue === false)
  )));
}
assert.equal(createSmtsRemovalLifecycleCommand({
  vehicleCard: installedVehicleCard,
  terminal: { ...installedTerminal, currentVehicleId: "truck-999" },
  installerId: "installer-2",
  eventDate: "2026-05-10",
}).ok, false);

const inventorySummary = summarizeSmtsInventory(
  [warehouseTerminal, installedTerminal],
  [activeSimCard, installedSimCard],
);
assert.equal(inventorySummary.terminalTotal, 2);
assert.equal(inventorySummary.terminalStatusCounts.warehouse, 1);
assert.equal(inventorySummary.terminalStatusCounts.installed, 1);
assert.equal(inventorySummary.simCardStatusCounts.active, 1);
assert.equal(inventorySummary.simCardStatusCounts.installed, 1);

const mountingEvents: SmtsMountingEvent[] = [
  {
    id: "event-2",
    version: 1,
    eventType: "remove",
    vehicleId: emptyVehicleCard.vehicleId,
    terminalId: warehouseTerminal.id,
    installerId: "installer-2",
    eventDate: "2026-05-10",
  },
  {
    id: "event-1",
    version: 1,
    eventType: "install",
    vehicleId: emptyVehicleCard.vehicleId,
    terminalId: warehouseTerminal.id,
    simCardId: activeSimCard.id,
    installerId: "installer-1",
    eventDate: "2026-05-08",
  },
];
assert.deepEqual(
  buildSmtsEquipmentTimeline(mountingEvents).map((event) => event.id),
  ["event-1", "event-2"],
);

const contractorAccesses: ContractorMonitoringAccess[] = [
  {
    id: "contractor-access-expired",
    version: 1,
    contractorId: "contractor-1",
    userId: "contractor-user-1",
    system: "Wialon",
    visibleVehicleIds: ["truck-101", "truck-extra"],
    validFrom: "2026-04-01",
    validTo: "2026-05-01",
    status: "active",
    approvedBy: "smts-admin-1",
  },
  {
    id: "contractor-access-unapproved",
    version: 1,
    contractorId: "contractor-1",
    userId: "contractor-user-2",
    system: "Wialon",
    visibleVehicleIds: ["truck-101"],
    validFrom: "2026-05-01",
    validTo: "2026-05-12",
    status: "active",
  },
];

assert.equal(isContractorMonitoringAccessActiveOnDate(contractorAccesses[1], "2026-05-08"), true);
assert.equal(isContractorMonitoringAccessActiveOnDate(contractorAccesses[0], "2026-05-08"), false);

const contractorAccessIssues = buildContractorMonitoringAccessIssues({
  currentDate: "2026-05-08",
  accesses: contractorAccesses,
  allowedVehicleIdsByContractor: {
    "contractor-1": ["truck-101"],
  },
  expiringSoonDays: 7,
});
assert.deepEqual(contractorAccessIssues.map((issue) => issue.code), [
  "active_after_valid_to",
  "extra_vehicle_visible",
  "active_without_approval",
  "access_expiring_soon",
]);
assert.equal(contractorAccessIssues.find((issue) => issue.code === "extra_vehicle_visible")?.vehicleId, "truck-extra");

const ecoDrivingEvents: EcoDrivingEvent[] = [
  {
    id: "eco-1",
    version: 1,
    periodStart: "2026-05-01",
    periodEnd: "2026-05-15",
    sectionId: "baktay",
    driverId: "driver-1",
    vehicleId: "truck-101",
    eventType: "speeding",
    count: 7,
  },
  {
    id: "eco-2",
    version: 1,
    periodStart: "2026-05-01",
    periodEnd: "2026-05-15",
    sectionId: "baktay",
    driverId: "driver-1",
    vehicleId: "truck-101",
    eventType: "no_seatbelt",
    count: 4,
  },
  {
    id: "eco-other-section",
    version: 1,
    periodStart: "2026-05-01",
    periodEnd: "2026-05-15",
    sectionId: "karatau",
    driverId: "driver-2",
    vehicleId: "truck-202",
    eventType: "idle",
    count: 20,
  },
];
const ecoRows = buildEcoDrivingViolationRows(ecoDrivingEvents);
assert.equal(ecoRows[0].totalCount, 20);
assert.equal(ecoRows[1].totalCount, 11);
assert.equal(ecoRows[1].severity, "critical");
assert.equal(ecoRows[1].eventCounts.speeding, 7);
assert.equal(ecoRows[1].eventCounts.no_seatbelt, 4);

const ecoMailingDraft = createEcoDrivingMailingDraft({
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  sectionId: "baktay",
  recipientUserIds: ["chief-1", "chief-1", "smts-admin"],
  events: ecoDrivingEvents,
  createdBy: "smts-admin",
});
assert.equal(ecoMailingDraft.ok, true);
if (ecoMailingDraft.ok) {
  assert.equal(ecoMailingDraft.draft.entityType, "eco_driving_mailing");
  assert.deepEqual(ecoMailingDraft.draft.recipientUserIds, ["chief-1", "smts-admin"]);
  assert.equal(ecoMailingDraft.draft.violationRows.length, 1);
  assert.equal(ecoMailingDraft.draft.createsQueuedSendRequest, true);
}

const rejectedEcoMailing = createEcoDrivingMailingDraft({
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  sectionId: "baktay",
  recipientUserIds: [],
  events: ecoDrivingEvents,
  createdBy: "smts-admin",
});
assert.equal(rejectedEcoMailing.ok, false);
if (!rejectedEcoMailing.ok) {
  assert.equal(rejectedEcoMailing.rejection.code, "recipient_required");
}

const fuelDrainEvents: FuelDrainEvent[] = [
  {
    id: "fuel-drain-1",
    version: 2,
    vehicleId: "truck-101",
    sectionId: "baktay",
    detectedAt: "2026-05-08T22:10:00Z",
    litersDelta: -240,
    reasonCode: "night",
    status: "new",
  },
  {
    id: "fuel-drain-2",
    version: 1,
    vehicleId: "truck-102",
    sectionId: "baktay",
    detectedAt: "2026-05-08T12:10:00Z",
    litersDelta: -40,
    reasonCode: "level_not_increased",
    status: "closed",
  },
];
assert.equal(getFuelDrainRiskLevel(fuelDrainEvents[0]), "critical");
assert.equal(getFuelDrainRiskLevel(fuelDrainEvents[1]), "watch");

const fuelDrainReviewRows = buildFuelDrainReviewRows(fuelDrainEvents);
assert.equal(fuelDrainReviewRows[0].id, "fuel-drain-1");
assert.equal(fuelDrainReviewRows[0].requiresReview, true);
assert.equal(fuelDrainReviewRows[0].riskLevel, "critical");

const rejectedFuelDrainTransition = createFuelDrainStatusPatchCommand(
  fuelDrainEvents[0],
  "confirmed",
  editAccess,
  "smts-admin",
);
assert.equal(rejectedFuelDrainTransition.ok, false);
if (!rejectedFuelDrainTransition.ok) {
  assert.equal(rejectedFuelDrainTransition.rejection.code, "transition_not_allowed");
}

const acceptedFuelDrainTransition = createFuelDrainStatusPatchCommand(
  { ...fuelDrainEvents[0], status: "reviewing" },
  "confirmed",
  editAccess,
  "smts-admin",
  "confirmed against parking zone",
);
assert.equal(acceptedFuelDrainTransition.ok, true);
if (acceptedFuelDrainTransition.ok) {
  assert.equal(acceptedFuelDrainTransition.command.entityType, "fuel_drain_event");
  assert.equal(acceptedFuelDrainTransition.command.changes[0].nextValue, "confirmed");
  assert.equal(acceptedFuelDrainTransition.command.changes[1].field, "checkedBy");
}

console.log("SMTS domain checks passed");
