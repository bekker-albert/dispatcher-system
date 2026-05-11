import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultTopTabs } from "../lib/domain/navigation/tabs";
import { dispatchServiceWorkspaces, legacyWorkspaceTopTabBridges } from "../lib/domain/workspaces/workspaces";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const appPrimaryContentSource = readFileSync(resolve(root, "features/app/AppPrimaryContent.tsx"), "utf8");
const lazyPrimaryContentSource = readFileSync(resolve(root, "features/app/lazyPrimaryContent.tsx"), "utf8");
const workspacesDoc = readFileSync(resolve(root, "docs/WORKSPACES_ARCHITECTURE.md"), "utf8");

const visibleTopTabs = defaultTopTabs
  .filter((tab) => tab.visible)
  .map((tab) => tab.id);

const workspaceTopTabs = dispatchServiceWorkspaces.map((workspace) => workspace.topTab);
const legacyBridgeTopTabs = legacyWorkspaceTopTabBridges.map((bridge) => bridge.topTab);

for (const topTab of [...new Set([...visibleTopTabs, ...workspaceTopTabs, ...legacyBridgeTopTabs])]) {
  assert.match(
    appPrimaryContentSource,
    new RegExp(`renderedTopTab === "${topTab}"`),
    `Top tab ${topTab} must have an AppPrimaryContent render branch.`,
  );
}

const tabToPrimaryContentExport: Record<string, string> = {
  admin: "AdminPrimaryContent",
  "ai-assistant": "AiAssistantPrimaryContent",
  common: "CommonProcessesPrimaryContent",
  contractors: "ContractorsPrimaryContent",
  dispatch: "DispatchPrimaryContent",
  fleet: "FleetPrimaryContent",
  fuel: "FuelPrimaryContent",
  home: "WorkspaceOverviewPrimaryContent",
  pto: "PtoPrimaryContent",
  reports: "ReportsPrimaryContent",
  tb: "SafetyPrimaryContent",
};

for (const topTab of visibleTopTabs) {
  const exportName = tabToPrimaryContentExport[topTab];
  assert.ok(exportName, `Top tab ${topTab} must have an expected lazy primary content export.`);
  assert.match(
    appPrimaryContentSource,
    new RegExp(`renderedTopTab === "${topTab}"[\\s\\S]*?<${exportName}`),
    `Top tab ${topTab} must render ${exportName}.`,
  );
  assert.match(
    lazyPrimaryContentSource,
    new RegExp(`export const ${exportName} = dynamic\\(`),
    `${exportName} must be lazy-loaded through dynamic().`,
  );
  assert.match(
    lazyPrimaryContentSource,
    new RegExp(`export const ${exportName} = dynamic\\([\\s\\S]*?ssr: false`),
    `${exportName} must stay client-lazy with ssr disabled.`,
  );
}

assert.match(appPrimaryContentSource, /navigation\.activeCustomTab/);
assert.match(appPrimaryContentSource, /<CustomTabPrimaryContent tab=\{navigation\.activeCustomTab\} \/>/);
assert.match(lazyPrimaryContentSource, /export const CustomTabPrimaryContent = dynamic\(/);
assert.match(lazyPrimaryContentSource, /export const CustomTabPrimaryContent = dynamic\([\s\S]*?ssr: false/);

assert.match(packageJson.scripts["check:workspaces"], /navigation-render-guardrails-checks\.ts/);
assert.match(workspacesDoc, /Navigation render coverage guardrail/);
assert.match(workspacesDoc, /tests\/navigation-render-guardrails-checks\.ts/);
assert.match(workspacesDoc, /Every visible top-level tab must have an `AppPrimaryContent` render branch/);
assert.match(workspacesDoc, /must render its lazy primary content export through `lazyPrimaryContent`/);
assert.match(workspacesDoc, /Custom tabs remain the only generic fallback/);

console.log("Navigation render guardrails checks passed");
