import {
  getReportInvalidationPlansWithoutWritePipeline,
  getWritePipelinePlansWithoutRequiredGuards,
} from "../data-access/moduleWritePipelinePlans";
import type { WorkspaceGuardrailIssue } from "./guardrailTypes";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";

const writePipelineIssueMessages: Partial<Record<WorkspaceGuardrailIssue["code"], string>> = {
  aggregate_invalidation_without_write_pipeline: "Report aggregate invalidation must be backed by a write pipeline.",
  write_pipeline_without_guard: "Write pipeline must require access preflight, payload envelope, audit and side-effect guards.",
  write_pipeline_without_transaction: "Write pipeline must use an atomic single-entity transaction.",
};

export function getWritePipelineGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  return [
    ...getWritePipelinePlansWithoutRequiredGuards(module.workspaceId),
    ...getReportInvalidationPlansWithoutWritePipeline(),
  ].filter((issue) => issue.moduleId === module.id).map((issue) => ({
    moduleId: module.id,
    workspaceId: module.workspaceId,
    code: issue.code,
    severity: "blocker",
    message: writePipelineIssueMessages[issue.code] ?? "Write pipeline plan is invalid.",
  }));
}
