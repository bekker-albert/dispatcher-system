import {
  getInvalidReportAggregateInvalidationPlans,
  getRefreshSourceModulesWithoutInvalidationPlans,
} from "../reports/aggregateInvalidationPlans";
import {
  getInvalidReportAggregateRefreshSourcePlans,
} from "../reports/aggregateRefreshSources";
import type { WorkspaceGuardrailIssue, WorkspaceGuardrailIssueCode } from "./guardrailTypes";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";

const invalidationCodeMap: Record<string, WorkspaceGuardrailIssueCode> = {
  grain_not_allowed: "report_aggregate_invalidation_grain_not_allowed",
  invalidation_plan_without_guards: "report_aggregate_invalidation_without_guards",
  mutation_action_mismatch: "report_aggregate_invalidation_action_mismatch",
  mutation_plan_missing: "report_aggregate_invalidation_mutation_plan_missing",
  source_plan_missing: "report_aggregate_invalidation_source_plan_missing",
};

const refreshSourceCodeMap: Record<string, WorkspaceGuardrailIssueCode> = {
  missing_source_list_query_plan: "report_aggregate_refresh_source_missing_list_query",
  source_filter_not_mapped: "report_aggregate_refresh_source_filter_not_mapped",
  source_plan_without_bounded_limits: "report_aggregate_refresh_source_without_bounded_limits",
  source_workspace_mismatch: "report_aggregate_refresh_source_workspace_mismatch",
};

const reportAggregateIssueMessages: Partial<Record<WorkspaceGuardrailIssueCode, string>> = {
  report_aggregate_invalidation_action_mismatch: "Report aggregate invalidation must reference the matching write/import action.",
  report_aggregate_invalidation_grain_not_allowed: "Report aggregate invalidation grain must be allowed by the refresh source plan.",
  report_aggregate_invalidation_mutation_plan_missing: "Report aggregate invalidation must have a matching create, patch, workflow or import plan.",
  report_aggregate_invalidation_source_plan_missing: "Report aggregate invalidation must have a bounded refresh source plan.",
  report_aggregate_invalidation_without_guards: "Report aggregate invalidation must require entity, period, source version and bounded refresh guards.",
  report_aggregate_refresh_source_filter_not_mapped: "Report aggregate refresh source filters must map to server-side list query columns.",
  report_aggregate_refresh_source_missing_list_query: "Report aggregate refresh source must have a bounded list query plan.",
  report_aggregate_refresh_source_without_bounded_limits: "Report aggregate refresh source must declare bounded limits and store results by reference.",
  report_aggregate_refresh_source_without_invalidation: "Report aggregate refresh source must have an invalidation plan for affected writes/imports.",
  report_aggregate_refresh_source_workspace_mismatch: "Report aggregate refresh source workspace must match the source list query plan.",
};

export function getReportAggregateGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  const invalidationIssues = getInvalidReportAggregateInvalidationPlans()
    .filter((issue) => issue.sourceModuleId === module.id)
    .map((issue) => createReportAggregateIssue(module, invalidationCodeMap[issue.code]));

  const refreshSourceIssues = getInvalidReportAggregateRefreshSourcePlans()
    .filter((issue) => issue.sourceModuleId === module.id)
    .map((issue) => createReportAggregateIssue(module, refreshSourceCodeMap[issue.code]));

  const missingInvalidationIssues = getRefreshSourceModulesWithoutInvalidationPlans()
    .filter((plan) => plan.sourceModuleId === module.id)
    .map(() => createReportAggregateIssue(module, "report_aggregate_refresh_source_without_invalidation"));

  return [
    ...invalidationIssues,
    ...refreshSourceIssues,
    ...missingInvalidationIssues,
  ];
}

function createReportAggregateIssue(
  module: WorkspaceModuleCatalogItem,
  code: WorkspaceGuardrailIssueCode,
): WorkspaceGuardrailIssue {
  return {
    moduleId: module.id,
    workspaceId: module.workspaceId,
    code,
    severity: "blocker",
    message: reportAggregateIssueMessages[code] ?? "Report aggregate plan is invalid.",
  };
}
