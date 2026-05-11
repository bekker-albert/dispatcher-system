import { NextResponse } from "next/server";
import type { WorkspaceModuleAccessAction } from "../../domain/access-control/moduleAccessPolicies";
import { getModuleDatabaseAuthorizationRequirement } from "../../domain/data-access/moduleDatabaseAuthorization";
import { getModuleDetailQueryPlan } from "../../domain/data-access/moduleDetailQueryPlans";
import { getModuleDataRouteContractByDatabaseAction } from "../../domain/data-access/moduleDataRoutes";
import { getModuleExportPlan } from "../../domain/data-access/moduleExportPlans";
import { getModuleHandlerReadiness } from "../../domain/data-access/moduleHandlerReadiness";
import { evaluateModuleHandlerImplementationGate } from "../../domain/data-access/moduleHandlerImplementationPlan";
import { createModuleHandlerRuntimeContract } from "../../domain/data-access/moduleHandlerRuntimeContracts";
import { getModuleLiveHandlerStatus } from "../../domain/data-access/moduleLiveHandlerRegistry";
import {
  getModuleImportPlanByDatabaseAction,
  type ModuleImportPlan,
} from "../../domain/data-access/moduleImportPlans";
import { getModuleListQueryPlan } from "../../domain/data-access/moduleListQueryPlans";
import { getModuleWritePipelinePlan } from "../../domain/data-access/moduleWritePipelinePlans";
import { getWorkspaceModuleQueryPolicy } from "../../domain/data-access/workspaceQueryPolicies";
import type { DispatchWorkspaceId } from "../../domain/workspaces/workspaces";
import type { DatabaseRequest } from "./types";
import { corsHeaders } from "./responses";

export const plannedModuleDatabaseActionCode = "planned_module_database_action";

const acceptedSectionScopeKeys = [
  "scope.sectionId",
  "query.filters.section_id",
  "query.filters.sectionId",
  "data.sectionId",
  "data.section_id",
] as const;

function createPlannedWritePipelinePayload(moduleId: string, databaseAction: string) {
  const pipelinePlan = getModuleWritePipelinePlan(moduleId, databaseAction);
  if (!pipelinePlan) return undefined;

  return {
    pipelineKind: pipelinePlan.pipelineKind,
    requiresExpectedVersion: pipelinePlan.requiresExpectedVersion,
    requiresDuplicateCheck: pipelinePlan.requiresDuplicateCheck,
    requiresAtomicTransaction: pipelinePlan.requiresAtomicTransaction,
    requiresChangeHistory: pipelinePlan.requiresChangeHistory,
    requiresPostCommitSideEffects: pipelinePlan.requiresPostCommitSideEffects,
    maxEntityRowWrites: pipelinePlan.maxEntityRowWrites,
    queuesAggregateRefresh: pipelinePlan.queuesAggregateRefresh,
    noInlineReportRecalculation: pipelinePlan.noInlineReportRecalculation,
    noFullReportRebuild: pipelinePlan.noFullReportRebuild,
  };
}

function createPlannedReadQueryPayload(moduleId: string, databaseAction: string) {
  const listPlan = getModuleListQueryPlan(moduleId);
  if (listPlan?.databaseAction === databaseAction) {
    const queryPolicy = getWorkspaceModuleQueryPolicy(moduleId)?.policy;

    return {
      queryKind: "list",
      serverPaginated: true,
      requiredFilters: queryPolicy?.requiredFilters ?? [],
      maxDateRangeDays: queryPolicy?.maxDateRangeDays,
      maxPageSize: queryPolicy?.maxPageSize,
      allowSearchWithoutFilters: queryPolicy?.allowSearchWithoutFilters ?? false,
      maxSearchLength: queryPolicy?.maxSearchLength,
      filterKeys: Object.keys(listPlan.filterColumns),
      searchEnabled: listPlan.searchColumns.length > 0,
      sortFields: Object.keys(listPlan.sortColumns),
      defaultSort: listPlan.defaultSort,
      noClientFullScan: true,
    } as const;
  }

  const detailPlan = getModuleDetailQueryPlan(moduleId);
  if (detailPlan?.databaseAction !== databaseAction) return undefined;

  return {
    queryKind: "detail",
    requiresId: detailPlan.requiresId,
    maxRows: detailPlan.maxRows,
    returnsVersion: detailPlan.returnsVersion,
    scopeFilterKeys: Object.keys(detailPlan.scopeColumns),
    noClientFullScan: true,
  } as const;
}

function createPlannedImportPipelinePayload(importPlan: ModuleImportPlan) {
  return {
    sourceKind: importPlan.sourceKind,
    allowedFormats: importPlan.allowedFormats,
    allowedModes: importPlan.allowedModes,
    maxRows: importPlan.maxRows,
    previewRowLimit: importPlan.previewRowLimit,
    issuePageSize: importPlan.issuePageSize,
    requiresStoredFileReference: importPlan.requiresStoredFileReference,
    requiresStagedValidation: importPlan.requiresStagedValidation,
    returnsValidationSummaryOnly: importPlan.returnsValidationSummaryOnly,
    persistsAcceptedRowsIndividually: importPlan.persistsAcceptedRowsIndividually,
    forbidsWholeTableReplacement: importPlan.forbidsWholeTableReplacement,
  };
}

function createPlannedExportPipelinePayload(moduleId: string, databaseAction: string) {
  const exportPlan = getModuleExportPlan(moduleId);
  if (exportPlan?.databaseAction !== databaseAction) return undefined;

  return {
    sourceKind: exportPlan.sourceKind,
    allowedFormats: exportPlan.allowedFormats,
    allowedGrains: exportPlan.allowedGrains,
    requiredFilters: exportPlan.requiredFilters,
    maxDateRangeDays: exportPlan.maxDateRangeDays,
    maxRowsPerExport: exportPlan.maxRowsPerExport,
    requiresServerSideFilters: exportPlan.requiresServerSideFilters,
    createsQueuedRequest: exportPlan.createsQueuedRequest,
    storesFileByReference: exportPlan.storesFileByReference,
    avoidsClientSideRecalculation: exportPlan.avoidsClientSideRecalculation,
    forbidsInlineFileContent: true,
  } as const;
}

function createPlannedHandlerReadinessPayload(resource: string, databaseAction: string) {
  const readiness = getModuleHandlerReadiness(resource, databaseAction);
  if (!readiness) return undefined;

  return {
    contractKind: readiness.contractKind,
    implementationReady: readiness.implementationReady,
    hasAuthorizationRequirement: readiness.hasAuthorizationRequirement,
    hasRequiredHandlerContract: readiness.hasRequiredHandlerContract,
    issues: readiness.issues,
  } as const;
}

function createPlannedAuthorizationPayload(resource: string, databaseAction: string) {
  const requirement = getModuleDatabaseAuthorizationRequirement({ resource, action: databaseAction });
  if (!requirement) return undefined;
  const sectionScopeKeys: readonly string[] = requirement.sectionScoped ? acceptedSectionScopeKeys : [];

  return {
    requiredCapability: requirement.requiredCapability,
    sectionScoped: requirement.sectionScoped,
    requiresAccessMatrix: requirement.requiresAccessMatrix,
    acceptedSectionScopeKeys: sectionScopeKeys,
  } as const;
}

function createPlannedImplementationPlanPayload(resource: string, databaseAction: string) {
  const implementationGate = evaluateModuleHandlerImplementationGate(resource, databaseAction);
  if (!implementationGate.phase || !implementationGate.order) return undefined;

  return {
    phase: implementationGate.phase,
    order: implementationGate.order,
    dependsOnReadHandlers: implementationGate.dependsOnReadHandlers ?? false,
    readyToConnectHandler: implementationGate.readyToConnectHandler,
    issues: implementationGate.issues,
    guardrails: implementationGate.guardrails ?? [],
  } as const;
}

function createPlannedRuntimeContractPayload(resource: string, databaseAction: string) {
  const runtimeContract = createModuleHandlerRuntimeContract(resource, databaseAction);
  if (runtimeContract.issues.includes("missing_implementation_gate")) return undefined;

  return {
    readyToConnectHandler: runtimeContract.readyToConnectHandler,
    requirements: runtimeContract.requirements,
    issues: runtimeContract.issues,
  } as const;
}

function createPlannedLiveHandlerPayload(resource: string, databaseAction: string) {
  const liveHandler = getModuleLiveHandlerStatus(resource, databaseAction);
  if (!liveHandler) return undefined;

  return {
    status: liveHandler.status,
    readyToConnectHandler: liveHandler.readyToConnectHandler,
    activationIssues: liveHandler.activationIssues,
  } as const;
}

type PlannedImplementationPlanPayload = NonNullable<ReturnType<typeof createPlannedImplementationPlanPayload>>;
type PlannedAuthorizationPayload = NonNullable<ReturnType<typeof createPlannedAuthorizationPayload>>;
type PlannedWritePipelinePayload = NonNullable<ReturnType<typeof createPlannedWritePipelinePayload>>;
type PlannedReadQueryPayload = NonNullable<ReturnType<typeof createPlannedReadQueryPayload>>;
type PlannedImportPipelinePayload = ReturnType<typeof createPlannedImportPipelinePayload>;
type PlannedExportPipelinePayload = NonNullable<ReturnType<typeof createPlannedExportPipelinePayload>>;
type PlannedHandlerReadinessPayload = NonNullable<ReturnType<typeof createPlannedHandlerReadinessPayload>>;
type PlannedLiveHandlerPayload = NonNullable<ReturnType<typeof createPlannedLiveHandlerPayload>>;
type PlannedRuntimeContractPayload = NonNullable<ReturnType<typeof createPlannedRuntimeContractPayload>>;

export type PlannedModuleDatabaseAction = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  action: string;
  accessAction: WorkspaceModuleAccessAction;
  endpoint: "/api/database";
  routeKind: "single-database-router";
  implementationStatus: "planned";
  authorization?: PlannedAuthorizationPayload;
  exportPipeline?: PlannedExportPipelinePayload;
  handlerReadiness?: PlannedHandlerReadinessPayload;
  implementationPlan?: PlannedImplementationPlanPayload;
  importPipeline?: PlannedImportPipelinePayload;
  liveHandler?: PlannedLiveHandlerPayload;
  readQuery?: PlannedReadQueryPayload;
  runtimeContract?: PlannedRuntimeContractPayload;
  writePipeline?: PlannedWritePipelinePayload;
};

export function getPlannedModuleDatabaseAction(
  request: DatabaseRequest,
): PlannedModuleDatabaseAction | undefined {
  const route = getModuleDataRouteContractByDatabaseAction(request.resource, request.action);
  if (route && route.contract.implementationStatus === "planned") {
    const writePipeline = createPlannedWritePipelinePayload(
      route.contract.moduleId,
      route.binding.databaseAction,
    );
    const readQuery = createPlannedReadQueryPayload(
      route.contract.moduleId,
      route.binding.databaseAction,
    );
    const exportPipeline = createPlannedExportPipelinePayload(
      route.contract.moduleId,
      route.binding.databaseAction,
    );
    const handlerReadiness = createPlannedHandlerReadinessPayload(
      route.contract.resource,
      route.binding.databaseAction,
    );
    const authorization = createPlannedAuthorizationPayload(
      route.contract.resource,
      route.binding.databaseAction,
    );
    const implementationPlan = createPlannedImplementationPlanPayload(
      route.contract.resource,
      route.binding.databaseAction,
    );
    const runtimeContract = createPlannedRuntimeContractPayload(
      route.contract.resource,
      route.binding.databaseAction,
    );
    const liveHandler = createPlannedLiveHandlerPayload(
      route.contract.resource,
      route.binding.databaseAction,
    );

    return {
      moduleId: route.contract.moduleId,
      workspaceId: route.contract.workspaceId,
      resource: route.contract.resource,
      action: route.binding.databaseAction,
      accessAction: route.binding.accessAction,
      endpoint: route.contract.endpoint,
      routeKind: route.contract.routeKind,
      implementationStatus: route.contract.implementationStatus,
      ...(authorization ? { authorization } : {}),
      ...(exportPipeline ? { exportPipeline } : {}),
      ...(handlerReadiness ? { handlerReadiness } : {}),
      ...(implementationPlan ? { implementationPlan } : {}),
      ...(liveHandler ? { liveHandler } : {}),
      ...(readQuery ? { readQuery } : {}),
      ...(runtimeContract ? { runtimeContract } : {}),
      ...(writePipeline ? { writePipeline } : {}),
    };
  }

  const importPlan = getModuleImportPlanByDatabaseAction(request.resource, request.action);
  if (!importPlan) return undefined;

  const authorization = createPlannedAuthorizationPayload(
    importPlan.resource,
    importPlan.databaseAction,
  );
  const handlerReadiness = createPlannedHandlerReadinessPayload(
    importPlan.resource,
    importPlan.databaseAction,
  );
  const implementationPlan = createPlannedImplementationPlanPayload(
    importPlan.resource,
    importPlan.databaseAction,
  );
  const runtimeContract = createPlannedRuntimeContractPayload(
    importPlan.resource,
    importPlan.databaseAction,
  );
  const liveHandler = createPlannedLiveHandlerPayload(
    importPlan.resource,
    importPlan.databaseAction,
  );

  return {
    moduleId: importPlan.moduleId,
    workspaceId: importPlan.workspaceId,
    resource: importPlan.resource,
    action: importPlan.databaseAction,
    accessAction: importPlan.requiredAccessAction,
    endpoint: importPlan.endpoint,
    routeKind: importPlan.routeKind,
    implementationStatus: "planned",
    ...(authorization ? { authorization } : {}),
    ...(handlerReadiness ? { handlerReadiness } : {}),
    ...(implementationPlan ? { implementationPlan } : {}),
    importPipeline: createPlannedImportPipelinePayload(importPlan),
    ...(liveHandler ? { liveHandler } : {}),
    ...(runtimeContract ? { runtimeContract } : {}),
  };
}

export function createPlannedModuleDatabaseActionResponse(
  databaseRequest: DatabaseRequest,
  request?: Request,
) {
  const plannedAction = getPlannedModuleDatabaseAction(databaseRequest);
  if (!plannedAction) return undefined;

  return NextResponse.json(
    {
      error: "Module database action is planned but not implemented yet.",
      code: plannedModuleDatabaseActionCode,
      ...plannedAction,
    },
    { status: 501, headers: corsHeaders(request) },
  );
}
