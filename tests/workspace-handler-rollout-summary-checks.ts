import assert from "node:assert/strict";
import { createWorkspaceHandlerRolloutSummary } from "../lib/domain/workspaces/handlerRolloutSummary";
import { dispatchServiceWorkspaces } from "../lib/domain/workspaces/workspaces";

const taxationSummary = createWorkspaceHandlerRolloutSummary("taxation");
assert.equal(taxationSummary.workspaceId, "taxation");
assert.ok(taxationSummary.totalActions > 0);
assert.equal(taxationSummary.readyActions, taxationSummary.totalActions);
assert.equal(taxationSummary.blockedActions, 0);
assert.equal(taxationSummary.runtimeBlockedActions, 0);
assert.equal(taxationSummary.dependencyIssues, 0);
assert.equal(taxationSummary.nextPhase, "read-model");
assert.ok(taxationSummary.nextBatchSize > 0);
assert.ok(taxationSummary.phaseCounts["read-model"] > 0);
assert.ok(taxationSummary.phaseCounts["write-workflow"] > 0);
assert.equal(taxationSummary.writeWorkflowActions, taxationSummary.phaseCounts["write-workflow"]);
assert.ok(taxationSummary.plannedWriteActions > 0);
assert.equal(taxationSummary.liveWriteActions, 0);
assert.equal(taxationSummary.writePlanningOnly, true);
assert.equal(taxationSummary.readyToStartImplementation, true);

const homeSummary = createWorkspaceHandlerRolloutSummary("home");
assert.equal(homeSummary.totalActions, 0);
assert.equal(homeSummary.nextPhase, undefined);
assert.equal(homeSummary.nextBatchSize, 0);
assert.equal(homeSummary.writeWorkflowActions, 0);
assert.equal(homeSummary.plannedWriteActions, 0);
assert.equal(homeSummary.liveWriteActions, 0);
assert.equal(homeSummary.writePlanningOnly, true);
assert.equal(homeSummary.readyToStartImplementation, false);

const implementationWorkspaces = dispatchServiceWorkspaces.filter((workspace) => workspace.id !== "home");
assert.ok(implementationWorkspaces.every((workspace) => (
  createWorkspaceHandlerRolloutSummary(workspace.id).blockedActions === 0
)));
assert.ok(implementationWorkspaces.every((workspace) => (
  createWorkspaceHandlerRolloutSummary(workspace.id).runtimeBlockedActions === 0
)));
assert.ok(implementationWorkspaces.every((workspace) => (
  createWorkspaceHandlerRolloutSummary(workspace.id).dependencyIssues === 0
)));
assert.ok(implementationWorkspaces.every((workspace) => (
  createWorkspaceHandlerRolloutSummary(workspace.id).liveWriteActions === 0
)));
assert.ok(implementationWorkspaces.every((workspace) => (
  createWorkspaceHandlerRolloutSummary(workspace.id).writePlanningOnly === true
)));

console.log("Workspace handler rollout summary checks passed");
