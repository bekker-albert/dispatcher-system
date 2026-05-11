import type { ModuleLiveHandlerKey } from "../data-access/moduleLiveHandlerRegistry";
import {
  createStage2FirstReadModelActivationChecklist,
  type Stage2FirstReadModelActivationChecklistItem,
} from "./stage2ReadModelActivationChecklist";
import {
  createStage2WriteHandlerActivationChecklist,
  type Stage2WriteHandlerActivationChecklistItem,
} from "./stage2WriteHandlerActivationChecklist";
import {
  createStage2LiveReadinessSnapshot,
  type Stage2LiveReadinessSnapshot,
} from "./stage2LiveReadinessSnapshot";

type Stage2NextActivationPhase = "read-model" | "write-handler";

export type Stage2NextActivationAction = {
  phase: Stage2NextActivationPhase;
  moduleId: string;
  workspaceId: string;
  resource: string;
  databaseAction: string;
  implementationPath: string;
  requiredCommands: string[];
  verifyCommand: "npm run verify";
  liveRegistrationAllowedFromPlan: false;
  rule: string;
};

export type Stage2NextReadModelActivationAction = Stage2NextActivationAction & {
  phase: "read-model";
  contractKind: string;
  schemaPreflightCommand: string;
  activationPreflightCommand: string;
  plannedSmokeStatus: 501;
};

export type Stage2NextWriteHandlerActivationAction = Stage2NextActivationAction & {
  phase: "write-handler";
  factoryKind: "create" | "patch";
  planningCommand: string;
  registrationReviewCommand: string;
  blockedUntilReadModelsLive: false;
};

export type Stage2NextActivationPlan = {
  requestedBy: string;
  currentStep: Stage2NextActivationPhase;
  firstBatchReadModelsReady: boolean;
  writeHandlersBlockedUntilReadModelsLive: boolean;
  liveActivationAllowedNow: boolean;
  maxParallelLiveRegistrations: 1;
  noMysqlConnection: true;
  liveRegistryMutation: false;
  handlerRegistrationMutation: false;
  nextAction?: Stage2NextReadModelActivationAction | Stage2NextWriteHandlerActivationAction;
  snapshot: Stage2LiveReadinessSnapshot;
  rule: string;
};

export function createStage2NextActivationPlan(
  requestedBy = "backend-engineer",
  liveHandlerKeys?: readonly ModuleLiveHandlerKey[],
): Stage2NextActivationPlan {
  const snapshot = createStage2LiveReadinessSnapshot(liveHandlerKeys);
  const nextAction = snapshot.firstBatchReadModelsReady
    ? createNextWriteHandlerAction(requestedBy)
    : createNextReadModelAction(requestedBy, snapshot);
  const currentStep: Stage2NextActivationPhase = snapshot.firstBatchReadModelsReady
    ? "write-handler"
    : "read-model";

  return {
    requestedBy,
    currentStep,
    firstBatchReadModelsReady: snapshot.firstBatchReadModelsReady,
    writeHandlersBlockedUntilReadModelsLive: snapshot.writeHandlersBlockedUntilReadModelsLive,
    liveActivationAllowedNow: snapshot.liveActivationAllowedNow,
    maxParallelLiveRegistrations: 1,
    noMysqlConnection: true,
    liveRegistryMutation: false,
    handlerRegistrationMutation: false,
    ...(nextAction ? { nextAction } : {}),
    snapshot,
    rule: "Stage 2 next action is one read-model live candidate until the first batch is live, then one guarded write-handler candidate.",
  };
}

function createNextReadModelAction(
  requestedBy: string,
  snapshot: Stage2LiveReadinessSnapshot,
): Stage2NextReadModelActivationAction | undefined {
  const checklist = createStage2FirstReadModelActivationChecklist(requestedBy);
  const nextItem = checklist.items.find((item) => (
    snapshot.pendingReadModelActions.includes(item.databaseAction)
  ));

  return nextItem ? toNextReadModelActivationAction(nextItem) : undefined;
}

function toNextReadModelActivationAction(
  item: Stage2FirstReadModelActivationChecklistItem,
): Stage2NextReadModelActivationAction {
  return {
    phase: "read-model",
    moduleId: item.moduleId,
    workspaceId: item.workspaceId,
    resource: item.resource,
    databaseAction: item.databaseAction,
    implementationPath: item.implementationPath,
    contractKind: item.contractKind,
    schemaPreflightCommand: item.schemaPreflightCommand,
    activationPreflightCommand: item.activationPreflightCommand,
    verifyCommand: item.verifyCommand,
    plannedSmokeStatus: item.smokeExpectation.plannedStatus,
    requiredCommands: [
      item.schemaPreflightCommand,
      item.activationPreflightCommand,
      item.verifyCommand,
    ],
    liveRegistrationAllowedFromPlan: false,
    rule: "Run schema preflight, activation preflight, verify and smoke before registering this single read-model handler.",
  };
}

function createNextWriteHandlerAction(
  requestedBy: string,
): Stage2NextWriteHandlerActivationAction | undefined {
  const checklist = createStage2WriteHandlerActivationChecklist(requestedBy);
  const nextItem = checklist.items[0];

  return nextItem ? toNextWriteHandlerActivationAction(nextItem) : undefined;
}

function toNextWriteHandlerActivationAction(
  item: Stage2WriteHandlerActivationChecklistItem,
): Stage2NextWriteHandlerActivationAction {
  return {
    phase: "write-handler",
    moduleId: item.moduleId,
    workspaceId: item.workspaceId,
    resource: item.resource,
    databaseAction: item.databaseAction,
    implementationPath: item.implementationPath,
    factoryKind: item.factoryKind,
    planningCommand: item.planningCommand,
    registrationReviewCommand: item.registrationReviewCommand,
    verifyCommand: item.verifyCommand,
    blockedUntilReadModelsLive: false,
    requiredCommands: [
      item.planningCommand,
      item.registrationReviewCommand,
      item.verifyCommand,
    ],
    liveRegistrationAllowedFromPlan: false,
    rule: "Run the passive write plan, passive write review, verify and test-database smoke before registering this single write handler.",
  };
}
