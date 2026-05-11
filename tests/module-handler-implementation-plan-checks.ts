import assert from "node:assert/strict";
import { listModuleHandlerReadiness } from "../lib/domain/data-access/moduleHandlerReadiness";
import {
  evaluateModuleHandlerImplementationGate,
  evaluateModuleHandlerImplementationDependencies,
  getModuleHandlerImplementationPlanEntry,
  getModuleHandlerImplementationBlockers,
  getModuleHandlerImplementationDependencyIssues,
  getNextModuleHandlerImplementationBatch,
  listModuleHandlerImplementationPlan,
  type ModuleHandlerImplementationPlanEntry,
} from "../lib/domain/data-access/moduleHandlerImplementationPlan";

const globalPlan = listModuleHandlerImplementationPlan();
const readiness = listModuleHandlerReadiness();

assert.equal(globalPlan.length, readiness.length);
assert.deepEqual(getModuleHandlerImplementationBlockers(), []);
assert.deepEqual(getModuleHandlerImplementationDependencyIssues(), []);

const firstWriteIndex = globalPlan.findIndex((entry) => entry.phase === "write-workflow");
const lastReadIndex = globalPlan.findLastIndex((entry) => entry.phase === "read-model");
assert.ok(firstWriteIndex > -1);
assert.ok(lastReadIndex > -1);
assert.ok(lastReadIndex < firstWriteIndex);

const firstExportIndex = globalPlan.findIndex((entry) => entry.phase === "export-queue");
const lastWriteIndex = globalPlan.findLastIndex((entry) => entry.phase === "write-workflow");
assert.ok(firstExportIndex > -1);
assert.ok(lastWriteIndex > -1);
assert.ok(firstExportIndex < lastWriteIndex);

const nextBatch = getNextModuleHandlerImplementationBatch(undefined, 12);
assert.ok(nextBatch.length > 0);
assert.ok(nextBatch.every((entry) => entry.phase === "read-model"));
assert.ok(nextBatch.every((entry) => entry.dependsOnReadHandlers === false));
assert.ok(nextBatch.every((entry) => entry.guardrails.includes("single_nextjs_process")));
assert.ok(nextBatch.every((entry) => entry.guardrails.includes("single_database_router")));

const taxationBatch = getNextModuleHandlerImplementationBatch("taxation", 4);
assert.ok(taxationBatch.length > 0);
assert.ok(taxationBatch.every((entry) => entry.workspaceId === "taxation"));
assert.ok(taxationBatch.every((entry) => entry.phase === "read-model"));

const waybillList = globalPlan.find((entry) => entry.databaseAction === "list-waybills");
assert.ok(waybillList);
assert.deepEqual(getModuleHandlerImplementationPlanEntry("taxation", "list-waybills"), waybillList);
assert.equal(waybillList.phase, "read-model");
assert.equal(waybillList.order, 1);
assert.equal(waybillList.requiredCapability, "view");
assert.equal(waybillList.sectionScoped, true);
assert.equal(waybillList.dependsOnReadHandlers, false);
assert.ok(waybillList.guardrails.includes("server_pagination_required"));
assert.ok(waybillList.guardrails.includes("section_scope_required"));
assert.deepEqual(evaluateModuleHandlerImplementationGate("taxation", "list-waybills"), {
  resource: "taxation",
  databaseAction: "list-waybills",
  readyToConnectHandler: true,
  moduleId: "taxation-waybills",
  workspaceId: "taxation",
  phase: "read-model",
  order: 1,
  dependsOnReadHandlers: false,
  guardrails: [
    "single_nextjs_process",
    "single_database_router",
    "access_matrix_required",
    "section_scope_required",
    "server_pagination_required",
  ],
  issues: [],
});

const waybillExport = globalPlan.find((entry) => entry.databaseAction === "export-waybills");
assert.ok(waybillExport);
assert.equal(waybillExport.phase, "export-queue");
assert.equal(waybillExport.dependsOnReadHandlers, true);
assert.ok(waybillExport.guardrails.includes("prepared_or_bounded_export"));

const shiftImport = globalPlan.find((entry) => entry.databaseAction === "stage-shift-report-import");
assert.ok(shiftImport);
assert.equal(shiftImport.phase, "import-staging");
assert.equal(shiftImport.dependsOnReadHandlers, true);
assert.ok(shiftImport.guardrails.includes("stored_file_reference_required"));

const waybillCreate = globalPlan.find((entry) => entry.databaseAction === "create-waybill");
assert.ok(waybillCreate);
assert.equal(waybillCreate.phase, "write-workflow");
assert.equal(waybillCreate.dependsOnReadHandlers, true);
assert.ok(waybillCreate.guardrails.includes("versioned_patch_required"));
assert.ok(waybillCreate.guardrails.includes("change_history_required"));

const aiContext = globalPlan.find((entry) => entry.databaseAction === "load-ai-context");
assert.ok(aiContext);
assert.equal(aiContext.phase, "read-model");
assert.equal(aiContext.contractKind, "on-demand");
assert.equal(aiContext.sectionScoped, false);
assert.equal(aiContext.guardrails.includes("server_pagination_required"), false);

const orphanWrite: ModuleHandlerImplementationPlanEntry = {
  moduleId: "future-write-only",
  workspaceId: "taxation",
  resource: "taxation",
  databaseAction: "patch-future-write-only",
  contractKind: "write",
  phase: "write-workflow",
  order: 4,
  implementationReady: true,
  dependsOnReadHandlers: true,
  requiredCapability: "edit",
  sectionScoped: true,
  guardrails: ["single_nextjs_process", "single_database_router"],
};
assert.deepEqual(evaluateModuleHandlerImplementationDependencies([orphanWrite]), [{
  moduleId: "future-write-only",
  workspaceId: "taxation",
  resource: "taxation",
  databaseAction: "patch-future-write-only",
  phase: "write-workflow",
  code: "missing_ready_read_model",
}]);
assert.deepEqual(evaluateModuleHandlerImplementationGate(
  "taxation",
  "patch-future-write-only",
  [orphanWrite],
).issues, ["missing_ready_read_model"]);
assert.equal(evaluateModuleHandlerImplementationGate(
  "taxation",
  "patch-future-write-only",
  [orphanWrite],
).readyToConnectHandler, false);

assert.deepEqual(evaluateModuleHandlerImplementationDependencies([
  {
    ...orphanWrite,
    databaseAction: "list-future-write-only",
    contractKind: "list",
    phase: "read-model",
    order: 1,
    dependsOnReadHandlers: false,
  },
  orphanWrite,
]), []);
assert.deepEqual(evaluateModuleHandlerImplementationGate("taxation", "unknown-action"), {
  resource: "taxation",
  databaseAction: "unknown-action",
  readyToConnectHandler: false,
  issues: ["missing_implementation_plan"],
});

console.log("Module handler implementation plan checks passed");
