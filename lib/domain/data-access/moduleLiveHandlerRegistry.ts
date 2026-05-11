import {
  listModuleHandlerImplementationPlan,
  type ModuleHandlerImplementationPhase,
  type ModuleHandlerImplementationPlanEntry,
} from "./moduleHandlerImplementationPlan";
import {
  createModuleHandlerRuntimeContract,
  type ModuleHandlerRuntimeRequirement,
} from "./moduleHandlerRuntimeContracts";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";

export type ModuleLiveHandlerStatus = "planned-only" | "live";

export type ModuleLiveHandlerKey = {
  resource: string;
  databaseAction: string;
};

export type ModuleLiveHandlerRegistryIssueCode =
  | "unknown_live_handler"
  | "live_handler_without_gate"
  | "live_handler_missing_runtime_contract";

export type ModuleLiveHandlerRegistryIssue = ModuleLiveHandlerKey & {
  code: ModuleLiveHandlerRegistryIssueCode;
  moduleId?: string;
  workspaceId?: DispatchWorkspaceId;
};

export type ModuleLiveHandlerRegistryEntry = ModuleLiveHandlerKey & {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  phase: ModuleHandlerImplementationPhase;
  status: ModuleLiveHandlerStatus;
  readyToConnectHandler: boolean;
  runtimeRequirements: ModuleHandlerRuntimeRequirement[];
  activationIssues: ModuleLiveHandlerRegistryIssueCode[];
};

const configuredLiveModuleHandlers: readonly ModuleLiveHandlerKey[] = [];

function isSameHandlerKey(left: ModuleLiveHandlerKey, right: ModuleLiveHandlerKey) {
  return left.resource === right.resource && left.databaseAction === right.databaseAction;
}

function hasLiveHandlerKey(
  entry: ModuleHandlerImplementationPlanEntry,
  liveHandlerKeys: readonly ModuleLiveHandlerKey[],
) {
  return liveHandlerKeys.some((key) => isSameHandlerKey(entry, key));
}

function createRegistryEntry(
  entry: ModuleHandlerImplementationPlanEntry,
  liveHandlerKeys: readonly ModuleLiveHandlerKey[],
): ModuleLiveHandlerRegistryEntry {
  const runtimeContract = createModuleHandlerRuntimeContract(entry.resource, entry.databaseAction);
  const status: ModuleLiveHandlerStatus = hasLiveHandlerKey(entry, liveHandlerKeys)
    ? "live"
    : "planned-only";
  const activationIssues: ModuleLiveHandlerRegistryIssueCode[] = status === "live"
    ? [
      ...(!runtimeContract.readyToConnectHandler ? ["live_handler_without_gate" as const] : []),
      ...(runtimeContract.requirements.length === 0
        ? ["live_handler_missing_runtime_contract" as const]
        : []),
    ]
    : [];

  return {
    moduleId: entry.moduleId,
    workspaceId: entry.workspaceId,
    resource: entry.resource,
    databaseAction: entry.databaseAction,
    phase: entry.phase,
    status,
    readyToConnectHandler: runtimeContract.readyToConnectHandler,
    runtimeRequirements: runtimeContract.requirements,
    activationIssues,
  };
}

export function listConfiguredLiveModuleHandlerKeys() {
  return [...configuredLiveModuleHandlers];
}

export function listModuleLiveHandlerRegistry(
  workspaceId?: DispatchWorkspaceId,
  liveHandlerKeys: readonly ModuleLiveHandlerKey[] = configuredLiveModuleHandlers,
) {
  return listModuleHandlerImplementationPlan(workspaceId)
    .map((entry) => createRegistryEntry(entry, liveHandlerKeys));
}

export function getModuleLiveHandlerStatus(
  resource: string,
  databaseAction: string,
  liveHandlerKeys: readonly ModuleLiveHandlerKey[] = configuredLiveModuleHandlers,
) {
  return listModuleLiveHandlerRegistry(undefined, liveHandlerKeys)
    .find((entry) => entry.resource === resource && entry.databaseAction === databaseAction);
}

export function getModuleLiveHandlerRegistryIssues(
  liveHandlerKeys: readonly ModuleLiveHandlerKey[] = configuredLiveModuleHandlers,
): ModuleLiveHandlerRegistryIssue[] {
  const registry = listModuleLiveHandlerRegistry(undefined, liveHandlerKeys);
  const unknownLiveHandlers = liveHandlerKeys
    .filter((key) => !registry.some((entry) => isSameHandlerKey(entry, key)))
    .map((key): ModuleLiveHandlerRegistryIssue => ({
      ...key,
      code: "unknown_live_handler",
    }));
  const activationIssues = registry.flatMap((entry): ModuleLiveHandlerRegistryIssue[] => (
    entry.activationIssues.map((code) => ({
      resource: entry.resource,
      databaseAction: entry.databaseAction,
      moduleId: entry.moduleId,
      workspaceId: entry.workspaceId,
      code,
    }))
  ));

  return [...unknownLiveHandlers, ...activationIssues];
}
