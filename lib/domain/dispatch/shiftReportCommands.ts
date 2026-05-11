import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import type { PatchSaveCommand } from "../editing/patchEditing";
import { canTransitionStatus, getTransitionRule } from "../workflows/statusTransitions";
import type { MiningShiftReport, MiningShiftReportStatus } from "./service-contracts";

export type MiningShiftReportCommandRejectionCode =
  | "transition_not_allowed"
  | "reason_required"
  | "edit_permission_required"
  | "approval_permission_required";

export type MiningShiftReportCommandRejection = {
  code: MiningShiftReportCommandRejectionCode;
  message: string;
};

export type MiningShiftReportStatusCommandResult =
  | { ok: true; command: PatchSaveCommand }
  | { ok: false; rejection: MiningShiftReportCommandRejection };

export const miningShiftReportStatusActions = {
  submit: "submitted",
  startReview: "reviewing",
  returnToSection: "returned",
  accept: "accepted",
  close: "closed",
} as const satisfies Record<string, MiningShiftReportStatus>;

export type MiningShiftReportStatusAction = keyof typeof miningShiftReportStatusActions;

const canEditStatus = (access: EffectiveAccessDecision): boolean => access.canEdit || access.canAdmin;
const canApproveStatus = (access: EffectiveAccessDecision): boolean => access.canApprove || access.canAdmin;

export const getMiningShiftReportStatusByAction = (
  action: MiningShiftReportStatusAction,
): MiningShiftReportStatus => miningShiftReportStatusActions[action];

export const createMiningShiftReportStatusPatchCommand = (
  report: MiningShiftReport,
  nextStatus: MiningShiftReportStatus,
  access: EffectiveAccessDecision,
  reason?: string,
): MiningShiftReportStatusCommandResult => {
  const transitionRule = getTransitionRule("mining-shift-report", report.status, nextStatus);

  if (!transitionRule || !canTransitionStatus("mining-shift-report", report.status, nextStatus)) {
    return {
      ok: false,
      rejection: {
        code: "transition_not_allowed",
        message: "Status transition is not allowed for this mining shift report.",
      },
    };
  }

  if (!canEditStatus(access)) {
    return {
      ok: false,
      rejection: {
        code: "edit_permission_required",
        message: "Edit permission is required to change mining shift report status.",
      },
    };
  }

  if (transitionRule.requiresApprovalRight && !canApproveStatus(access)) {
    return {
      ok: false,
      rejection: {
        code: "approval_permission_required",
        message: "Approval permission is required for this status transition.",
      },
    };
  }

  if (transitionRule.requiresReason && !reason?.trim()) {
    return {
      ok: false,
      rejection: {
        code: "reason_required",
        message: "Reason is required for this status transition.",
      },
    };
  }

  return {
    ok: true,
    command: {
      entityType: "mining_shift_report",
      entity: {
        id: report.id,
        version: report.version,
        updatedAt: report.updatedAt,
        updatedBy: report.updatedBy,
      },
      changes: [{
        field: "status",
        previousValue: report.status,
        nextValue: nextStatus,
      }],
      reason,
    },
  };
};

export const createMiningShiftReportActionCommand = (
  report: MiningShiftReport,
  action: MiningShiftReportStatusAction,
  access: EffectiveAccessDecision,
  reason?: string,
): MiningShiftReportStatusCommandResult => (
  createMiningShiftReportStatusPatchCommand(
    report,
    getMiningShiftReportStatusByAction(action),
    access,
    reason,
  )
);
