import type { AccessCapability } from "../access-control/accessMatrix";
import type { WorkspaceModuleAccessAction } from "../access-control/moduleAccessPolicies";
import {
  getModuleActionRequiredCapability,
  getWorkspaceModuleAccessPolicy,
  workspaceModuleAccessPolicies,
} from "../access-control/moduleAccessPolicies";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import {
  getModuleDataRouteContractByDatabaseAction,
  moduleDataRouteContracts,
} from "./moduleDataRoutes";
import {
  getModuleImportPlanByDatabaseAction,
  moduleImportPlans,
} from "./moduleImportPlans";

export type ModuleDatabaseAuthorizationRequest = {
  resource?: string;
  action?: string;
  payload?: unknown;
};

export type ModuleDatabaseAuthorizationRequirement = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  accessAction: WorkspaceModuleAccessAction;
  requiredCapability: AccessCapability;
  sectionScoped: boolean;
  requiresAccessMatrix: true;
};

export type ModuleDatabaseAuthorizationGap = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  accessAction: WorkspaceModuleAccessAction;
  code: "missing_access_policy" | "missing_required_capability";
};

export type ModuleDatabaseAuthorizationContext = {
  requirement: ModuleDatabaseAuthorizationRequirement;
  sectionId?: string;
  scope: {
    workspaceId: DispatchWorkspaceId;
    moduleId: string;
    sectionId?: string;
  };
  missingSectionScope: boolean;
};

function isWorkspaceModuleAccessAction(value: string): value is WorkspaceModuleAccessAction {
  return [
    "open",
    "list",
    "create",
    "edit",
    "approve",
    "delete",
    "export",
    "admin",
  ].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNestedRecord(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return isRecord(value) ? value : undefined;
}

export function resolveModuleDatabaseSectionId(payload: unknown) {
  if (!isRecord(payload)) return undefined;

  const scope = getNestedRecord(payload, "scope");
  const query = getNestedRecord(payload, "query");
  const filters = query ? getNestedRecord(query, "filters") : undefined;
  const data = getNestedRecord(payload, "data");

  return getNonEmptyString(scope?.sectionId)
    ?? getNonEmptyString(filters?.section_id)
    ?? getNonEmptyString(filters?.sectionId)
    ?? getNonEmptyString(data?.sectionId)
    ?? getNonEmptyString(data?.section_id);
}

export function getModuleDatabaseAuthorizationRequirement({
  resource,
  action,
}: ModuleDatabaseAuthorizationRequest): ModuleDatabaseAuthorizationRequirement | undefined {
  const route = getModuleDataRouteContractByDatabaseAction(resource, action);
  if (route && isWorkspaceModuleAccessAction(route.binding.accessAction)) {
    const accessPolicy = getWorkspaceModuleAccessPolicy(route.contract.moduleId);
    const requiredCapability = getModuleActionRequiredCapability(route.contract.moduleId, route.binding.accessAction);
    if (!accessPolicy || !requiredCapability) return undefined;

    return {
      moduleId: route.contract.moduleId,
      workspaceId: route.contract.workspaceId,
      resource: route.contract.resource,
      databaseAction: action ?? "",
      accessAction: route.binding.accessAction,
      requiredCapability,
      sectionScoped: accessPolicy.sectionScoped,
      requiresAccessMatrix: true,
    };
  }

  const importPlan = getModuleImportPlanByDatabaseAction(resource, action);
  if (!importPlan) return undefined;

  const accessPolicy = getWorkspaceModuleAccessPolicy(importPlan.moduleId);
  const requiredCapability = getModuleActionRequiredCapability(importPlan.moduleId, importPlan.requiredAccessAction);
  if (!accessPolicy || !requiredCapability) return undefined;

  return {
    moduleId: importPlan.moduleId,
    workspaceId: importPlan.workspaceId,
    resource: importPlan.resource,
    databaseAction: action ?? "",
    accessAction: importPlan.requiredAccessAction,
    requiredCapability,
    sectionScoped: accessPolicy.sectionScoped,
    requiresAccessMatrix: true,
  };
}

export function createModuleDatabaseAuthorizationContext(
  request: ModuleDatabaseAuthorizationRequest,
): ModuleDatabaseAuthorizationContext | undefined {
  const requirement = getModuleDatabaseAuthorizationRequirement(request);
  if (!requirement) return undefined;

  const sectionId = resolveModuleDatabaseSectionId(request.payload);

  return {
    requirement,
    sectionId,
    scope: {
      workspaceId: requirement.workspaceId,
      moduleId: requirement.moduleId,
      sectionId,
    },
    missingSectionScope: requirement.sectionScoped && !sectionId,
  };
}

export function listModuleDatabaseAuthorizationRequirements(
  workspaceId?: DispatchWorkspaceId,
): ModuleDatabaseAuthorizationRequirement[] {
  const routeRequirements = moduleDataRouteContracts.flatMap((contract) => {
    if (workspaceId && contract.workspaceId !== workspaceId) return [];

    return Object.entries(contract.actions).flatMap(([accessAction, databaseAction]) => {
      if (!databaseAction || !isWorkspaceModuleAccessAction(accessAction)) return [];
      const requirement = getModuleDatabaseAuthorizationRequirement({
        resource: contract.resource,
        action: databaseAction,
      });
      return requirement ? [requirement] : [];
    });
  });

  const importRequirements = moduleImportPlans.flatMap((plan) => {
    if (workspaceId && plan.workspaceId !== workspaceId) return [];

    const requirement = getModuleDatabaseAuthorizationRequirement({
      resource: plan.resource,
      action: plan.databaseAction,
    });
    return requirement ? [requirement] : [];
  });

  return [...routeRequirements, ...importRequirements];
}

export function getModuleDatabaseAuthorizationGaps(): ModuleDatabaseAuthorizationGap[] {
  const policyModuleIds = new Set(workspaceModuleAccessPolicies.map((policy) => policy.moduleId));

  const routeGaps = moduleDataRouteContracts.flatMap((contract) => (
    Object.entries(contract.actions).flatMap(([accessAction, databaseAction]): ModuleDatabaseAuthorizationGap[] => {
      if (!databaseAction || !isWorkspaceModuleAccessAction(accessAction)) return [];

      if (!policyModuleIds.has(contract.moduleId)) {
        return [{
          moduleId: contract.moduleId,
          workspaceId: contract.workspaceId,
          resource: contract.resource,
          databaseAction,
          accessAction,
          code: "missing_access_policy" as const,
        }];
      }

      if (!getModuleActionRequiredCapability(contract.moduleId, accessAction)) {
        return [{
          moduleId: contract.moduleId,
          workspaceId: contract.workspaceId,
          resource: contract.resource,
          databaseAction,
          accessAction,
          code: "missing_required_capability" as const,
        }];
      }

      return [];
    })
  ));

  const importGaps = moduleImportPlans.flatMap((plan): ModuleDatabaseAuthorizationGap[] => {
    if (!policyModuleIds.has(plan.moduleId)) {
      return [{
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        resource: plan.resource,
        databaseAction: plan.databaseAction,
        accessAction: plan.requiredAccessAction,
        code: "missing_access_policy",
      }];
    }

    if (!getModuleActionRequiredCapability(plan.moduleId, plan.requiredAccessAction)) {
      return [{
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        resource: plan.resource,
        databaseAction: plan.databaseAction,
        accessAction: plan.requiredAccessAction,
        code: "missing_required_capability",
      }];
    }

    return [];
  });

  return [...routeGaps, ...importGaps];
}
