import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

function readSource(relativePath: string) {
  return readFileSync(resolve(testDir, "..", relativePath), "utf8");
}

const topBarSource = readSource("features/app-shell/TopBar.tsx");
const breadcrumbsSource = readSource("features/app-shell/Breadcrumbs.tsx");
const appShellSource = readSource("features/app-shell/AppShell.tsx");
const printDocumentCssSource = readSource("features/reports/reportPrintMediaDocumentSections.ts");
const reportToolbarSource = readSource("features/reports/ReportAreaToolbar.tsx");
const reportsSectionSource = readSource("features/reports/ReportsSection.tsx");
const printControllerSource = readSource("features/reports/useReportPrintLayoutController.ts");

assert.match(topBarSource, /className="erp-topbar no-print"/);
assert.doesNotMatch(topBarSource, /erp-topbar__title/);
assert.match(topBarSource, /<Breadcrumbs activeReportCustomerCode=\{activeReportCustomerCode\} trail=\{trail\} \/>/);

assert.match(breadcrumbsSource, /const workspace = trail\.workspace/);
assert.doesNotMatch(breadcrumbsSource, /workspaceBreadcrumbLabels/);
assert.doesNotMatch(breadcrumbsSource, /dispatch: "Горная"/);
assert.doesNotMatch(breadcrumbsSource, /admin: "Админка"/);
assert.match(breadcrumbsSource, /const leaf = trail\.child \?\? trail\.item/);
assert.match(breadcrumbsSource, /activeReportCustomerCode/);
assert.doesNotMatch(breadcrumbsSource, /trail\.status/);
assert.match(appShellSource, /activeReportCustomerCode/);
assert.match(appShellSource, /appHeaderProps\.reportCustomerId/);

assert.match(reportsSectionSource, /className="report-print-area"/);
assert.match(reportToolbarSource, /className="report-screen-toolbar no-print"/);
assert.match(printControllerSource, /report-print-mode/);
assert.match(printControllerSource, /afterprint/);

for (const selector of [
  "body:has(.report-print-area) *",
  "html.report-print-mode body *",
  ".report-print-area",
  ".erp-sidebar",
  ".erp-topbar",
  ".no-print",
  ".report-screen-toolbar",
  ".report-screen-title",
]) {
  assert.match(printDocumentCssSource, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.doesNotMatch(printDocumentCssSource, /\.report-print-area\s*\{[\s\S]*display:\s*none/i);

console.log("Report print scope checks passed");
