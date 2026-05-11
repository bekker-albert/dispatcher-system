import type { RequiredFilterKey } from "./pagination";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import type { WorkspaceModuleCatalogItem } from "../workspaces/moduleCatalog";
import { workspaceModuleCatalog } from "../workspaces/moduleCatalog";
import {
  getWorkspaceModuleQueryPolicy,
  getWorkspaceModulesRequiringQueryPolicy,
} from "./workspaceQueryPolicies";
import { moduleDatabaseIndexContracts } from "./indexContractCatalog";

export type ModuleDatabaseIndexContract = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  primaryEntity: string;
  indexes: Array<{
    name: string;
    fields: string[];
    coversFilters: RequiredFilterKey[];
    reason: string;
  }>;
  notes: string;
};

export type ModuleIndexContractMissingFilter = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  missingFilter: RequiredFilterKey;
};

export { moduleDatabaseIndexContracts };

export function getModuleDatabaseIndexContract(moduleId: string) {
  return moduleDatabaseIndexContracts.find((contract) => contract.moduleId === moduleId);
}

export function listModuleDatabaseIndexContracts(workspaceId?: DispatchWorkspaceId) {
  return moduleDatabaseIndexContracts.filter((contract) => (
    workspaceId ? contract.workspaceId === workspaceId : true
  ));
}

export function getWorkspaceModulesWithoutIndexContract(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  const coveredModuleIds = new Set(moduleDatabaseIndexContracts.map((contract) => contract.moduleId));
  return getWorkspaceModulesRequiringQueryPolicy(modules).filter((module) => !coveredModuleIds.has(module.id));
}

export function getIndexContractCoveredFilters(moduleId: string) {
  const contract = getModuleDatabaseIndexContract(moduleId);
  if (!contract) return [];

  return Array.from(new Set(contract.indexes.flatMap((index) => index.coversFilters)));
}

export function getIndexContractsMissingRequiredFilters(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
): ModuleIndexContractMissingFilter[] {
  return getWorkspaceModulesRequiringQueryPolicy(modules).flatMap((module) => {
    const queryPolicy = getWorkspaceModuleQueryPolicy(module.id);
    if (!queryPolicy) return [];

    const coveredFilters = new Set(getIndexContractCoveredFilters(module.id));

    return queryPolicy.policy.requiredFilters.flatMap((requiredFilter) => (
      coveredFilters.has(requiredFilter)
        ? []
        : [{
            moduleId: module.id,
            workspaceId: module.workspaceId,
            missingFilter: requiredFilter,
          }]
    ));
  });
}
