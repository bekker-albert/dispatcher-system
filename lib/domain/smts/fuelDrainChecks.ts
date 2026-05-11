import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import type { PatchSaveCommand } from "../editing/patchEditing";
import { canTransitionStatus, getTransitionRule } from "../workflows/statusTransitions";
import type { FuelDrainCheckStatus, FuelDrainEvent } from "./service-contracts";

export type FuelDrainRiskLevel = "watch" | "warning" | "critical";

export type FuelDrainReviewRow = {
  id: string;
  vehicleId: string;
  sectionId: string;
  detectedAt: string;
  litersDelta: number;
  reasonCode: FuelDrainEvent["reasonCode"];
  status: FuelDrainCheckStatus;
  riskLevel: FuelDrainRiskLevel;
  requiresReview: boolean;
};

export type FuelDrainStatusCommandRejectionCode =
  | "transition_not_allowed"
  | "reason_required"
  | "edit_permission_required"
  | "approval_permission_required";

export type FuelDrainStatusCommandResult =
  | { ok: true; command: PatchSaveCommand }
  | {
      ok: false;
      rejection: {
        code: FuelDrainStatusCommandRejectionCode;
        message: string;
      };
    };

const reviewStatuses = new Set<FuelDrainCheckStatus>(["new", "reviewing"]);
const canEditStatus = (access: EffectiveAccessDecision) => access.canEdit || access.canAdmin;
const canApproveStatus = (access: EffectiveAccessDecision) => access.canApprove || access.canAdmin;

export function getFuelDrainRiskLevel(
  event: Pick<FuelDrainEvent, "litersDelta" | "reasonCode">,
): FuelDrainRiskLevel {
  const absoluteDelta = Math.abs(event.litersDelta);

  if (event.reasonCode === "without_waybill" || event.reasonCode === "night" || absoluteDelta >= 200) {
    return "critical";
  }

  if (event.reasonCode === "outside_zone" || event.reasonCode === "parking_drop" || absoluteDelta >= 80) {
    return "warning";
  }

  return "watch";
}

export function buildFuelDrainReviewRows(
  events: readonly FuelDrainEvent[],
): FuelDrainReviewRow[] {
  return events
    .map((event) => ({
      id: event.id,
      vehicleId: event.vehicleId,
      sectionId: event.sectionId,
      detectedAt: event.detectedAt,
      litersDelta: event.litersDelta,
      reasonCode: event.reasonCode,
      status: event.status,
      riskLevel: getFuelDrainRiskLevel(event),
      requiresReview: reviewStatuses.has(event.status),
    }))
    .sort((left, right) => (
      Number(right.requiresReview) - Number(left.requiresReview)
      || Math.abs(right.litersDelta) - Math.abs(left.litersDelta)
      || left.detectedAt.localeCompare(right.detectedAt)
      || left.id.localeCompare(right.id)
    ));
}

export function createFuelDrainStatusPatchCommand(
  event: FuelDrainEvent,
  nextStatus: FuelDrainCheckStatus,
  access: EffectiveAccessDecision,
  checkedBy: string,
  reason?: string,
): FuelDrainStatusCommandResult {
  const transitionRule = getTransitionRule("fuel-drain-check", event.status, nextStatus);

  if (!transitionRule || !canTransitionStatus("fuel-drain-check", event.status, nextStatus)) {
    return {
      ok: false,
      rejection: {
        code: "transition_not_allowed",
        message: "Status transition is not allowed for this fuel drain check.",
      },
    };
  }

  if (!canEditStatus(access)) {
    return {
      ok: false,
      rejection: {
        code: "edit_permission_required",
        message: "Edit permission is required to change fuel drain check status.",
      },
    };
  }

  if (transitionRule.requiresApprovalRight && !canApproveStatus(access)) {
    return {
      ok: false,
      rejection: {
        code: "approval_permission_required",
        message: "Approval permission is required for this fuel drain status transition.",
      },
    };
  }

  if (transitionRule.requiresReason && !reason?.trim()) {
    return {
      ok: false,
      rejection: {
        code: "reason_required",
        message: "Reason is required for this fuel drain status transition.",
      },
    };
  }

  return {
    ok: true,
    command: {
      entityType: "fuel_drain_event",
      entity: {
        id: event.id,
        version: event.version,
        updatedAt: event.updatedAt,
        updatedBy: event.updatedBy,
      },
      changes: [
        { field: "status", previousValue: event.status, nextValue: nextStatus },
        { field: "checkedBy", previousValue: event.checkedBy, nextValue: checkedBy },
      ],
      reason,
    },
  };
}
