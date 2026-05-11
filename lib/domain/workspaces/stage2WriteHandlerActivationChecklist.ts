import {
  evaluateModuleHandlerImplementationGate,
  listModuleHandlerImplementationPlan,
  type ModuleHandlerImplementationPlanEntry,
} from "../data-access/moduleHandlerImplementationPlan";
import { getModuleLiveHandlerStatus } from "../data-access/moduleLiveHandlerRegistry";
import {
  getModuleWritePipelinePlan,
  type ModuleWritePipelineKind,
} from "../data-access/moduleWritePipelinePlans";
import {
  stage2FirstReadModelModuleIds,
  type WorkspaceImplementationRoadmapAction,
} from "./implementationRoadmap";
import { createExpectedWriteHandlerImplementationPath } from "./stage2ImplementationPaths";

type Stage2WriteHandlerFactoryKind = "create" | "patch";

export type Stage2WriteHandlerActivationChecklistItem = WorkspaceImplementationRoadmapAction & {
  phase: "write-workflow";
  pipelineKind: ModuleWritePipelineKind;
  factoryKind: Stage2WriteHandlerFactoryKind;
  readModelPrerequisites: {
    listAction?: string;
    detailAction?: string;
    listReady: boolean;
    detailReady: boolean;
    ready: boolean;
  };
  requiresExpectedVersion: boolean;
  requiresDuplicateCheck: boolean;
  queuesAggregateRefresh: boolean;
  readyToConnectHandler: boolean;
  plannedLiveHandlerStatus: "planned-only" | "live" | "unknown";
  implementationPath: string;
  planningCommand: string;
  registrationReviewCommand: string;
  verifyCommand: "npm run verify";
  rollbackPlan: "Remove the live registry key and guarded write registration";
  doesNotApplyChanges: true;
  noRegistrationFromPlan: true;
  requiresReadModelPathBeforeLive: true;
  noWriteSmokeAfterLiveWithoutTestDatabase: true;
};

export type Stage2WriteHandlerActivationChecklist = {
  appliesChanges: false;
  databaseConnection: false;
  liveRegistryMutation: false;
  handlerRegistrationMutation: false;
  doesNotRegisterHandlers: true;
  maxParallelActivations: 1;
  requiresGreenVerifyBeforeEachAction: true;
  requiresReadModelPathBeforeLive: true;
  items: Stage2WriteHandlerActivationChecklistItem[];
  stopConditions: string[];
  rule: string;
};

export type Stage2WriteHandlerActivationChecklistIssueCode =
  | "parallel_activation_not_limited"
  | "green_verify_not_required"
  | "read_model_dependency_not_required"
  | "missing_read_model_prerequisite"
  | "non_write_action"
  | "missing_write_pipeline"
  | "factory_kind_mismatch"
  | "implementation_gate_blocked"
  | "live_handler_not_planned"
  | "verify_command_missing"
  | "planning_command_missing"
  | "registration_review_missing"
  | "plan_applies_changes"
  | "plan_registers_handler"
  | "unsafe_live_write_smoke";

export type Stage2WriteHandlerActivationChecklistIssue = {
  code: Stage2WriteHandlerActivationChecklistIssueCode;
  moduleId?: string;
  databaseAction?: string;
};

export const stage2WriteHandlerActivationRule =
  "Plan write handlers only after bounded read models; activate exactly one create/patch action at a time with version checks, change history and compact responses.";

const stage2WriteHandlerVerifyCommand = "npm run verify" as const;
const stage2WriteHandlerRollbackPlan = "Remove the live registry key and guarded write registration" as const;
const stage2WriteHandlerStopConditions = [
  "Do not register a live write handler from this planner output.",
  "Stop if readModelPrerequisites.ready is false.",
  "Stop if plan:write-handler-activation or review:write-handler is not green.",
  "Stop if compact_write_response is missing from runtime requirements.",
  "Stop if the handler writes more than one entity row.",
  "Stop if the handler needs a new API route, database, backend process, AppRoot state or useAppStateBundle business state.",
];

export function createStage2WriteHandlerActivationChecklist(
  requestedBy = "backend-engineer",
): Stage2WriteHandlerActivationChecklist {
  const implementationPlan = listModuleHandlerImplementationPlan();
  const items = implementationPlan
    .filter(isStage2WriteHandlerCandidate)
    .sort(compareWriteHandlerActivationEntries)
    .map((entry) => createStage2WriteHandlerActivationChecklistItem(
      entry,
      requestedBy,
      implementationPlan,
    ));

  return {
    appliesChanges: false,
    databaseConnection: false,
    liveRegistryMutation: false,
    handlerRegistrationMutation: false,
    doesNotRegisterHandlers: true,
    maxParallelActivations: 1,
    requiresGreenVerifyBeforeEachAction: true,
    requiresReadModelPathBeforeLive: true,
    items,
    stopConditions: [...stage2WriteHandlerStopConditions],
    rule: stage2WriteHandlerActivationRule,
  };
}

export function validateStage2WriteHandlerActivationChecklist(
  checklist: Stage2WriteHandlerActivationChecklist,
): Stage2WriteHandlerActivationChecklistIssue[] {
  const issues: Stage2WriteHandlerActivationChecklistIssue[] = [
    ...(checklist.appliesChanges === false ? [] : [{
      code: "plan_applies_changes" as const,
    }]),
    ...(checklist.databaseConnection === false ? [] : [{
      code: "plan_applies_changes" as const,
    }]),
    ...(checklist.liveRegistryMutation === false && checklist.handlerRegistrationMutation === false
      ? []
      : [{ code: "plan_registers_handler" as const }]),
    ...(checklist.doesNotRegisterHandlers ? [] : [{
      code: "plan_registers_handler" as const,
    }]),
    ...(checklist.maxParallelActivations === 1 ? [] : [{
      code: "parallel_activation_not_limited" as const,
    }]),
    ...(checklist.requiresGreenVerifyBeforeEachAction ? [] : [{
      code: "green_verify_not_required" as const,
    }]),
    ...(checklist.requiresReadModelPathBeforeLive ? [] : [{
      code: "read_model_dependency_not_required" as const,
    }]),
  ];

  for (const item of checklist.items) {
    issues.push(...validateStage2WriteHandlerActivationChecklistItem(item));
  }

  return issues;
}

function isStage2WriteHandlerCandidate(entry: ModuleHandlerImplementationPlanEntry) {
  return entry.phase === "write-workflow"
    && entry.implementationReady
    && stage2FirstReadModelModuleIds.includes(
      entry.moduleId as typeof stage2FirstReadModelModuleIds[number],
    );
}

function createStage2WriteHandlerActivationChecklistItem(
  entry: ModuleHandlerImplementationPlanEntry,
  requestedBy: string,
  implementationPlan: readonly ModuleHandlerImplementationPlanEntry[],
): Stage2WriteHandlerActivationChecklistItem {
  const pipeline = getModuleWritePipelinePlan(entry.moduleId, entry.databaseAction);
  const pipelineKind = pipeline?.pipelineKind ?? "patch";
  const factoryKind = getStage2WriteHandlerFactoryKind(pipelineKind);
  const liveStatus = getModuleLiveHandlerStatus(entry.resource, entry.databaseAction);
  const implementationPath = createStage2WriteHandlerImplementationPath(entry);
  const implementationGate = evaluateModuleHandlerImplementationGate(
    entry.resource,
    entry.databaseAction,
    implementationPlan,
  );

  return {
    moduleId: entry.moduleId,
    workspaceId: entry.workspaceId,
    resource: entry.resource,
    databaseAction: entry.databaseAction,
    contractKind: entry.contractKind,
    requiredCapability: entry.requiredCapability,
    sectionScoped: entry.sectionScoped,
    phase: "write-workflow",
    pipelineKind,
    factoryKind,
    readModelPrerequisites: createStage2WriteHandlerReadModelPrerequisites(
      entry,
      implementationPlan,
    ),
    requiresExpectedVersion: pipeline?.requiresExpectedVersion ?? true,
    requiresDuplicateCheck: pipeline?.requiresDuplicateCheck ?? false,
    queuesAggregateRefresh: pipeline?.queuesAggregateRefresh ?? false,
    readyToConnectHandler: implementationGate.readyToConnectHandler,
    plannedLiveHandlerStatus: liveStatus?.status ?? "unknown",
    implementationPath,
    planningCommand: createStage2WriteHandlerPlanCommand(entry, factoryKind),
    registrationReviewCommand: createStage2WriteHandlerReviewCommand(
      entry,
      factoryKind,
      requestedBy,
      implementationPath,
    ),
    verifyCommand: stage2WriteHandlerVerifyCommand,
    rollbackPlan: stage2WriteHandlerRollbackPlan,
    doesNotApplyChanges: true,
    noRegistrationFromPlan: true,
    requiresReadModelPathBeforeLive: true,
    noWriteSmokeAfterLiveWithoutTestDatabase: true,
  };
}

function createStage2WriteHandlerImplementationPath(entry: ModuleHandlerImplementationPlanEntry) {
  return createExpectedWriteHandlerImplementationPath(entry.resource, entry.databaseAction);
}

function createStage2WriteHandlerReadModelPrerequisites(
  entry: ModuleHandlerImplementationPlanEntry,
  implementationPlan: readonly ModuleHandlerImplementationPlanEntry[],
): Stage2WriteHandlerActivationChecklistItem["readModelPrerequisites"] {
  const readModelEntries = implementationPlan.filter((planEntry) => (
    planEntry.moduleId === entry.moduleId
    && planEntry.phase === "read-model"
    && planEntry.implementationReady
  ));
  const listEntry = readModelEntries.find((planEntry) => planEntry.contractKind === "list");
  const detailEntry = readModelEntries.find((planEntry) => planEntry.contractKind === "detail");

  return {
    listAction: listEntry?.databaseAction,
    detailAction: detailEntry?.databaseAction,
    listReady: Boolean(listEntry),
    detailReady: Boolean(detailEntry),
    ready: Boolean(listEntry && detailEntry),
  };
}

function createStage2WriteHandlerPlanCommand(
  entry: ModuleHandlerImplementationPlanEntry,
  factoryKind: Stage2WriteHandlerFactoryKind,
) {
  return [
    "npm run plan:write-handler-activation --",
    `--resource ${entry.resource}`,
    `--action ${entry.databaseAction}`,
    `--factory-kind ${factoryKind}`,
  ].join(" ");
}

function createStage2WriteHandlerReviewCommand(
  entry: ModuleHandlerImplementationPlanEntry,
  factoryKind: Stage2WriteHandlerFactoryKind,
  requestedBy: string,
  implementationPath: string,
) {
  return [
    "npm run review:write-handler --",
    `--resource ${entry.resource}`,
    `--action ${entry.databaseAction}`,
    `--factory-kind ${factoryKind}`,
    `--requested-by ${requestedBy}`,
    `--reason "Connect one bounded write handler after read-model rollout."`,
    `--implementation-path ${implementationPath}`,
    `--rollback-plan "${stage2WriteHandlerRollbackPlan}."`,
  ].join(" ");
}

function getStage2WriteHandlerFactoryKind(
  pipelineKind: ModuleWritePipelineKind,
): Stage2WriteHandlerFactoryKind {
  return pipelineKind === "create" ? "create" : "patch";
}

function compareWriteHandlerActivationEntries(
  left: ModuleHandlerImplementationPlanEntry,
  right: ModuleHandlerImplementationPlanEntry,
) {
  const leftModuleOrder = stage2FirstReadModelModuleIds.indexOf(
    left.moduleId as typeof stage2FirstReadModelModuleIds[number],
  );
  const rightModuleOrder = stage2FirstReadModelModuleIds.indexOf(
    right.moduleId as typeof stage2FirstReadModelModuleIds[number],
  );
  if (leftModuleOrder !== rightModuleOrder) return leftModuleOrder - rightModuleOrder;

  const leftPipeline = getModuleWritePipelinePlan(left.moduleId, left.databaseAction)?.pipelineKind;
  const rightPipeline = getModuleWritePipelinePlan(right.moduleId, right.databaseAction)?.pipelineKind;
  const pipelineOrder = writePipelineOrder(leftPipeline) - writePipelineOrder(rightPipeline);
  if (pipelineOrder !== 0) return pipelineOrder;

  return left.databaseAction.localeCompare(right.databaseAction);
}

function writePipelineOrder(pipelineKind?: ModuleWritePipelineKind) {
  if (pipelineKind === "create") return 1;
  if (pipelineKind === "patch") return 2;
  if (pipelineKind === "workflow-transition") return 3;

  return 4;
}

function validateStage2WriteHandlerActivationChecklistItem(
  item: Stage2WriteHandlerActivationChecklistItem,
): Stage2WriteHandlerActivationChecklistIssue[] {
  const itemRef = {
    moduleId: item.moduleId,
    databaseAction: item.databaseAction,
  };
  const expectedFactoryKind = getStage2WriteHandlerFactoryKind(item.pipelineKind);

  return [
    ...(item.contractKind === "write" && item.phase === "write-workflow" ? [] : [{
      ...itemRef,
      code: "non_write_action" as const,
    }]),
    ...(item.readModelPrerequisites.ready ? [] : [{
      ...itemRef,
      code: "missing_read_model_prerequisite" as const,
    }]),
    ...(getModuleWritePipelinePlan(item.moduleId, item.databaseAction) ? [] : [{
      ...itemRef,
      code: "missing_write_pipeline" as const,
    }]),
    ...(item.factoryKind === expectedFactoryKind ? [] : [{
      ...itemRef,
      code: "factory_kind_mismatch" as const,
    }]),
    ...(item.readyToConnectHandler ? [] : [{
      ...itemRef,
      code: "implementation_gate_blocked" as const,
    }]),
    ...(item.plannedLiveHandlerStatus === "planned-only" ? [] : [{
      ...itemRef,
      code: "live_handler_not_planned" as const,
    }]),
    ...(item.verifyCommand === "npm run verify" ? [] : [{
      ...itemRef,
      code: "verify_command_missing" as const,
    }]),
    ...(item.planningCommand.includes("plan:write-handler-activation") ? [] : [{
      ...itemRef,
      code: "planning_command_missing" as const,
    }]),
    ...(item.registrationReviewCommand.includes("review:write-handler") ? [] : [{
      ...itemRef,
      code: "registration_review_missing" as const,
    }]),
    ...(item.doesNotApplyChanges ? [] : [{
      ...itemRef,
      code: "plan_applies_changes" as const,
    }]),
    ...(item.noRegistrationFromPlan ? [] : [{
      ...itemRef,
      code: "plan_registers_handler" as const,
    }]),
    ...(item.noWriteSmokeAfterLiveWithoutTestDatabase ? [] : [{
      ...itemRef,
      code: "unsafe_live_write_smoke" as const,
    }]),
  ];
}
