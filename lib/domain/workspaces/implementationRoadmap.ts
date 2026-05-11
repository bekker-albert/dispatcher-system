import {
  getModuleHandlerImplementationBlockers,
  getModuleHandlerImplementationDependencyIssues,
  getNextModuleHandlerImplementationBatch,
  listModuleHandlerImplementationPlan,
  type ModuleHandlerImplementationGuardrail,
  type ModuleHandlerImplementationPhase,
  type ModuleHandlerImplementationPlanEntry,
} from "../data-access/moduleHandlerImplementationPlan";
import type { DispatchWorkspaceId } from "./workspaces";

export type WorkspaceImplementationRoadmapAction = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  contractKind: ModuleHandlerImplementationPlanEntry["contractKind"];
  requiredCapability?: string;
  sectionScoped: boolean;
};

export type WorkspaceImplementationRoadmapPhase = {
  phase: ModuleHandlerImplementationPhase;
  order: number;
  title: string;
  objective: string;
  totalActions: number;
  readyActions: number;
  blockedActions: number;
  guardrails: ModuleHandlerImplementationGuardrail[];
  canStart: boolean;
};

export type WorkspaceImplementationRoadmap = {
  workspaceId?: DispatchWorkspaceId;
  totalActions: number;
  readyActions: number;
  blockedActions: number;
  dependencyIssues: number;
  nextBatch: WorkspaceImplementationRoadmapAction[];
  phases: WorkspaceImplementationRoadmapPhase[];
  rolloutRule: string;
};

export type WorkspaceReadModelRolloutModule = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  actions: WorkspaceImplementationRoadmapAction[];
  hasListAction: boolean;
  hasDetailAction: boolean;
};

export type WorkspaceReadModelRolloutPlan = {
  workspaceId?: DispatchWorkspaceId;
  maxModuleBatchSize: number;
  modules: WorkspaceReadModelRolloutModule[];
  totalReadModelActions: number;
  noWriteActions: true;
  noExportActions: true;
  noImportActions: true;
  rule: string;
};

export type Stage2FirstReadModelBatch = {
  maxModuleBatchSize: 2;
  moduleIds: readonly string[];
  modules: WorkspaceReadModelRolloutModule[];
  actions: WorkspaceImplementationRoadmapAction[];
  noWriteActions: true;
  noExportActions: true;
  noImportActions: true;
  requiresAccessMatrix: true;
  requiresSectionScope: true;
  requiresServerPagination: true;
  maxPageSize: 100;
  rule: string;
};

export const stage2FirstReadModelModuleIds = [
  "taxation-waybills",
  "mining-shift-reports",
] as const;

const phaseOrder: ModuleHandlerImplementationPhase[] = [
  "read-model",
  "export-queue",
  "import-staging",
  "write-workflow",
];

const phaseTitles: Record<ModuleHandlerImplementationPhase, string> = {
  "read-model": "Read models",
  "export-queue": "On-demand exports",
  "import-staging": "Import staging",
  "write-workflow": "Versioned write workflows",
};

const phaseObjectives: Record<ModuleHandlerImplementationPhase, string> = {
  "read-model": "Connect bounded list/detail handlers with access matrix checks before any write UI.",
  "export-queue": "Generate Excel/PDF artifacts only on request and store results by reference.",
  "import-staging": "Stage uploaded files without holding large spreadsheets in memory.",
  "write-workflow": "Enable versioned patch saves, conflict handling and audit history after read handlers exist.",
};

export function createWorkspaceImplementationRoadmap(
  workspaceId?: DispatchWorkspaceId,
  batchLimit = 8,
): WorkspaceImplementationRoadmap {
  const plan = listModuleHandlerImplementationPlan(workspaceId);
  const blockers = getModuleHandlerImplementationBlockers(workspaceId);
  const dependencyIssues = getModuleHandlerImplementationDependencyIssues(workspaceId);
  const nextBatch = getNextModuleHandlerImplementationBatch(workspaceId, batchLimit)
    .map(toRoadmapAction);

  return {
    workspaceId,
    totalActions: plan.length,
    readyActions: plan.filter((entry) => entry.implementationReady).length,
    blockedActions: blockers.length,
    dependencyIssues: dependencyIssues.length,
    nextBatch,
    phases: phaseOrder.map((phase, index) => createRoadmapPhase(phase, index + 1, plan)),
    rolloutRule: "Implement one bounded read-model batch first; connect exports, imports and writes only after the module has ready read handlers.",
  };
}

export function createWorkspaceReadModelRolloutPlan(
  workspaceId?: DispatchWorkspaceId,
  maxModuleBatchSize = 4,
): WorkspaceReadModelRolloutPlan {
  const readModelActions = listModuleHandlerImplementationPlan(workspaceId)
    .filter((entry) => entry.phase === "read-model" && entry.implementationReady)
    .map(toRoadmapAction);
  const modules = Array.from(groupActionsByModule(readModelActions).values())
    .slice(0, maxModuleBatchSize);

  return {
    workspaceId,
    maxModuleBatchSize,
    modules,
    totalReadModelActions: readModelActions.length,
    noWriteActions: true,
    noExportActions: true,
    noImportActions: true,
    rule: "First backend batch connects only read-model list/detail/on-demand handlers with access and query policy checks.",
  };
}

export function createStage2FirstReadModelBatch(): Stage2FirstReadModelBatch {
  const readModelActions = listModuleHandlerImplementationPlan()
    .filter((entry) => (
      entry.phase === "read-model"
      && entry.implementationReady
      && stage2FirstReadModelModuleIds.includes(entry.moduleId as typeof stage2FirstReadModelModuleIds[number])
    ))
    .map(toRoadmapAction);
  const groupedModules = groupActionsByModule(readModelActions);
  const modules = stage2FirstReadModelModuleIds
    .map((moduleId) => groupedModules.get(moduleId))
    .filter((module): module is WorkspaceReadModelRolloutModule => Boolean(module));
  const actions = modules.flatMap((module) => module.actions);

  return {
    maxModuleBatchSize: 2,
    moduleIds: stage2FirstReadModelModuleIds,
    modules,
    actions,
    noWriteActions: true,
    noExportActions: true,
    noImportActions: true,
    requiresAccessMatrix: true,
    requiresSectionScope: true,
    requiresServerPagination: true,
    maxPageSize: 100,
    rule: "Stage 2 first batch is limited to taxation waybills and mining shift reports read-model list/detail handlers only.",
  };
}

function createRoadmapPhase(
  phase: ModuleHandlerImplementationPhase,
  order: number,
  plan: readonly ModuleHandlerImplementationPlanEntry[],
): WorkspaceImplementationRoadmapPhase {
  const entries = plan.filter((entry) => entry.phase === phase);
  const readyActions = entries.filter((entry) => entry.implementationReady).length;
  const blockedActions = entries.length - readyActions;

  return {
    phase,
    order,
    title: phaseTitles[phase],
    objective: phaseObjectives[phase],
    totalActions: entries.length,
    readyActions,
    blockedActions,
    guardrails: uniqueGuardrails(entries),
    canStart: entries.length > 0 && blockedActions === 0,
  };
}

function groupActionsByModule(
  actions: readonly WorkspaceImplementationRoadmapAction[],
) {
  const modules = new Map<string, WorkspaceReadModelRolloutModule>();

  for (const action of actions) {
    const existingModule = modules.get(action.moduleId) ?? {
      moduleId: action.moduleId,
      workspaceId: action.workspaceId,
      actions: [],
      hasListAction: false,
      hasDetailAction: false,
    };

    const nextActions = [...existingModule.actions, action];
    modules.set(action.moduleId, {
      ...existingModule,
      actions: nextActions,
      hasListAction: nextActions.some((item) => item.contractKind === "list"),
      hasDetailAction: nextActions.some((item) => item.contractKind === "detail"),
    });
  }

  return modules;
}

function uniqueGuardrails(
  entries: readonly ModuleHandlerImplementationPlanEntry[],
): ModuleHandlerImplementationGuardrail[] {
  return Array.from(new Set(entries.flatMap((entry) => entry.guardrails)));
}

function toRoadmapAction(
  entry: ModuleHandlerImplementationPlanEntry,
): WorkspaceImplementationRoadmapAction {
  return {
    moduleId: entry.moduleId,
    workspaceId: entry.workspaceId,
    resource: entry.resource,
    databaseAction: entry.databaseAction,
    contractKind: entry.contractKind,
    requiredCapability: entry.requiredCapability,
    sectionScoped: entry.sectionScoped,
  };
}
