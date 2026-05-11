import assert from "node:assert/strict";
import { getWorkspaceModuleCatalog } from "../lib/domain/workspaces/moduleCatalog";
import { createWorkspaceReadinessSummary } from "../lib/domain/workspaces/readiness";
import { dispatchServiceWorkspaces } from "../lib/domain/workspaces/workspaces";
import {
  requiredDispatchWorkspaceIds,
  validateDispatchWorkspaceRegistry,
} from "../lib/domain/workspaces/workspaceRegistry";

const taxationWorkspace = dispatchServiceWorkspaces.find((workspace) => workspace.id === "taxation");
assert.ok(taxationWorkspace);

const taxationModules = getWorkspaceModuleCatalog("taxation");
assert.ok(taxationModules.length >= 2);
assert.ok(taxationModules.every((module) => module.tableStrategy === "server-paginated"));

const taxationReadiness = createWorkspaceReadinessSummary(taxationWorkspace);
assert.equal(taxationReadiness.workspaceId, "taxation");
assert.equal(taxationReadiness.totalCount, 8);
assert.equal(taxationReadiness.items.find((item) => item.id === "data-route-contract")?.state, "ready");
assert.ok(taxationReadiness.items.find((item) => item.id === "data-route-contract")?.detail.includes("/api/database"));
assert.equal(taxationReadiness.items.find((item) => item.id === "guardrails")?.state, "ready");
assert.equal(taxationReadiness.items.find((item) => item.id === "handler-rollout")?.state, "ready");
assert.ok(taxationReadiness.items.find((item) => item.id === "handler-rollout")?.detail.includes("read-model"));
assert.ok([
  "\u041b\u0435\u043d\u0438\u0432\u0430\u044f \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0430",
  "\u041c\u0430\u0442\u0440\u0438\u0446\u0430 \u0434\u043e\u0441\u0442\u0443\u043f\u0430",
  "\u0421\u0435\u0440\u0432\u0435\u0440\u043d\u044b\u0435 \u0432\u044b\u0431\u043e\u0440\u043a\u0438",
  "Patch-\u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435",
  "Data route",
  "Guardrails",
  "Handler rollout",
].includes(taxationReadiness.nextStep));

const scoredWorkspaces = dispatchServiceWorkspaces.filter((workspace) => workspace.id !== "home");
assert.ok(scoredWorkspaces.every((workspace) => createWorkspaceReadinessSummary(workspace).totalCount === 8));
assert.deepEqual(validateDispatchWorkspaceRegistry(), []);
assert.deepEqual(dispatchServiceWorkspaces.map((workspace) => workspace.id), [...requiredDispatchWorkspaceIds]);

assert.deepEqual(validateDispatchWorkspaceRegistry(
  dispatchServiceWorkspaces.filter((workspace) => workspace.id !== "taxation"),
).map((issue) => issue.code), [
  "missing_required_workspace",
]);

assert.deepEqual(validateDispatchWorkspaceRegistry([
  ...dispatchServiceWorkspaces,
  { ...taxationWorkspace, topTab: "dispatch" },
]).map((issue) => issue.code), [
  "duplicate_workspace_id",
  "duplicate_workspace_top_tab",
]);

assert.deepEqual(validateDispatchWorkspaceRegistry([
  { ...taxationWorkspace, currentModules: [], futureModules: [], performanceRule: "" },
]).map((issue) => issue.code), [
  "missing_required_workspace",
  "missing_required_workspace",
  "missing_required_workspace",
  "missing_required_workspace",
  "missing_required_workspace",
  "missing_required_workspace",
  "missing_required_workspace",
  "missing_required_workspace",
  "workspace_missing_operational_context",
  "workspace_missing_future_scope",
  "workspace_missing_performance_rule",
]);

console.log("Workspace readiness checks passed");
