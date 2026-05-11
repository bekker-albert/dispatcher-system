import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import type { PatchSaveCommand, VersionedEntityReference } from "../editing/patchEditing";
import { canTransitionStatus, getTransitionRule } from "../workflows/statusTransitions";
import type {
  BusinessTrip,
  BusinessTripTask,
  CommonProcessStatus,
  OvertimeKind,
  OvertimeRequest,
} from "./service-contracts";

export type CommonProcessEntityType =
  | "overtime_request"
  | "business_trip"
  | "business_trip_task";

export type CommonProcessStatusField =
  | "status"
  | "approvalStatus";

export type CommonProcessStatusAction =
  | "submit"
  | "startReview"
  | "approve"
  | "reject"
  | "close"
  | "cancel";

export type CommonProcessValidationCode =
  | "hours_out_of_range"
  | "reason_required"
  | "basis_required"
  | "route_required"
  | "purpose_required"
  | "period_invalid"
  | "report_required"
  | "task_not_finished";

export type CommonProcessValidationIssue = {
  code: CommonProcessValidationCode;
  message: string;
};

export type CommonProcessCommandRejectionCode =
  | "transition_not_allowed"
  | "reason_required"
  | "edit_permission_required"
  | "approval_permission_required";

export type CommonProcessStatusCommandResult =
  | { ok: true; command: PatchSaveCommand }
  | {
      ok: false;
      rejection: {
        code: CommonProcessCommandRejectionCode;
        message: string;
      };
    };

export type BusinessTripReadiness = {
  canClose: boolean;
  blockerCount: number;
  issues: CommonProcessValidationIssue[];
};

export const commonProcessStatusActions = {
  submit: "submitted",
  startReview: "reviewing",
  approve: "approved",
  reject: "rejected",
  close: "closed",
  cancel: "cancelled",
} as const satisfies Record<CommonProcessStatusAction, CommonProcessStatus>;

const overtimeKindsRequiringBasis = new Set<OvertimeKind>([
  "substitution",
  "rest_recall",
  "day_off_work",
  "vacancy_work",
]);

const canEditCommonProcess = (access: EffectiveAccessDecision): boolean => access.canEdit || access.canAdmin;
const canApproveCommonProcess = (access: EffectiveAccessDecision): boolean => access.canApprove || access.canAdmin;

export const validateOvertimeRequest = (
  request: OvertimeRequest,
): CommonProcessValidationIssue[] => {
  const issues: CommonProcessValidationIssue[] = [];

  if (!Number.isFinite(request.hours) || request.hours <= 0 || request.hours > 24) {
    issues.push({
      code: "hours_out_of_range",
      message: "Overtime hours must be greater than zero and no more than 24.",
    });
  }

  if (!request.reason.trim()) {
    issues.push({
      code: "reason_required",
      message: "Overtime reason is required.",
    });
  }

  if (overtimeKindsRequiringBasis.has(request.overtimeKind) && !request.basis?.trim()) {
    issues.push({
      code: "basis_required",
      message: "This overtime kind requires a basis document.",
    });
  }

  return issues;
};

export const validateBusinessTrip = (
  trip: BusinessTrip,
): CommonProcessValidationIssue[] => {
  const issues: CommonProcessValidationIssue[] = [];

  if (!trip.route.trim()) {
    issues.push({
      code: "route_required",
      message: "Business trip route is required.",
    });
  }

  if (!trip.purpose.trim()) {
    issues.push({
      code: "purpose_required",
      message: "Business trip purpose is required.",
    });
  }

  if (trip.periodEnd < trip.periodStart) {
    issues.push({
      code: "period_invalid",
      message: "Business trip period end cannot be before start.",
    });
  }

  return issues;
};

export const createCommonProcessStatusPatchCommand = (
  entityType: CommonProcessEntityType,
  entity: VersionedEntityReference,
  currentStatus: CommonProcessStatus,
  statusField: CommonProcessStatusField,
  action: CommonProcessStatusAction,
  access: EffectiveAccessDecision,
  reason?: string,
): CommonProcessStatusCommandResult => {
  const nextStatus = commonProcessStatusActions[action];
  const transitionRule = getTransitionRule("common-process", currentStatus, nextStatus);

  if (!transitionRule || !canTransitionStatus("common-process", currentStatus, nextStatus)) {
    return {
      ok: false,
      rejection: {
        code: "transition_not_allowed",
        message: "Status transition is not allowed for this common process.",
      },
    };
  }

  if (!canEditCommonProcess(access)) {
    return {
      ok: false,
      rejection: {
        code: "edit_permission_required",
        message: "Edit permission is required to change common process status.",
      },
    };
  }

  if (transitionRule.requiresApprovalRight && !canApproveCommonProcess(access)) {
    return {
      ok: false,
      rejection: {
        code: "approval_permission_required",
        message: "Approval permission is required for this common process transition.",
      },
    };
  }

  if (transitionRule.requiresReason && !reason?.trim()) {
    return {
      ok: false,
      rejection: {
        code: "reason_required",
        message: "Reason is required for this common process transition.",
      },
    };
  }

  return {
    ok: true,
    command: {
      entityType,
      entity: {
        id: entity.id,
        version: entity.version,
        updatedAt: entity.updatedAt,
        updatedBy: entity.updatedBy,
      },
      changes: [{
        field: statusField,
        previousValue: currentStatus,
        nextValue: nextStatus,
      }],
      reason,
    },
  };
};

export const createOvertimeStatusCommand = (
  request: OvertimeRequest,
  action: CommonProcessStatusAction,
  access: EffectiveAccessDecision,
  reason?: string,
): CommonProcessStatusCommandResult => (
  createCommonProcessStatusPatchCommand(
    "overtime_request",
    request,
    request.status,
    "status",
    action,
    access,
    reason,
  )
);

export const createBusinessTripStatusCommand = (
  trip: BusinessTrip,
  action: CommonProcessStatusAction,
  access: EffectiveAccessDecision,
  reason?: string,
): CommonProcessStatusCommandResult => (
  createCommonProcessStatusPatchCommand(
    "business_trip",
    trip,
    trip.approvalStatus,
    "approvalStatus",
    action,
    access,
    reason,
  )
);

export const createBusinessTripTaskStatusCommand = (
  task: BusinessTripTask,
  action: CommonProcessStatusAction,
  access: EffectiveAccessDecision,
  reason?: string,
): CommonProcessStatusCommandResult => (
  createCommonProcessStatusPatchCommand(
    "business_trip_task",
    task,
    task.status,
    "status",
    action,
    access,
    reason,
  )
);

export const createBusinessTripReadiness = (
  trip: BusinessTrip,
  tasks: readonly BusinessTripTask[],
): BusinessTripReadiness => {
  const issues: CommonProcessValidationIssue[] = [];

  if (!trip.reportText?.trim()) {
    issues.push({
      code: "report_required",
      message: "Business trip report is required before close.",
    });
  }

  for (const task of tasks.filter((item) => item.tripId === trip.id)) {
    if (task.status !== "approved" && task.status !== "closed") {
      issues.push({
        code: "task_not_finished",
        message: "Business trip task must be approved or closed before trip close.",
      });
    }
  }

  return {
    canClose: issues.length === 0,
    blockerCount: issues.length,
    issues,
  };
};
