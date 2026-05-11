import {
  getListQueryPlansMissingRequiredFilterColumns,
  getListQueryPlansWithRouteMetadataMismatch,
  getListQueryPlansWithoutRouteAction,
  getUnsafeListQueryPlanIdentifiers,
  getWorkspaceModulesWithoutListQueryPlan,
} from "../data-access/moduleListQueryPlans";
import type { WorkspaceGuardrailIssue } from "./guardrailTypes";
import { addModuleGuardrailIssue } from "./moduleGuardrailIssueFactory";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";

export function getModuleListQueryGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  const issues: WorkspaceGuardrailIssue[] = [];
  const missingListQueryPlan = getWorkspaceModulesWithoutListQueryPlan([module]).length > 0;
  const listQueryPlanRouteGaps = getListQueryPlansWithoutRouteAction()
    .filter((plan) => plan.moduleId === module.id);
  const listQueryPlanMetadataGaps = getListQueryPlansWithRouteMetadataMismatch()
    .filter((issue) => issue.moduleId === module.id);
  const listQueryPlanMissingFilters = getListQueryPlansMissingRequiredFilterColumns([module]);
  const unsafeListQueryPlanIdentifiers = getUnsafeListQueryPlanIdentifiers()
    .filter((issue) => issue.moduleId === module.id);

  if (missingListQueryPlan) {
    addModuleGuardrailIssue(
      issues,
      module,
      "missing_list_query_plan",
      "blocker",
      "Server-backed list actions must declare table, filter, search and sort column mappings.",
    );
  }

  if (listQueryPlanRouteGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "list_query_plan_without_route_action",
      "blocker",
      "List query plan database action must match the module data route list action.",
    );
  }

  if (listQueryPlanMetadataGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "list_query_plan_route_metadata_mismatch",
      "blocker",
      "List query plan workspace and resource must match the module data route contract.",
    );
  }

  if (listQueryPlanMissingFilters.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "list_query_plan_missing_required_filter",
      "blocker",
      "List query plan must map every required query-policy filter to a database column.",
    );
  }

  if (unsafeListQueryPlanIdentifiers.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "list_query_plan_unsafe_identifier",
      "blocker",
      "List query plan must use safe table and column identifiers.",
    );
  }

  return issues;
}
