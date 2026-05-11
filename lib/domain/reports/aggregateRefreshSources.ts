import type { RequiredFilterKey } from "../data-access/pagination";
import {
  getModuleListQueryPlan,
  type ModuleListQueryPlan,
} from "../data-access/moduleListQueryPlans";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import type { WorkspaceQueuedOperationTrigger } from "../workspaces/queuedOperations";
import type {
  ReportAggregateRefreshPlan,
} from "./aggregateRefresh";
import type { ReportAggregationGrain } from "./aggregation-contracts";

export type ReportAggregateRefreshSourcePlan = {
  reportKey: string;
  sourceModuleId: string;
  sourceWorkspaceId: DispatchWorkspaceId;
  sourceResource: string;
  sourceDatabaseAction: string;
  targetAggregateEntity: string;
  allowedGrains: ReportAggregationGrain[];
  metricKeys: string[];
  requiredSourceFilters: RequiredFilterKey[];
  maxDateRangeDays: number;
  maxInputRows: number;
  maxRuntimeSeconds: number;
  allowedTriggers: Exclude<WorkspaceQueuedOperationTrigger, "continuous-background">[];
  updateMode: "upsert-affected-aggregates";
  requiresBoundedSourceQuery: true;
  writesPreparedAggregateRows: true;
  storesResultByReference: true;
};

export type ReportAggregateRefreshSourceIssue = {
  reportKey: string;
  sourceModuleId: string;
  code:
    | "grain_not_allowed"
    | "missing_source_list_query_plan"
    | "source_filter_not_mapped"
    | "source_plan_without_bounded_limits"
    | "source_workspace_mismatch"
    | "trigger_not_allowed";
  field?: string;
  value?: string;
};

export type ReportAggregateRefreshSourceInput = {
  id: string;
  requestedBy: string;
  trigger: WorkspaceQueuedOperationTrigger;
  grain: ReportAggregationGrain;
  periodStart: string;
  periodEnd: string;
  sectionId?: string;
  sourceIds?: readonly string[];
  sourceVersion?: string;
  estimatedInputRows?: number;
};

export type ReportAggregateRefreshSourceResult =
  | { ok: true; plan: ReportAggregateRefreshPlan }
  | {
      ok: false;
      rejection: {
        code: "aggregate_refresh_source_invalid";
        message: string;
        issues: ReportAggregateRefreshSourceIssue[];
      };
    };

export const reportAggregateRefreshSourcePlans: ReportAggregateRefreshSourcePlan[] = [
  {
    reportKey: "dispatch-service-control",
    sourceModuleId: "mining-operational-accounting",
    sourceWorkspaceId: "mining-dispatch",
    sourceResource: "dispatch",
    sourceDatabaseAction: "list-operational-accounting",
    targetAggregateEntity: "prepared_report_aggregates",
    allowedGrains: ["shift", "day", "month", "year"],
    metricKeys: ["mining_volume", "plan_completion", "repair_hours"],
    requiredSourceFilters: ["date", "section_id", "shift"],
    maxDateRangeDays: 31,
    maxInputRows: 5000,
    maxRuntimeSeconds: 180,
    allowedTriggers: ["event-driven", "manual-request", "scheduled"],
    updateMode: "upsert-affected-aggregates",
    requiresBoundedSourceQuery: true,
    writesPreparedAggregateRows: true,
    storesResultByReference: true,
  },
  {
    reportKey: "dispatch-service-control",
    sourceModuleId: "taxation-fuel-periods",
    sourceWorkspaceId: "taxation",
    sourceResource: "taxation",
    sourceDatabaseAction: "list-fuel-periods",
    targetAggregateEntity: "prepared_report_aggregates",
    allowedGrains: ["fuel_period", "month", "year"],
    metricKeys: ["fuel_issued", "fuel_overconsumption", "contractor_debt"],
    requiredSourceFilters: ["section_id", "period_id", "status"],
    maxDateRangeDays: 366,
    maxInputRows: 10000,
    maxRuntimeSeconds: 240,
    allowedTriggers: ["event-driven", "manual-request", "scheduled"],
    updateMode: "upsert-affected-aggregates",
    requiresBoundedSourceQuery: true,
    writesPreparedAggregateRows: true,
    storesResultByReference: true,
  },
  {
    reportKey: "dispatch-service-control",
    sourceModuleId: "smts-fuel-drains",
    sourceWorkspaceId: "smts-gps",
    sourceResource: "smts",
    sourceDatabaseAction: "list-fuel-drain-events",
    targetAggregateEntity: "prepared_report_aggregates",
    allowedGrains: ["day", "watch", "month"],
    metricKeys: ["fuel_drain_events", "confirmed_fuel_drains"],
    requiredSourceFilters: ["date", "section_id", "vehicle_id", "status"],
    maxDateRangeDays: 14,
    maxInputRows: 5000,
    maxRuntimeSeconds: 180,
    allowedTriggers: ["event-driven", "manual-request", "scheduled"],
    updateMode: "upsert-affected-aggregates",
    requiresBoundedSourceQuery: true,
    writesPreparedAggregateRows: true,
    storesResultByReference: true,
  },
  {
    reportKey: "dispatch-service-control",
    sourceModuleId: "fleet-movements",
    sourceWorkspaceId: "fleet",
    sourceResource: "fleet",
    sourceDatabaseAction: "list-vehicle-movements",
    targetAggregateEntity: "prepared_report_aggregates",
    allowedGrains: ["day", "month", "year"],
    metricKeys: ["vehicle_movements"],
    requiredSourceFilters: ["section_id", "vehicle_id", "status"],
    maxDateRangeDays: 31,
    maxInputRows: 5000,
    maxRuntimeSeconds: 180,
    allowedTriggers: ["event-driven", "manual-request", "scheduled"],
    updateMode: "upsert-affected-aggregates",
    requiresBoundedSourceQuery: true,
    writesPreparedAggregateRows: true,
    storesResultByReference: true,
  },
];

export function getReportAggregateRefreshSourcePlan(sourceModuleId: string) {
  return reportAggregateRefreshSourcePlans.find((plan) => plan.sourceModuleId === sourceModuleId);
}

export function listReportAggregateRefreshSourcePlans(workspaceId?: DispatchWorkspaceId) {
  return reportAggregateRefreshSourcePlans.filter((plan) => (
    workspaceId ? plan.sourceWorkspaceId === workspaceId : true
  ));
}

function validatePlanAgainstListQuery(
  plan: ReportAggregateRefreshSourcePlan,
  listPlan: ModuleListQueryPlan | undefined,
): ReportAggregateRefreshSourceIssue[] {
  if (!listPlan) {
    return [{
      reportKey: plan.reportKey,
      sourceModuleId: plan.sourceModuleId,
      code: "missing_source_list_query_plan",
    }];
  }

  const issues: ReportAggregateRefreshSourceIssue[] = [];

  if (listPlan.workspaceId !== plan.sourceWorkspaceId) {
    issues.push({
      reportKey: plan.reportKey,
      sourceModuleId: plan.sourceModuleId,
      code: "source_workspace_mismatch",
      value: listPlan.workspaceId,
    });
  }

  for (const filter of plan.requiredSourceFilters) {
    if (!listPlan.filterColumns[filter]) {
      issues.push({
        reportKey: plan.reportKey,
        sourceModuleId: plan.sourceModuleId,
        code: "source_filter_not_mapped",
        field: filter,
      });
    }
  }

  return issues;
}

export function validateReportAggregateRefreshSourcePlan(
  plan: ReportAggregateRefreshSourcePlan,
): ReportAggregateRefreshSourceIssue[] {
  const issues = validatePlanAgainstListQuery(plan, getModuleListQueryPlan(plan.sourceModuleId));

  if (
    plan.maxDateRangeDays < 1 ||
    plan.maxInputRows < 1 ||
    plan.maxRuntimeSeconds < 1 ||
    plan.metricKeys.length === 0 ||
    plan.allowedGrains.length === 0 ||
    !plan.requiresBoundedSourceQuery ||
    !plan.writesPreparedAggregateRows ||
    !plan.storesResultByReference
  ) {
    issues.push({
      reportKey: plan.reportKey,
      sourceModuleId: plan.sourceModuleId,
      code: "source_plan_without_bounded_limits",
    });
  }

  return issues;
}

export function getInvalidReportAggregateRefreshSourcePlans() {
  return reportAggregateRefreshSourcePlans.flatMap(validateReportAggregateRefreshSourcePlan);
}

export function createReportAggregateRefreshPlanFromSource(
  sourcePlan: ReportAggregateRefreshSourcePlan,
  input: ReportAggregateRefreshSourceInput,
): ReportAggregateRefreshSourceResult {
  const issues = validateReportAggregateRefreshSourcePlan(sourcePlan);

  if (!sourcePlan.allowedGrains.includes(input.grain)) {
    issues.push({
      reportKey: sourcePlan.reportKey,
      sourceModuleId: sourcePlan.sourceModuleId,
      code: "grain_not_allowed",
      field: "grain",
      value: input.grain,
    });
  }

  if (input.trigger === "continuous-background" || !sourcePlan.allowedTriggers.includes(input.trigger)) {
    issues.push({
      reportKey: sourcePlan.reportKey,
      sourceModuleId: sourcePlan.sourceModuleId,
      code: "trigger_not_allowed",
      field: "trigger",
      value: input.trigger,
    });
  }

  if (issues.length > 0) {
    return {
      ok: false,
      rejection: {
        code: "aggregate_refresh_source_invalid",
        message: "Aggregate refresh source is not ready for a bounded prepared report refresh.",
        issues,
      },
    };
  }

  return {
    ok: true,
    plan: {
      id: input.id,
      workspaceId: sourcePlan.sourceWorkspaceId,
      moduleId: sourcePlan.sourceModuleId,
      reportKey: sourcePlan.reportKey,
      requestedBy: input.requestedBy,
      trigger: input.trigger,
      grain: input.grain,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      sectionId: input.sectionId,
      sourceIds: input.sourceIds,
      sourceVersion: input.sourceVersion,
      metricKeys: sourcePlan.metricKeys,
      updateMode: sourcePlan.updateMode,
      estimatedInputRows: input.estimatedInputRows,
      maxInputRows: sourcePlan.maxInputRows,
      maxRuntimeSeconds: sourcePlan.maxRuntimeSeconds,
    },
  };
}
