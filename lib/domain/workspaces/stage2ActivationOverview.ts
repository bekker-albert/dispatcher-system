import { createStage2FirstReadModelActivationSummary } from "./stage2ReadModelActivationSummary";
import { createStage2WriteHandlerActivationSummary } from "./stage2WriteHandlerActivationSummary";

export type Stage2ActivationOverview = {
  requestedBy: string;
  readyToPlan: boolean;
  currentActivationStep: "read-model";
  activationOrder: readonly ["read-models", "write-handlers"];
  maxParallelLiveRegistrations: 1;
  noMysqlConnection: true;
  noLiveRegistryMutation: true;
  noHandlerRegistrationMutation: true;
  readModels: {
    ready: boolean;
    totalActions: number;
    firstAction?: string;
    nextActivationGateReady: boolean;
    requiredCommands: string[];
  };
  writeHandlers: {
    readyAfterReadModels: boolean;
    totalActions: number;
    firstAction?: string;
    nextActivationGateReady: boolean;
    requiredCommands: string[];
    blockedUntilReadModelsLive: boolean;
    liveActivationAllowedNow: boolean;
  };
  rule: string;
};

export function createStage2ActivationOverview(
  requestedBy = "backend-engineer",
): Stage2ActivationOverview {
  const readModelSummary = createStage2FirstReadModelActivationSummary(requestedBy);
  const writeHandlerSummary = createStage2WriteHandlerActivationSummary(requestedBy);

  return {
    requestedBy,
    readyToPlan: readModelSummary.ready && writeHandlerSummary.ready,
    currentActivationStep: "read-model",
    activationOrder: ["read-models", "write-handlers"],
    maxParallelLiveRegistrations: 1,
    noMysqlConnection: true,
    noLiveRegistryMutation: true,
    noHandlerRegistrationMutation: true,
    readModels: {
      ready: readModelSummary.ready,
      totalActions: readModelSummary.totalActions,
      firstAction: readModelSummary.firstAction?.databaseAction,
      nextActivationGateReady: readModelSummary.nextActivationGate?.ready ?? false,
      requiredCommands: readModelSummary.nextActivationGate?.requiredCommands ?? [],
    },
    writeHandlers: {
      readyAfterReadModels: writeHandlerSummary.ready,
      totalActions: writeHandlerSummary.totalActions,
      firstAction: writeHandlerSummary.firstAction?.databaseAction,
      nextActivationGateReady: writeHandlerSummary.nextActivationGate?.ready ?? false,
      requiredCommands: writeHandlerSummary.nextActivationGate?.requiredCommands ?? [],
      blockedUntilReadModelsLive: writeHandlerSummary.nextActivationGate?.blockedUntilReadModelsLive ?? true,
      liveActivationAllowedNow: writeHandlerSummary.nextActivationGate?.liveActivationAllowedNow ?? false,
    },
    rule: "Stage 2 activates bounded read models first; write handlers stay blocked until read handlers are live and verified.",
  };
}
