import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createWorkspaceImplementationRoadmap,
  createWorkspaceReadModelRolloutPlan,
} from "../lib/domain/workspaces/implementationRoadmap";

const testDir = dirname(fileURLToPath(import.meta.url));
const workspacesDoc = readFileSync(resolve(testDir, "..", "docs", "WORKSPACES_ARCHITECTURE.md"), "utf8");
const globalRoadmap = createWorkspaceImplementationRoadmap(undefined, 10);
const globalReadModelRollout = createWorkspaceReadModelRolloutPlan(undefined, 5);

assert.ok(globalRoadmap.totalActions > 0);
assert.equal(globalRoadmap.blockedActions, 0);
assert.equal(globalRoadmap.dependencyIssues, 0);
assert.ok(globalRoadmap.rolloutRule.includes("read-model"));
assert.ok(globalRoadmap.rolloutRule.includes("ready read handlers"));

assert.deepEqual(globalRoadmap.phases.map((phase) => phase.phase), [
  "read-model",
  "export-queue",
  "import-staging",
  "write-workflow",
]);
assert.deepEqual(globalRoadmap.phases.map((phase) => phase.order), [1, 2, 3, 4]);

const readPhase = globalRoadmap.phases.find((phase) => phase.phase === "read-model");
assert.ok(readPhase);
assert.ok(readPhase.totalActions > 0);
assert.equal(readPhase.canStart, true);
assert.ok(readPhase.guardrails.includes("single_nextjs_process"));
assert.ok(readPhase.guardrails.includes("single_database_router"));
assert.ok(readPhase.guardrails.includes("access_matrix_required"));
assert.ok(readPhase.guardrails.includes("server_pagination_required"));

const exportPhase = globalRoadmap.phases.find((phase) => phase.phase === "export-queue");
assert.ok(exportPhase);
assert.ok(exportPhase.guardrails.includes("prepared_or_bounded_export"));

const importPhase = globalRoadmap.phases.find((phase) => phase.phase === "import-staging");
assert.ok(importPhase);
assert.ok(importPhase.guardrails.includes("stored_file_reference_required"));

const writePhase = globalRoadmap.phases.find((phase) => phase.phase === "write-workflow");
assert.ok(writePhase);
assert.ok(writePhase.guardrails.includes("versioned_patch_required"));
assert.ok(writePhase.guardrails.includes("change_history_required"));

assert.ok(globalRoadmap.nextBatch.length > 0);
assert.ok(globalRoadmap.nextBatch.length <= 10);
assert.ok(globalRoadmap.nextBatch.every((action) => action.contractKind === "list" || action.contractKind === "detail" || action.contractKind === "on-demand"));
assert.ok(globalRoadmap.nextBatch.every((action) => action.databaseAction.startsWith("list-") || action.databaseAction.startsWith("get-") || action.databaseAction === "load-ai-context"));
assert.ok(globalRoadmap.nextBatch.every((action) => action.resource !== "reports" || action.databaseAction !== "export-prepared-report"));

assert.equal(globalReadModelRollout.noWriteActions, true);
assert.equal(globalReadModelRollout.noExportActions, true);
assert.equal(globalReadModelRollout.noImportActions, true);
assert.equal(globalReadModelRollout.maxModuleBatchSize, 5);
assert.ok(globalReadModelRollout.totalReadModelActions > 0);
assert.ok(globalReadModelRollout.modules.length > 0);
assert.ok(globalReadModelRollout.modules.length <= 5);
assert.ok(globalReadModelRollout.rule.includes("only read-model"));
assert.ok(globalReadModelRollout.modules.every((module) => module.actions.length > 0));
assert.ok(globalReadModelRollout.modules.every((module) => module.actions.every((action) => (
  action.contractKind === "list" || action.contractKind === "detail" || action.contractKind === "on-demand"
))));
assert.ok(globalReadModelRollout.modules.every((module) => module.actions.every((action) => (
  !action.databaseAction.startsWith("create-")
  && !action.databaseAction.startsWith("patch-")
  && !action.databaseAction.startsWith("export-")
  && !action.databaseAction.startsWith("stage-")
))));
assert.ok(globalReadModelRollout.modules.some((module) => module.hasListAction && module.hasDetailAction));

const taxationRoadmap = createWorkspaceImplementationRoadmap("taxation", 4);
const taxationReadModelRollout = createWorkspaceReadModelRolloutPlan("taxation", 2);
assert.equal(taxationRoadmap.workspaceId, "taxation");
assert.ok(taxationRoadmap.totalActions > 0);
assert.ok(taxationRoadmap.nextBatch.length <= 4);
assert.ok(taxationRoadmap.nextBatch.every((action) => action.workspaceId === "taxation"));
assert.ok(taxationRoadmap.nextBatch.some((action) => action.databaseAction === "list-waybills"));
assert.ok(taxationRoadmap.nextBatch.every((action) => action.sectionScoped));
assert.equal(taxationReadModelRollout.workspaceId, "taxation");
assert.ok(taxationReadModelRollout.modules.length <= 2);
assert.ok(taxationReadModelRollout.modules.every((module) => module.workspaceId === "taxation"));
assert.ok(taxationReadModelRollout.modules.some((module) => (
  module.moduleId === "taxation-waybills"
  && module.hasListAction
  && module.hasDetailAction
)));

assert.match(workspacesDoc, /Stage 2 implementation roadmap/);
assert.match(workspacesDoc, /`lib\/domain\/workspaces\/implementationRoadmap\.ts`/);
assert.match(workspacesDoc, /write-planning counters/);
assert.match(workspacesDoc, /planned write actions separately from live write actions/);
assert.match(workspacesDoc, /`read-model`: connect bounded list\/detail handlers first/);
assert.match(workspacesDoc, /`write-workflow`: enable versioned patch saves/);
assert.match(workspacesDoc, /not a runtime\s+background job/);
assert.match(workspacesDoc, /`createWorkspaceReadModelRolloutPlan`/);
assert.match(workspacesDoc, /bounded `list`\/`detail`\/on-demand handlers before any write, export or import/);
assert.match(workspacesDoc, /no UI edit mode/);
assert.match(workspacesDoc, /`docs\/STAGE_2_READ_MODEL_ROLLOUT\.md`/);
assert.match(workspacesDoc, /`docs\/STAGE_2_WRITE_HANDLER_ROLLOUT\.md`/);
assert.match(workspacesDoc, /`plan:stage2-write-handlers`/);
assert.match(workspacesDoc, /`plan:write-handler-activation`/);
assert.match(workspacesDoc, /`review:write-handler`/);
assert.match(workspacesDoc, /compact write responses inside the shared `\/api\/database` route/);

console.log("Workspace implementation roadmap checks passed");
