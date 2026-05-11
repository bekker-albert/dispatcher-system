import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createStage2FirstReadModelBatch,
  stage2FirstReadModelModuleIds,
} from "../lib/domain/workspaces/implementationRoadmap";
import {
  createStage2FirstReadModelActivationChecklist,
  validateStage2FirstReadModelActivationChecklist,
  type Stage2FirstReadModelActivationChecklist,
} from "../lib/domain/workspaces/stage2ReadModelActivationChecklist";
import { createStage2FirstReadModelActivationSummary } from "../lib/domain/workspaces/stage2ReadModelActivationSummary";

const testDir = dirname(fileURLToPath(import.meta.url));
const rolloutDoc = readFileSync(resolve(testDir, "..", "docs", "STAGE_2_READ_MODEL_ROLLOUT.md"), "utf8");
const implementationRoadmapSource = readFileSync(
  resolve(testDir, "..", "lib", "domain", "workspaces", "implementationRoadmap.ts"),
  "utf8",
);
const activationChecklistSource = readFileSync(
  resolve(testDir, "..", "lib", "domain", "workspaces", "stage2ReadModelActivationChecklist.ts"),
  "utf8",
);
const activationSummarySource = readFileSync(
  resolve(testDir, "..", "lib", "domain", "workspaces", "stage2ReadModelActivationSummary.ts"),
  "utf8",
);
const batch = createStage2FirstReadModelBatch();
const activationChecklist = createStage2FirstReadModelActivationChecklist("stage-2-check");
const activationSummary = createStage2FirstReadModelActivationSummary("stage-2-check");

assert.equal(batch.maxModuleBatchSize, 2);
assert.deepEqual([...stage2FirstReadModelModuleIds], [
  "taxation-waybills",
  "mining-shift-reports",
]);
assert.deepEqual([...batch.moduleIds], [...stage2FirstReadModelModuleIds]);
assert.deepEqual(batch.modules.map((module) => module.moduleId), [...stage2FirstReadModelModuleIds]);
assert.equal(batch.modules.length, 2);

for (const batchModule of batch.modules) {
  assert.equal(batchModule.hasListAction, true, `${batchModule.moduleId} must have a list handler in Stage 2 first batch.`);
  assert.equal(batchModule.hasDetailAction, true, `${batchModule.moduleId} must have a detail handler in Stage 2 first batch.`);
}

assert.deepEqual(batch.actions.map((action) => action.databaseAction).sort(), [
  "get-shift-report",
  "get-waybill",
  "list-shift-reports",
  "list-waybills",
]);
assert.ok(batch.actions.every((action) => action.contractKind === "list" || action.contractKind === "detail"));
assert.ok(batch.actions.every((action) => action.requiredCapability === "view"));
assert.ok(batch.actions.every((action) => action.sectionScoped));
assert.ok(batch.actions.every((action) => (
  !action.databaseAction.startsWith("create-")
  && !action.databaseAction.startsWith("patch-")
  && !action.databaseAction.startsWith("export-")
  && !action.databaseAction.startsWith("stage-")
)));

assert.equal(batch.noWriteActions, true);
assert.equal(batch.noExportActions, true);
assert.equal(batch.noImportActions, true);
assert.equal(batch.requiresAccessMatrix, true);
assert.equal(batch.requiresSectionScope, true);
assert.equal(batch.requiresServerPagination, true);
assert.equal(batch.maxPageSize, 100);
assert.match(batch.rule, /read-model list\/detail handlers only/);

assert.equal(activationChecklist.maxParallelActivations, 1);
assert.equal(activationChecklist.requiresGreenVerifyBeforeEachAction, true);
assert.equal(activationChecklist.items.length, 4);
assert.deepEqual(activationChecklist.items.map((item) => item.databaseAction), [
  "list-waybills",
  "get-waybill",
  "list-shift-reports",
  "get-shift-report",
]);
assert.ok(activationChecklist.items.every((item) => item.verifyCommand === "npm run verify"));
assert.ok(activationChecklist.items.every((item) => item.rollbackPlan === "Remove the live registry key and guarded registration"));
assert.ok(activationChecklist.items.every((item) => item.schemaPreflightCommand.startsWith("npm run check:read-model-schema -- --workspace ")));
assert.ok(activationChecklist.items.every((item) => item.activationPreflightCommand.includes("npm run review:live-handler --")));
assert.ok(activationChecklist.items.every((item) => item.activationPreflightCommand.includes("--requested-by stage-2-check")));
assert.ok(activationChecklist.items.every((item) => item.plannedSmokeRequest.endpoint === "/api/database"));
assert.ok(activationChecklist.items.every((item) => item.plannedSmokeRequest.method === "POST"));
assert.ok(activationChecklist.items.every((item) => item.plannedSmokeRequest.body.resource === item.resource));
assert.ok(activationChecklist.items.every((item) => item.plannedSmokeRequest.body.action === item.databaseAction));
assert.ok(activationChecklist.items.every((item) => item.smokeExpectation.plannedStatus === 501));
assert.ok(activationChecklist.items.every((item) => item.smokeExpectation.plannedCode === "planned_module_database_action"));
assert.ok(activationChecklist.items.every((item) => item.smokeExpectation.plannedLiveHandlerStatus === "planned-only"));
assert.ok(activationChecklist.items.every((item) => item.smokeExpectation.liveStatus === 200));
const shiftReportSmokePayload = activationChecklist.items.find((item) => item.databaseAction === "list-shift-reports")
  ?.plannedSmokeRequest.body.payload as { query?: { filters?: Record<string, unknown> } } | undefined;
assert.equal(
  shiftReportSmokePayload?.query?.filters?.shift,
  "<shift>",
);
assert.deepEqual(validateStage2FirstReadModelActivationChecklist(activationChecklist), []);
const checklistWithoutShift = JSON.parse(JSON.stringify(activationChecklist)) as Stage2FirstReadModelActivationChecklist;
const shiftReportItem = checklistWithoutShift.items.find((item) => item.databaseAction === "list-shift-reports");
const mutableShiftReportPayload = shiftReportItem?.plannedSmokeRequest.body.payload as {
  query?: { filters?: Record<string, unknown> };
} | undefined;
if (mutableShiftReportPayload?.query?.filters) {
  delete mutableShiftReportPayload.query.filters.shift;
}
assert.deepEqual(validateStage2FirstReadModelActivationChecklist(checklistWithoutShift).filter((issue) => (
  issue.databaseAction === "list-shift-reports"
)).map((issue) => [issue.code, issue.field]), [
  ["list_smoke_query_policy_failed", "shift"],
]);
assert.match(activationChecklist.rule, /Activate exactly one Stage 2 read-model action at a time/);

assert.equal(activationSummary.ready, true);
assert.equal(activationSummary.totalActions, 4);
assert.equal(activationSummary.listActions, 2);
assert.equal(activationSummary.detailActions, 2);
assert.equal(activationSummary.issueCount, 0);
assert.deepEqual(activationSummary.moduleIds, [...stage2FirstReadModelModuleIds]);
assert.equal(activationSummary.firstAction?.databaseAction, "list-waybills");
assert.equal(activationSummary.firstAction?.plannedSmokeCode, "planned_module_database_action");
assert.equal(activationSummary.firstAction?.plannedLiveHandlerStatus, "planned-only");

assert.doesNotMatch(implementationRoadmapSource, /review:live-handler/);
assert.doesNotMatch(implementationRoadmapSource, /schemaPreflightCommand/);
assert.doesNotMatch(implementationRoadmapSource, /plannedSmokeRequest/);
assert.match(activationChecklistSource, /createStage2FirstReadModelBatch/);
assert.match(activationChecklistSource, /validateStage2FirstReadModelActivationChecklist/);
assert.match(activationChecklistSource, /schemaPreflightCommand/);
assert.match(activationChecklistSource, /plannedSmokeRequest/);
assert.match(activationChecklistSource, /plannedLiveHandlerStatus: "planned-only"/);
assert.match(activationSummarySource, /createStage2FirstReadModelBatch/);
assert.doesNotMatch(activationSummarySource, /stage2ReadModelActivationChecklist/);
assert.doesNotMatch(activationSummarySource, /createStage2FirstReadModelActivationChecklist/);
assert.doesNotMatch(activationSummarySource, /validateStage2FirstReadModelActivationChecklist/);

assert.match(rolloutDoc, /`createStage2FirstReadModelBatch`/);
assert.match(rolloutDoc, /`createStage2FirstReadModelActivationChecklist`/);
assert.match(rolloutDoc, /`lib\/domain\/workspaces\/stage2ReadModelActivationChecklist\.ts`/);
assert.match(rolloutDoc, /schema preflight,\s+activation preflight, verify, smoke/);
assert.match(rolloutDoc, /maximum of two modules/);
assert.match(rolloutDoc, /no write, export or import actions/);
assert.match(rolloutDoc, /public planned API payload/);
assert.match(rolloutDoc, /must not expose table names/);
assert.match(rolloutDoc, /write pipelines, export pipelines or import pipelines/);

console.log("Stage 2 first read model batch checks passed");
