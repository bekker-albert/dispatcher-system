import {
  listModuleHandlerImplementationPlan,
  type ModuleHandlerImplementationPlanEntry,
} from "../data-access/moduleHandlerImplementationPlan";
import {
  getModuleLiveHandlerStatus,
  type ModuleLiveHandlerKey,
  type ModuleLiveHandlerStatus,
} from "../data-access/moduleLiveHandlerRegistry";
import { stage2FirstReadModelModuleIds } from "./implementationRoadmap";
import type { DispatchWorkspaceId } from "./workspaces";

type Stage2ReadModelContractKind = "list" | "detail";

export type Stage2ReadModelLiveAction = {
  resource: string;
  databaseAction: string;
  contractKind: Stage2ReadModelContractKind;
  liveStatus: ModuleLiveHandlerStatus | "unknown";
  ready: boolean;
};

export type Stage2LiveReadinessModule = {
  moduleId: string;
  workspaceId?: DispatchWorkspaceId;
  readModelsReady: boolean;
  totalReadModelActions: number;
  liveReadModelActions: number;
  pendingReadModelActions: string[];
  readModelActions: Stage2ReadModelLiveAction[];
};

export type Stage2WriteLiveReadinessAction = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  sameModuleReadModelsReady: boolean;
  firstBatchReadModelsReady: boolean;
  blockedUntilReadModelsLive: boolean;
  liveActivationAllowedNow: boolean;
  requiredReadModelActions: string[];
};

export type Stage2LiveReadinessSnapshot = {
  totalReadModelActions: number;
  liveReadModelActions: number;
  pendingReadModelActions: string[];
  firstBatchReadModelsReady: boolean;
  writeHandlersBlockedUntilReadModelsLive: boolean;
  liveActivationAllowedNow: boolean;
  maxParallelLiveRegistrations: 1;
  noMysqlConnection: true;
  liveRegistryMutation: false;
  handlerRegistrationMutation: false;
  modules: Stage2LiveReadinessModule[];
  writeActions: Stage2WriteLiveReadinessAction[];
  rule: string;
};

export function createStage2LiveReadinessSnapshot(
  liveHandlerKeys?: readonly ModuleLiveHandlerKey[],
): Stage2LiveReadinessSnapshot {
  const stage2Plan = listModuleHandlerImplementationPlan()
    .filter((entry) => isStage2FirstReadModelModuleId(entry.moduleId));
  const modules = stage2FirstReadModelModuleIds
    .map((moduleId) => createStage2LiveReadinessModule(moduleId, stage2Plan, liveHandlerKeys));
  const firstBatchReadModelsReady = modules.length === stage2FirstReadModelModuleIds.length
    && modules.every((module) => module.readModelsReady);
  const writeActions = stage2Plan
    .filter((entry) => entry.phase === "write-workflow")
    .map((entry) => createStage2WriteLiveReadinessAction(
      entry,
      modules,
      firstBatchReadModelsReady,
    ));
  const pendingReadModelActions = modules.flatMap((module) => module.pendingReadModelActions);

  return {
    totalReadModelActions: modules.reduce((total, module) => total + module.totalReadModelActions, 0),
    liveReadModelActions: modules.reduce((total, module) => total + module.liveReadModelActions, 0),
    pendingReadModelActions,
    firstBatchReadModelsReady,
    writeHandlersBlockedUntilReadModelsLive: writeActions.some((action) => action.blockedUntilReadModelsLive),
    liveActivationAllowedNow: writeActions.length > 0
      && writeActions.every((action) => action.liveActivationAllowedNow),
    maxParallelLiveRegistrations: 1,
    noMysqlConnection: true,
    liveRegistryMutation: false,
    handlerRegistrationMutation: false,
    modules,
    writeActions,
    rule: "Stage 2 write handlers stay blocked until every first-batch read-model list/detail handler is live.",
  };
}

function createStage2LiveReadinessModule(
  moduleId: typeof stage2FirstReadModelModuleIds[number],
  stage2Plan: readonly ModuleHandlerImplementationPlanEntry[],
  liveHandlerKeys?: readonly ModuleLiveHandlerKey[],
): Stage2LiveReadinessModule {
  const moduleEntries = stage2Plan.filter((entry) => entry.moduleId === moduleId);
  const readModelActions = moduleEntries
    .filter(isReadModelEntry)
    .sort(compareReadModelActions)
    .map((entry) => createReadModelLiveAction(entry, liveHandlerKeys));
  const pendingReadModelActions = readModelActions
    .filter((action) => !action.ready)
    .map((action) => action.databaseAction);

  return {
    moduleId,
    workspaceId: moduleEntries[0]?.workspaceId,
    readModelsReady: readModelActions.length > 0 && pendingReadModelActions.length === 0,
    totalReadModelActions: readModelActions.length,
    liveReadModelActions: readModelActions.filter((action) => action.ready).length,
    pendingReadModelActions,
    readModelActions,
  };
}

function createReadModelLiveAction(
  entry: ModuleHandlerImplementationPlanEntry,
  liveHandlerKeys?: readonly ModuleLiveHandlerKey[],
): Stage2ReadModelLiveAction {
  const liveStatus = getModuleLiveHandlerStatus(
    entry.resource,
    entry.databaseAction,
    liveHandlerKeys,
  )?.status ?? "unknown";

  return {
    resource: entry.resource,
    databaseAction: entry.databaseAction,
    contractKind: entry.contractKind as Stage2ReadModelContractKind,
    liveStatus,
    ready: liveStatus === "live",
  };
}

function createStage2WriteLiveReadinessAction(
  entry: ModuleHandlerImplementationPlanEntry,
  modules: readonly Stage2LiveReadinessModule[],
  firstBatchReadModelsReady: boolean,
): Stage2WriteLiveReadinessAction {
  const moduleReadiness = modules.find((module) => module.moduleId === entry.moduleId);
  const sameModuleReadModelsReady = moduleReadiness?.readModelsReady ?? false;
  const liveActivationAllowedNow = sameModuleReadModelsReady && firstBatchReadModelsReady;

  return {
    moduleId: entry.moduleId,
    workspaceId: entry.workspaceId,
    resource: entry.resource,
    databaseAction: entry.databaseAction,
    sameModuleReadModelsReady,
    firstBatchReadModelsReady,
    blockedUntilReadModelsLive: !liveActivationAllowedNow,
    liveActivationAllowedNow,
    requiredReadModelActions: moduleReadiness?.readModelActions.map((action) => action.databaseAction) ?? [],
  };
}

function isStage2FirstReadModelModuleId(
  moduleId: string,
): moduleId is typeof stage2FirstReadModelModuleIds[number] {
  return (stage2FirstReadModelModuleIds as readonly string[]).includes(moduleId);
}

function isReadModelEntry(
  entry: ModuleHandlerImplementationPlanEntry,
) {
  return entry.phase === "read-model"
    && (entry.contractKind === "list" || entry.contractKind === "detail");
}

function compareReadModelActions(
  left: ModuleHandlerImplementationPlanEntry,
  right: ModuleHandlerImplementationPlanEntry,
) {
  return readModelContractOrder(left.contractKind) - readModelContractOrder(right.contractKind);
}

function readModelContractOrder(contractKind: string) {
  if (contractKind === "list") return 1;
  if (contractKind === "detail") return 2;

  return 3;
}
