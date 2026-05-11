import { createWriteReadModelLivePrerequisites } from "../data-access/writeReadModelLivePrerequisites";
import type { ModuleWritePipelineKind } from "../data-access/moduleWritePipelinePlans";
import {
  createStage2WriteHandlerActivationChecklist,
  validateStage2WriteHandlerActivationChecklist,
  type Stage2WriteHandlerActivationChecklist,
} from "./stage2WriteHandlerActivationChecklist";
import { stage2FirstReadModelModuleIds } from "./implementationRoadmap";

type Stage2WriteHandlerFactoryKind = "create" | "patch";

export type Stage2WriteHandlerActivationSummary = {
  requestedBy: string;
  ready: boolean;
  totalActions: number;
  createActions: number;
  patchActions: number;
  workflowTransitionActions: number;
  issueCount: number;
  moduleIds: string[];
  appliesChanges: false;
  databaseConnection: false;
  liveRegistryMutation: false;
  handlerRegistrationMutation: false;
  doesNotRegisterHandlers: true;
  stopConditions: string[];
  nextActivationGate?: {
    ready: boolean;
    maxParallelActivations: 1;
    requiredCommands: string[];
    readModelLivePrerequisitesReady: boolean;
    requiresReadModelsLiveBeforeActivation: true;
    blockedUntilReadModelsLive: boolean;
    liveActivationAllowedNow: boolean;
    requiresGreenVerifyBeforeActivation: true;
    requiresTestDatabaseForWriteSmoke: true;
    noLiveRegistrationFromSummary: true;
  };
  firstAction?: {
    moduleId: string;
    workspaceId: string;
    resource: string;
    databaseAction: string;
    pipelineKind: ModuleWritePipelineKind;
    factoryKind: Stage2WriteHandlerFactoryKind;
    implementationPath: string;
    planningCommand: string;
    registrationReviewCommand: string;
    verifyCommand: "npm run verify";
    plannedLiveHandlerStatus: "planned-only" | "live" | "unknown";
  };
  rule: string;
};

export function createStage2WriteHandlerActivationSummary(
  requestedBy = "backend-engineer",
): Stage2WriteHandlerActivationSummary {
  const checklist = createStage2WriteHandlerActivationChecklist(requestedBy);
  const issues = validateStage2WriteHandlerActivationChecklist(checklist);
  const firstAction = checklist.items[0];
  const firstActionLivePrerequisites = firstAction
    ? createWriteReadModelLivePrerequisites(firstAction.resource, firstAction.databaseAction)
    : undefined;

  return {
    requestedBy,
    ready: issues.length === 0,
    totalActions: checklist.items.length,
    createActions: countPipelineKind(checklist, "create"),
    patchActions: countPipelineKind(checklist, "patch"),
    workflowTransitionActions: countPipelineKind(checklist, "workflow-transition"),
    issueCount: issues.length,
    moduleIds: [...stage2FirstReadModelModuleIds],
    appliesChanges: false,
    databaseConnection: false,
    liveRegistryMutation: false,
    handlerRegistrationMutation: false,
    doesNotRegisterHandlers: true,
    stopConditions: [...checklist.stopConditions],
    ...(firstAction ? {
      nextActivationGate: {
        ready: issues.length === 0 && firstAction.readModelPrerequisites.ready,
        maxParallelActivations: checklist.maxParallelActivations,
        requiredCommands: [
          firstAction.planningCommand,
          firstAction.registrationReviewCommand,
          firstAction.verifyCommand,
        ],
        readModelLivePrerequisitesReady: firstActionLivePrerequisites?.ready ?? false,
        requiresReadModelsLiveBeforeActivation: true,
        blockedUntilReadModelsLive: !(firstActionLivePrerequisites?.ready ?? false),
        liveActivationAllowedNow: firstActionLivePrerequisites?.ready ?? false,
        requiresGreenVerifyBeforeActivation: true,
        requiresTestDatabaseForWriteSmoke: true,
        noLiveRegistrationFromSummary: true,
      },
      firstAction: {
        moduleId: firstAction.moduleId,
        workspaceId: firstAction.workspaceId,
        resource: firstAction.resource,
        databaseAction: firstAction.databaseAction,
        pipelineKind: firstAction.pipelineKind,
        factoryKind: firstAction.factoryKind,
        implementationPath: firstAction.implementationPath,
        planningCommand: firstAction.planningCommand,
        registrationReviewCommand: firstAction.registrationReviewCommand,
        verifyCommand: firstAction.verifyCommand,
        plannedLiveHandlerStatus: firstAction.plannedLiveHandlerStatus,
      },
    } : {}),
    rule: checklist.rule,
  };
}

function countPipelineKind(
  checklist: Stage2WriteHandlerActivationChecklist,
  pipelineKind: ModuleWritePipelineKind,
) {
  return checklist.items.filter((item) => item.pipelineKind === pipelineKind).length;
}
