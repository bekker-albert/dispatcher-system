import {
  getWorkflowTransitionBindingsForUnknownModules,
  getWorkflowTransitionBindingsWithUnknownWorkflows,
  getWorkflowTransitionBindingWorkflowWorkspaceMismatches,
  getWorkflowModulesWithoutTransitionBinding,
  getWorkflowTransitionBindingWorkspaceMismatches,
} from "../data-access/moduleWorkflowTransitions";
import type { DispatchWorkspaceId } from "./workspaces";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";
import type { WorkspaceGuardrailIssue } from "./guardrailTypes";

export function getWorkflowTransitionGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  const missingWorkflowTransitionBindings = getWorkflowModulesWithoutTransitionBinding([module]);
  const workflowTransitionWorkspaceMismatches = getWorkflowTransitionBindingWorkspaceMismatches([module]);
  const issues: WorkspaceGuardrailIssue[] = [];

  if (missingWorkflowTransitionBindings.length > 0) {
    issues.push({
      moduleId: module.id,
      workspaceId: module.workspaceId,
      code: "missing_workflow_transition_binding",
      severity: "blocker",
      message: "Workflow modules must bind module actions to explicit allowed status transitions.",
    });
  }

  if (workflowTransitionWorkspaceMismatches.length > 0) {
    issues.push({
      moduleId: module.id,
      workspaceId: module.workspaceId,
      code: "workflow_transition_workspace_mismatch",
      severity: "blocker",
      message: "Workflow transition binding workspace must match the module catalog workspace.",
    });
  }

  return issues;
}

export function getWorkflowTransitionRegistryGuardrailIssues(
  workspaceId?: DispatchWorkspaceId,
): WorkspaceGuardrailIssue[] {
  return [
    ...getWorkflowTransitionBindingsForUnknownModules(),
    ...getWorkflowTransitionBindingsWithUnknownWorkflows(),
    ...getWorkflowTransitionBindingWorkflowWorkspaceMismatches(),
  ].filter((issue) => workspaceId ? issue.workspaceId === workspaceId : true)
    .map((issue) => ({
      moduleId: issue.moduleId,
      workspaceId: issue.workspaceId,
      code: issue.code,
      severity: "blocker",
      message: workflowRegistryIssueMessages[issue.code],
    }));
}

const workflowRegistryIssueMessages: Pick<Record<WorkspaceGuardrailIssue["code"], string>,
  | "workflow_transition_unknown_module"
  | "workflow_transition_unknown_workflow"
  | "workflow_transition_workflow_workspace_mismatch"
> = {
  workflow_transition_unknown_module: "Workflow transition binding must reference a catalog module.",
  workflow_transition_unknown_workflow: "Workflow transition binding must reference a known workflow definition.",
  workflow_transition_workflow_workspace_mismatch: "Workflow definition workspace must match the module binding workspace.",
};
