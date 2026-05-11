import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createWriteReadModelLivePrerequisites } from "../lib/domain/data-access/writeReadModelLivePrerequisites";

const helperSource = readFileSync(
  resolve("lib/domain/data-access/writeReadModelLivePrerequisites.ts"),
  "utf8",
);
const packetSource = readFileSync(resolve("scripts/plan-write-handler-activation-packet.ts"), "utf8");
const reviewSource = readFileSync(resolve("lib/server/database/write-handler-registration-review.ts"), "utf8");

assert.match(helperSource, /getModuleHandlerImplementationPlanEntry/);
assert.match(helperSource, /listModuleHandlerImplementationPlan/);
assert.match(helperSource, /getModuleLiveHandlerStatus/);
assert.match(helperSource, /readModelContractKindOrder/);
assert.match(helperSource, /Write handlers can go live only after/);
assert.doesNotMatch(helperSource, /process\.env\.DB|dbRows|dbExecute|createLiveModuleDatabaseHandlersFromRegistrations/);

assert.match(packetSource, /createWriteReadModelLivePrerequisites/);
assert.doesNotMatch(packetSource, /listModuleHandlerImplementationPlan/);
assert.doesNotMatch(packetSource, /readModelContractKindOrder/);
assert.match(reviewSource, /createWriteReadModelLivePrerequisites/);
assert.doesNotMatch(reviewSource, /listModuleHandlerImplementationPlan/);
assert.doesNotMatch(reviewSource, /readModelContractKindOrder/);

const plannedPrerequisites = createWriteReadModelLivePrerequisites("taxation", "create-waybill");
assert.equal(plannedPrerequisites.ready, false);
assert.deepEqual(plannedPrerequisites.requiredActions.map((action) => (
  [action.databaseAction, action.contractKind, action.liveStatus, action.ready]
)), [
  ["list-waybills", "list", "planned-only", false],
  ["get-waybill", "detail", "planned-only", false],
]);
assert.match(plannedPrerequisites.rule, /read models are live/);

const oneLivePrerequisite = createWriteReadModelLivePrerequisites("taxation", "create-waybill", [{
  resource: "taxation",
  databaseAction: "list-waybills",
}]);
assert.equal(oneLivePrerequisite.ready, false);
assert.deepEqual(oneLivePrerequisite.requiredActions.map((action) => (
  [action.databaseAction, action.liveStatus, action.ready]
)), [
  ["list-waybills", "live", true],
  ["get-waybill", "planned-only", false],
]);

const allLivePrerequisites = createWriteReadModelLivePrerequisites("taxation", "create-waybill", [
  { resource: "taxation", databaseAction: "list-waybills" },
  { resource: "taxation", databaseAction: "get-waybill" },
]);
assert.equal(allLivePrerequisites.ready, true);
assert.deepEqual(allLivePrerequisites.requiredActions.map((action) => (
  [action.databaseAction, action.liveStatus, action.ready]
)), [
  ["list-waybills", "live", true],
  ["get-waybill", "live", true],
]);

const unknownPrerequisites = createWriteReadModelLivePrerequisites("taxation", "not-a-real-action");
assert.equal(unknownPrerequisites.ready, false);
assert.deepEqual(unknownPrerequisites.requiredActions, []);

console.log("Write read-model live prerequisites checks passed");
