import {
  createStage2FirstReadModelBatch,
  stage2FirstReadModelModuleIds,
  type WorkspaceImplementationRoadmapAction,
} from "./implementationRoadmap";
import {
  normalizeServerPageQueryDraft,
  validateServerPageQueryPolicy,
  type ServerPageQueryDraft,
} from "../data-access/queryPolicy";
import { getWorkspaceModuleQueryPolicy } from "../data-access/workspaceQueryPolicies";
import {
  createStage2ReadModelActivationPreflightCommand,
  createStage2ReadModelSchemaPreflightCommand,
  stage2ReadModelActivationRule,
  stage2ReadModelImplementationPath,
  stage2ReadModelPlannedSmokeExpectation,
  stage2ReadModelRollbackPlan,
  stage2ReadModelVerifyCommand,
} from "./stage2ReadModelActivationCommands";

export type Stage2FirstReadModelSmokeExpectation = {
  plannedStatus: 501;
  plannedCode: "planned_module_database_action";
  plannedLiveHandlerStatus: "planned-only";
  liveStatus: 200;
};

export type Stage2FirstReadModelActivationChecklistItem = WorkspaceImplementationRoadmapAction & {
  schemaPreflightCommand: string;
  activationPreflightCommand: string;
  implementationPath: typeof stage2ReadModelImplementationPath;
  verifyCommand: "npm run verify";
  rollbackPlan: "Remove the live registry key and guarded registration";
  plannedSmokeRequest: {
    endpoint: "/api/database";
    method: "POST";
    body: {
      resource: string;
      action: string;
      payload: Record<string, unknown>;
    };
  };
  smokeExpectation: Stage2FirstReadModelSmokeExpectation;
};

export type Stage2FirstReadModelActivationChecklist = {
  maxParallelActivations: 1;
  requiresGreenVerifyBeforeEachAction: true;
  items: Stage2FirstReadModelActivationChecklistItem[];
  rule: string;
};

export type Stage2FirstReadModelActivationChecklistIssueCode =
  | "parallel_activation_not_limited"
  | "green_verify_not_required"
  | "non_read_model_action"
  | "verify_command_missing"
  | "planned_smoke_expectation_invalid"
  | "planned_smoke_route_mismatch"
  | "query_policy_missing"
  | "list_smoke_query_missing"
  | "list_smoke_query_policy_failed"
  | "detail_smoke_id_missing"
  | "detail_smoke_scope_missing";

export type Stage2FirstReadModelActivationChecklistIssue = {
  code: Stage2FirstReadModelActivationChecklistIssueCode;
  moduleId?: string;
  databaseAction?: string;
  field?: string;
};

export function createStage2FirstReadModelActivationChecklist(
  requestedBy = "backend-engineer",
): Stage2FirstReadModelActivationChecklist {
  const items = createStage2FirstReadModelBatch().actions
    .sort(compareReadModelActivationActions)
    .map((action) => createStage2FirstReadModelActivationChecklistItem(action, requestedBy));

  return {
    maxParallelActivations: 1,
    requiresGreenVerifyBeforeEachAction: true,
    items,
    rule: stage2ReadModelActivationRule,
  };
}

export function validateStage2FirstReadModelActivationChecklist(
  checklist: Stage2FirstReadModelActivationChecklist,
): Stage2FirstReadModelActivationChecklistIssue[] {
  const issues: Stage2FirstReadModelActivationChecklistIssue[] = [
    ...(checklist.maxParallelActivations === 1 ? [] : [{ code: "parallel_activation_not_limited" as const }]),
    ...(checklist.requiresGreenVerifyBeforeEachAction ? [] : [{ code: "green_verify_not_required" as const }]),
  ];

  for (const item of checklist.items) {
    issues.push(...validateStage2FirstReadModelActivationChecklistItem(item));
  }

  return issues;
}

function compareReadModelActivationActions(
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

function createStage2FirstReadModelActivationChecklistItem(
  action: WorkspaceImplementationRoadmapAction,
  requestedBy: string,
): Stage2FirstReadModelActivationChecklistItem {
  return {
    ...action,
    schemaPreflightCommand: createStage2ReadModelSchemaPreflightCommand(action),
    activationPreflightCommand: createStage2ReadModelActivationPreflightCommand(action, requestedBy),
    implementationPath: stage2ReadModelImplementationPath,
    verifyCommand: stage2ReadModelVerifyCommand,
    rollbackPlan: stage2ReadModelRollbackPlan,
    plannedSmokeRequest: {
      endpoint: "/api/database",
      method: "POST",
      body: {
        resource: action.resource,
        action: action.databaseAction,
        payload: createStage2FirstReadModelSmokePayload(action),
      },
    },
    smokeExpectation: stage2ReadModelPlannedSmokeExpectation,
  };
}

function createStage2FirstReadModelSmokePayload(
  action: WorkspaceImplementationRoadmapAction,
): Record<string, unknown> {
  if (action.contractKind === "detail") {
    return {
      id: "<id>",
      scope: { sectionId: "<section_id>" },
    };
  }

  return {
    scope: { sectionId: "<section_id>" },
    query: {
      pageSize: 25,
      filters: createStage2FirstReadModelSmokeFilters(action),
    },
  };
}

function createStage2FirstReadModelSmokeFilters(
  action: WorkspaceImplementationRoadmapAction,
) {
  const queryPolicy = getWorkspaceModuleQueryPolicy(action.moduleId)?.policy;
  const requiredFilters = queryPolicy?.requiredFilters ?? ["date", "section_id", "status"];

  return Object.fromEntries(requiredFilters.map((filterKey) => [
    filterKey,
    smokeFilterPlaceholderByKey[filterKey] ?? `<${filterKey}>`,
  ]));
}

const smokeFilterPlaceholderByKey: Record<string, string> = {
  date: "<YYYY-MM-DD>",
  section_id: "<section_id>",
  shift: "<shift>",
  status: "<status>",
  vehicle_id: "<vehicle_id>",
  driver_id: "<driver_id>",
  period_id: "<period_id>",
};

function validateStage2FirstReadModelActivationChecklistItem(
  item: Stage2FirstReadModelActivationChecklistItem,
): Stage2FirstReadModelActivationChecklistIssue[] {
  const itemRef = {
    moduleId: item.moduleId,
    databaseAction: item.databaseAction,
  };
  const issues: Stage2FirstReadModelActivationChecklistIssue[] = [
    ...(item.contractKind === "list" || item.contractKind === "detail" ? [] : [{
      ...itemRef,
      code: "non_read_model_action" as const,
    }]),
    ...(item.verifyCommand === "npm run verify" ? [] : [{
      ...itemRef,
      code: "verify_command_missing" as const,
    }]),
    ...(isPlannedSmokeExpectationValid(item.smokeExpectation) ? [] : [{
      ...itemRef,
      code: "planned_smoke_expectation_invalid" as const,
    }]),
    ...(isPlannedSmokeRouteValid(item) ? [] : [{
      ...itemRef,
      code: "planned_smoke_route_mismatch" as const,
    }]),
  ];

  if (item.contractKind === "list") {
    issues.push(...validateListSmokePayload(item));
  }

  if (item.contractKind === "detail") {
    issues.push(...validateDetailSmokePayload(item));
  }

  return issues;
}

function validateListSmokePayload(
  item: Stage2FirstReadModelActivationChecklistItem,
): Stage2FirstReadModelActivationChecklistIssue[] {
  const itemRef = {
    moduleId: item.moduleId,
    databaseAction: item.databaseAction,
  };
  const queryPolicy = getWorkspaceModuleQueryPolicy(item.moduleId)?.policy;
  if (!queryPolicy) return [{ ...itemRef, code: "query_policy_missing" }];

  const queryDraft = getSmokeQueryDraft(item.plannedSmokeRequest.body.payload);
  if (!queryDraft) return [{ ...itemRef, code: "list_smoke_query_missing" }];

  return validateServerPageQueryPolicy(
    normalizeServerPageQueryDraft(queryDraft),
    queryPolicy,
  ).map((issue) => ({
    ...itemRef,
    code: "list_smoke_query_policy_failed" as const,
    field: issue.field,
  }));
}

function validateDetailSmokePayload(
  item: Stage2FirstReadModelActivationChecklistItem,
): Stage2FirstReadModelActivationChecklistIssue[] {
  const itemRef = {
    moduleId: item.moduleId,
    databaseAction: item.databaseAction,
  };
  const payload = item.plannedSmokeRequest.body.payload;
  const id = payload.id;
  const scope = payload.scope;

  return [
    ...(typeof id === "string" && id.trim() ? [] : [{
      ...itemRef,
      code: "detail_smoke_id_missing" as const,
    }]),
    ...(scope && typeof scope === "object" && !Array.isArray(scope) ? [] : [{
      ...itemRef,
      code: "detail_smoke_scope_missing" as const,
    }]),
  ];
}

function getSmokeQueryDraft(payload: Record<string, unknown>): ServerPageQueryDraft | undefined {
  const query = payload.query;
  if (!query || typeof query !== "object" || Array.isArray(query)) return undefined;

  return query as ServerPageQueryDraft;
}

function isPlannedSmokeExpectationValid(
  expectation: Stage2FirstReadModelSmokeExpectation,
) {
  return expectation.plannedStatus === 501
    && expectation.plannedCode === "planned_module_database_action"
    && expectation.plannedLiveHandlerStatus === "planned-only"
    && expectation.liveStatus === 200;
}

function isPlannedSmokeRouteValid(
  item: Stage2FirstReadModelActivationChecklistItem,
) {
  return item.plannedSmokeRequest.endpoint === "/api/database"
    && item.plannedSmokeRequest.method === "POST"
    && item.plannedSmokeRequest.body.resource === item.resource
    && item.plannedSmokeRequest.body.action === item.databaseAction;
}
