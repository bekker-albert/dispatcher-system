import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import type { PatchSaveCommand } from "../editing/patchEditing";
import { canTransitionStatus, getTransitionRule } from "../workflows/statusTransitions";
import type {
  VehicleMovementDocument,
  VehicleMovementStatus,
  VehicleSectionHistoryEntry,
} from "./service-contracts";

export type VehicleMovementValidationCode =
  | "same_section"
  | "basis_required"
  | "reason_required"
  | "current_section_mismatch"
  | "arrival_before_departure";

export type VehicleMovementValidationIssue = {
  code: VehicleMovementValidationCode;
  message: string;
};

export type VehicleMovementCommandRejectionCode =
  | "transition_not_allowed"
  | "reason_required"
  | "edit_permission_required"
  | "approval_permission_required";

export type VehicleMovementCommandResult =
  | { ok: true; command: PatchSaveCommand }
  | {
      ok: false;
      rejection: {
        code: VehicleMovementCommandRejectionCode;
        message: string;
      };
    };

export type VehicleSectionHistoryCreateCommand = {
  entityType: "vehicle_section_history";
  vehicleId: string;
  sectionId: string;
  validFrom: string;
  movementDocumentId: string;
};

export type VehicleMovementHistoryCommandResult =
  | {
      ok: true;
      closePreviousSectionCommand: PatchSaveCommand;
      openNextSectionCommand: VehicleSectionHistoryCreateCommand;
    }
  | {
      ok: false;
      rejection: {
        code: "movement_not_accepted" | "arrival_date_required" | "current_section_mismatch";
        message: string;
      };
    };

export const vehicleMovementStatusActions = {
  submit: "approval",
  approve: "approved",
  startTransit: "in_transit",
  markArrived: "arrived",
  accept: "accepted",
  close: "closed",
  cancel: "cancelled",
} as const satisfies Record<string, VehicleMovementStatus>;

export type VehicleMovementStatusAction = keyof typeof vehicleMovementStatusActions;

const canEditMovement = (access: EffectiveAccessDecision): boolean => access.canEdit || access.canAdmin;
const canApproveMovement = (access: EffectiveAccessDecision): boolean => access.canApprove || access.canAdmin;

export const getCurrentVehicleSectionHistory = (
  history: readonly VehicleSectionHistoryEntry[],
  vehicleId: string,
): VehicleSectionHistoryEntry | undefined => history
  .filter((entry) => entry.vehicleId === vehicleId && !entry.validTo)
  .sort((left, right) => right.validFrom.localeCompare(left.validFrom))[0];

export const validateVehicleMovementDocument = (
  movement: VehicleMovementDocument,
  currentSection?: VehicleSectionHistoryEntry,
): VehicleMovementValidationIssue[] => {
  const issues: VehicleMovementValidationIssue[] = [];

  if (movement.fromSectionId === movement.toSectionId) {
    issues.push({
      code: "same_section",
      message: "Vehicle movement must change the section.",
    });
  }

  if (!movement.basis.trim()) {
    issues.push({
      code: "basis_required",
      message: "Vehicle movement basis is required.",
    });
  }

  if (!movement.reason.trim()) {
    issues.push({
      code: "reason_required",
      message: "Vehicle movement reason is required.",
    });
  }

  if (currentSection && currentSection.sectionId !== movement.fromSectionId) {
    issues.push({
      code: "current_section_mismatch",
      message: "Vehicle movement source section must match current section history.",
    });
  }

  if (movement.arrivalDate && movement.arrivalDate < movement.departureDate) {
    issues.push({
      code: "arrival_before_departure",
      message: "Vehicle movement arrival date cannot be before departure date.",
    });
  }

  return issues;
};

export const createVehicleMovementStatusPatchCommand = (
  movement: VehicleMovementDocument,
  nextStatus: VehicleMovementStatus,
  access: EffectiveAccessDecision,
  reason?: string,
): VehicleMovementCommandResult => {
  const transitionRule = getTransitionRule("vehicle-movement", movement.status, nextStatus);

  if (!transitionRule || !canTransitionStatus("vehicle-movement", movement.status, nextStatus)) {
    return {
      ok: false,
      rejection: {
        code: "transition_not_allowed",
        message: "Status transition is not allowed for this vehicle movement.",
      },
    };
  }

  if (!canEditMovement(access)) {
    return {
      ok: false,
      rejection: {
        code: "edit_permission_required",
        message: "Edit permission is required to change vehicle movement status.",
      },
    };
  }

  if (transitionRule.requiresApprovalRight && !canApproveMovement(access)) {
    return {
      ok: false,
      rejection: {
        code: "approval_permission_required",
        message: "Approval permission is required for this vehicle movement transition.",
      },
    };
  }

  if (transitionRule.requiresReason && !reason?.trim()) {
    return {
      ok: false,
      rejection: {
        code: "reason_required",
        message: "Reason is required for this vehicle movement transition.",
      },
    };
  }

  return {
    ok: true,
    command: {
      entityType: "vehicle_movement",
      entity: {
        id: movement.id,
        version: movement.version,
        updatedAt: movement.updatedAt,
        updatedBy: movement.updatedBy,
      },
      changes: [{
        field: "status",
        previousValue: movement.status,
        nextValue: nextStatus,
      }],
      reason,
    },
  };
};

export const createVehicleMovementActionCommand = (
  movement: VehicleMovementDocument,
  action: VehicleMovementStatusAction,
  access: EffectiveAccessDecision,
  reason?: string,
): VehicleMovementCommandResult => (
  createVehicleMovementStatusPatchCommand(
    movement,
    vehicleMovementStatusActions[action],
    access,
    reason,
  )
);

export const createVehicleMovementHistoryCommands = (
  movement: VehicleMovementDocument,
  currentSection: VehicleSectionHistoryEntry,
): VehicleMovementHistoryCommandResult => {
  if (movement.status !== "accepted") {
    return {
      ok: false,
      rejection: {
        code: "movement_not_accepted",
        message: "Vehicle section history can be changed only after movement is accepted.",
      },
    };
  }

  if (!movement.arrivalDate) {
    return {
      ok: false,
      rejection: {
        code: "arrival_date_required",
        message: "Arrival date is required to update vehicle section history.",
      },
    };
  }

  if (currentSection.vehicleId !== movement.vehicleId || currentSection.sectionId !== movement.fromSectionId) {
    return {
      ok: false,
      rejection: {
        code: "current_section_mismatch",
        message: "Current section history does not match vehicle movement source section.",
      },
    };
  }

  return {
    ok: true,
    closePreviousSectionCommand: {
      entityType: "vehicle_section_history",
      entity: {
        id: currentSection.id,
        version: currentSection.version,
        updatedAt: currentSection.updatedAt,
        updatedBy: currentSection.updatedBy,
      },
      changes: [{
        field: "validTo",
        previousValue: currentSection.validTo,
        nextValue: movement.arrivalDate,
      }],
      reason: "Close previous vehicle section history after accepted movement.",
    },
    openNextSectionCommand: {
      entityType: "vehicle_section_history",
      vehicleId: movement.vehicleId,
      sectionId: movement.toSectionId,
      validFrom: movement.arrivalDate,
      movementDocumentId: movement.id,
    },
  };
};
