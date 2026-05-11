import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import type { PatchSaveCommand } from "../editing/patchEditing";
import type { WorkspaceModuleCatalogItem } from "../workspaces/moduleCatalog";
import { workspaceModuleCatalog } from "../workspaces/moduleCatalog";
import {
  canTransitionStatus,
  getTransitionRule,
  workflowDefinitions,
  type DispatchWorkflowId,
} from "../workflows/statusTransitions";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";

export type ModuleWorkflowTransitionBinding = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  workflowId: DispatchWorkflowId;
  statusField: "status";
};

export type ModuleWorkflowTransitionBindingIssue = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  workflowId?: string;
  code:
    | "workflow_transition_unknown_module"
    | "workflow_transition_unknown_workflow"
    | "workflow_transition_workflow_workspace_mismatch";
  value?: string;
};

export type ModuleWorkflowTransitionIssue = {
  code:
    | "workflow_transition_plan_missing"
    | "workflow_status_patch_required"
    | "workflow_status_previous_required"
    | "workflow_status_next_required"
    | "workflow_transition_not_allowed"
    | "workflow_reason_required"
    | "workflow_approval_required";
  message: string;
  field?: string;
};

export const moduleWorkflowTransitionBindings: ModuleWorkflowTransitionBinding[] = [
  { moduleId: "mining-shift-reports", workspaceId: "mining-dispatch", workflowId: "mining-shift-report", statusField: "status" },
  { moduleId: "taxation-waybills", workspaceId: "taxation", workflowId: "waybill", statusField: "status" },
  { moduleId: "taxation-fuel-periods", workspaceId: "taxation", workflowId: "fuel-accounting-period", statusField: "status" },
  { moduleId: "smts-fuel-drains", workspaceId: "smts-gps", workflowId: "fuel-drain-check", statusField: "status" },
  { moduleId: "fleet-movements", workspaceId: "fleet", workflowId: "vehicle-movement", statusField: "status" },
  { moduleId: "common-overtime", workspaceId: "common-processes", workflowId: "common-process", statusField: "status" },
  { moduleId: "common-business-trips", workspaceId: "common-processes", workflowId: "common-process", statusField: "status" },
];

export function getModuleWorkflowTransitionBinding(moduleId: string) {
  return moduleWorkflowTransitionBindings.find((binding) => binding.moduleId === moduleId);
}

export function getWorkflowModulesWithoutTransitionBinding(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  const boundModuleIds = new Set(moduleWorkflowTransitionBindings.map((binding) => binding.moduleId));

  return modules.filter((module) => module.editingStrategy === "workflow" && !boundModuleIds.has(module.id));
}

export function getWorkflowTransitionBindingWorkspaceMismatches(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  return moduleWorkflowTransitionBindings.flatMap((binding) => {
    const moduleItem = modules.find((item) => item.id === binding.moduleId);

    return moduleItem && moduleItem.workspaceId !== binding.workspaceId
      ? [{ moduleId: moduleItem.id, expectedWorkspaceId: moduleItem.workspaceId, actualWorkspaceId: binding.workspaceId }]
      : [];
  });
}

export function getWorkflowTransitionBindingsForUnknownModules(
  bindings: readonly ModuleWorkflowTransitionBinding[] = moduleWorkflowTransitionBindings,
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  const knownModuleIds = new Set(modules.map((module) => module.id));

  return bindings.filter((binding) => !knownModuleIds.has(binding.moduleId))
    .map((binding): ModuleWorkflowTransitionBindingIssue => ({
      moduleId: binding.moduleId,
      workspaceId: binding.workspaceId,
      workflowId: binding.workflowId,
      code: "workflow_transition_unknown_module",
      value: binding.moduleId,
    }));
}

export function getWorkflowTransitionBindingsWithUnknownWorkflows(
  bindings: readonly ModuleWorkflowTransitionBinding[] = moduleWorkflowTransitionBindings,
) {
  const knownWorkflowIds = new Set<string>(workflowDefinitions.map((workflow) => workflow.id));

  return bindings.filter((binding) => !knownWorkflowIds.has(binding.workflowId))
    .map((binding): ModuleWorkflowTransitionBindingIssue => ({
      moduleId: binding.moduleId,
      workspaceId: binding.workspaceId,
      workflowId: binding.workflowId,
      code: "workflow_transition_unknown_workflow",
      value: binding.workflowId,
    }));
}

export function getWorkflowTransitionBindingWorkflowWorkspaceMismatches(
  bindings: readonly ModuleWorkflowTransitionBinding[] = moduleWorkflowTransitionBindings,
) {
  return bindings.flatMap((binding): ModuleWorkflowTransitionBindingIssue[] => {
    const workflowDefinition = workflowDefinitions.find((workflow) => workflow.id === binding.workflowId);
    if (!workflowDefinition || workflowDefinition.workspaceId === binding.workspaceId) return [];

    return [{
      moduleId: binding.moduleId,
      workspaceId: binding.workspaceId,
      workflowId: binding.workflowId,
      code: "workflow_transition_workflow_workspace_mismatch",
      value: workflowDefinition.workspaceId,
    }];
  });
}

export function validateModuleWorkflowTransitionPayload({
  moduleId,
  patch,
  access,
  reason,
}: {
  moduleId: string;
  patch: PatchSaveCommand;
  access: EffectiveAccessDecision;
  reason?: string;
}): ModuleWorkflowTransitionIssue[] {
  const binding = getModuleWorkflowTransitionBinding(moduleId);
  if (!binding) {
    return [{
      code: "workflow_transition_plan_missing",
      message: "Workflow transition action has no module workflow binding.",
      field: "moduleId",
    }];
  }

  const statusChange = patch.changes.find((change) => change.field === binding.statusField);
  if (!statusChange) {
    return [{
      code: "workflow_status_patch_required",
      message: "Workflow transition must include a status patch.",
      field: "patch.changes.status",
    }];
  }

  const currentStatus = typeof statusChange.previousValue === "string" ? statusChange.previousValue : undefined;
  const nextStatus = typeof statusChange.nextValue === "string" ? statusChange.nextValue : undefined;

  if (!currentStatus) {
    return [{
      code: "workflow_status_previous_required",
      message: "Workflow transition must include the previous status.",
      field: "patch.changes.status.previousValue",
    }];
  }

  if (!nextStatus) {
    return [{
      code: "workflow_status_next_required",
      message: "Workflow transition must include the next status.",
      field: "patch.changes.status.nextValue",
    }];
  }

  const transitionRule = getTransitionRule(binding.workflowId, currentStatus, nextStatus);
  if (!transitionRule || !canTransitionStatus(binding.workflowId, currentStatus, nextStatus)) {
    return [{
      code: "workflow_transition_not_allowed",
      message: "Workflow status transition is not allowed.",
      field: "patch.changes.status",
    }];
  }

  const issues: ModuleWorkflowTransitionIssue[] = [];
  if (transitionRule.requiresApprovalRight && !access.canApprove) {
    issues.push({
      code: "workflow_approval_required",
      message: "Workflow transition requires approval access.",
      field: "access.canApprove",
    });
  }

  if (transitionRule.requiresReason && !(reason ?? patch.reason)?.trim()) {
    issues.push({
      code: "workflow_reason_required",
      message: "Workflow transition requires a reason.",
      field: "reason",
    });
  }

  return issues;
}
