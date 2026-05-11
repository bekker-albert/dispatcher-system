import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import type { PatchSaveCommand } from "../editing/patchEditing";
import type { MiningDispatchReportReadiness, MiningDispatchReportReadinessIssue } from "./reportReadiness";
import type { MiningShiftReport } from "./service-contracts";
import { createMiningShiftReportActionCommand } from "./shiftReportCommands";

export type MiningDispatchReportClosureRejectionCode =
  | "readiness_blockers"
  | "approval_permission_required"
  | "no_reports_to_close"
  | "status_transition_rejected";

export type MiningDispatchReportClosureRejection = {
  code: MiningDispatchReportClosureRejectionCode;
  message: string;
  blockerCount?: number;
  issues?: MiningDispatchReportReadinessIssue[];
};

export type MiningDispatchReportClosureResult =
  | {
      ok: true;
      commands: PatchSaveCommand[];
      warningCount: number;
    }
  | {
      ok: false;
      rejection: MiningDispatchReportClosureRejection;
    };

const canCloseDispatchReport = (access: EffectiveAccessDecision): boolean => (
  access.canApprove || access.canAdmin
);

export const createMiningDispatchReportClosureCommands = (
  reports: readonly MiningShiftReport[],
  readiness: MiningDispatchReportReadiness,
  access: EffectiveAccessDecision,
  reason = "Close mining dispatch report",
): MiningDispatchReportClosureResult => {
  if (!readiness.canClose) {
    return {
      ok: false,
      rejection: {
        code: "readiness_blockers",
        message: "Mining dispatch report has readiness blockers and cannot be closed.",
        blockerCount: readiness.blockerCount,
        issues: readiness.issues.filter((issue) => issue.severity === "blocker"),
      },
    };
  }

  if (!canCloseDispatchReport(access)) {
    return {
      ok: false,
      rejection: {
        code: "approval_permission_required",
        message: "Approval permission is required to close mining dispatch report.",
      },
    };
  }

  const reportsToClose = reports.filter((report) => report.status === "accepted");

  if (reportsToClose.length === 0) {
    return {
      ok: false,
      rejection: {
        code: "no_reports_to_close",
        message: "There are no accepted mining shift reports to close.",
      },
    };
  }

  const commands: PatchSaveCommand[] = [];

  for (const report of reportsToClose) {
    const result = createMiningShiftReportActionCommand(report, "close", access, reason);

    if (!result.ok) {
      return {
        ok: false,
        rejection: {
          code: "status_transition_rejected",
          message: result.rejection.message,
        },
      };
    }

    commands.push(result.command);
  }

  return {
    ok: true,
    commands,
    warningCount: readiness.warningCount,
  };
};
