import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import type { WorkspaceModuleCatalogItem } from "../workspaces/moduleCatalog";
import { workspaceModuleCatalog } from "../workspaces/moduleCatalog";
import type { AccessCapability } from "./accessMatrix";
import type { EffectiveAccessDecision } from "./effectivePermissions";
import { hasAccessCapability } from "./effectivePermissions";

export type WorkspaceModuleAccessAction =
  | "open"
  | "list"
  | "create"
  | "edit"
  | "approve"
  | "delete"
  | "export"
  | "admin";

export type WorkspaceModuleAccessPolicy = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  sectionScoped: boolean;
  actionCapabilities: Partial<Record<WorkspaceModuleAccessAction, AccessCapability>>;
  reason: string;
};

export type WorkspaceModuleAccessPolicyIssueCode =
  | "duplicate_access_policy"
  | "access_policy_unknown_module"
  | "access_policy_workspace_mismatch"
  | "access_policy_missing_open_view"
  | "access_policy_missing_list_view"
  | "access_policy_missing_edit"
  | "access_policy_missing_approve"
  | "access_policy_missing_export"
  | "access_policy_readonly_grants_write"
  | "access_policy_section_scope_without_filter";

export type WorkspaceModuleAccessPolicyIssue = {
  code: WorkspaceModuleAccessPolicyIssueCode;
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  message: string;
};

const readonlyActions = {
  open: "view",
  list: "view",
} as const satisfies Partial<Record<WorkspaceModuleAccessAction, AccessCapability>>;

const versionedPatchActions = {
  ...readonlyActions,
  create: "edit",
  edit: "edit",
  delete: "delete",
  export: "export",
} as const satisfies Partial<Record<WorkspaceModuleAccessAction, AccessCapability>>;

const workflowActions = {
  ...versionedPatchActions,
  approve: "approve",
} as const satisfies Partial<Record<WorkspaceModuleAccessAction, AccessCapability>>;

export const workspaceModuleAccessPolicies: WorkspaceModuleAccessPolicy[] = [
  {
    moduleId: "mining-shift-reports",
    workspaceId: "mining-dispatch",
    sectionScoped: true,
    actionCapabilities: workflowActions,
    reason: "Mining shift reports are section-scoped workflow documents with approval and export.",
  },
  {
    moduleId: "mining-operational-accounting",
    workspaceId: "mining-dispatch",
    sectionScoped: true,
    actionCapabilities: versionedPatchActions,
    reason: "Operational accounting is section-scoped and can be adjusted by versioned patches.",
  },
  {
    moduleId: "taxation-waybills",
    workspaceId: "taxation",
    sectionScoped: true,
    actionCapabilities: workflowActions,
    reason: "Waybills are section-scoped workflow documents for issue, approval and export.",
  },
  {
    moduleId: "taxation-fuel-periods",
    workspaceId: "taxation",
    sectionScoped: true,
    actionCapabilities: workflowActions,
    reason: "Fuel periods require section-scoped edit, reconciliation approval and export rights.",
  },
  {
    moduleId: "smts-vehicle-cards",
    workspaceId: "smts-gps",
    sectionScoped: true,
    actionCapabilities: versionedPatchActions,
    reason: "SMTS vehicle cards are section-scoped technical records updated by patches.",
  },
  {
    moduleId: "smts-fuel-drains",
    workspaceId: "smts-gps",
    sectionScoped: true,
    actionCapabilities: workflowActions,
    reason: "Fuel drain checks are section-scoped workflow events with confirmation statuses.",
  },
  {
    moduleId: "fleet-movements",
    workspaceId: "fleet",
    sectionScoped: true,
    actionCapabilities: workflowActions,
    reason: "Vehicle movements are section-scoped workflow documents with approval.",
  },
  {
    moduleId: "service-vehicle",
    workspaceId: "fleet",
    sectionScoped: false,
    actionCapabilities: versionedPatchActions,
    reason: "Service vehicle records are not tied to production sections but still require patch rights.",
  },
  {
    moduleId: "common-overtime",
    workspaceId: "common-processes",
    sectionScoped: true,
    actionCapabilities: workflowActions,
    reason: "Overtime requests are workflow documents with section visibility and approval.",
  },
  {
    moduleId: "common-business-trips",
    workspaceId: "common-processes",
    sectionScoped: true,
    actionCapabilities: workflowActions,
    reason: "Business trips are workflow documents with approval and optional export.",
  },
  {
    moduleId: "prepared-reports",
    workspaceId: "reports",
    sectionScoped: true,
    actionCapabilities: {
      ...readonlyActions,
      export: "export",
    },
    reason: "Prepared reports are read-only aggregates with explicit export permission.",
  },
  {
    moduleId: "access-matrix",
    workspaceId: "admin",
    sectionScoped: false,
    actionCapabilities: {
      ...versionedPatchActions,
      admin: "admin",
    },
    reason: "Access matrix changes require administrative rights and versioned patches.",
  },
  {
    moduleId: "ai-on-demand",
    workspaceId: "ai-assistant",
    sectionScoped: false,
    actionCapabilities: readonlyActions,
    reason: "AI assistant context is opened on demand and does not grant edit rights by default.",
  },
];

export function getWorkspaceModuleAccessPolicy(moduleId: string) {
  return workspaceModuleAccessPolicies.find((policy) => policy.moduleId === moduleId);
}

export function listWorkspaceModuleAccessPolicies(workspaceId?: DispatchWorkspaceId) {
  return workspaceModuleAccessPolicies.filter((policy) => (
    workspaceId ? policy.workspaceId === workspaceId : true
  ));
}

export function getWorkspaceModulesWithoutAccessPolicy(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  const coveredModuleIds = new Set(workspaceModuleAccessPolicies.map((policy) => policy.moduleId));
  return modules.filter((module) => !coveredModuleIds.has(module.id));
}

export function validateWorkspaceModuleAccessPolicies(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
  policies: readonly WorkspaceModuleAccessPolicy[] = workspaceModuleAccessPolicies,
) {
  const issues: WorkspaceModuleAccessPolicyIssue[] = [];
  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const policyIdCounts = countBy(policies, (policy) => policy.moduleId);

  for (const [moduleId, count] of policyIdCounts) {
    if (count > 1) {
      const policy = policies.find((item) => item.moduleId === moduleId);
      if (policy) {
        issues.push({
          code: "duplicate_access_policy",
          moduleId,
          workspaceId: policy.workspaceId,
          message: "Each workspace module must have only one access policy.",
        });
      }
    }
  }

  for (const policy of policies) {
    const catalogItem = moduleById.get(policy.moduleId);
    if (!catalogItem) {
      issues.push({
        code: "access_policy_unknown_module",
        moduleId: policy.moduleId,
        workspaceId: policy.workspaceId,
        message: "Access policy must reference a module from the workspace catalog.",
      });
      continue;
    }

    if (policy.workspaceId !== catalogItem.workspaceId) {
      issues.push({
        code: "access_policy_workspace_mismatch",
        moduleId: policy.moduleId,
        workspaceId: policy.workspaceId,
        message: "Access policy workspace must match the module catalog workspace.",
      });
    }

    if (
      policy.sectionScoped
      && catalogItem.tableStrategy !== "none"
      && !catalogItem.requiredFilters.includes("section_id")
    ) {
      issues.push({
        code: "access_policy_section_scope_without_filter",
        moduleId: policy.moduleId,
        workspaceId: policy.workspaceId,
        message: "Section-scoped modules must declare section_id as a required server filter.",
      });
    }

    if (policy.actionCapabilities.open !== "view") {
      issues.push({
        code: "access_policy_missing_open_view",
        moduleId: policy.moduleId,
        workspaceId: policy.workspaceId,
        message: "Every module must require can_view before opening its workspace screen.",
      });
    }

    if (policy.actionCapabilities.list !== "view") {
      issues.push({
        code: "access_policy_missing_list_view",
        moduleId: policy.moduleId,
        workspaceId: policy.workspaceId,
        message: "Every module list must require can_view before reading rows.",
      });
    }

    if (catalogItem.editingStrategy === "versioned-patch" && policy.actionCapabilities.edit !== "edit") {
      issues.push({
        code: "access_policy_missing_edit",
        moduleId: policy.moduleId,
        workspaceId: policy.workspaceId,
        message: "Versioned patch modules must map edit actions to can_edit.",
      });
    }

    if (catalogItem.editingStrategy === "workflow" && policy.actionCapabilities.approve !== "approve") {
      issues.push({
        code: "access_policy_missing_approve",
        moduleId: policy.moduleId,
        workspaceId: policy.workspaceId,
        message: "Workflow modules must map approve actions to can_approve.",
      });
    }

    if (
      (catalogItem.tableStrategy === "aggregate" || catalogItem.tableStrategy === "on-demand-export")
      && policy.actionCapabilities.export !== "export"
    ) {
      issues.push({
        code: "access_policy_missing_export",
        moduleId: policy.moduleId,
        workspaceId: policy.workspaceId,
        message: "Aggregate and on-demand export modules must map export actions to can_export.",
      });
    }

    if (catalogItem.editingStrategy === "readonly" && grantsWriteCapability(policy)) {
      issues.push({
        code: "access_policy_readonly_grants_write",
        moduleId: policy.moduleId,
        workspaceId: policy.workspaceId,
        message: "Readonly modules must not expose create, edit, approve, delete, or admin actions.",
      });
    }
  }

  return issues;
}

export function getModuleActionRequiredCapability(
  moduleId: string,
  action: WorkspaceModuleAccessAction,
) {
  return getWorkspaceModuleAccessPolicy(moduleId)?.actionCapabilities[action];
}

export function canUseWorkspaceModuleAction(
  decision: EffectiveAccessDecision,
  moduleId: string,
  action: WorkspaceModuleAccessAction,
) {
  const capability = getModuleActionRequiredCapability(moduleId, action);
  return capability ? hasAccessCapability(decision, capability) : false;
}

export function getAllowedWorkspaceModuleActions(
  decision: EffectiveAccessDecision,
  moduleId: string,
) {
  const policy = getWorkspaceModuleAccessPolicy(moduleId);
  if (!policy) return [];

  return Object.keys(policy.actionCapabilities).filter((action) => (
    canUseWorkspaceModuleAction(decision, moduleId, action as WorkspaceModuleAccessAction)
  )) as WorkspaceModuleAccessAction[];
}

function grantsWriteCapability(policy: WorkspaceModuleAccessPolicy) {
  return Boolean(
    policy.actionCapabilities.create
    || policy.actionCapabilities.edit
    || policy.actionCapabilities.approve
    || policy.actionCapabilities.delete
    || policy.actionCapabilities.admin,
  );
}

function countBy<TItem, TKey>(items: readonly TItem[], getKey: (item: TItem) => TKey) {
  const counts = new Map<TKey, number>();
  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
