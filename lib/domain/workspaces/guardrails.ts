import {
  getWorkspaceModuleAccessPolicy,
  listWorkspaceModuleAccessPolicies,
  validateWorkspaceModuleAccessPolicies,
} from "../access-control/moduleAccessPolicies";
import { dispatchServiceWorkspaces, type DispatchWorkspaceId } from "./workspaces";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";
import { workspaceModuleCatalog } from "./moduleCatalog";
import type { WorkspaceGuardrailIssue, WorkspaceGuardrailIssueCode, WorkspaceGuardrailReport, WorkspaceGuardrailSeverity } from "./guardrailTypes";
import { getWorkspaceModuleDataAccessGuardrailIssues } from "./moduleDataAccessGuardrails";
import { validateWorkspaceModuleCatalog } from "./moduleCatalogRegistry";
import { getWorkspaceRegistryGuardrailIssues } from "./workspaceRegistryGuardrails";
import { getWorkflowTransitionRegistryGuardrailIssues } from "./workflowGuardrails";

export type { WorkspaceGuardrailIssue, WorkspaceGuardrailIssueCode, WorkspaceGuardrailReport, WorkspaceGuardrailSeverity } from "./guardrailTypes";

function addIssue(
  issues: WorkspaceGuardrailIssue[],
  module: WorkspaceModuleCatalogItem,
  code: WorkspaceGuardrailIssueCode,
  severity: WorkspaceGuardrailSeverity,
  message: string,
) {
  issues.push({
    moduleId: module.id,
    workspaceId: module.workspaceId,
    code,
    severity,
    message,
  });
}

export function getWorkspaceModuleGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  const issues: WorkspaceGuardrailIssue[] = [];
  const accessPolicy = getWorkspaceModuleAccessPolicy(module.id);

  if (!accessPolicy) {
    addIssue(issues, module, "missing_access_policy", "blocker", "Module actions must map to access capabilities.");
  }

  issues.push(...getWorkspaceModuleDataAccessGuardrailIssues(module));

  return issues;
}

export function createWorkspaceGuardrailReport(
  workspaceId?: DispatchWorkspaceId,
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
): WorkspaceGuardrailReport {
  const checkedModules = modules.filter((module) => (
    workspaceId ? module.workspaceId === workspaceId : true
  ));
  const workspaceIds = workspaceId
    ? [workspaceId]
    : dispatchServiceWorkspaces.map((workspace) => workspace.id);
  const catalogIssues: WorkspaceGuardrailIssue[] = validateWorkspaceModuleCatalog(checkedModules, workspaceIds)
    .map((issue) => ({
      ...issue,
      severity: "blocker",
    }));
  const checkedModuleIds = new Set(checkedModules.map((module) => module.id));
  const checkedAccessPolicies = workspaceId
    ? listWorkspaceModuleAccessPolicies(workspaceId).filter((policy) => checkedModuleIds.has(policy.moduleId))
    : undefined;
  const accessPolicyIssues: WorkspaceGuardrailIssue[] = validateWorkspaceModuleAccessPolicies(
    checkedModules,
    checkedAccessPolicies,
  ).map((issue) => ({
    ...issue,
    severity: "blocker",
  }));
  const registryIssues = getWorkspaceRegistryGuardrailIssues(workspaceId);
  const workflowRegistryIssues = getWorkflowTransitionRegistryGuardrailIssues(workspaceId);
  const issues = [
    ...registryIssues,
    ...workflowRegistryIssues,
    ...catalogIssues,
    ...accessPolicyIssues,
    ...checkedModules.flatMap(getWorkspaceModuleGuardrailIssues),
  ];
  const blockerCount = issues.filter((issue) => issue.severity === "blocker").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return {
    workspaceId,
    checkedModuleCount: checkedModules.length,
    blockerCount,
    warningCount,
    issues,
    isReadyForImplementation: blockerCount === 0,
  };
}
