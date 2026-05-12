import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { erpNavigationModel, type NavigationItem } from "../features/app-shell/navigationModel";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");

function readSource(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function walkRouteFiles(startPath: string): string[] {
  const stats = statSync(startPath);
  if (stats.isFile()) return basename(startPath) === "route.ts" ? [startPath] : [];
  if (!stats.isDirectory()) return [];
  return readdirSync(startPath).flatMap((entryName) => walkRouteFiles(join(startPath, entryName)));
}

function flattenItems(items: NavigationItem[]): NavigationItem[] {
  return items.flatMap((item) => [item, ...flattenItems(item.children ?? [])]);
}

function toRepoPath(path: string) {
  return relative(root, path).replace(/\\/g, "/");
}

const appRootSource = readSource("features/app/AppRoot.tsx");
const appPrimaryContentSource = readSource("features/app/AppPrimaryContent.tsx");
const appShellSource = readSource("features/app-shell/AppShell.tsx");
const sidebarSource = readSource("features/app-shell/Sidebar.tsx");
const sidebarGroupSource = readSource("features/app-shell/SidebarGroup.tsx");
const sidebarItemSource = readSource("features/app-shell/SidebarItem.tsx");
const topBarSource = readSource("features/app-shell/TopBar.tsx");
const mappingSource = readSource("features/app-shell/navigationMapping.ts");
const labelOverridesSource = readSource("features/app-shell/navigationLabelOverrides.ts");
const labelOverridesHookSource = readSource("features/app-shell/useNavigationLabelOverrides.ts");
const orderOverridesSource = readSource("features/app-shell/navigationOrderOverrides.ts");
const orderOverridesHookSource = readSource("features/app-shell/useNavigationOrderOverrides.ts");
const sidebarStateSource = readSource("features/app-shell/useSidebarState.ts");
const sidebarGroupExpansionSource = readSource("features/app-shell/useSidebarGroupExpansion.ts");
const lazyPrimaryContentSource = readSource("features/app/lazyPrimaryContent.tsx");
const useAppStateBundleSource = readSource("features/app/useAppStateBundle.ts");
const adminNavigationSource = readSource("lib/domain/admin/navigation.ts");

assert.ok(erpNavigationModel.length >= 10, "ERP navigation must be grouped by compact workspaces.");

const workspaceLabels = erpNavigationModel.map((group) => group.label);
assert.deepEqual(workspaceLabels.slice(0, 10), [
  "Главная",
  "Горная",
  "ПТО",
  "Техника",
  "Топливо",
  "GPS / ТБ",
  "Договоры",
  "Отчеты",
  "AI",
  "Админка",
]);

const allItems = erpNavigationModel.flatMap((group) => flattenItems(group.items));
assert.ok(allItems.some((item) => item.status === "production"));
assert.ok(allItems.some((item) => item.status === "preview"));
assert.ok(allItems.some((item) => item.status === "planned"));

for (const id of [
  "dispatch-daily-volumes",
  "dispatch-daily-report",
  "dispatch-day",
  "dispatch-night",
  "pto-plan",
  "pto-oper",
  "pto-survey",
  "pto-cycle",
  "pto-buckets",
  "pto-bodies",
  "fleet-directory",
  "fleet-placement",
  "admin-users",
  "admin-database",
]) {
  assert.ok(allItems.some((item) => item.id === id), `${id} must stay in ERP navigation.`);
}

const dispatchGroup = erpNavigationModel.find((group) => group.id === "dispatch");
assert.ok(dispatchGroup);
assert.deepEqual(
  dispatchGroup?.items.map((item) => item.id),
  ["dispatch-daily-volumes", "dispatch-daily-report", "dispatch-day", "dispatch-night"],
  "Горная must show Суточные объемы before Суточный отчет.",
);
assert.equal(allItems.find((item) => item.id === "dispatch-daily-volumes")?.target?.dispatchDailyReportTab, "volumes");
assert.equal(allItems.find((item) => item.id === "dispatch-daily-report")?.target?.dispatchDailyReportTab, "summary");

assert.equal(allItems.filter((item) => item.label === "Главная").length, 0, "Sidebar must not duplicate the Главная workspace as a visible child item.");

for (const removedId of [
  "dispatch-shift",
  "dispatch-daily",
  "fleet-working",
  "fleet-repair",
  "fleet-idle",
  "reports-summary",
  "reports-plan-fact",
  "reports-sections",
  "reports-customers",
  "reports-fleet",
  "reports-export",
]) {
  assert.ok(!allItems.some((item) => item.id === removedId), `${removedId} must not remain as a static sidebar item.`);
}

const ptoVolumeItem = allItems.find((item) => item.id === "pto-volume-calc");
assert.ok(ptoVolumeItem);
assert.equal(ptoVolumeItem?.target?.topTab, "pto");
assert.equal(ptoVolumeItem?.target?.ptoTab, "performance");
assert.equal(ptoVolumeItem?.children, undefined);

const ptoGroup = erpNavigationModel.find((group) => group.id === "pto");
assert.ok(ptoGroup);
assert.deepEqual(ptoGroup?.items.map((item) => item.id), [
  "pto-plan",
  "pto-oper",
  "pto-survey",
  "pto-cycle",
  "pto-buckets",
  "pto-bodies",
  "pto-volume-calc",
]);
assert.ok(!allItems.some((item) => item.id === "pto-performance"), "Производительность must be folded into Расчет объемов in the sidebar.");

const reportsGroup = erpNavigationModel.find((group) => group.id === "reports");
assert.ok(reportsGroup);
assert.deepEqual(reportsGroup?.items, [], "Report customer items must be generated from reportCustomers at runtime.");
assert.match(appShellSource, /attachReportCustomerNavigationItems/);
assert.match(mappingSource, /createReportCustomerNavigationItems/);
assert.match(mappingSource, /reportCustomerId/);
assert.match(mappingSource, /fleetTab/);
assert.match(mappingSource, /Сводный отчет/);

const adminDatabaseItem = allItems.find((item) => item.id === "admin-database");
assert.equal(adminDatabaseItem?.status, "production");
assert.equal(adminDatabaseItem?.target?.topTab, "admin");
assert.equal(adminDatabaseItem?.target?.adminSection, "database");
assert.match(adminNavigationSource, /value: "database"/);

for (const item of allItems.filter((candidate) => candidate.status === "planned")) {
  assert.notEqual(item.status, "production");
}

assert.match(appRootSource, /<AppShell/);
assert.match(appRootSource, /<AppPrimaryContent \{\.\.\.primaryContentProps\} \/>/);
assert.match(appPrimaryContentSource, /renderedTopTab !== "home"/);
assert.match(appShellSource, /getVisibleNavigationGroups/);
assert.match(appShellSource, /createNavigationTrail/);
assert.match(appShellSource, /applyNavigationLabelOverrides/);
assert.match(appShellSource, /applyNavigationOrderOverrides/);
assert.match(appShellSource, /useNavigationLabelOverrides/);
assert.match(appShellSource, /useNavigationOrderOverrides/);
assert.match(appShellSource, /canEditNavigationLabels/);
assert.match(appShellSource, /data-database-configured/);
assert.match(appShellSource, /dispatchDailyReportTab/);
assert.match(appShellSource, /onSelectDispatchDailyReportTab/);
assert.match(appShellSource, /onAddCustomTab=\{appState\.addCustomTab\}/);
assert.match(sidebarSource, /mining-logo\.png/);
assert.match(sidebarSource, /AAM Dispatch/);
assert.doesNotMatch(sidebarSource, /NavigationLabelEditor/);
assert.match(sidebarSource, /Править меню/);
assert.match(sidebarSource, /PencilLine/);
assert.match(sidebarSource, /Plus/);
assert.match(sidebarSource, /onAddCustomTab/);
assert.match(sidebarSource, /handleAddCustomTab/);
assert.match(sidebarSource, /placeholder="Новая вкладка"/);
assert.match(sidebarSource, /onMoveNavigationItem/);
assert.match(sidebarSource, /floating/);
assert.match(sidebarSource, /SidebarGroup/);
assert.match(sidebarGroupSource, /isNavigationGroupActive/);
assert.match(sidebarGroupSource, /InlineNavigationLabelInput/);
assert.match(sidebarGroupSource, /useSidebarGroupExpansion/);
assert.match(sidebarGroupSource, /toggleExpanded/);
assert.match(sidebarGroupSource, /erp-sidebar-group__header/);
assert.match(sidebarGroupSource, /event\.stopPropagation\(\)/);
assert.match(sidebarGroupSource, /aria-label=\{\`\$\{expanded \? "Свернуть" : "Развернуть"\}/);
assert.doesNotMatch(sidebarGroupSource, /expanded \|\| active/);
assert.match(sidebarSource, /onToggleCollapsed/);
assert.match(readSource("features/app-shell/SidebarToggle.tsx"), /event\.stopPropagation\(\)/);
assert.match(sidebarItemSource, /data-disabled/);
assert.match(sidebarItemSource, /aria-disabled/);
assert.match(sidebarItemSource, /draggable=\{editing && !collapsed\}/);
assert.match(sidebarItemSource, /InlineNavigationItemLabel/);
assert.match(sidebarItemSource, /Eye/);
assert.match(sidebarItemSource, /Clock3/);
assert.doesNotMatch(sidebarItemSource, />\s*\{statusLabel\(item\.status\)\}\s*<\/span>/);
assert.match(topBarSource, /Breadcrumbs/);
assert.match(topBarSource, /AuthSessionButton/);
assert.doesNotMatch(topBarSource, /erp-topbar__status|production source|fallback\/local/);
assert.match(mappingSource, /selectNavigationTarget/);
assert.match(mappingSource, /onSelectPtoTab/);
assert.match(mappingSource, /onSelectAdminSection/);
assert.match(mappingSource, /onSelectFleetTab/);
assert.match(mappingSource, /onSelectReportCustomer/);
assert.match(mappingSource, /dispatchDailyReportTab/);
assert.match(mappingSource, /onSelectDispatchDailyReportTab/);

assert.match(sidebarStateSource, /localStorage/);
assert.match(sidebarStateSource, /sidebarCollapsedPreferenceKey/);
assert.match(sidebarStateSource, /useSyncExternalStore/);
assert.match(sidebarStateSource, /getSidebarCollapsedSnapshot/);
assert.doesNotMatch(sidebarStateSource, /readInitialSidebarCollapsed/);
assert.match(sidebarGroupExpansionSource, /sidebarGroupExpansionPreferenceKey/);
assert.match(sidebarGroupExpansionSource, /useSyncExternalStore/);
assert.match(sidebarGroupExpansionSource, /localStorage/);
assert.match(labelOverridesSource, /navigationLabelOverrideStorageKey/);
assert.match(labelOverridesSource, /applyNavigationLabelOverrides/);
assert.match(labelOverridesSource, /normalizeNavigationLabelOverride/);
assert.match(labelOverridesSource, /canEditNavigationLabels/);
assert.match(labelOverridesHookSource, /localStorage/);
assert.match(labelOverridesHookSource, /navigationLabelOverrideStorageKey/);
assert.match(labelOverridesHookSource, /useSyncExternalStore/);
assert.match(labelOverridesHookSource, /getNavigationLabelOverrideSnapshot/);
assert.doesNotMatch(labelOverridesHookSource, /useState<NavigationLabelOverrides>\(\(\) => readNavigationLabelOverrides\(\)\)/);
assert.match(sidebarItemSource, /maxLength=\{48\}/);
assert.match(sidebarGroupSource, /maxLength=\{48\}/);
assert.match(sidebarSource, /maxLength=\{48\}/);
assert.match(orderOverridesSource, /navigationOrderOverrideStorageKey/);
assert.match(orderOverridesSource, /moveNavigationItemWithinParent/);
assert.match(orderOverridesHookSource, /localStorage/);
assert.match(orderOverridesHookSource, /navigationOrderOverrideStorageKey/);
assert.match(orderOverridesHookSource, /useSyncExternalStore/);
assert.match(orderOverridesHookSource, /getNavigationOrderOverrideSnapshot/);
assert.doesNotMatch(orderOverridesHookSource, /useState<NavigationOrderOverrides>\(\(\) => readNavigationOrderOverrides\(\)\)/);
assert.doesNotMatch(useAppStateBundleSource, /sidebarCollapsedPreferenceKey|erpShell\.sidebarCollapsed/);
assert.doesNotMatch(useAppStateBundleSource, /sidebarGroupExpansionPreferenceKey|sidebarGroups\.v1/);
assert.doesNotMatch(useAppStateBundleSource, /navigationLabelOverrideStorageKey|navigationLabels/);
assert.doesNotMatch(useAppStateBundleSource, /navigationOrderOverrideStorageKey|navigationOrder/);

for (const exportName of [
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
]) {
  assert.match(lazyPrimaryContentSource, new RegExp(`export const ${exportName} = dynamic\\(`));
  assert.match(appPrimaryContentSource, new RegExp(exportName));
}

for (const stateName of [
  "vehicleCards",
  "vehicleStatusHistory",
  "vehicleSectionHistory",
  "vehicleDocuments",
  "vehicleContractLinks",
  "vehicleGpsLinks",
  "sections",
  "sectionSchedules",
  "erpRoles",
  "erpRolePermissions",
]) {
  assert.doesNotMatch(useAppStateBundleSource, new RegExp(`\\b${stateName}\\b`));
}

const routeFiles = walkRouteFiles(resolve(root, "app", "api")).map(toRepoPath).sort();
assert.deepEqual(
  routeFiles.filter((routePath) => !routePath.startsWith("app/api/auth/") && routePath !== "app/api/database/route.ts"),
  [],
  "ERP shell sprint must not create app/api/<module> routes.",
);

assert.ok(existsSync(resolve(root, "features", "app-shell", "navigationModel.ts")));
console.log("ERP app shell navigation checks passed");
