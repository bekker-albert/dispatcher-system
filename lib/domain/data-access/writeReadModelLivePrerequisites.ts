import {
  getModuleHandlerImplementationPlanEntry,
  listModuleHandlerImplementationPlan,
} from "./moduleHandlerImplementationPlan";
import {
  getModuleLiveHandlerStatus,
  type ModuleLiveHandlerKey,
  type ModuleLiveHandlerStatus,
} from "./moduleLiveHandlerRegistry";

export type WriteReadModelLivePrerequisites = {
  ready: boolean;
  requiredActions: Array<{
    resource: string;
    databaseAction: string;
    contractKind: "list" | "detail" | string;
    liveStatus: ModuleLiveHandlerStatus | "unknown";
    ready: boolean;
  }>;
  rule: string;
};

export function createWriteReadModelLivePrerequisites(
  resource: string,
  databaseAction: string,
  liveHandlerKeys?: readonly ModuleLiveHandlerKey[],
): WriteReadModelLivePrerequisites {
  const entry = getModuleHandlerImplementationPlanEntry(resource, databaseAction);
  const requiredActions = entry
    ? listModuleHandlerImplementationPlan()
      .filter((planEntry) => (
        planEntry.moduleId === entry.moduleId
        && planEntry.phase === "read-model"
        && (planEntry.contractKind === "list" || planEntry.contractKind === "detail")
      ))
      .sort((left, right) => (
        readModelContractKindOrder(left.contractKind) - readModelContractKindOrder(right.contractKind)
      ))
      .map((planEntry) => {
        const status: ModuleLiveHandlerStatus | "unknown" = getModuleLiveHandlerStatus(
          planEntry.resource,
          planEntry.databaseAction,
          liveHandlerKeys,
        )?.status ?? "unknown";

        return {
          resource: planEntry.resource,
          databaseAction: planEntry.databaseAction,
          contractKind: planEntry.contractKind,
          liveStatus: status,
          ready: status === "live",
        };
      })
    : [];

  return {
    ready: requiredActions.length > 0 && requiredActions.every((action) => action.ready),
    requiredActions,
    rule: "Write handlers can go live only after the same module list/detail read models are live.",
  };
}

function readModelContractKindOrder(contractKind: string) {
  if (contractKind === "list") return 1;
  if (contractKind === "detail") return 2;

  return 3;
}
