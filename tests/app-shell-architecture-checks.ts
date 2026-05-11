import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

function readSource(relativePath: string) {
  return readFileSync(resolve(testDir, "..", relativePath), "utf8");
}

function lineCount(source: string) {
  return source.split(/\r?\n/).length;
}

const pageSource = readSource("app/page.tsx");
const appRootSource = readSource("features/app/AppRoot.tsx");
const erpAppShellSource = readSource("features/app-shell/AppShell.tsx");
const erpSidebarSource = readSource("features/app-shell/Sidebar.tsx");
const erpTopBarSource = readSource("features/app-shell/TopBar.tsx");
const useAppStateBundleSource = readSource("features/app/useAppStateBundle.ts");
const useAppSectionPreloaderSource = readSource("features/app/useAppSectionPreloader.ts");
const appPrimaryContentSource = readSource("features/app/AppPrimaryContent.tsx");
const lazyPrimaryContentSource = readSource("features/app/lazyPrimaryContent.tsx");
const adminNavigationSource = readSource("lib/domain/admin/navigation.ts");
const workspaceOverviewSource = readSource("features/workspaces/WorkspaceOverviewSection.tsx");
const commonProcessesSource = readSource("features/workspaces/CommonProcessesSection.tsx");
const adminAccessMatrixSource = readSource("features/admin/access/AdminAccessMatrixSection.tsx");
const workspacesDoc = readSource("docs/WORKSPACES_ARCHITECTURE.md");
const architectureDoc = readSource("docs/DISPATCH_SERVICE_ARCHITECTURE.md");

assert.ok(lineCount(pageSource) <= 40, "app/page.tsx must stay a small auth gate.");
assert.ok(lineCount(appRootSource) <= 140, "AppRoot must stay a shell, not a module host.");
assert.ok(lineCount(useAppStateBundleSource) <= 160, "useAppStateBundle must not absorb module business state.");
assert.ok(lineCount(appPrimaryContentSource) <= 220, "AppPrimaryContent must stay a router to lazy screens.");

const pageImports = pageSource.match(/^import .+;$/gm) ?? [];
assert.ok(pageImports.length <= 5, "app/page.tsx must keep only auth-gate imports.");
assert.match(pageSource, /^import AppRoot from "@\/features\/app\/AppRoot";/m);
assert.match(pageSource, /^import \{ LoginScreen \} from "@\/features\/auth\/LoginScreen";/m);
assert.match(pageSource, /^import \{ authRequired, authSessionCookieName, getAuthDisabledUser \} from "@\/lib\/server\/auth\/config";/m);
assert.match(pageSource, /^import \{ getAuthSessionFromCookieValue \} from "@\/lib\/server\/auth\/session";/m);
assert.match(pageSource, /^import \{ cookies \} from "next\/headers";/m);
assert.match(pageSource, /<AppRoot initialAuthUser=\{getAuthDisabledUser\(\)\} \/>/);
assert.match(pageSource, /<AppRoot initialAuthUser=\{session\.user\} \/>/);
assert.match(pageSource, /<LoginScreen \/>/);
assert.doesNotMatch(pageSource, /["']use client["']/);
assert.doesNotMatch(pageSource, /features\/dispatch|features\/pto|features\/fuel|features\/fleet/);
assert.doesNotMatch(pageSource, /features\/workspaces|lib\/domain|service-contracts|moduleCatalog/);
assert.doesNotMatch(pageSource, /lib\/data|api\/database|mysql|supabase|localStorage|sessionStorage/);
assert.doesNotMatch(pageSource, /dynamic\(|useState|useEffect|fetch\(|databaseRequest|dbRows|dbExecute/);

assert.match(appRootSource, /<AppShell/);
assert.match(appRootSource, /appHeaderProps=\{appHeaderProps\}/);
assert.match(appRootSource, /<AppPrimaryContent \{\.\.\.primaryContentProps\} \/>/);
assert.doesNotMatch(appRootSource, /DispatchSection|PtoSection|FuelSection|FleetSection|SafetySection|ReportsSection/);
assert.match(erpAppShellSource, /erpNavigationModel/);
assert.match(erpAppShellSource, /AppPrimaryContent|children/);
assert.match(erpSidebarSource, /SidebarGroup/);
assert.match(erpTopBarSource, /AuthSessionButton/);
assert.doesNotMatch(erpAppShellSource, /DispatchSection|PtoSection|FuelSection|FleetSection|SafetySection|ReportsSection/);

assert.match(useAppStateBundleSource, /useAppTabsState/);
assert.match(useAppStateBundleSource, /useAppDataLoadState/);
assert.doesNotMatch(useAppStateBundleSource, /WorkspaceOverviewSection|CommonProcessesSection|AdminAccessMatrixSection/);
assert.doesNotMatch(useAppStateBundleSource, /const \[[^\]]*Rows[^\]]*\] = useState/);
assert.match(useAppSectionPreloaderSource, /requestIdleCallback/);
assert.match(useAppSectionPreloaderSource, /primarySectionPreloaders: SectionPreloader\[\] = \[/);
assert.doesNotMatch(useAppSectionPreloaderSource, /DispatchPrimaryContent/);
assert.doesNotMatch(
  useAppSectionPreloaderSource,
  /import\("@\/features\/app\/(?:Pto|Reports|Admin|Fleet|Fuel|Safety|CommonProcesses|AiAssistant|WorkspaceOverview)PrimaryContent"\)/,
);
assert.doesNotMatch(useAppSectionPreloaderSource, /@\/features\/pto\/PtoSection|@\/features\/reports|@\/features\/fuel|@\/features\/fleet/);

assert.match(workspaceOverviewSource, /createWorkspaceHandlerRolloutSummary/);
assert.match(workspaceOverviewSource, /createStage2FirstReadModelActivationSummary/);
assert.doesNotMatch(workspaceOverviewSource, /@\/lib\/data|databaseRequest|fetch\(/);
assert.match(adminNavigationSource, /value: "database"/);

for (const placeholderSource of [workspaceOverviewSource, commonProcessesSource, adminAccessMatrixSource]) {
  assert.doesNotMatch(placeholderSource, /@\/features\/dispatch|@\/features\/fuel|@\/features\/pto|@\/features\/reports/);
  assert.doesNotMatch(placeholderSource, /@\/lib\/data|databaseRequest|fetch\(/);
  assert.doesNotMatch(placeholderSource, /useState\(/);
}
assert.doesNotMatch(adminAccessMatrixSource, /<form|<button|<input|<select|<textarea|onClick=|onSubmit=/);
assert.doesNotMatch(adminAccessMatrixSource, /createAccessMatrixGrant|createAccessMatrixGrantPatchCommand|createAccessMatrixGrantCreateCommand/);

const lazyExports = [
  "WorkspaceOverviewPrimaryContent",
  "DispatchPrimaryContent",
  "FuelPrimaryContent",
  "SafetyPrimaryContent",
  "FleetPrimaryContent",
  "PtoPrimaryContent",
  "ReportsPrimaryContent",
  "AdminPrimaryContent",
  "AiAssistantPrimaryContent",
  "CommonProcessesPrimaryContent",
] as const;

for (const exportName of lazyExports) {
  assert.match(lazyPrimaryContentSource, new RegExp(`export const ${exportName} = dynamic\\(`));
  assert.match(lazyPrimaryContentSource, new RegExp(`export const ${exportName} = dynamic\\([\\s\\S]*?ssr: false`));
  assert.match(appPrimaryContentSource, new RegExp(exportName));
}

assert.match(workspacesDoc, /app\/page\.tsx/);
assert.match(workspacesDoc, /AppRoot/);
assert.match(workspacesDoc, /useAppStateBundle/);
assert.match(workspacesDoc, /lazyPrimaryContent/);
assert.match(workspacesDoc, /dynamic/);
assert.match(architectureDoc, /app\/page\.tsx/);
assert.match(architectureDoc, /features\/app\/AppRoot\.tsx/);
assert.match(architectureDoc, /features\/app\/useAppStateBundle\.ts/);

console.log("App shell architecture checks passed");
