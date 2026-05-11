import type { MiningGpsLineReconciliationRow } from "./gpsReconciliation";
import type { MiningNonCompletionReasonRequirement } from "./nonCompletionReasons";
import type { MiningPlanFactRow } from "./planFact";
import type { MiningShiftReportSubmissionControlRow } from "./submissionControl";

export type MiningDispatchReportIssueSeverity = "blocker" | "warning";

export type MiningDispatchReportIssueCode =
  | "missing_submission"
  | "overdue_submission"
  | "returned_submission"
  | "gps_mismatch"
  | "missing_non_completion_reason"
  | "unplanned_fact"
  | "over_plan";

export type MiningDispatchReportReadinessIssue = {
  code: MiningDispatchReportIssueCode;
  severity: MiningDispatchReportIssueSeverity;
  entityId: string;
  sectionId?: string;
  reportDate?: string;
  message: string;
};

export type MiningDispatchReportReadiness = {
  canClose: boolean;
  blockerCount: number;
  warningCount: number;
  issues: MiningDispatchReportReadinessIssue[];
};

export type MiningDispatchReportReadinessInput = {
  submissions: readonly MiningShiftReportSubmissionControlRow[];
  gpsReconciliations: readonly MiningGpsLineReconciliationRow[];
  nonCompletionReasons: readonly MiningNonCompletionReasonRequirement[];
  planFactRows: readonly MiningPlanFactRow[];
};

const createIssue = (
  issue: MiningDispatchReportReadinessIssue,
): MiningDispatchReportReadinessIssue => issue;

export const createMiningDispatchReportReadiness = (
  input: MiningDispatchReportReadinessInput,
): MiningDispatchReportReadiness => {
  const issues: MiningDispatchReportReadinessIssue[] = [];

  for (const submission of input.submissions) {
    if (submission.status === "missing") {
      issues.push(createIssue({
        code: "missing_submission",
        severity: "blocker",
        entityId: submission.key,
        sectionId: submission.sectionId,
        reportDate: submission.reportDate,
        message: "Expected mining shift report is missing.",
      }));
      continue;
    }

    if (submission.status === "returned") {
      issues.push(createIssue({
        code: "returned_submission",
        severity: "blocker",
        entityId: submission.reportId ?? submission.key,
        sectionId: submission.sectionId,
        reportDate: submission.reportDate,
        message: "Mining shift report was returned and must be resubmitted.",
      }));
      continue;
    }

    if (submission.isOverdue) {
      issues.push(createIssue({
        code: "overdue_submission",
        severity: "warning",
        entityId: submission.reportId ?? submission.key,
        sectionId: submission.sectionId,
        reportDate: submission.reportDate,
        message: "Mining shift report was submitted after the expected deadline.",
      }));
    }
  }

  for (const row of input.gpsReconciliations) {
    if (row.status === "mismatch" || row.status === "new") {
      issues.push(createIssue({
        code: "gps_mismatch",
        severity: "blocker",
        entityId: row.id,
        sectionId: row.sectionId,
        reportDate: row.reportDate,
        message: "GPS trips do not match submitted trips or GPS data is missing.",
      }));
    }
  }

  for (const reason of input.nonCompletionReasons) {
    if (reason.status === "reason_required") {
      issues.push(createIssue({
        code: "missing_non_completion_reason",
        severity: "blocker",
        entityId: reason.id,
        sectionId: reason.sectionId,
        reportDate: reason.reportDate,
        message: "Non-completion reason is required before report close.",
      }));
    }
  }

  for (const row of input.planFactRows) {
    if (row.status === "unplanned_fact") {
      issues.push(createIssue({
        code: "unplanned_fact",
        severity: "warning",
        entityId: row.id,
        sectionId: row.sectionId,
        reportDate: row.reportDate,
        message: "Fact volume exists without an approved plan target.",
      }));
    }

    if (row.status === "over_plan") {
      issues.push(createIssue({
        code: "over_plan",
        severity: "warning",
        entityId: row.id,
        sectionId: row.sectionId,
        reportDate: row.reportDate,
        message: "Fact volume is above plan and should be reviewed.",
      }));
    }
  }

  const blockerCount = issues.filter((issue) => issue.severity === "blocker").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return {
    canClose: blockerCount === 0,
    blockerCount,
    warningCount,
    issues,
  };
};
