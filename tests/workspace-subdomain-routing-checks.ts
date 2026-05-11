import assert from "node:assert/strict";
import { defaultTopTabs, type TopTab } from "../lib/domain/navigation/tabs";
import type { DispatchWorkspaceId } from "../lib/domain/workspaces/workspaces";
import {
  dispatchServiceWorkspaces,
  legacyWorkspaceTopTabBridges,
  workspaceSubdomainRoutes,
} from "../lib/domain/workspaces/workspaces";
import {
  normalizeWorkspaceHost,
  resolveWorkspaceByHost,
  resolveWorkspaceNavigationIntent,
  validateWorkspaceSubdomainRoutes,
  validateWorkspaceTopTabRoutes,
} from "../lib/domain/workspaces/subdomainRouting";

assert.equal(normalizeWorkspaceHost(" HTTPS://GD.AAM-DISPATCH.KZ:443, proxy.local "), "gd.aam-dispatch.kz");
assert.equal(normalizeWorkspaceHost("dt.aam-dispatch.kz:3000"), "dt.aam-dispatch.kz");

const gdRoute = resolveWorkspaceByHost("GD.AAM-DISPATCH.KZ:443");
assert.equal(gdRoute?.workspace.id, "mining-dispatch");
assert.equal(gdRoute?.route.topTab, "dispatch");

const taxationIntent = resolveWorkspaceNavigationIntent("dt.aam-dispatch.kz");
assert.deepEqual(taxationIntent, {
  source: "subdomain",
  host: "dt.aam-dispatch.kz",
  workspaceId: "taxation",
  topTab: "fuel",
  sameNextProject: true,
  separateBackend: false,
  separateDatabase: false,
});

const fallbackIntent = resolveWorkspaceNavigationIntent("unknown.localhost", "reports");
assert.deepEqual(fallbackIntent, {
  source: "fallback",
  host: "unknown.localhost",
  workspaceId: "reports",
  topTab: "reports",
  sameNextProject: true,
  separateBackend: false,
  separateDatabase: false,
});

const ptoFallbackIntent = resolveWorkspaceNavigationIntent("unknown.localhost", "pto");
assert.deepEqual(ptoFallbackIntent, {
  source: "fallback",
  host: "unknown.localhost",
  workspaceId: "mining-dispatch",
  topTab: "pto",
  sameNextProject: true,
  separateBackend: false,
  separateDatabase: false,
});

const contractorsFallbackIntent = resolveWorkspaceNavigationIntent("unknown.localhost", "contractors");
assert.deepEqual(contractorsFallbackIntent, {
  source: "fallback",
  host: "unknown.localhost",
  workspaceId: "taxation",
  topTab: "contractors",
  sameNextProject: true,
  separateBackend: false,
  separateDatabase: false,
});

const workspaceTopTabs = new Set(dispatchServiceWorkspaces.map((workspace) => workspace.topTab));
const legacyBridgeTopTabs = new Set(legacyWorkspaceTopTabBridges.map((bridge) => bridge.topTab));
const unmappedVisibleTopTabs = defaultTopTabs
  .filter((tab) => tab.visible)
  .map((tab) => tab.id)
  .filter((tab) => !workspaceTopTabs.has(tab) && !legacyBridgeTopTabs.has(tab));

assert.deepEqual(
  unmappedVisibleTopTabs,
  [],
  "Every visible top tab must map to a workspace or an explicit legacy workspace bridge.",
);

assert.deepEqual(
  legacyWorkspaceTopTabBridges.map((bridge) => bridge.topTab),
  ["pto", "contractors"],
);
assert.ok(legacyWorkspaceTopTabBridges.every((bridge) => bridge.reason.length > 40));

assert.deepEqual(
  workspaceSubdomainRoutes.map((route) => route.host),
  [
    "gd.aam-dispatch.kz",
    "dt.aam-dispatch.kz",
    "smts.aam-dispatch.kz",
    "pto.aam-dispatch.kz",
    "reports.aam-dispatch.kz",
    "admin.aam-dispatch.kz",
  ],
);
for (const route of workspaceSubdomainRoutes) {
  assert.match(route.host, /^[a-z0-9-]+\.aam-dispatch\.kz$/);
  assert.equal(route.host, normalizeWorkspaceHost(route.host));
  assert.doesNotMatch(route.host, /^https?:\/\//);
  assert.doesNotMatch(route.host, /[:/,\s]/);
  assert.doesNotMatch(route.host, /localhost|127\.0\.0\.1|0\.0\.0\.0/);
}

assert.deepEqual(validateWorkspaceSubdomainRoutes(), []);
assert.deepEqual(validateWorkspaceTopTabRoutes(), []);

assert.deepEqual(validateWorkspaceSubdomainRoutes([
  ...workspaceSubdomainRoutes,
  { host: "GD.AAM-DISPATCH.KZ", workspaceId: "mining-dispatch", topTab: "dispatch" },
  { host: "missing.aam-dispatch.kz", workspaceId: "missing" as DispatchWorkspaceId, topTab: "dispatch" },
  { host: "bad-tab.aam-dispatch.kz", workspaceId: "reports", topTab: "custom:bad-tab" as TopTab },
]).map((issue) => issue.code), [
  "duplicate_host",
  "workspace_missing",
  "top_tab_missing",
]);

const [homeWorkspace] = dispatchServiceWorkspaces;
assert.ok(homeWorkspace);

assert.deepEqual(validateWorkspaceTopTabRoutes([
  { ...homeWorkspace, topTab: "custom:bad-tab" as TopTab },
]).map((issue) => issue.code), [
  "workspace_top_tab_missing",
]);

assert.deepEqual(validateWorkspaceTopTabRoutes([
  { ...homeWorkspace, topTab: "reports" },
], defaultTopTabs.map((tab) => tab.id === "reports" ? { ...tab, visible: false } : tab)).map((issue) => issue.code), [
  "workspace_top_tab_hidden",
]);

console.log("Workspace subdomain routing checks passed");
