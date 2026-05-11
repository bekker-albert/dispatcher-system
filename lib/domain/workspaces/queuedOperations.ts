import type { DispatchWorkspaceId } from "./workspaces";

export type WorkspaceQueuedOperationKind =
  | "ai-workload"
  | "export"
  | "gps-reconciliation"
  | "import-validation"
  | "prepared-aggregate-refresh";

export type WorkspaceQueuedOperationTrigger =
  | "continuous-background"
  | "event-driven"
  | "manual-request"
  | "scheduled";

export type WorkspaceQueuedOperationPlan = {
  id: string;
  kind: WorkspaceQueuedOperationKind;
  trigger: WorkspaceQueuedOperationTrigger;
  workspaceId: DispatchWorkspaceId;
  moduleId: string;
  requestedBy?: string;
  periodStart?: string;
  periodEnd?: string;
  sectionId?: string;
  vehicleId?: string;
  sourceIds?: readonly string[];
  maxInputRows?: number;
  estimatedInputRows?: number;
  maxRuntimeSeconds?: number;
  storesResultByReference?: boolean;
  usesFullHistory?: boolean;
  readsAllWorkspaces?: boolean;
};

export type WorkspaceQueuedOperationPolicy = {
  maxInputRows: number;
  maxDateRangeDays: number;
  maxRuntimeSeconds: number;
  forbidContinuousBackground: true;
  requireBoundedContext: true;
  requireResultReference: true;
};

export type WorkspaceQueuedOperationIssueCode =
  | "all_workspace_scan_forbidden"
  | "bounded_context_required"
  | "continuous_background_forbidden"
  | "date_range_too_large"
  | "full_history_forbidden"
  | "input_limit_exceeded"
  | "input_limit_required"
  | "inline_result_forbidden"
  | "period_invalid"
  | "requester_required"
  | "runtime_limit_exceeded"
  | "runtime_limit_required";

export type WorkspaceQueuedOperationIssue = {
  code: WorkspaceQueuedOperationIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type WorkspaceQueuedOperationEvaluation = {
  canQueue: boolean;
  issueCount: number;
  issues: WorkspaceQueuedOperationIssue[];
};

export type WorkspaceQueuedOperationEnvelope = {
  id: string;
  kind: WorkspaceQueuedOperationKind;
  trigger: Exclude<WorkspaceQueuedOperationTrigger, "continuous-background">;
  workspaceId: DispatchWorkspaceId;
  moduleId: string;
  requestedBy: string;
  executionMode: "queued";
  noResidentProcess: true;
  maxInputRows: number;
  maxRuntimeSeconds: number;
  storesResultByReference: true;
};

export type WorkspaceQueuedOperationEnvelopeResult =
  | { ok: true; envelope: WorkspaceQueuedOperationEnvelope }
  | {
      ok: false;
      rejection: {
        code: "queued_operation_invalid";
        message: string;
        issues: WorkspaceQueuedOperationIssue[];
      };
    };

export const defaultWorkspaceQueuedOperationPolicy: WorkspaceQueuedOperationPolicy = {
  maxInputRows: 10_000,
  maxDateRangeDays: 31,
  maxRuntimeSeconds: 300,
  forbidContinuousBackground: true,
  requireBoundedContext: true,
  requireResultReference: true,
};

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function evaluateWorkspaceQueuedOperationPlan(
  plan: WorkspaceQueuedOperationPlan,
  policy: WorkspaceQueuedOperationPolicy = defaultWorkspaceQueuedOperationPolicy,
): WorkspaceQueuedOperationEvaluation {
  const issues: WorkspaceQueuedOperationIssue[] = [];

  if (policy.forbidContinuousBackground && plan.trigger === "continuous-background") {
    issues.push({
      code: "continuous_background_forbidden",
      severity: "blocker",
      message: "Long workspace operations must be queued by request, event, or schedule.",
      field: "trigger",
    });
  }

  if (!plan.requestedBy?.trim()) {
    issues.push({
      code: "requester_required",
      severity: "blocker",
      message: "Queued operation must keep the requesting user or system actor.",
      field: "requestedBy",
    });
  }

  if (plan.usesFullHistory) {
    issues.push({
      code: "full_history_forbidden",
      severity: "blocker",
      message: "Queued operation cannot read full history; use a bounded period or explicit source ids.",
      field: "usesFullHistory",
    });
  }

  if (plan.readsAllWorkspaces) {
    issues.push({
      code: "all_workspace_scan_forbidden",
      severity: "blocker",
      message: "Queued operation cannot scan all workspaces in one run.",
      field: "readsAllWorkspaces",
    });
  }

  if (policy.requireBoundedContext && !hasBoundedContext(plan)) {
    issues.push({
      code: "bounded_context_required",
      severity: "blocker",
      message: "Queued operation must be bounded by period, section, vehicle, or explicit source ids.",
      field: "scope",
    });
  }

  const dateRangeDays = getInclusiveDateRangeDays(plan.periodStart, plan.periodEnd);
  if ((plan.periodStart || plan.periodEnd) && dateRangeDays < 1) {
    issues.push({
      code: "period_invalid",
      severity: "blocker",
      message: "Queued operation period is invalid.",
      field: "period",
    });
  } else if (dateRangeDays > policy.maxDateRangeDays) {
    issues.push({
      code: "date_range_too_large",
      severity: "blocker",
      message: "Queued operation period exceeds policy range.",
      field: "period",
    });
  }

  if (plan.maxInputRows === undefined) {
    issues.push({
      code: "input_limit_required",
      severity: "blocker",
      message: "Queued operation must declare maxInputRows.",
      field: "maxInputRows",
    });
  } else if (plan.maxInputRows > policy.maxInputRows) {
    issues.push({
      code: "input_limit_exceeded",
      severity: "blocker",
      message: "Queued operation maxInputRows exceeds policy limit.",
      field: "maxInputRows",
    });
  }

  if (plan.estimatedInputRows !== undefined && plan.estimatedInputRows > policy.maxInputRows) {
    issues.push({
      code: "input_limit_exceeded",
      severity: "blocker",
      message: "Queued operation estimated rows exceed policy limit.",
      field: "estimatedInputRows",
    });
  }

  if (plan.maxRuntimeSeconds === undefined) {
    issues.push({
      code: "runtime_limit_required",
      severity: "blocker",
      message: "Queued operation must declare maxRuntimeSeconds.",
      field: "maxRuntimeSeconds",
    });
  } else if (plan.maxRuntimeSeconds > policy.maxRuntimeSeconds) {
    issues.push({
      code: "runtime_limit_exceeded",
      severity: "blocker",
      message: "Queued operation runtime exceeds policy limit.",
      field: "maxRuntimeSeconds",
    });
  }

  if (policy.requireResultReference && !plan.storesResultByReference) {
    issues.push({
      code: "inline_result_forbidden",
      severity: "blocker",
      message: "Queued operation result must be stored by reference, not inline in memory.",
      field: "storesResultByReference",
    });
  }

  return {
    canQueue: issues.every((issue) => issue.severity !== "blocker"),
    issueCount: issues.length,
    issues,
  };
}

export function createWorkspaceQueuedOperationEnvelope(
  plan: WorkspaceQueuedOperationPlan,
  policy: WorkspaceQueuedOperationPolicy = defaultWorkspaceQueuedOperationPolicy,
): WorkspaceQueuedOperationEnvelopeResult {
  const evaluation = evaluateWorkspaceQueuedOperationPlan(plan, policy);

  if (!evaluation.canQueue || plan.trigger === "continuous-background" || !plan.requestedBy) {
    return {
      ok: false,
      rejection: {
        code: "queued_operation_invalid",
        message: "Queued operation does not satisfy the 2 GB RAM execution policy.",
        issues: evaluation.issues,
      },
    };
  }

  return {
    ok: true,
    envelope: {
      id: plan.id,
      kind: plan.kind,
      trigger: plan.trigger,
      workspaceId: plan.workspaceId,
      moduleId: plan.moduleId,
      requestedBy: plan.requestedBy.trim(),
      executionMode: "queued",
      noResidentProcess: true,
      maxInputRows: plan.maxInputRows ?? policy.maxInputRows,
      maxRuntimeSeconds: plan.maxRuntimeSeconds ?? policy.maxRuntimeSeconds,
      storesResultByReference: true,
    },
  };
}

function hasBoundedContext(plan: WorkspaceQueuedOperationPlan): boolean {
  return Boolean(
    plan.sectionId?.trim()
    || plan.vehicleId?.trim()
    || (plan.periodStart?.trim() && plan.periodEnd?.trim())
    || (plan.sourceIds && plan.sourceIds.length > 0),
  );
}

function getInclusiveDateRangeDays(periodStart?: string, periodEnd?: string): number {
  if (!periodStart || !periodEnd) return 0;

  const start = Date.parse(`${periodStart}T00:00:00.000Z`);
  const end = Date.parse(`${periodEnd}T00:00:00.000Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return -1;

  return Math.floor((end - start) / millisecondsPerDay) + 1;
}
