import assert from "node:assert/strict";
import {
  getModuleLiveHandlerRegistryIssues,
  getModuleLiveHandlerStatus,
  listConfiguredLiveModuleHandlerKeys,
  listModuleLiveHandlerRegistry,
} from "../lib/domain/data-access/moduleLiveHandlerRegistry";
import { listModuleHandlerImplementationPlan } from "../lib/domain/data-access/moduleHandlerImplementationPlan";

const registry = listModuleLiveHandlerRegistry();
const implementationPlan = listModuleHandlerImplementationPlan();
assert.equal(registry.length, implementationPlan.length);
assert.ok(registry.length > 0);
assert.deepEqual(listConfiguredLiveModuleHandlerKeys(), []);
assert.ok(registry.every((entry) => entry.status === "planned-only"));
assert.ok(registry.every((entry) => entry.activationIssues.length === 0));
assert.ok(registry.every((entry) => entry.readyToConnectHandler));
assert.ok(registry.every((entry) => (
  entry.runtimeRequirements.includes("single_database_router_dispatch")
  && entry.runtimeRequirements.includes("authorization_before_handler")
)));

const plannedWaybillList = getModuleLiveHandlerStatus("taxation", "list-waybills");
assert.ok(plannedWaybillList);
assert.equal(plannedWaybillList.moduleId, "taxation-waybills");
assert.equal(plannedWaybillList.workspaceId, "taxation");
assert.equal(plannedWaybillList.phase, "read-model");
assert.equal(plannedWaybillList.status, "planned-only");
assert.equal(plannedWaybillList.readyToConnectHandler, true);
assert.ok(plannedWaybillList.runtimeRequirements.includes("server_query_policy_assertion"));
assert.ok(plannedWaybillList.runtimeRequirements.includes("public_read_model_response_envelope"));
assert.ok(plannedWaybillList.runtimeRequirements.includes("list_result_page_limit"));

const liveWaybillList = getModuleLiveHandlerStatus("taxation", "list-waybills", [{
  resource: "taxation",
  databaseAction: "list-waybills",
}]);
assert.ok(liveWaybillList);
assert.equal(liveWaybillList.status, "live");
assert.deepEqual(liveWaybillList.activationIssues, []);

assert.equal(getModuleLiveHandlerStatus("taxation", "unknown-action"), undefined);
assert.deepEqual(getModuleLiveHandlerRegistryIssues(), []);
assert.deepEqual(getModuleLiveHandlerRegistryIssues([{
  resource: "unknown",
  databaseAction: "unknown",
}]), [{
  resource: "unknown",
  databaseAction: "unknown",
  code: "unknown_live_handler",
}]);

const taxationRegistry = listModuleLiveHandlerRegistry("taxation");
assert.ok(taxationRegistry.length > 0);
assert.ok(taxationRegistry.every((entry) => entry.workspaceId === "taxation"));

console.log("Module live handler registry checks passed");
