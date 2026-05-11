import type { RequiredFilterKey } from "./pagination";
import { recommendedDatabaseIndexes } from "./pagination";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import type { WorkspaceModuleCatalogItem } from "../workspaces/moduleCatalog";
import { workspaceModuleCatalog } from "../workspaces/moduleCatalog";
import { modulePersistenceContracts } from "./persistenceContractCatalog";

export type ModulePersistenceWriteMode =
  | "readonly"
  | "versioned-patch"
  | "workflow-patch"
  | "queued-export"
  | "on-demand";

export type ModulePersistenceContract = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  primaryEntities: string[];
  writeMode: ModulePersistenceWriteMode;
  versioned: boolean;
  patchOnly: boolean;
  writesChangeHistory: boolean;
  aggregateOnly?: boolean;
  exportOnDemand?: boolean;
  requiredIndexes: RequiredFilterKey[];
  historyEntities?: string[];
  notes: string;
};

export { modulePersistenceContracts };

const patchWriteModes: ModulePersistenceWriteMode[] = ["versioned-patch", "workflow-patch"];

export function getModulePersistenceContract(moduleId: string) {
  return modulePersistenceContracts.find((contract) => contract.moduleId === moduleId);
}

export function listModulePersistenceContracts(workspaceId?: DispatchWorkspaceId) {
  return modulePersistenceContracts.filter((contract) => (
    workspaceId ? contract.workspaceId === workspaceId : true
  ));
}

export function getWorkspaceModulesWithoutPersistenceContract(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  const coveredModuleIds = new Set(modulePersistenceContracts.map((contract) => contract.moduleId));
  return modules.filter((module) => !coveredModuleIds.has(module.id));
}

export function getPatchContractsWithoutVersioning() {
  return modulePersistenceContracts.filter((contract) => (
    patchWriteModes.includes(contract.writeMode)
    && (!contract.versioned || !contract.patchOnly || !contract.writesChangeHistory)
  ));
}

export function getContractsWithUnsupportedIndexes() {
  const supportedIndexes = new Set(recommendedDatabaseIndexes);
  return modulePersistenceContracts.filter((contract) => (
    contract.requiredIndexes.some((index) => !supportedIndexes.has(index))
  ));
}
