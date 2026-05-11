import { getModuleDatabaseAuthorizationRequirement } from "./moduleDatabaseAuthorization";
import {
  listModuleHandlerReadiness,
  type ModuleHandlerContractKind,
  type ModuleHandlerReadiness,
} from "./moduleHandlerReadiness";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";

export type ModuleHandlerImplementationPhase =
  | "read-model"
  | "export-queue"
  | "import-staging"
  | "write-workflow";

export type ModuleHandlerImplementationGuardrail =
  | "single_nextjs_process"
  | "single_database_router"
  | "access_matrix_required"
  | "section_scope_required"
  | "server_pagination_required"
  | "prepared_or_bounded_export"
  | "stored_file_reference_required"
  | "versioned_patch_required"
  | "change_history_required";

export type ModuleHandlerImplementationPlanEntry = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  contractKind: ModuleHandlerContractKind;
  phase: ModuleHandlerImplementationPhase;
  order: number;
  implementationReady: boolean;
  dependsOnReadHandlers: boolean;
  requiredCapability?: string;
  sectionScoped: boolean;
  guardrails: ModuleHandlerImplementationGuardrail[];
};

export type ModuleHandlerImplementationDependencyIssueCode =
  | "missing_ready_read_model";

export type ModuleHandlerImplementationDependencyIssue = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  phase: ModuleHandlerImplementationPhase;
  code: ModuleHandlerImplementationDependencyIssueCode;
};

export type ModuleHandlerImplementationGateIssueCode =
  | "missing_implementation_plan"
  | "handler_not_ready"
  | ModuleHandlerImplementationDependencyIssueCode;

export type ModuleHandlerImplementationGate = {
  resource: string;
  databaseAction: string;
  readyToConnectHandler: boolean;
  moduleId?: string;
  workspaceId?: DispatchWorkspaceId;
  phase?: ModuleHandlerImplementationPhase;
  order?: number;
  dependsOnReadHandlers?: boolean;
  guardrails?: ModuleHandlerImplementationGuardrail[];
  issues: ModuleHandlerImplementationGateIssueCode[];
};

const phaseOrder: Record<ModuleHandlerImplementationPhase, number> = {
  "read-model": 1,
  "export-queue": 2,
  "import-staging": 3,
  "write-workflow": 4,
};

function getImplementationPhase(
  contractKind: ModuleHandlerContractKind,
): ModuleHandlerImplementationPhase {
  if (contractKind === "export") return "export-queue";
  if (contractKind === "import") return "import-staging";
  if (contractKind === "write") return "write-workflow";

  return "read-model";
}

function getGuardrails(
  readiness: ModuleHandlerReadiness,
  phase: ModuleHandlerImplementationPhase,
  sectionScoped: boolean,
): ModuleHandlerImplementationGuardrail[] {
  return [
    "single_nextjs_process",
    "single_database_router",
    "access_matrix_required",
    ...(sectionScoped ? ["section_scope_required" as const] : []),
    ...(readiness.contractKind === "list" ? ["server_pagination_required" as const] : []),
    ...(phase === "export-queue" ? ["prepared_or_bounded_export" as const] : []),
    ...(phase === "import-staging" ? ["stored_file_reference_required" as const] : []),
    ...(phase === "write-workflow" ? [
      "versioned_patch_required" as const,
      "change_history_required" as const,
    ] : []),
  ];
}

function createPlanEntry(readiness: ModuleHandlerReadiness): ModuleHandlerImplementationPlanEntry {
  const authorization = getModuleDatabaseAuthorizationRequirement({
    resource: readiness.resource,
    action: readiness.databaseAction,
  });
  const phase = getImplementationPhase(readiness.contractKind);
  const sectionScoped = authorization?.sectionScoped ?? false;

  return {
    moduleId: readiness.moduleId,
    workspaceId: readiness.workspaceId,
    resource: readiness.resource,
    databaseAction: readiness.databaseAction,
    contractKind: readiness.contractKind,
    phase,
    order: phaseOrder[phase],
    implementationReady: readiness.implementationReady,
    dependsOnReadHandlers: phase !== "read-model",
    requiredCapability: authorization?.requiredCapability,
    sectionScoped,
    guardrails: getGuardrails(readiness, phase, sectionScoped),
  };
}

export function listModuleHandlerImplementationPlan(workspaceId?: DispatchWorkspaceId) {
  return listModuleHandlerReadiness(workspaceId)
    .map(createPlanEntry)
    .sort((left, right) => (
      left.order - right.order
      || left.workspaceId.localeCompare(right.workspaceId)
      || left.moduleId.localeCompare(right.moduleId)
      || left.databaseAction.localeCompare(right.databaseAction)
    ));
}

export function getModuleHandlerImplementationPlanEntry(
  resource: string,
  databaseAction: string,
) {
  return listModuleHandlerImplementationPlan().find((entry) => (
    entry.resource === resource && entry.databaseAction === databaseAction
  ));
}

export function getNextModuleHandlerImplementationBatch(
  workspaceId?: DispatchWorkspaceId,
  limit = 8,
) {
  const readyPlan = listModuleHandlerImplementationPlan(workspaceId)
    .filter((entry) => entry.implementationReady);
  const firstOrder = readyPlan[0]?.order;
  if (!firstOrder) return [];

  return readyPlan
    .filter((entry) => entry.order === firstOrder)
    .slice(0, limit);
}

export function getModuleHandlerImplementationBlockers(workspaceId?: DispatchWorkspaceId) {
  return listModuleHandlerImplementationPlan(workspaceId)
    .filter((entry) => !entry.implementationReady);
}

export function evaluateModuleHandlerImplementationDependencies(
  entries: readonly ModuleHandlerImplementationPlanEntry[] = listModuleHandlerImplementationPlan(),
): ModuleHandlerImplementationDependencyIssue[] {
  const readyReadModuleIds = new Set(entries
    .filter((entry) => entry.phase === "read-model" && entry.implementationReady)
    .map((entry) => entry.moduleId));

  return entries.flatMap((entry): ModuleHandlerImplementationDependencyIssue[] => {
    if (!entry.dependsOnReadHandlers || readyReadModuleIds.has(entry.moduleId)) return [];

    return [{
      moduleId: entry.moduleId,
      workspaceId: entry.workspaceId,
      resource: entry.resource,
      databaseAction: entry.databaseAction,
      phase: entry.phase,
      code: "missing_ready_read_model",
    }];
  });
}

export function getModuleHandlerImplementationDependencyIssues(
  workspaceId?: DispatchWorkspaceId,
) {
  return evaluateModuleHandlerImplementationDependencies(
    listModuleHandlerImplementationPlan(workspaceId),
  );
}

export function evaluateModuleHandlerImplementationGate(
  resource: string,
  databaseAction: string,
  entries: readonly ModuleHandlerImplementationPlanEntry[] = listModuleHandlerImplementationPlan(),
): ModuleHandlerImplementationGate {
  const entry = entries.find((planEntry) => (
    planEntry.resource === resource && planEntry.databaseAction === databaseAction
  ));
  if (!entry) {
    return {
      resource,
      databaseAction,
      readyToConnectHandler: false,
      issues: ["missing_implementation_plan"],
    };
  }

  const dependencyIssues = evaluateModuleHandlerImplementationDependencies(entries)
    .filter((issue) => (
      issue.resource === resource && issue.databaseAction === databaseAction
    ))
    .map((issue) => issue.code);
  const issues: ModuleHandlerImplementationGateIssueCode[] = [
    ...(entry.implementationReady ? [] : ["handler_not_ready" as const]),
    ...dependencyIssues,
  ];

  return {
    resource,
    databaseAction,
    readyToConnectHandler: issues.length === 0,
    moduleId: entry.moduleId,
    workspaceId: entry.workspaceId,
    phase: entry.phase,
    order: entry.order,
    dependsOnReadHandlers: entry.dependsOnReadHandlers,
    guardrails: entry.guardrails,
    issues,
  };
}
