import type { WorkspaceModuleAccessAction } from "../access-control/moduleAccessPolicies";
import type { WorkspaceModuleCatalogItem } from "../workspaces/moduleCatalog";
import { workspaceModuleCatalog } from "../workspaces/moduleCatalog";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import { moduleDataRouteContracts } from "./moduleDataRouteCatalog";

export type ModuleDataRouteKind = "single-database-router";
export type ModuleDataRouteImplementationStatus = "planned" | "existing-router";

export type ModuleDataRouteContract = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  endpoint: "/api/database";
  routeKind: ModuleDataRouteKind;
  resource: string;
  actions: Partial<Record<WorkspaceModuleAccessAction, string>>;
  requiresPreflight: boolean;
  implementationStatus: ModuleDataRouteImplementationStatus;
  notes: string;
};

export type ModuleDataRouteActionBinding = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  accessAction: WorkspaceModuleAccessAction;
  databaseAction: string;
  routeKey: string;
};

export type ModuleDataRouteActionCollision = {
  routeKey: string;
  resource: string;
  databaseAction: string;
  bindings: ModuleDataRouteActionBinding[];
};

export type ModuleDataRouteIdentifierIssue = {
  code: "unsafe_resource_identifier" | "unsafe_database_action_identifier";
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  field: "resource" | "databaseAction";
  value: string;
};

export type ModuleDataRouteStrategyIssue = {
  code:
    | "data_route_module_missing"
    | "data_route_workspace_mismatch"
    | "data_route_missing_list_action"
    | "data_route_missing_open_action"
    | "data_route_readonly_has_write_action"
    | "data_route_versioned_patch_missing_edit_action"
    | "data_route_workflow_missing_approve_action";
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
};

export type ModuleDataRouteContractActionMatch = {
  contract: ModuleDataRouteContract;
  binding: ModuleDataRouteActionBinding;
};

const workspaceModuleAccessActions: WorkspaceModuleAccessAction[] = [
  "open",
  "list",
  "create",
  "edit",
  "approve",
  "delete",
  "export",
  "admin",
];

function isWorkspaceModuleAccessAction(value: string): value is WorkspaceModuleAccessAction {
  return workspaceModuleAccessActions.includes(value as WorkspaceModuleAccessAction);
}

function createDataRouteKey(resource: string, databaseAction: string) {
  return `${resource}:${databaseAction}`;
}

function isSafeDatabaseRouteIdentifier(value: string) {
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value);
}

function hasWriteRouteAction(actions: ModuleDataRouteContract["actions"]) {
  return Boolean(
    actions.create
    || actions.edit
    || actions.approve
    || actions.delete
    || actions.admin,
  );
}

export { moduleDataRouteContracts };

export function getModuleDataRouteContract(moduleId: string) {
  return moduleDataRouteContracts.find((contract) => contract.moduleId === moduleId);
}

export function listModuleDataRouteContracts(workspaceId?: DispatchWorkspaceId) {
  return moduleDataRouteContracts.filter((contract) => (
    workspaceId ? contract.workspaceId === workspaceId : true
  ));
}

export function getWorkspaceModulesWithoutDataRouteContract(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  const coveredModuleIds = new Set(moduleDataRouteContracts.map((contract) => contract.moduleId));
  return modules.filter((module) => !coveredModuleIds.has(module.id));
}

export function getDataRouteContractsOutsideSingleDatabaseRouter() {
  return moduleDataRouteContracts.filter((contract) => (
    contract.endpoint !== "/api/database" || contract.routeKind !== "single-database-router"
  ));
}

export function getDataRouteContractsWithoutPreflight() {
  return moduleDataRouteContracts.filter((contract) => !contract.requiresPreflight);
}

export function listModuleDataRouteActionBindings(
  workspaceId?: DispatchWorkspaceId,
): ModuleDataRouteActionBinding[] {
  return moduleDataRouteContracts.flatMap((contract) => {
    if (workspaceId && contract.workspaceId !== workspaceId) return [];

    return Object.entries(contract.actions).flatMap(([accessAction, databaseAction]) => {
      if (!databaseAction || !isWorkspaceModuleAccessAction(accessAction)) return [];

      return [{
        moduleId: contract.moduleId,
        workspaceId: contract.workspaceId,
        resource: contract.resource,
        accessAction,
        databaseAction,
        routeKey: createDataRouteKey(contract.resource, databaseAction),
      }];
    });
  });
}

export function getDuplicateModuleDataRouteActions(
  workspaceId?: DispatchWorkspaceId,
): ModuleDataRouteActionCollision[] {
  const groups = new Map<string, ModuleDataRouteActionCollision>();

  for (const binding of listModuleDataRouteActionBindings(workspaceId)) {
    const group = groups.get(binding.routeKey) ?? {
      routeKey: binding.routeKey,
      resource: binding.resource,
      databaseAction: binding.databaseAction,
      bindings: [],
    };
    group.bindings.push(binding);
    groups.set(binding.routeKey, group);
  }

  return Array.from(groups.values()).filter((group) => group.bindings.length > 1);
}

export function validateModuleDataRouteIdentifiers(
  contracts: readonly ModuleDataRouteContract[] = moduleDataRouteContracts,
) {
  const issues: ModuleDataRouteIdentifierIssue[] = [];

  for (const contract of contracts) {
    if (!isSafeDatabaseRouteIdentifier(contract.resource)) {
      issues.push({
        code: "unsafe_resource_identifier",
        moduleId: contract.moduleId,
        workspaceId: contract.workspaceId,
        field: "resource",
        value: contract.resource,
      });
    }

    for (const databaseAction of Object.values(contract.actions)) {
      if (databaseAction && !isSafeDatabaseRouteIdentifier(databaseAction)) {
        issues.push({
          code: "unsafe_database_action_identifier",
          moduleId: contract.moduleId,
          workspaceId: contract.workspaceId,
          field: "databaseAction",
          value: databaseAction,
        });
      }
    }
  }

  return issues;
}

export function validateModuleDataRouteStrategyAlignment(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
  contracts: readonly ModuleDataRouteContract[] = moduleDataRouteContracts,
) {
  const issues: ModuleDataRouteStrategyIssue[] = [];
  const moduleById = new Map(modules.map((module) => [module.id, module]));

  for (const contract of contracts) {
    const catalogItem = moduleById.get(contract.moduleId);
    if (!catalogItem) {
      issues.push({
        code: "data_route_module_missing",
        moduleId: contract.moduleId,
        workspaceId: contract.workspaceId,
      });
      continue;
    }

    if (contract.workspaceId !== catalogItem.workspaceId) {
      issues.push({
        code: "data_route_workspace_mismatch",
        moduleId: contract.moduleId,
        workspaceId: contract.workspaceId,
      });
    }

    if (catalogItem.tableStrategy !== "none" && !contract.actions.list) {
      issues.push({
        code: "data_route_missing_list_action",
        moduleId: contract.moduleId,
        workspaceId: contract.workspaceId,
      });
    }

    if (catalogItem.tableStrategy !== "none" && !contract.actions.open) {
      issues.push({
        code: "data_route_missing_open_action",
        moduleId: contract.moduleId,
        workspaceId: contract.workspaceId,
      });
    }

    if (catalogItem.editingStrategy === "readonly" && hasWriteRouteAction(contract.actions)) {
      issues.push({
        code: "data_route_readonly_has_write_action",
        moduleId: contract.moduleId,
        workspaceId: contract.workspaceId,
      });
    }

    if (catalogItem.editingStrategy === "versioned-patch" && !contract.actions.edit) {
      issues.push({
        code: "data_route_versioned_patch_missing_edit_action",
        moduleId: contract.moduleId,
        workspaceId: contract.workspaceId,
      });
    }

    if (catalogItem.editingStrategy === "workflow" && !contract.actions.approve) {
      issues.push({
        code: "data_route_workflow_missing_approve_action",
        moduleId: contract.moduleId,
        workspaceId: contract.workspaceId,
      });
    }
  }

  return issues;
}

export function getModuleDataRouteAction(
  moduleId: string,
  action: WorkspaceModuleAccessAction,
) {
  return getModuleDataRouteContract(moduleId)?.actions[action];
}

export function getModuleDataRouteActionBinding(
  resource?: string,
  databaseAction?: string,
) {
  if (!resource || !databaseAction) return undefined;

  return listModuleDataRouteActionBindings().find((binding) => (
    binding.resource === resource && binding.databaseAction === databaseAction
  ));
}

export function getModuleDataRouteContractByDatabaseAction(
  resource?: string,
  databaseAction?: string,
): ModuleDataRouteContractActionMatch | undefined {
  const binding = getModuleDataRouteActionBinding(resource, databaseAction);
  if (!binding) return undefined;

  const contract = getModuleDataRouteContract(binding.moduleId);
  return contract ? { contract, binding } : undefined;
}
