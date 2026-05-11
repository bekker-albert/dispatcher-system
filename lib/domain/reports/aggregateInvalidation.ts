import type { WorkspaceQueuedOperationTrigger } from "../workspaces/queuedOperations";
import type { ReportAggregationGrain } from "./aggregation-contracts";
import {
  createReportAggregateRefreshPlanFromSource,
  getReportAggregateRefreshSourcePlan,
  type ReportAggregateRefreshSourceIssue,
} from "./aggregateRefreshSources";
import type { ReportAggregateRefreshPlan } from "./aggregateRefresh";

export type ReportAggregateInvalidationReason =
  | "create-saved"
  | "patch-saved"
  | "workflow-transition"
  | "import-accepted"
  | "manual-correction";

export type ReportAggregateInvalidationEvent = {
  id: string;
  sourceModuleId: string;
  entityId: string;
  changedBy: string;
  changedAt: string;
  reason: ReportAggregateInvalidationReason;
  grain: ReportAggregationGrain;
  periodStart?: string;
  periodEnd?: string;
  sectionId?: string;
  sourceVersion?: string;
  changedFields?: readonly string[];
  estimatedInputRows?: number;
  trigger?: WorkspaceQueuedOperationTrigger;
};

export type ReportAggregateInvalidationIssueCode =
  | ReportAggregateRefreshSourceIssue["code"]
  | "changed_at_required"
  | "changed_by_required"
  | "continuous_background_forbidden"
  | "entity_id_required"
  | "period_required"
  | "source_plan_missing"
  | "source_version_required"
  | "whole_table_invalidation_forbidden";

export type ReportAggregateInvalidationIssue = {
  code: ReportAggregateInvalidationIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ReportAggregateInvalidationEnvelope = {
  eventId: string;
  sourceModuleId: string;
  entityId: string;
  changedBy: string;
  changedAt: string;
  reason: ReportAggregateInvalidationReason;
  action: "queue-prepared-aggregate-refresh";
  refreshScope: "entity-period-section";
  refreshPlan: ReportAggregateRefreshPlan;
  noFullReportRebuild: true;
  noClientSideRecalculation: true;
};

export type ReportAggregateInvalidationResult =
  | { ok: true; envelope: ReportAggregateInvalidationEnvelope }
  | {
      ok: false;
      rejection: {
        code: "aggregate_invalidation_invalid";
        message: string;
        issues: ReportAggregateInvalidationIssue[];
      };
    };

const forbiddenWholeTableFields = new Set([
  "allrows",
  "dataset",
  "records",
  "rows",
  "table",
]);

function normalizeFieldName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isWholeTableField(field: string) {
  const normalizedField = normalizeFieldName(field);

  return [...forbiddenWholeTableFields].some((forbiddenField) => (
    normalizedField === forbiddenField || normalizedField.startsWith(forbiddenField)
  ));
}

function toInvalidationIssue(issue: ReportAggregateRefreshSourceIssue): ReportAggregateInvalidationIssue {
  return {
    code: issue.code,
    severity: "blocker",
    message: "Aggregate refresh source cannot accept this invalidation event.",
    field: issue.field,
  };
}

export function validateReportAggregateInvalidationEvent(
  event: ReportAggregateInvalidationEvent,
): ReportAggregateInvalidationIssue[] {
  const issues: ReportAggregateInvalidationIssue[] = [];
  const sourcePlan = getReportAggregateRefreshSourcePlan(event.sourceModuleId);

  if (!sourcePlan) {
    issues.push({
      code: "source_plan_missing",
      severity: "blocker",
      message: "Invalidation source module has no prepared aggregate refresh source plan.",
      field: "sourceModuleId",
    });
  }

  if (!event.entityId.trim()) {
    issues.push({
      code: "entity_id_required",
      severity: "blocker",
      message: "Invalidation event must target one changed source entity.",
      field: "entityId",
    });
  }

  if (!event.changedBy.trim()) {
    issues.push({
      code: "changed_by_required",
      severity: "blocker",
      message: "Invalidation event must keep the actor who changed source data.",
      field: "changedBy",
    });
  }

  if (!event.changedAt.trim()) {
    issues.push({
      code: "changed_at_required",
      severity: "blocker",
      message: "Invalidation event must keep the source change timestamp.",
      field: "changedAt",
    });
  }

  if (!event.periodStart?.trim() || !event.periodEnd?.trim()) {
    issues.push({
      code: "period_required",
      severity: "blocker",
      message: "Invalidation event must be bounded by the affected report period.",
      field: "period",
    });
  }

  if (!event.sourceVersion?.trim()) {
    issues.push({
      code: "source_version_required",
      severity: "blocker",
      message: "Invalidation event must carry the source version created by the write.",
      field: "sourceVersion",
    });
  }

  if (event.trigger === "continuous-background") {
    issues.push({
      code: "continuous_background_forbidden",
      severity: "blocker",
      message: "Source invalidation must queue a bounded refresh, not a resident background job.",
      field: "trigger",
    });
  }

  if (event.changedFields?.some(isWholeTableField)) {
    issues.push({
      code: "whole_table_invalidation_forbidden",
      severity: "blocker",
      message: "Invalidation event cannot describe a whole-table change.",
      field: "changedFields",
    });
  }

  if (sourcePlan) {
    const sourceResult = createReportAggregateRefreshPlanFromSource(sourcePlan, {
      id: `aggregate-refresh:${event.id}`,
      requestedBy: event.changedBy,
      trigger: event.trigger ?? "event-driven",
      grain: event.grain,
      periodStart: event.periodStart ?? "",
      periodEnd: event.periodEnd ?? "",
      sectionId: event.sectionId,
      sourceIds: event.entityId.trim() ? [event.entityId] : [],
      sourceVersion: event.sourceVersion,
      estimatedInputRows: event.estimatedInputRows,
    });

    if (!sourceResult.ok) {
      issues.push(...sourceResult.rejection.issues.map(toInvalidationIssue));
    }
  }

  return issues;
}

export function createReportAggregateInvalidationEnvelope(
  event: ReportAggregateInvalidationEvent,
): ReportAggregateInvalidationResult {
  const issues = validateReportAggregateInvalidationEvent(event);
  const sourcePlan = getReportAggregateRefreshSourcePlan(event.sourceModuleId);

  if (issues.length > 0 || !sourcePlan) {
    return {
      ok: false,
      rejection: {
        code: "aggregate_invalidation_invalid",
        message: "Report aggregate invalidation cannot queue a bounded refresh plan.",
        issues,
      },
    };
  }

  const refreshPlan = createReportAggregateRefreshPlanFromSource(sourcePlan, {
    id: `aggregate-refresh:${event.id}`,
    requestedBy: event.changedBy,
    trigger: event.trigger ?? "event-driven",
    grain: event.grain,
    periodStart: event.periodStart ?? "",
    periodEnd: event.periodEnd ?? "",
    sectionId: event.sectionId,
    sourceIds: [event.entityId],
    sourceVersion: event.sourceVersion,
    estimatedInputRows: event.estimatedInputRows,
  });

  if (!refreshPlan.ok) {
    return {
      ok: false,
      rejection: {
        code: "aggregate_invalidation_invalid",
        message: "Report aggregate invalidation cannot queue a bounded refresh plan.",
        issues: refreshPlan.rejection.issues.map(toInvalidationIssue),
      },
    };
  }

  return {
    ok: true,
    envelope: {
      eventId: event.id,
      sourceModuleId: event.sourceModuleId,
      entityId: event.entityId,
      changedBy: event.changedBy.trim(),
      changedAt: event.changedAt,
      reason: event.reason,
      action: "queue-prepared-aggregate-refresh",
      refreshScope: "entity-period-section",
      refreshPlan: refreshPlan.plan,
      noFullReportRebuild: true,
      noClientSideRecalculation: true,
    },
  };
}
