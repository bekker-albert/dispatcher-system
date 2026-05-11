import {
  getImportPlansOutsideSingleRouter,
  getImportPlansWithRouteMetadataMismatch,
  getImportPlansWithoutAccessPolicy,
  getImportPlansWithoutBoundedLimits,
  getImportPlansWithoutStagedValidation,
  getUnsafeImportPlanIdentifiers,
} from "../data-access/moduleImportPlans";
import type { WorkspaceGuardrailIssue } from "./guardrailTypes";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";

const importIssueMessages: Partial<Record<WorkspaceGuardrailIssue["code"], string>> = {
  import_plan_outside_single_router: "Import plan must use the single /api/database router.",
  import_plan_route_metadata_mismatch: "Import plan workspace and resource must match the module data route contract.",
  import_plan_without_access_policy: "Import plan must require a declared module access policy action.",
  import_plan_without_bounded_limits: "Import plan must declare row, preview, issue and format limits.",
  import_plan_without_staged_validation: "Import plan must stage files by reference and validate before accepting rows.",
  import_plan_unsafe_identifier: "Import plan must use safe import batch entity identifiers.",
};

export function getImportGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  return [
    ...getImportPlansOutsideSingleRouter(module.workspaceId),
    ...getImportPlansWithRouteMetadataMismatch(),
    ...getImportPlansWithoutAccessPolicy(module.workspaceId),
    ...getImportPlansWithoutBoundedLimits(module.workspaceId),
    ...getImportPlansWithoutStagedValidation(module.workspaceId),
    ...getUnsafeImportPlanIdentifiers(module.workspaceId),
  ].filter((issue) => issue.moduleId === module.id).map((issue) => ({
    moduleId: module.id,
    workspaceId: module.workspaceId,
    code: issue.code,
    severity: "blocker",
    message: importIssueMessages[issue.code] ?? "Import plan is invalid.",
  }));
}
