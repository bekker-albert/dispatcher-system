import type { WorkspaceGuardrailIssue, WorkspaceGuardrailIssueCode, WorkspaceGuardrailSeverity } from "./guardrailTypes";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";

export function createModuleGuardrailIssue(
  module: WorkspaceModuleCatalogItem,
  code: WorkspaceGuardrailIssueCode,
  severity: WorkspaceGuardrailSeverity,
  message: string,
): WorkspaceGuardrailIssue {
  return {
    moduleId: module.id,
    workspaceId: module.workspaceId,
    code,
    severity,
    message,
  };
}

export function addModuleGuardrailIssue(
  issues: WorkspaceGuardrailIssue[],
  module: WorkspaceModuleCatalogItem,
  code: WorkspaceGuardrailIssueCode,
  severity: WorkspaceGuardrailSeverity,
  message: string,
) {
  issues.push(createModuleGuardrailIssue(module, code, severity, message));
}
