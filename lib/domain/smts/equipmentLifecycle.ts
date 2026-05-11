import type { PatchFieldChange, PatchSaveCommand, VersionedEntityReference } from "../editing/patchEditing";
import type {
  SmtsMountingEvent,
  SmtsSimCard,
  SmtsTerminal,
  SmtsVehicleCard,
} from "./service-contracts";

export type SmtsLifecycleRejectionCode =
  | "vehicle_already_has_terminal"
  | "vehicle_has_no_terminal"
  | "terminal_not_available"
  | "terminal_not_on_vehicle"
  | "sim_not_available";

export type SmtsMountingEventCreateCommand = {
  entityType: "smts_mounting_event";
  eventType: SmtsMountingEvent["eventType"];
  vehicleId: string;
  terminalId?: string;
  simCardId?: string;
  installerId: string;
  eventDate: string;
  comment?: string;
};

export type SmtsLifecycleCommandBundle = {
  patchCommands: PatchSaveCommand[];
  mountingEvent: SmtsMountingEventCreateCommand;
};

export type SmtsLifecycleCommandResult =
  | { ok: true; bundle: SmtsLifecycleCommandBundle }
  | {
      ok: false;
      rejection: {
        code: SmtsLifecycleRejectionCode;
        message: string;
      };
    };

export type SmtsInstallLifecycleInput = {
  vehicleCard: SmtsVehicleCard;
  terminal: SmtsTerminal;
  simCard?: SmtsSimCard;
  installerId: string;
  eventDate: string;
  wialonId?: string;
  comment?: string;
};

export type SmtsRemovalLifecycleInput = {
  vehicleCard: SmtsVehicleCard;
  terminal: SmtsTerminal;
  simCard?: SmtsSimCard;
  installerId: string;
  eventDate: string;
  comment?: string;
};

export type SmtsInventorySummary = {
  terminalTotal: number;
  simCardTotal: number;
  terminalStatusCounts: Record<SmtsTerminal["status"], number>;
  simCardStatusCounts: Record<SmtsSimCard["status"], number>;
};

export type SmtsEquipmentTimelineRow = {
  id: string;
  eventType: SmtsMountingEvent["eventType"];
  vehicleId: string;
  terminalId?: string;
  simCardId?: string;
  eventDate: string;
  installerId: string;
  comment?: string;
};

const availableTerminalStatuses = new Set<SmtsTerminal["status"]>([
  "warehouse",
  "removed",
  "transferred",
  "reserve",
]);

const availableSimCardStatuses = new Set<SmtsSimCard["status"]>([
  "warehouse",
  "active",
  "replaced",
]);

const toVersionedReference = (entity: VersionedEntityReference): VersionedEntityReference => ({
  id: entity.id,
  version: entity.version,
  updatedAt: entity.updatedAt,
  updatedBy: entity.updatedBy,
});

const createPatchCommand = (
  entityType: string,
  entity: VersionedEntityReference,
  changes: PatchFieldChange[],
  reason: string,
): PatchSaveCommand => ({
  entityType,
  entity: toVersionedReference(entity),
  changes,
  reason,
});

const countByStatus = <Status extends string, Entity extends { status: Status }>(
  statuses: readonly Status[],
  entities: readonly Entity[],
): Record<Status, number> => statuses.reduce<Record<Status, number>>((counts, status) => ({
  ...counts,
  [status]: entities.filter((entity) => entity.status === status).length,
}), {} as Record<Status, number>);

const smtsTerminalStatuses: SmtsTerminal["status"][] = [
  "warehouse",
  "installed",
  "removed",
  "transferred",
  "faulty",
  "repair",
  "written_off",
  "reserve",
];

const smtsSimCardStatuses: SmtsSimCard["status"][] = [
  "warehouse",
  "active",
  "installed",
  "blocked",
  "lost",
  "replaced",
  "written_off",
];

export const isSmtsTerminalAvailableForInstall = (terminal: SmtsTerminal): boolean => (
  availableTerminalStatuses.has(terminal.status) && !terminal.currentVehicleId
);

export const isSmtsSimCardAvailableForInstall = (simCard: SmtsSimCard): boolean => (
  availableSimCardStatuses.has(simCard.status) && !simCard.currentTerminalId
);

export const createSmtsInstallLifecycleCommand = (
  input: SmtsInstallLifecycleInput,
): SmtsLifecycleCommandResult => {
  if (input.vehicleCard.terminalInstalled || input.vehicleCard.terminalId) {
    return {
      ok: false,
      rejection: {
        code: "vehicle_already_has_terminal",
        message: "Vehicle already has an installed SMTS terminal.",
      },
    };
  }

  if (!isSmtsTerminalAvailableForInstall(input.terminal)) {
    return {
      ok: false,
      rejection: {
        code: "terminal_not_available",
        message: "Terminal is not available for installation.",
      },
    };
  }

  if (input.simCard && !isSmtsSimCardAvailableForInstall(input.simCard)) {
    return {
      ok: false,
      rejection: {
        code: "sim_not_available",
        message: "SIM card is not available for installation.",
      },
    };
  }

  const reason = "Install SMTS equipment";
  const patchCommands = [
    createPatchCommand("smts_vehicle_card", input.vehicleCard, [
      { field: "terminalInstalled", previousValue: input.vehicleCard.terminalInstalled, nextValue: true },
      { field: "terminalId", previousValue: input.vehicleCard.terminalId, nextValue: input.terminal.id },
      { field: "imei", previousValue: input.vehicleCard.imei, nextValue: input.terminal.imei },
      { field: "terminalModel", previousValue: input.vehicleCard.terminalModel, nextValue: input.terminal.model },
      { field: "simCardId", previousValue: input.vehicleCard.simCardId, nextValue: input.simCard?.id },
      { field: "wialonId", previousValue: input.vehicleCard.wialonId, nextValue: input.wialonId },
      { field: "installedAt", previousValue: input.vehicleCard.installedAt, nextValue: input.eventDate },
      { field: "removedAt", previousValue: input.vehicleCard.removedAt, nextValue: undefined },
      { field: "installerId", previousValue: input.vehicleCard.installerId, nextValue: input.installerId },
    ], reason),
    createPatchCommand("smts_terminal", input.terminal, [
      { field: "status", previousValue: input.terminal.status, nextValue: "installed" },
      { field: "currentVehicleId", previousValue: input.terminal.currentVehicleId, nextValue: input.vehicleCard.vehicleId },
      { field: "currentSimCardId", previousValue: input.terminal.currentSimCardId, nextValue: input.simCard?.id },
    ], reason),
  ];

  if (input.simCard) {
    patchCommands.push(createPatchCommand("smts_sim_card", input.simCard, [
      { field: "status", previousValue: input.simCard.status, nextValue: "installed" },
      { field: "currentTerminalId", previousValue: input.simCard.currentTerminalId, nextValue: input.terminal.id },
    ], reason));
  }

  return {
    ok: true,
    bundle: {
      patchCommands,
      mountingEvent: {
        entityType: "smts_mounting_event",
        eventType: "install",
        vehicleId: input.vehicleCard.vehicleId,
        terminalId: input.terminal.id,
        simCardId: input.simCard?.id,
        installerId: input.installerId,
        eventDate: input.eventDate,
        comment: input.comment,
      },
    },
  };
};

export const createSmtsRemovalLifecycleCommand = (
  input: SmtsRemovalLifecycleInput,
): SmtsLifecycleCommandResult => {
  if (!input.vehicleCard.terminalInstalled || !input.vehicleCard.terminalId) {
    return {
      ok: false,
      rejection: {
        code: "vehicle_has_no_terminal",
        message: "Vehicle has no installed SMTS terminal to remove.",
      },
    };
  }

  if (input.vehicleCard.terminalId !== input.terminal.id || input.terminal.currentVehicleId !== input.vehicleCard.vehicleId) {
    return {
      ok: false,
      rejection: {
        code: "terminal_not_on_vehicle",
        message: "Terminal is not currently installed on this vehicle.",
      },
    };
  }

  const reason = "Remove SMTS equipment";
  const patchCommands = [
    createPatchCommand("smts_vehicle_card", input.vehicleCard, [
      { field: "terminalInstalled", previousValue: input.vehicleCard.terminalInstalled, nextValue: false },
      { field: "terminalId", previousValue: input.vehicleCard.terminalId, nextValue: undefined },
      { field: "imei", previousValue: input.vehicleCard.imei, nextValue: undefined },
      { field: "terminalModel", previousValue: input.vehicleCard.terminalModel, nextValue: undefined },
      { field: "simCardId", previousValue: input.vehicleCard.simCardId, nextValue: undefined },
      { field: "removedAt", previousValue: input.vehicleCard.removedAt, nextValue: input.eventDate },
    ], reason),
    createPatchCommand("smts_terminal", input.terminal, [
      { field: "status", previousValue: input.terminal.status, nextValue: "removed" },
      { field: "currentVehicleId", previousValue: input.terminal.currentVehicleId, nextValue: undefined },
      { field: "currentSimCardId", previousValue: input.terminal.currentSimCardId, nextValue: undefined },
    ], reason),
  ];

  if (input.simCard) {
    patchCommands.push(createPatchCommand("smts_sim_card", input.simCard, [
      { field: "status", previousValue: input.simCard.status, nextValue: "active" },
      { field: "currentTerminalId", previousValue: input.simCard.currentTerminalId, nextValue: undefined },
    ], reason));
  }

  return {
    ok: true,
    bundle: {
      patchCommands,
      mountingEvent: {
        entityType: "smts_mounting_event",
        eventType: "remove",
        vehicleId: input.vehicleCard.vehicleId,
        terminalId: input.terminal.id,
        simCardId: input.simCard?.id,
        installerId: input.installerId,
        eventDate: input.eventDate,
        comment: input.comment,
      },
    },
  };
};

export const summarizeSmtsInventory = (
  terminals: readonly SmtsTerminal[],
  simCards: readonly SmtsSimCard[],
): SmtsInventorySummary => ({
  terminalTotal: terminals.length,
  simCardTotal: simCards.length,
  terminalStatusCounts: countByStatus(smtsTerminalStatuses, terminals),
  simCardStatusCounts: countByStatus(smtsSimCardStatuses, simCards),
});

export const buildSmtsEquipmentTimeline = (
  events: readonly SmtsMountingEvent[],
): SmtsEquipmentTimelineRow[] => events
  .map((event) => ({
    id: event.id,
    eventType: event.eventType,
    vehicleId: event.vehicleId,
    terminalId: event.terminalId,
    simCardId: event.simCardId,
    eventDate: event.eventDate,
    installerId: event.installerId,
    comment: event.comment,
  }))
  .sort((left, right) => (
    left.eventDate.localeCompare(right.eventDate)
    || left.id.localeCompare(right.id)
  ));
