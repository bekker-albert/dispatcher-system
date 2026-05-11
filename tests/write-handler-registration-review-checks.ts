import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createExpectedWriteImplementationPath,
  isSafeWriteImplementationTarget,
  reviewWriteLiveHandlerRegistrationCandidate,
} from "../lib/server/database/write-handler-registration-review";

const source = readFileSync(resolve("lib/server/database/write-handler-registration-review.ts"), "utf8");

assert.match(source, /reviewModuleHandlerActivation/);
assert.match(source, /getModuleWritePipelinePlan/);
assert.match(source, /createModuleHandlerRuntimeContract/);
assert.match(source, /createWriteReadModelLivePrerequisites/);
assert.match(source, /readModelLivePrerequisites/);
assert.match(source, /liveActivationReady/);
assert.match(source, /read_model_live_prerequisite_missing/);
assert.match(source, /compact_write_response/);
assert.match(source, /implementation_path_invalid/);
assert.match(source, /isAllowedWriteImplementationPath/);
assert.match(source, /export function createExpectedWriteImplementationPath/);
assert.match(source, /expectedImplementationPath/);
assert.match(source, /invalidExpectedWriteImplementationPath/);
assert.match(source, /export function isSafeWriteImplementationTarget/);
assert.match(source, /isSafeImplementationPathSegment/);
assert.match(source, /\^\[a-z0-9\]\[a-z0-9-\]\*\$/);
assert.match(source, /hasPathTraversal/);
assert.match(source, /lib\/server\/database\/handlers\//);
assert.match(source, /endsWith\("\.ts"\)/);
assert.match(source, /normalizedPath === expectedPath/);
assert.match(source, /doesNotRegisterHandler: true/);
assert.doesNotMatch(source, /createLiveModuleDatabaseHandlersFromRegistrations/);

assert.equal(
  createExpectedWriteImplementationPath("taxation", "create-waybill"),
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.equal(
  createExpectedWriteImplementationPath(" taxation ", " create-waybill "),
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.equal(
  createExpectedWriteImplementationPath("../taxation", "create-waybill"),
  "lib/server/database/handlers/__invalid__/__invalid__.ts",
);
assert.equal(
  createExpectedWriteImplementationPath("taxation", "../create-waybill"),
  "lib/server/database/handlers/__invalid__/__invalid__.ts",
);
assert.equal(
  createExpectedWriteImplementationPath("taxation\\unsafe", "create-waybill"),
  "lib/server/database/handlers/__invalid__/__invalid__.ts",
);
assert.equal(
  createExpectedWriteImplementationPath("taxation", "create/waybill"),
  "lib/server/database/handlers/__invalid__/__invalid__.ts",
);
assert.equal(isSafeWriteImplementationTarget("taxation", "create-waybill"), true);
assert.equal(isSafeWriteImplementationTarget("taxation-2", "patch-fuel-period"), true);
assert.equal(isSafeWriteImplementationTarget("../taxation", "create-waybill"), false);
assert.equal(isSafeWriteImplementationTarget("taxation", "create/waybill"), false);
assert.equal(isSafeWriteImplementationTarget("taxation\\unsafe", "create-waybill"), false);
assert.equal(isSafeWriteImplementationTarget("Taxation", "create-waybill"), false);

const readyCreate = reviewWriteLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "create-waybill",
  factoryKind: "create",
  implementationPath: "lib/server/database/handlers/taxation/create-waybill.ts",
  requestedBy: "backend-engineer",
  changeReason: "Connect one bounded create handler after read models and write contracts are green.",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key and return create-waybill to planned-only 501.",
});
assert.equal(readyCreate.ready, true);
assert.equal(readyCreate.liveActivationReady, false);
assert.deepEqual(readyCreate.liveActivationIssues, ["read_model_live_prerequisite_missing"]);
assert.equal(readyCreate.readModelLivePrerequisites.ready, false);
assert.deepEqual(readyCreate.readModelLivePrerequisites.requiredActions.map((action) => (
  [action.databaseAction, action.contractKind, action.liveStatus, action.ready]
)), [
  ["list-waybills", "list", "planned-only", false],
  ["get-waybill", "detail", "planned-only", false],
]);
assert.equal(readyCreate.moduleId, "taxation-waybills");
assert.equal(readyCreate.workspaceId, "taxation");
assert.equal(readyCreate.contractKind, "write");
assert.equal(readyCreate.phase, "write-workflow");
assert.equal(readyCreate.pipelineKind, "create");
assert.equal(readyCreate.expectedFactoryKind, "create");
assert.equal(readyCreate.requestedFactoryKind, "create");
assert.equal(readyCreate.expectedImplementationPath, "lib/server/database/handlers/taxation/create-waybill.ts");
assert.deepEqual(readyCreate.issues, []);
assert.deepEqual(readyCreate.missingRuntimeRequirements, []);
assert.deepEqual(readyCreate.activationIssues, []);
assert.ok(readyCreate.runtimeRequirements.includes("atomic_write_transaction"));
assert.ok(readyCreate.runtimeRequirements.includes("change_history_write"));
assert.ok(readyCreate.runtimeRequirements.includes("post_commit_side_effects_only"));
assert.ok(readyCreate.runtimeRequirements.includes("compact_write_response"));
assert.deepEqual(readyCreate.registrationSummary, {
  resource: "taxation",
  databaseAction: "create-waybill",
  factoryKind: "create",
  implementationPath: "lib/server/database/handlers/taxation/create-waybill.ts",
});
assert.equal(readyCreate.requiresGuardedFactory, true);
assert.equal(readyCreate.requiresSinglePullRequest, true);
assert.equal(readyCreate.noNewProcess, true);
assert.equal(readyCreate.doesNotRegisterHandler, true);

const readyPatch = reviewWriteLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "patch-fuel-period",
  factoryKind: "patch",
  implementationPath: "lib/server/database/handlers/taxation/patch-fuel-period.ts",
  requestedBy: "backend-engineer",
  changeReason: "Connect one bounded patch handler after fuel period read models and write contracts are green.",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key and return patch-fuel-period to planned-only 501.",
});
assert.equal(readyPatch.ready, true);
assert.equal(readyPatch.liveActivationReady, false);
assert.equal(readyPatch.moduleId, "taxation-fuel-periods");
assert.equal(readyPatch.pipelineKind, "patch");
assert.equal(readyPatch.expectedFactoryKind, "patch");

const readyWorkflow = reviewWriteLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "transition-fuel-period",
  factoryKind: "patch",
  implementationPath: "lib/server/database/handlers/taxation/transition-fuel-period.ts",
  requestedBy: "backend-engineer",
  changeReason: "Connect one bounded workflow transition with version checks and compact responses.",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key and return transition-fuel-period to planned-only 501.",
});
assert.equal(readyWorkflow.ready, true);
assert.equal(readyWorkflow.liveActivationReady, false);
assert.equal(readyWorkflow.pipelineKind, "workflow-transition");
assert.equal(readyWorkflow.expectedFactoryKind, "patch");

const wrongFactory = reviewWriteLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "create-waybill",
  factoryKind: "patch",
  implementationPath: "lib/server/database/handlers/taxation/create-waybill.ts",
  requestedBy: "backend-engineer",
  changeReason: "Wrong factory must be blocked.",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key.",
});
assert.equal(wrongFactory.ready, false);
assert.deepEqual(wrongFactory.issues, ["factory_kind_mismatch"]);
assert.equal(wrongFactory.registrationSummary, undefined);

const invalidImplementationPath = reviewWriteLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "create-waybill",
  factoryKind: "create",
  implementationPath: "lib/server/database/module-live-handlers.ts",
  requestedBy: "backend-engineer",
  changeReason: "Wrong implementation path must be blocked.",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key.",
  activationScopeSize: 1,
});
assert.equal(invalidImplementationPath.ready, false);
assert.equal(
  invalidImplementationPath.expectedImplementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.ok(invalidImplementationPath.issues.includes("implementation_path_invalid"));
assert.equal(invalidImplementationPath.registrationSummary, undefined);

const mismatchedImplementationPath = reviewWriteLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "create-waybill",
  factoryKind: "create",
  implementationPath: "lib/server/database/handlers/taxation/patch-waybill.ts",
  requestedBy: "backend-engineer",
  changeReason: "Mismatched write handler path must be blocked.",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key.",
  activationScopeSize: 1,
});
assert.equal(mismatchedImplementationPath.ready, false);
assert.equal(
  mismatchedImplementationPath.expectedImplementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.ok(mismatchedImplementationPath.issues.includes("implementation_path_invalid"));
assert.equal(mismatchedImplementationPath.registrationSummary, undefined);

const traversalImplementationPath = reviewWriteLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "create-waybill",
  factoryKind: "create",
  implementationPath: "lib/server/database/handlers/../module-live-handlers.ts",
  requestedBy: "backend-engineer",
  changeReason: "Path traversal must be blocked.",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key.",
  activationScopeSize: 1,
});
assert.equal(traversalImplementationPath.ready, false);
assert.ok(traversalImplementationPath.issues.includes("implementation_path_invalid"));
assert.equal(traversalImplementationPath.registrationSummary, undefined);

const unsafeTargetSegments = reviewWriteLiveHandlerRegistrationCandidate({
  resource: "../taxation",
  databaseAction: "create-waybill",
  factoryKind: "create",
  implementationPath: "lib/server/database/handlers/__invalid__/__invalid__.ts",
  requestedBy: "backend-engineer",
  changeReason: "Unsafe resource segment must not produce a file path.",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key.",
  activationScopeSize: 1,
});
assert.equal(unsafeTargetSegments.ready, false);
assert.equal(
  unsafeTargetSegments.expectedImplementationPath,
  "lib/server/database/handlers/__invalid__/__invalid__.ts",
);
assert.ok(unsafeTargetSegments.issues.includes("implementation_path_invalid"));
assert.equal(unsafeTargetSegments.registrationSummary, undefined);

const missingActivationMetadata = reviewWriteLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "create-waybill",
  factoryKind: "create",
  implementationPath: "",
  requestedBy: "",
  changeReason: "",
  verificationCommands: ["npm run typecheck"],
  rollbackPlan: "",
  activationScopeSize: 2,
});
assert.equal(missingActivationMetadata.ready, false);
assert.ok(missingActivationMetadata.issues.includes("implementation_path_required"));
assert.ok(missingActivationMetadata.issues.includes("activation_review_blocked"));
assert.deepEqual(missingActivationMetadata.activationIssues, [
  "batch_activation_forbidden",
  "missing_requested_by",
  "missing_change_reason",
  "missing_implementation_path",
  "missing_verify_command",
  "missing_rollback_plan",
]);

const unsupportedReadModel = reviewWriteLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "list-waybills",
  factoryKind: "list",
  implementationPath: "lib/server/database/handlers/taxation/list-waybills.ts",
  requestedBy: "backend-engineer",
  changeReason: "Read models are reviewed by the read-model registration review, not the write review.",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key.",
});
assert.equal(unsupportedReadModel.ready, false);
assert.ok(unsupportedReadModel.issues.includes("unsupported_contract_kind"));
assert.ok(unsupportedReadModel.issues.includes("missing_write_pipeline"));

const unknown = reviewWriteLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "unknown-action",
  factoryKind: "create",
  implementationPath: "lib/server/database/handlers/taxation/unknown.ts",
  requestedBy: "backend-engineer",
  changeReason: "Unknown action must not pass.",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key.",
});
assert.equal(unknown.ready, false);
assert.ok(unknown.issues.includes("missing_implementation_plan"));
assert.ok(unknown.issues.includes("missing_write_pipeline"));
assert.ok(unknown.issues.includes("missing_runtime_requirement"));
assert.ok(unknown.issues.includes("activation_review_blocked"));

console.log("Write handler registration review checks passed");
