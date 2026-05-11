import {
  createStage2FirstReadModelBatch,
  stage2FirstReadModelModuleIds,
  type WorkspaceImplementationRoadmapAction,
} from "./implementationRoadmap";
import {
  createStage2ReadModelActivationPreflightCommand,
  createStage2ReadModelSchemaPreflightCommand,
  stage2ReadModelActivationRule,
  stage2ReadModelImplementationPath,
  stage2ReadModelPlannedSmokeExpectation,
  stage2ReadModelVerifyCommand,
} from "./stage2ReadModelActivationCommands";

type Stage2FirstReadModelActivationSummaryIssueCode =
  | "module_batch_size_changed"
  | "module_missing"
  | "module_without_list_action"
  | "module_without_detail_action"
  | "unsafe_action_kind"
  | "non_view_action"
  | "section_scope_missing"
  | "access_matrix_missing"
  | "server_pagination_missing"
  | "page_size_too_large"
  | "write_action_included"
  | "export_action_included"
  | "import_action_included";

type Stage2FirstReadModelActivationSummaryIssue = {
  code: Stage2FirstReadModelActivationSummaryIssueCode;
  moduleId?: string;
  databaseAction?: string;
};

export type Stage2FirstReadModelActivationSummary = {
  requestedBy: string;
  ready: boolean;
  totalActions: number;
  listActions: number;
  detailActions: number;
  issueCount: number;
  moduleIds: string[];
  nextActivationGate?: {
    ready: boolean;
    maxParallelActivations: 1;
    requiredCommands: string[];
    requiresSchemaPreflightBeforeActivation: true;
    requiresGreenVerifyBeforeActivation: true;
    noLiveRegistrationFromSummary: true;
  };
  firstAction?: {
    moduleId: string;
    workspaceId: string;
    resource: string;
    databaseAction: string;
    contractKind: string;
    implementationPath: typeof stage2ReadModelImplementationPath;
    schemaPreflightCommand: string;
    activationPreflightCommand: string;
    verifyCommand: "npm run verify";
    plannedSmokeStatus: 501;
    plannedSmokeCode: "planned_module_database_action";
    plannedLiveHandlerStatus: "planned-only";
  };
  rule: string;
};

export function createStage2FirstReadModelActivationSummary(
  requestedBy = "backend-engineer",
): Stage2FirstReadModelActivationSummary {
  const batch = createStage2FirstReadModelBatch();
  const issues = validateStage2FirstReadModelActivationSummaryBatch(batch);
  const firstAction = [...batch.actions].sort(compareReadModelActivationSummaryActions)[0];
  const firstActionSchemaPreflightCommand = firstAction
    ? createStage2ReadModelSchemaPreflightCommand(firstAction)
    : undefined;
  const firstActionActivationPreflightCommand = firstAction
    ? createStage2ReadModelActivationPreflightCommand(firstAction, requestedBy)
    : undefined;
  const nextActivationGate = firstActionSchemaPreflightCommand && firstActionActivationPreflightCommand
    ? {
        ready: issues.length === 0,
        maxParallelActivations: 1 as const,
        requiredCommands: [
          firstActionSchemaPreflightCommand,
          firstActionActivationPreflightCommand,
          stage2ReadModelVerifyCommand,
        ],
        requiresSchemaPreflightBeforeActivation: true as const,
        requiresGreenVerifyBeforeActivation: true as const,
        noLiveRegistrationFromSummary: true as const,
      }
    : undefined;

  return {
    requestedBy,
    ready: issues.length === 0,
    totalActions: batch.actions.length,
    listActions: batch.actions.filter((item) => item.contractKind === "list").length,
    detailActions: batch.actions.filter((item) => item.contractKind === "detail").length,
    issueCount: issues.length,
    moduleIds: [...batch.moduleIds],
    ...(nextActivationGate ? { nextActivationGate } : {}),
    ...(firstAction ? {
      firstAction: {
        moduleId: firstAction.moduleId,
        workspaceId: firstAction.workspaceId,
        resource: firstAction.resource,
        databaseAction: firstAction.databaseAction,
        contractKind: firstAction.contractKind,
        implementationPath: stage2ReadModelImplementationPath,
        schemaPreflightCommand: firstActionSchemaPreflightCommand ?? createStage2ReadModelSchemaPreflightCommand(firstAction),
        activationPreflightCommand: firstActionActivationPreflightCommand ?? createStage2ReadModelActivationPreflightCommand(firstAction, requestedBy),
        verifyCommand: stage2ReadModelVerifyCommand,
        plannedSmokeStatus: stage2ReadModelPlannedSmokeExpectation.plannedStatus,
        plannedSmokeCode: stage2ReadModelPlannedSmokeExpectation.plannedCode,
        plannedLiveHandlerStatus: stage2ReadModelPlannedSmokeExpectation.plannedLiveHandlerStatus,
      },
    } : {}),
    rule: stage2ReadModelActivationRule,
  };
}

function validateStage2FirstReadModelActivationSummaryBatch(
  batch: ReturnType<typeof createStage2FirstReadModelBatch>,
): Stage2FirstReadModelActivationSummaryIssue[] {
  const issues: Stage2FirstReadModelActivationSummaryIssue[] = [
    ...(batch.maxModuleBatchSize === 2 ? [] : [{ code: "module_batch_size_changed" as const }]),
    ...(batch.requiresAccessMatrix ? [] : [{ code: "access_matrix_missing" as const }]),
    ...(batch.requiresSectionScope ? [] : [{ code: "section_scope_missing" as const }]),
    ...(batch.requiresServerPagination ? [] : [{ code: "server_pagination_missing" as const }]),
    ...(batch.maxPageSize <= 100 ? [] : [{ code: "page_size_too_large" as const }]),
    ...(batch.noWriteActions ? [] : [{ code: "write_action_included" as const }]),
    ...(batch.noExportActions ? [] : [{ code: "export_action_included" as const }]),
    ...(batch.noImportActions ? [] : [{ code: "import_action_included" as const }]),
  ];

  for (const moduleId of stage2FirstReadModelModuleIds) {
    const rolloutModule = batch.modules.find((item) => item.moduleId === moduleId);
    if (!rolloutModule) {
      issues.push({ code: "module_missing", moduleId });
      continue;
    }
    if (!rolloutModule.hasListAction) issues.push({ code: "module_without_list_action", moduleId });
    if (!rolloutModule.hasDetailAction) issues.push({ code: "module_without_detail_action", moduleId });
  }

  for (const action of batch.actions) {
    const itemRef = { moduleId: action.moduleId, databaseAction: action.databaseAction };
    if (action.contractKind !== "list" && action.contractKind !== "detail") {
      issues.push({ ...itemRef, code: "unsafe_action_kind" });
    }
    if (action.requiredCapability !== "view") {
      issues.push({ ...itemRef, code: "non_view_action" });
    }
    if (!action.sectionScoped) {
      issues.push({ ...itemRef, code: "section_scope_missing" });
    }
  }

  return issues;
}

function compareReadModelActivationSummaryActions(
  left: WorkspaceImplementationRoadmapAction,
  right: WorkspaceImplementationRoadmapAction,
) {
  const leftModuleOrder = stage2FirstReadModelModuleIds.indexOf(left.moduleId as typeof stage2FirstReadModelModuleIds[number]);
  const rightModuleOrder = stage2FirstReadModelModuleIds.indexOf(right.moduleId as typeof stage2FirstReadModelModuleIds[number]);
  if (leftModuleOrder !== rightModuleOrder) return leftModuleOrder - rightModuleOrder;

  return readModelActionKindOrder(left.contractKind) - readModelActionKindOrder(right.contractKind);
}

function readModelActionKindOrder(
  contractKind: WorkspaceImplementationRoadmapAction["contractKind"],
) {
  if (contractKind === "list") return 1;
  if (contractKind === "detail") return 2;

  return 3;
}
