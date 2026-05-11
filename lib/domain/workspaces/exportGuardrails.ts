import {
  getExportPlansWithRouteMetadataMismatch,
  getExportPlansWithoutBoundedQuery,
  getExportPlansWithoutQueuedRequest,
  getExportPlansWithoutRouteAction,
  getMissingExportPlans,
  getUnsafeExportPlanIdentifiers,
} from "../data-access/moduleExportPlans";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";
import type { WorkspaceGuardrailIssue } from "./guardrails";

const exportIssueMessages: Partial<Record<WorkspaceGuardrailIssue["code"], string>> = {
  missing_export_plan: "Export actions must declare bounded filters, limits and queued request storage.",
  export_plan_without_route_action: "Export plan database action must match the module data route action.",
  export_plan_route_metadata_mismatch: "Export plan workspace and resource must match the module data route contract.",
  export_plan_without_bounded_query: "Export plan must require server filters, date limits, row limits and formats.",
  export_plan_without_queued_request: "Export plan must create a queued request and store files by reference.",
  export_plan_unsafe_identifier: "Export plan must use safe export request entity identifiers.",
};

export function getExportGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  return [
    ...getMissingExportPlans(module.workspaceId),
    ...getExportPlansWithoutRouteAction(module.workspaceId),
    ...getExportPlansWithRouteMetadataMismatch(),
    ...getExportPlansWithoutBoundedQuery(module.workspaceId),
    ...getExportPlansWithoutQueuedRequest(module.workspaceId),
    ...getUnsafeExportPlanIdentifiers(module.workspaceId),
  ].filter((issue) => issue.moduleId === module.id).map((issue) => ({
    moduleId: module.id,
    workspaceId: module.workspaceId,
    code: issue.code,
    severity: "blocker",
    message: exportIssueMessages[issue.code] ?? "Export plan is invalid.",
  }));
}
