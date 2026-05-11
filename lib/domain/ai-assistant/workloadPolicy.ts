import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import { requiresAiAssistantApproval } from "./approval-policy";
import type {
  AiAssistantActionRisk,
  AiAssistantActionType,
  AiAssistantConnectorKey,
} from "./types";

export type AiAssistantWorkloadMode =
  | "manual-request"
  | "event-driven"
  | "scheduled"
  | "continuous-background";

export type AiAssistantWorkloadPlan = {
  id: string;
  mode: AiAssistantWorkloadMode;
  actionType: AiAssistantActionType;
  requestedBy?: string;
  workspaceId?: DispatchWorkspaceId;
  targetConnector?: AiAssistantConnectorKey;
  risk?: AiAssistantActionRisk;
  periodStart?: string;
  periodEnd?: string;
  sectionId?: string;
  vehicleId?: string;
  sourceIds?: readonly string[];
  estimatedInputRows?: number;
  maxInputRows?: number;
  approvalGranted?: boolean;
  usesFullHistory?: boolean;
  readsAllWorkspaces?: boolean;
};

export type AiAssistantWorkloadPolicy = {
  maxInputRows: number;
  maxDateRangeDays: number;
  requireBoundedContext: true;
  forbidContinuousBackground: true;
};

export type AiAssistantWorkloadIssueCode =
  | "continuous_background_forbidden"
  | "requester_required"
  | "bounded_context_required"
  | "period_invalid"
  | "date_range_too_large"
  | "input_limit_required"
  | "input_limit_exceeded"
  | "full_history_forbidden"
  | "all_workspace_scan_forbidden"
  | "approval_required";

export type AiAssistantWorkloadIssue = {
  code: AiAssistantWorkloadIssueCode;
  severity: "blocker" | "warning";
  message: string;
};

export type AiAssistantWorkloadEvaluation = {
  canRun: boolean;
  mode: AiAssistantWorkloadMode;
  issueCount: number;
  issues: AiAssistantWorkloadIssue[];
};

export const defaultAiAssistantWorkloadPolicy: AiAssistantWorkloadPolicy = {
  maxInputRows: 100,
  maxDateRangeDays: 7,
  requireBoundedContext: true,
  forbidContinuousBackground: true,
};

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function evaluateAiAssistantWorkloadPlan(
  plan: AiAssistantWorkloadPlan,
  policy: AiAssistantWorkloadPolicy = defaultAiAssistantWorkloadPolicy,
): AiAssistantWorkloadEvaluation {
  const issues: AiAssistantWorkloadIssue[] = [];

  if (policy.forbidContinuousBackground && plan.mode === "continuous-background") {
    issues.push({
      code: "continuous_background_forbidden",
      severity: "blocker",
      message: "AI assistant workloads must be manual, event-driven, or scheduled; continuous background scans are forbidden.",
    });
  }

  if (!plan.requestedBy?.trim()) {
    issues.push({
      code: "requester_required",
      severity: "blocker",
      message: "AI assistant workload must keep the requesting user or system actor.",
    });
  }

  if (plan.usesFullHistory) {
    issues.push({
      code: "full_history_forbidden",
      severity: "blocker",
      message: "AI assistant workload cannot read full history; use a bounded period or explicit source ids.",
    });
  }

  if (plan.readsAllWorkspaces) {
    issues.push({
      code: "all_workspace_scan_forbidden",
      severity: "blocker",
      message: "AI assistant workload cannot scan all workspaces at once.",
    });
  }

  if (policy.requireBoundedContext && !hasBoundedContext(plan)) {
    issues.push({
      code: "bounded_context_required",
      severity: "blocker",
      message: "AI assistant workload must be bounded by period, section, vehicle, or explicit source ids.",
    });
  }

  const dateRangeDays = getInclusiveDateRangeDays(plan.periodStart, plan.periodEnd);
  if ((plan.periodStart || plan.periodEnd) && dateRangeDays < 1) {
    issues.push({
      code: "period_invalid",
      severity: "blocker",
      message: "AI assistant workload period is invalid.",
    });
  } else if (dateRangeDays > policy.maxDateRangeDays) {
    issues.push({
      code: "date_range_too_large",
      severity: "blocker",
      message: "AI assistant workload period exceeds policy range.",
    });
  }

  if (plan.maxInputRows === undefined) {
    issues.push({
      code: "input_limit_required",
      severity: "blocker",
      message: "AI assistant workload must declare maxInputRows.",
    });
  } else if (plan.maxInputRows > policy.maxInputRows) {
    issues.push({
      code: "input_limit_exceeded",
      severity: "blocker",
      message: "AI assistant workload maxInputRows exceeds policy limit.",
    });
  }

  if (plan.estimatedInputRows !== undefined && plan.estimatedInputRows > policy.maxInputRows) {
    issues.push({
      code: "input_limit_exceeded",
      severity: "blocker",
      message: "AI assistant workload estimated rows exceed policy limit.",
    });
  }

  if (requiresWorkloadApproval(plan) && !plan.approvalGranted) {
    issues.push({
      code: "approval_required",
      severity: "blocker",
      message: "AI assistant workload requires approval before execution.",
    });
  }

  return {
    canRun: issues.every((issue) => issue.severity !== "blocker"),
    mode: plan.mode,
    issueCount: issues.length,
    issues,
  };
}

export function createAiAssistantWorkloadRunEnvelope(
  plan: AiAssistantWorkloadPlan,
  policy: AiAssistantWorkloadPolicy = defaultAiAssistantWorkloadPolicy,
) {
  const evaluation = evaluateAiAssistantWorkloadPlan(plan, policy);

  return {
    planId: plan.id,
    canRun: evaluation.canRun,
    mode: plan.mode,
    requestedBy: plan.requestedBy,
    workspaceId: plan.workspaceId,
    maxInputRows: plan.maxInputRows,
    issueCodes: evaluation.issues.map((issue) => issue.code),
  };
}

function requiresWorkloadApproval(plan: AiAssistantWorkloadPlan): boolean {
  return requiresAiAssistantApproval(
    plan.actionType,
    plan.risk ?? "low",
    plan.targetConnector ?? "ai-api",
  );
}

function hasBoundedContext(plan: AiAssistantWorkloadPlan): boolean {
  return Boolean(
    plan.sectionId?.trim()
    || plan.vehicleId?.trim()
    || (plan.periodStart?.trim() && plan.periodEnd?.trim())
    || (plan.sourceIds && plan.sourceIds.length > 0),
  );
}

function getInclusiveDateRangeDays(periodStart?: string, periodEnd?: string): number {
  if (!periodStart || !periodEnd) {
    return 0;
  }

  const start = Date.parse(`${periodStart}T00:00:00.000Z`);
  const end = Date.parse(`${periodEnd}T00:00:00.000Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return -1;
  }

  return Math.floor((end - start) / millisecondsPerDay) + 1;
}
