import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getModuleDataRouteActionBinding,
  getModuleDataRouteContractByDatabaseAction,
  listModuleDataRouteActionBindings,
} from "../lib/domain/data-access/moduleDataRoutes";
import { moduleCreateMutationPlans } from "../lib/domain/data-access/moduleCreateMutationPlans";
import { moduleDetailQueryPlans } from "../lib/domain/data-access/moduleDetailQueryPlans";
import { moduleExportPlans } from "../lib/domain/data-access/moduleExportPlans";
import { moduleImportPlans } from "../lib/domain/data-access/moduleImportPlans";
import { moduleListQueryPlans } from "../lib/domain/data-access/moduleListQueryPlans";
import { modulePatchMutationPlans } from "../lib/domain/data-access/modulePatchMutationPlans";
import { createStage2FirstReadModelBatch } from "../lib/domain/workspaces/implementationRoadmap";
import { createDatabasePostHandler } from "../lib/server/database/router";
import {
  createPlannedModuleDatabaseActionResponse,
  getPlannedModuleDatabaseAction,
  plannedModuleDatabaseActionCode,
} from "../lib/server/database/planned-module-actions";

const testDir = dirname(fileURLToPath(import.meta.url));
const databaseRouterSource = readFileSync(resolve(testDir, "../lib/server/database/router.ts"), "utf8");

process.env.AUTH_REQUIRED = "false";

function collectObjectKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectObjectKeys);

  return Object.entries(value).flatMap(([key, childValue]) => [
    key,
    ...collectObjectKeys(childValue),
  ]);
}

function collectPlannedActions() {
  const routeActions = listModuleDataRouteActionBindings().flatMap((binding) => {
    const plannedAction = getPlannedModuleDatabaseAction({
      resource: binding.resource,
      action: binding.databaseAction,
    });

    return plannedAction ? [plannedAction] : [];
  });
  const importActions = moduleImportPlans.flatMap((plan) => {
    const plannedAction = getPlannedModuleDatabaseAction({
      resource: plan.resource,
      action: plan.databaseAction,
    });

    return plannedAction ? [plannedAction] : [];
  });

  return [...routeActions, ...importActions];
}

assert.match(databaseRouterSource, /tryHandleLiveModuleDatabaseAction\(body, request, jsonForRequest\)/);
assert.match(databaseRouterSource, /createPlannedModuleDatabaseActionResponse\(body, request\)/);
assert.ok(
  databaseRouterSource.indexOf("tryHandleLiveModuleDatabaseAction(body, request, jsonForRequest)")
  < databaseRouterSource.indexOf("createPlannedModuleDatabaseActionResponse(body, request)"),
);

const waybillBinding = getModuleDataRouteActionBinding("taxation", "list-waybills");
assert.ok(waybillBinding);
assert.equal(waybillBinding.moduleId, "taxation-waybills");
assert.equal(waybillBinding.accessAction, "list");

const waybillRoute = getModuleDataRouteContractByDatabaseAction("taxation", "list-waybills");
assert.ok(waybillRoute);
assert.equal(waybillRoute.contract.moduleId, "taxation-waybills");
assert.equal(waybillRoute.contract.implementationStatus, "planned");

const plannedWaybillAction = getPlannedModuleDatabaseAction({
  resource: "taxation",
  action: "list-waybills",
});
assert.ok(plannedWaybillAction);
assert.equal(plannedWaybillAction.moduleId, "taxation-waybills");
assert.equal(plannedWaybillAction.workspaceId, "taxation");
assert.equal(plannedWaybillAction.resource, "taxation");
assert.equal(plannedWaybillAction.action, "list-waybills");
assert.equal(plannedWaybillAction.accessAction, "list");
assert.equal(plannedWaybillAction.endpoint, "/api/database");
assert.equal(plannedWaybillAction.routeKind, "single-database-router");
assert.equal(plannedWaybillAction.implementationStatus, "planned");
assert.equal(plannedWaybillAction.authorization?.requiredCapability, "view");
assert.equal(plannedWaybillAction.authorization?.sectionScoped, true);
assert.equal(plannedWaybillAction.authorization?.requiresAccessMatrix, true);
assert.ok(plannedWaybillAction.authorization?.acceptedSectionScopeKeys.includes("scope.sectionId"));
assert.ok(plannedWaybillAction.authorization?.acceptedSectionScopeKeys.includes("query.filters.section_id"));
assert.equal(plannedWaybillAction.handlerReadiness?.contractKind, "list");
assert.equal(plannedWaybillAction.handlerReadiness?.implementationReady, true);
assert.equal(plannedWaybillAction.handlerReadiness?.hasAuthorizationRequirement, true);
assert.equal(plannedWaybillAction.handlerReadiness?.hasRequiredHandlerContract, true);
assert.deepEqual(plannedWaybillAction.handlerReadiness?.issues, []);
assert.equal(plannedWaybillAction.implementationPlan?.phase, "read-model");
assert.equal(plannedWaybillAction.implementationPlan?.order, 1);
assert.equal(plannedWaybillAction.implementationPlan?.dependsOnReadHandlers, false);
assert.equal(plannedWaybillAction.implementationPlan?.readyToConnectHandler, true);
assert.deepEqual(plannedWaybillAction.implementationPlan?.issues, []);
assert.ok(plannedWaybillAction.implementationPlan?.guardrails.includes("server_pagination_required"));
assert.equal(plannedWaybillAction.runtimeContract?.readyToConnectHandler, true);
assert.ok(plannedWaybillAction.runtimeContract?.requirements.includes("authorization_before_handler"));
assert.ok(plannedWaybillAction.runtimeContract?.requirements.includes("server_query_policy_assertion"));
assert.ok(plannedWaybillAction.runtimeContract?.requirements.includes("public_read_model_response_envelope"));
assert.ok(plannedWaybillAction.runtimeContract?.requirements.includes("list_result_page_limit"));
assert.equal(plannedWaybillAction.liveHandler?.status, "planned-only");
assert.equal(plannedWaybillAction.liveHandler?.readyToConnectHandler, true);
assert.deepEqual(plannedWaybillAction.liveHandler?.activationIssues, []);
assert.equal(plannedWaybillAction.readQuery?.queryKind, "list");
if (plannedWaybillAction.readQuery?.queryKind !== "list") {
  throw new Error("Expected list read query contract for planned waybill list.");
}
assert.equal(plannedWaybillAction.readQuery.serverPaginated, true);
assert.equal(plannedWaybillAction.readQuery.maxPageSize, 100);
assert.deepEqual(plannedWaybillAction.readQuery.requiredFilters, ["date", "section_id", "status"]);
assert.ok(plannedWaybillAction.readQuery.filterKeys.includes("driver_id"));
assert.ok(plannedWaybillAction.readQuery.sortFields.includes("vehicle"));
assert.equal(plannedWaybillAction.readQuery.noClientFullScan, true);

const plannedGetWaybillAction = getPlannedModuleDatabaseAction({
  resource: "taxation",
  action: "get-waybill",
});
assert.equal(plannedGetWaybillAction?.readQuery?.queryKind, "detail");
if (plannedGetWaybillAction?.readQuery?.queryKind !== "detail") {
  throw new Error("Expected detail read query contract for planned waybill detail.");
}
assert.equal(plannedGetWaybillAction.readQuery.requiresId, true);
assert.equal(plannedGetWaybillAction.readQuery.maxRows, 1);
assert.equal(plannedGetWaybillAction.readQuery.returnsVersion, true);
assert.ok(plannedGetWaybillAction.readQuery.scopeFilterKeys.includes("vehicle_id"));

const plannedShiftImportAction = getPlannedModuleDatabaseAction({
  resource: "dispatch",
  action: "stage-shift-report-import",
});
assert.ok(plannedShiftImportAction);
assert.equal(plannedShiftImportAction.moduleId, "mining-shift-reports");
assert.equal(plannedShiftImportAction.workspaceId, "mining-dispatch");
assert.equal(plannedShiftImportAction.resource, "dispatch");
assert.equal(plannedShiftImportAction.action, "stage-shift-report-import");
assert.equal(plannedShiftImportAction.accessAction, "edit");
assert.equal(plannedShiftImportAction.endpoint, "/api/database");
assert.equal(plannedShiftImportAction.routeKind, "single-database-router");
assert.equal(plannedShiftImportAction.implementationStatus, "planned");
assert.equal(plannedShiftImportAction.authorization?.requiredCapability, "edit");
assert.equal(plannedShiftImportAction.authorization?.sectionScoped, true);
assert.equal(plannedShiftImportAction.handlerReadiness?.contractKind, "import");
assert.equal(plannedShiftImportAction.handlerReadiness?.implementationReady, true);
assert.equal(plannedShiftImportAction.handlerReadiness?.hasAuthorizationRequirement, true);
assert.equal(plannedShiftImportAction.handlerReadiness?.hasRequiredHandlerContract, true);
assert.equal(plannedShiftImportAction.implementationPlan?.phase, "import-staging");
assert.equal(plannedShiftImportAction.implementationPlan?.dependsOnReadHandlers, true);
assert.equal(plannedShiftImportAction.implementationPlan?.readyToConnectHandler, true);
assert.ok(plannedShiftImportAction.implementationPlan?.guardrails.includes("stored_file_reference_required"));
assert.ok(plannedShiftImportAction.runtimeContract?.requirements.includes("stored_import_file_reference"));
assert.ok(plannedShiftImportAction.runtimeContract?.requirements.includes("staged_import_validation"));
assert.ok(plannedShiftImportAction.importPipeline);
assert.equal(plannedShiftImportAction.importPipeline.sourceKind, "legacy-excel");
assert.deepEqual(plannedShiftImportAction.importPipeline.allowedFormats, ["xlsx", "csv"]);
assert.equal(plannedShiftImportAction.importPipeline.maxRows, 1000);
assert.equal(plannedShiftImportAction.importPipeline.previewRowLimit, 50);
assert.equal(plannedShiftImportAction.importPipeline.issuePageSize, 50);
assert.equal(plannedShiftImportAction.importPipeline.requiresStoredFileReference, true);
assert.equal(plannedShiftImportAction.importPipeline.requiresStagedValidation, true);
assert.equal(plannedShiftImportAction.importPipeline.returnsValidationSummaryOnly, true);
assert.equal(plannedShiftImportAction.importPipeline.persistsAcceptedRowsIndividually, true);
assert.equal(plannedShiftImportAction.importPipeline.forbidsWholeTableReplacement, true);

assert.equal(getPlannedModuleDatabaseAction({ resource: "pto", action: "load" }), undefined);

const plannedCreateWaybillAction = getPlannedModuleDatabaseAction({
  resource: "taxation",
  action: "create-waybill",
});
assert.ok(plannedCreateWaybillAction?.writePipeline);
assert.equal(plannedCreateWaybillAction.handlerReadiness?.contractKind, "write");
assert.equal(plannedCreateWaybillAction.handlerReadiness?.implementationReady, true);
assert.equal(plannedCreateWaybillAction.implementationPlan?.phase, "write-workflow");
assert.equal(plannedCreateWaybillAction.implementationPlan?.dependsOnReadHandlers, true);
assert.equal(plannedCreateWaybillAction.implementationPlan?.readyToConnectHandler, true);
assert.ok(plannedCreateWaybillAction.runtimeContract?.requirements.includes("atomic_write_transaction"));
assert.ok(plannedCreateWaybillAction.runtimeContract?.requirements.includes("change_history_write"));
assert.ok(plannedCreateWaybillAction.runtimeContract?.requirements.includes("compact_write_response"));
assert.equal(plannedCreateWaybillAction.writePipeline.pipelineKind, "create");
assert.equal(plannedCreateWaybillAction.writePipeline.requiresExpectedVersion, false);
assert.equal(plannedCreateWaybillAction.writePipeline.requiresDuplicateCheck, true);
assert.equal(plannedCreateWaybillAction.writePipeline.requiresAtomicTransaction, true);
assert.equal(plannedCreateWaybillAction.writePipeline.requiresChangeHistory, true);
assert.equal(plannedCreateWaybillAction.writePipeline.maxEntityRowWrites, 1);
assert.equal(plannedCreateWaybillAction.writePipeline.noInlineReportRecalculation, true);

const plannedPatchFuelPeriodAction = getPlannedModuleDatabaseAction({
  resource: "taxation",
  action: "patch-fuel-period",
});
assert.ok(plannedPatchFuelPeriodAction?.writePipeline);
assert.equal(plannedPatchFuelPeriodAction.writePipeline.pipelineKind, "patch");
assert.equal(plannedPatchFuelPeriodAction.writePipeline.requiresExpectedVersion, true);
assert.equal(plannedPatchFuelPeriodAction.writePipeline.queuesAggregateRefresh, true);

const plannedWaybillExportAction = getPlannedModuleDatabaseAction({
  resource: "taxation",
  action: "export-waybills",
});
assert.ok(plannedWaybillExportAction?.exportPipeline);
assert.equal(plannedWaybillExportAction.exportPipeline.sourceKind, "bounded-list-query");
assert.deepEqual(plannedWaybillExportAction.exportPipeline.allowedFormats, ["xlsx", "pdf", "csv"]);
assert.deepEqual(plannedWaybillExportAction.exportPipeline.requiredFilters, ["date", "section_id", "shift", "status"]);
assert.equal(plannedWaybillExportAction.exportPipeline.maxDateRangeDays, 31);
assert.equal(plannedWaybillExportAction.exportPipeline.maxRowsPerExport, 5000);
assert.equal(plannedWaybillExportAction.exportPipeline.createsQueuedRequest, true);
assert.equal(plannedWaybillExportAction.exportPipeline.storesFileByReference, true);
assert.equal(plannedWaybillExportAction.exportPipeline.forbidsInlineFileContent, true);

const plannedActionPayloads = collectPlannedActions();
const forbiddenPublicKeys = new Set([
  "changeHistoryEntity",
  "createdAtColumn",
  "createdByColumn",
  "exportRequestEntity",
  "filterColumns",
  "idColumn",
  "importBatchEntity",
  "scopeColumns",
  "searchColumns",
  "selectColumns",
  "sortColumns",
  "statusColumn",
  "tableName",
  "updatedAtColumn",
  "updatedByColumn",
  "versionColumn",
]);
const plannedActionKeys = new Set(plannedActionPayloads.flatMap(collectObjectKeys));
for (const forbiddenKey of forbiddenPublicKeys) {
  assert.equal(plannedActionKeys.has(forbiddenKey), false, `planned payload leaks ${forbiddenKey}`);
}

const internalTableNames = new Set([
  ...moduleListQueryPlans.map((plan) => plan.tableName),
  ...moduleDetailQueryPlans.map((plan) => plan.tableName),
  ...moduleCreateMutationPlans.map((plan) => plan.tableName),
  ...modulePatchMutationPlans.map((plan) => plan.tableName),
  ...modulePatchMutationPlans.map((plan) => plan.changeHistoryEntity),
  ...moduleImportPlans.map((plan) => plan.importBatchEntity),
  ...moduleExportPlans.map((plan) => plan.exportRequestEntity),
]);
const plannedActionJson = JSON.stringify(plannedActionPayloads);
for (const tableName of internalTableNames) {
  assert.equal(plannedActionJson.includes(tableName), false, `planned payload leaks ${tableName}`);
}

const stage2FirstBatch = createStage2FirstReadModelBatch();
assert.equal(stage2FirstBatch.actions.length, 4);
for (const batchAction of stage2FirstBatch.actions) {
  const plannedAction = getPlannedModuleDatabaseAction({
    resource: batchAction.resource,
    action: batchAction.databaseAction,
  });
  assert.ok(plannedAction, `${batchAction.resource}/${batchAction.databaseAction} must have a planned public contract.`);
  assert.equal(plannedAction.moduleId, batchAction.moduleId);
  assert.equal(plannedAction.workspaceId, batchAction.workspaceId);
  assert.equal(plannedAction.implementationStatus, "planned");
  assert.equal(plannedAction.authorization?.requiredCapability, "view");
  assert.equal(plannedAction.authorization?.sectionScoped, true);
  assert.equal(plannedAction.authorization?.requiresAccessMatrix, true);
  assert.equal(plannedAction.handlerReadiness?.implementationReady, true);
  assert.equal(plannedAction.implementationPlan?.phase, "read-model");
  assert.equal(plannedAction.implementationPlan?.dependsOnReadHandlers, false);
  assert.equal(plannedAction.liveHandler?.status, "planned-only");
  assert.equal(plannedAction.runtimeContract?.readyToConnectHandler, true);
  assert.ok(plannedAction.readQuery);
  assert.equal("writePipeline" in plannedAction, false);
  assert.equal("exportPipeline" in plannedAction, false);
  assert.equal("importPipeline" in plannedAction, false);
  assert.equal(JSON.stringify(plannedAction).includes("tableName"), false);
}

const directResponse = createPlannedModuleDatabaseActionResponse({
  resource: "taxation",
  action: "list-waybills",
}, new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { origin: "https://aam-dispatch.kz" },
}));
assert.ok(directResponse);
assert.equal(directResponse.status, 501);
assert.equal(directResponse.headers.get("Access-Control-Allow-Origin"), "https://aam-dispatch.kz");
assert.equal((await directResponse.json()).code, plannedModuleDatabaseActionCode);

const plannedPost = createDatabasePostHandler({});
const plannedResponse = await plannedPost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    origin: "https://aam-dispatch.kz",
  },
  body: JSON.stringify({
    resource: "taxation",
    action: "list-waybills",
    payload: { scope: { sectionId: "baktai" } },
  }),
}));
assert.equal(plannedResponse.status, 501);
const plannedBody = await plannedResponse.json();
assert.equal(plannedBody.code, plannedModuleDatabaseActionCode);
assert.equal(plannedBody.moduleId, "taxation-waybills");
assert.equal(plannedBody.workspaceId, "taxation");
assert.equal(plannedBody.authorization.requiredCapability, "view");
assert.equal(plannedBody.authorization.sectionScoped, true);
assert.equal(plannedBody.handlerReadiness.contractKind, "list");
assert.equal(plannedBody.handlerReadiness.implementationReady, true);
assert.equal(plannedBody.implementationPlan.phase, "read-model");
assert.equal(plannedBody.implementationPlan.dependsOnReadHandlers, false);
assert.equal(plannedBody.implementationPlan.readyToConnectHandler, true);
assert.equal(plannedBody.runtimeContract.readyToConnectHandler, true);
assert.ok(plannedBody.runtimeContract.requirements.includes("public_read_model_response_envelope"));
assert.ok(plannedBody.runtimeContract.requirements.includes("list_result_page_limit"));
assert.equal(plannedBody.liveHandler.status, "planned-only");
assert.equal(plannedBody.liveHandler.readyToConnectHandler, true);
assert.deepEqual(plannedBody.liveHandler.activationIssues, []);
assert.equal(plannedBody.readQuery.queryKind, "list");
assert.equal(plannedBody.readQuery.serverPaginated, true);
assert.equal(plannedBody.readQuery.noClientFullScan, true);

const plannedImportResponse = await plannedPost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    origin: "https://aam-dispatch.kz",
  },
  body: JSON.stringify({
    resource: "dispatch",
    action: "stage-shift-report-import",
    payload: { scope: { sectionId: "baktay" } },
  }),
}));
assert.equal(plannedImportResponse.status, 501);
const plannedImportBody = await plannedImportResponse.json();
assert.equal(plannedImportBody.code, plannedModuleDatabaseActionCode);
assert.equal(plannedImportBody.moduleId, "mining-shift-reports");
assert.equal(plannedImportBody.accessAction, "edit");
assert.equal(plannedImportBody.authorization.requiredCapability, "edit");
assert.equal(plannedImportBody.authorization.sectionScoped, true);
assert.equal(plannedImportBody.handlerReadiness.contractKind, "import");
assert.equal(plannedImportBody.handlerReadiness.implementationReady, true);
assert.equal(plannedImportBody.implementationPlan.phase, "import-staging");
assert.equal(plannedImportBody.implementationPlan.dependsOnReadHandlers, true);
assert.equal(plannedImportBody.implementationPlan.readyToConnectHandler, true);
assert.ok(plannedImportBody.runtimeContract.requirements.includes("stored_import_file_reference"));
assert.equal(plannedImportBody.liveHandler.status, "planned-only");
assert.equal(plannedImportBody.liveHandler.readyToConnectHandler, true);
assert.deepEqual(plannedImportBody.liveHandler.activationIssues, []);
assert.equal(plannedImportBody.importPipeline.requiresStoredFileReference, true);
assert.equal(plannedImportBody.importPipeline.previewRowLimit, 50);
assert.equal(plannedImportBody.importPipeline.forbidsWholeTableReplacement, true);

const rejectedPlannedCreate = await plannedPost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    origin: "https://evil.example",
  },
  body: JSON.stringify({
    resource: "taxation",
    action: "create-waybill",
    payload: { scope: { sectionId: "baktai" } },
  }),
}));
assert.equal(rejectedPlannedCreate.status, 403);

const unknownResponse = await plannedPost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    origin: "https://aam-dispatch.kz",
  },
  body: JSON.stringify({ resource: "unknown", action: "unknown" }),
}));
assert.equal(unknownResponse.status, 400);

console.log("Planned module database actions checks passed");
