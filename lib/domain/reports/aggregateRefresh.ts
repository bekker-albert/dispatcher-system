import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import {
  createWorkspaceQueuedOperationEnvelope,
  evaluateWorkspaceQueuedOperationPlan,
  type WorkspaceQueuedOperationEnvelope,
  type WorkspaceQueuedOperationIssue,
  type WorkspaceQueuedOperationIssueCode,
  type WorkspaceQueuedOperationPolicy,
  type WorkspaceQueuedOperationTrigger,
  defaultWorkspaceQueuedOperationPolicy,
} from "../workspaces/queuedOperations";
import type { ReportAggregationGrain } from "./aggregation-contracts";

export type ReportAggregateRefreshUpdateMode =
  | "replace-full-report"
  | "upsert-affected-aggregates";

export type ReportAggregateRefreshPlan = {
  id: string;
  workspaceId: DispatchWorkspaceId;
  moduleId: string;
  reportKey: string;
  requestedBy: string;
  trigger: WorkspaceQueuedOperationTrigger;
  grain: ReportAggregationGrain;
  periodStart: string;
  periodEnd: string;
  sectionId?: string;
  sourceIds?: readonly string[];
  sourceVersion?: string;
  metricKeys: readonly string[];
  updateMode: ReportAggregateRefreshUpdateMode;
  estimatedInputRows?: number;
  maxInputRows?: number;
  maxRuntimeSeconds?: number;
  usesFullHistory?: boolean;
  readsAllWorkspaces?: boolean;
};

export type ReportAggregateRefreshIssueCode =
  | WorkspaceQueuedOperationIssueCode
  | "full_report_rebuild_forbidden"
  | "metric_keys_required"
  | "source_version_required"
  | "update_mode_invalid";

export type ReportAggregateRefreshIssue = {
  code: ReportAggregateRefreshIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ReportAggregateRefreshEnvelope = {
  id: string;
  reportKey: string;
  workspaceId: DispatchWorkspaceId;
  moduleId: string;
  grain: ReportAggregationGrain;
  periodStart: string;
  periodEnd: string;
  sectionId?: string;
  sourceIds: readonly string[];
  sourceVersion: string;
  metricKeys: readonly string[];
  updateMode: "upsert-affected-aggregates";
  queuedOperation: WorkspaceQueuedOperationEnvelope;
  resultMode: "prepared-aggregate-rows-by-reference";
  writesPreparedAggregateRows: true;
  avoidsClientSideRecalculation: true;
  noFullReportRebuild: true;
};

export type ReportAggregateRefreshEnvelopeResult =
  | { ok: true; envelope: ReportAggregateRefreshEnvelope }
  | {
      ok: false;
      rejection: {
        code: "aggregate_refresh_invalid";
        message: string;
        issues: ReportAggregateRefreshIssue[];
      };
    };

function createQueuedOperationPlan(plan: ReportAggregateRefreshPlan) {
  return {
    id: plan.id,
    kind: "prepared-aggregate-refresh" as const,
    trigger: plan.trigger,
    workspaceId: plan.workspaceId,
    moduleId: plan.moduleId,
    requestedBy: plan.requestedBy,
    periodStart: plan.periodStart,
    periodEnd: plan.periodEnd,
    sectionId: plan.sectionId,
    sourceIds: plan.sourceIds,
    estimatedInputRows: plan.estimatedInputRows,
    maxInputRows: plan.maxInputRows,
    maxRuntimeSeconds: plan.maxRuntimeSeconds,
    storesResultByReference: true,
    usesFullHistory: plan.usesFullHistory,
    readsAllWorkspaces: plan.readsAllWorkspaces,
  };
}

function toAggregateIssue(issue: WorkspaceQueuedOperationIssue): ReportAggregateRefreshIssue {
  return {
    code: issue.code,
    severity: issue.severity,
    message: issue.message,
    field: issue.field,
  };
}

export function validateReportAggregateRefreshPlan(
  plan: ReportAggregateRefreshPlan,
  policy: WorkspaceQueuedOperationPolicy = defaultWorkspaceQueuedOperationPolicy,
): ReportAggregateRefreshIssue[] {
  const queuedIssues = evaluateWorkspaceQueuedOperationPlan(createQueuedOperationPlan(plan), policy)
    .issues
    .map(toAggregateIssue);
  const issues: ReportAggregateRefreshIssue[] = [...queuedIssues];

  if (!plan.metricKeys.some((metricKey) => metricKey.trim())) {
    issues.push({
      code: "metric_keys_required",
      severity: "blocker",
      message: "Aggregate refresh must declare the affected metrics.",
      field: "metricKeys",
    });
  }

  if (!plan.sourceVersion?.trim()) {
    issues.push({
      code: "source_version_required",
      severity: "blocker",
      message: "Prepared aggregate refresh must reference the source version used to build rows.",
      field: "sourceVersion",
    });
  }

  if (plan.updateMode !== "upsert-affected-aggregates") {
    issues.push({
      code: plan.updateMode === "replace-full-report" ? "full_report_rebuild_forbidden" : "update_mode_invalid",
      severity: "blocker",
      message: "Aggregate refresh must update only affected aggregate rows.",
      field: "updateMode",
    });
  }

  return issues;
}

export function createReportAggregateRefreshEnvelope(
  plan: ReportAggregateRefreshPlan,
  policy: WorkspaceQueuedOperationPolicy = defaultWorkspaceQueuedOperationPolicy,
): ReportAggregateRefreshEnvelopeResult {
  const issues = validateReportAggregateRefreshPlan(plan, policy);
  const queuedOperation = createWorkspaceQueuedOperationEnvelope(createQueuedOperationPlan(plan), policy);

  if (issues.some((issue) => issue.severity === "blocker") || !queuedOperation.ok) {
    return {
      ok: false,
      rejection: {
        code: "aggregate_refresh_invalid",
        message: "Prepared aggregate refresh does not satisfy the 2 GB RAM report policy.",
        issues,
      },
    };
  }

  return {
    ok: true,
    envelope: {
      id: plan.id,
      reportKey: plan.reportKey,
      workspaceId: plan.workspaceId,
      moduleId: plan.moduleId,
      grain: plan.grain,
      periodStart: plan.periodStart,
      periodEnd: plan.periodEnd,
      ...(plan.sectionId ? { sectionId: plan.sectionId } : {}),
      sourceIds: plan.sourceIds ?? [],
      sourceVersion: plan.sourceVersion?.trim() ?? "",
      metricKeys: plan.metricKeys.filter((metricKey) => metricKey.trim()),
      updateMode: "upsert-affected-aggregates",
      queuedOperation: queuedOperation.envelope,
      resultMode: "prepared-aggregate-rows-by-reference",
      writesPreparedAggregateRows: true,
      avoidsClientSideRecalculation: true,
      noFullReportRebuild: true,
    },
  };
}
