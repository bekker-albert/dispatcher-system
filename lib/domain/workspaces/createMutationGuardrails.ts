import {
  getCreateMutationPlansMissingSectionScopeForSectionScopedPolicies,
  getCreateMutationPlansWithRouteMetadataMismatch,
  getCreateMutationPlansWithoutDuplicateKeys,
  getCreateMutationPlansWithoutRouteAction,
  getCreateMutationPlansWithoutVersionHistory,
  getMissingCreateMutationPlans,
  getUnsafeCreateMutationPlanIdentifiers,
} from "../data-access/moduleCreateMutationPlans";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";
import type { WorkspaceGuardrailIssue } from "./guardrails";

const createMutationIssueMessages: Partial<Record<WorkspaceGuardrailIssue["code"], string>> = {
  missing_create_mutation_plan: "Create actions must declare initial version, status and duplicate checks.",
  create_mutation_plan_without_route_action: "Create mutation plan database action must match the module data route action.",
  create_mutation_plan_route_metadata_mismatch: "Create mutation plan workspace and resource must match the module data route contract.",
  create_mutation_plan_without_version_history: "Create mutation plan must initialize version fields and write change history.",
  create_mutation_plan_without_duplicate_keys: "Create mutation plan must prevent duplicate operational documents.",
  create_mutation_plan_missing_section_scope: "Section-scoped create plans must include section_id in the future SQL scope.",
  create_mutation_plan_unsafe_identifier: "Create mutation plan must use safe table and column identifiers.",
};

export function getCreateMutationGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  return [
    ...getMissingCreateMutationPlans(module.workspaceId),
    ...getCreateMutationPlansWithoutRouteAction(module.workspaceId),
    ...getCreateMutationPlansWithRouteMetadataMismatch(),
    ...getCreateMutationPlansWithoutVersionHistory(module.workspaceId),
    ...getCreateMutationPlansWithoutDuplicateKeys(module.workspaceId),
    ...getCreateMutationPlansMissingSectionScopeForSectionScopedPolicies(module.workspaceId),
    ...getUnsafeCreateMutationPlanIdentifiers(module.workspaceId),
  ].filter((issue) => issue.moduleId === module.id).map((issue) => ({
    moduleId: module.id,
    workspaceId: module.workspaceId,
    code: issue.code,
    severity: "blocker",
    message: createMutationIssueMessages[issue.code] ?? "Create mutation plan is invalid.",
  }));
}
