import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { reviewModuleHandlerActivation } from "../lib/domain/data-access/moduleHandlerActivation";

const testDir = dirname(fileURLToPath(import.meta.url));
const workspacesDoc = readFileSync(resolve(testDir, "..", "docs", "WORKSPACES_ARCHITECTURE.md"), "utf8");

const readyWaybillActivation = reviewModuleHandlerActivation({
  resource: "taxation",
  databaseAction: "list-waybills",
  requestedBy: "backend-engineer",
  changeReason: "Connect the first bounded taxation read model after contracts are green.",
  implementationPath: "lib/server/database/handlers/taxation/list-waybills.ts",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key and return the action to planned-only 501.",
});
assert.equal(readyWaybillActivation.status, "ready-to-register");
assert.equal(readyWaybillActivation.moduleId, "taxation-waybills");
assert.equal(readyWaybillActivation.workspaceId, "taxation");
assert.equal(readyWaybillActivation.phase, "read-model");
assert.equal(readyWaybillActivation.currentLiveStatus, "planned-only");
assert.equal(readyWaybillActivation.readyToConnectHandler, true);
assert.deepEqual(readyWaybillActivation.issues, []);
assert.equal(readyWaybillActivation.requiresRegistryChange, true);
assert.equal(readyWaybillActivation.requiresSinglePullRequest, true);
assert.equal(readyWaybillActivation.noNewProcess, true);
assert.deepEqual(readyWaybillActivation.nextRegistryEntry, {
  resource: "taxation",
  databaseAction: "list-waybills",
});
assert.ok(readyWaybillActivation.runtimeRequirements.includes("single_database_router_dispatch"));
assert.ok(readyWaybillActivation.runtimeRequirements.includes("authorization_before_handler"));
assert.ok(readyWaybillActivation.runtimeRequirements.includes("server_query_policy_assertion"));
assert.ok(readyWaybillActivation.runtimeRequirements.includes("public_read_model_response_envelope"));
assert.ok(readyWaybillActivation.runtimeRequirements.includes("list_result_page_limit"));

const readyWaybillCreateActivation = reviewModuleHandlerActivation({
  resource: "taxation",
  databaseAction: "create-waybill",
  requestedBy: "backend-engineer",
  changeReason: "Connect one bounded create handler after read model and write contracts are green.",
  implementationPath: "lib/server/database/handlers/taxation/create-waybill.ts",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key and return the action to planned-only 501.",
});
assert.equal(readyWaybillCreateActivation.status, "ready-to-register");
assert.equal(readyWaybillCreateActivation.phase, "write-workflow");
assert.ok(readyWaybillCreateActivation.runtimeRequirements.includes("atomic_write_transaction"));
assert.ok(readyWaybillCreateActivation.runtimeRequirements.includes("change_history_write"));
assert.ok(readyWaybillCreateActivation.runtimeRequirements.includes("post_commit_side_effects_only"));
assert.ok(readyWaybillCreateActivation.runtimeRequirements.includes("compact_write_response"));
assert.equal(readyWaybillCreateActivation.requiresSinglePullRequest, true);
assert.equal(readyWaybillCreateActivation.noNewProcess, true);

const incompleteActivation = reviewModuleHandlerActivation({
  resource: "taxation",
  databaseAction: "list-waybills",
  requestedBy: "",
  changeReason: "",
  implementationPath: "",
  verificationCommands: ["npm run typecheck"],
  rollbackPlan: "",
});
assert.equal(incompleteActivation.status, "blocked");
assert.equal(incompleteActivation.requiresRegistryChange, false);
assert.deepEqual(incompleteActivation.issues, [
  "missing_requested_by",
  "missing_change_reason",
  "missing_implementation_path",
  "missing_verify_command",
  "missing_rollback_plan",
]);

const alreadyLiveActivation = reviewModuleHandlerActivation({
  resource: "taxation",
  databaseAction: "list-waybills",
  requestedBy: "backend-engineer",
  changeReason: "Duplicate activation must not pass.",
  implementationPath: "lib/server/database/handlers/taxation/list-waybills.ts",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key.",
}, [{
  resource: "taxation",
  databaseAction: "list-waybills",
}]);
assert.equal(alreadyLiveActivation.status, "blocked");
assert.deepEqual(alreadyLiveActivation.issues, ["already_live"]);

const unknownActivation = reviewModuleHandlerActivation({
  resource: "taxation",
  databaseAction: "unknown-action",
  requestedBy: "backend-engineer",
  changeReason: "Unknown action must be registered in moduleDataRoutes first.",
  implementationPath: "lib/server/database/handlers/taxation/unknown.ts",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the unregistered handler.",
});
assert.equal(unknownActivation.status, "blocked");
assert.ok(unknownActivation.issues.includes("unknown_handler"));
assert.ok(unknownActivation.issues.includes("implementation_gate_blocked"));
assert.ok(unknownActivation.issues.includes("runtime_contract_missing"));

const batchActivation = reviewModuleHandlerActivation({
  resource: "taxation",
  databaseAction: "list-waybills",
  requestedBy: "backend-engineer",
  changeReason: "Batch activation is intentionally blocked.",
  implementationPath: "lib/server/database/handlers/taxation/list-waybills.ts",
  verificationCommands: ["npm run verify"],
  rollbackPlan: "Remove the live registry key.",
  activationScopeSize: 2,
});
assert.equal(batchActivation.status, "blocked");
assert.deepEqual(batchActivation.issues, ["batch_activation_forbidden"]);

assert.match(workspacesDoc, /Live handler activation runbook/);
assert.match(workspacesDoc, /`reviewModuleHandlerActivation`/);
assert.match(workspacesDoc, /`verificationCommands` containing `npm run verify`/);
assert.match(workspacesDoc, /`activationScopeSize` equal to `1`/);
assert.match(workspacesDoc, /returning the action to the `planned-only` 501 response/);

console.log("Module handler activation checks passed");
