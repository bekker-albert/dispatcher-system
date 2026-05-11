import {
  getModuleHandlerImplementationBlockers,
  getModuleHandlerImplementationDependencyIssues,
} from "../data-access/moduleHandlerImplementationPlan";
import type { WorkspaceGuardrailIssue } from "./guardrailTypes";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";

export function getHandlerImplementationGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  const implementationBlockers = getModuleHandlerImplementationBlockers(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const dependencyIssues = getModuleHandlerImplementationDependencyIssues(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const issues: WorkspaceGuardrailIssue[] = [];

  if (implementationBlockers.length > 0) {
    issues.push({
      moduleId: module.id,
      workspaceId: module.workspaceId,
      code: "handler_implementation_not_ready",
      severity: "blocker",
      message: "Module handler implementation plan must be ready before live handler wiring.",
    });
  }

  if (dependencyIssues.length > 0) {
    issues.push({
      moduleId: module.id,
      workspaceId: module.workspaceId,
      code: "handler_phase_without_read_model",
      severity: "blocker",
      message: "Export/import/write handlers must not be implemented before a ready bounded read-model handler.",
    });
  }

  return issues;
}
