import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clonePlanFactReportCustomer,
  isBuiltInPlanFactReport,
  movePlanFactReportCustomer,
  planFactReportTabLabel,
} from "../lib/domain/plan-fact/workspace";
import { defaultReportCustomers } from "../lib/domain/reports/defaults";

const testDir = dirname(fileURLToPath(import.meta.url));
const readSource = (path: string) => readFileSync(resolve(testDir, path), "utf8");

const ptoPrimary = readSource("../features/app/PtoPrimaryContent.tsx");
const reportsPrimary = readSource("../features/app/ReportsPrimaryContent.tsx");
const appStateBundle = readSource("../features/app/useAppStateBundle.ts");
const reportUiState = readSource("../features/reports/useReportUiState.ts");
const workspaceController = readSource("../features/plan-fact/usePlanFactWorkspaceController.ts");
const workspaceTabs = readSource("../features/plan-fact/PlanFactWorkspaceTabs.tsx");
const reportManager = readSource("../features/plan-fact/PlanFactReportManager.tsx");
const domainWorkspace = readSource("../lib/domain/plan-fact/workspace.ts");
const architectureDoc = readSource("../docs/PLAN_FACT_ARCHITECTURE.md");

assert.match(ptoPrimary, /PlanFactWorkspaceShell/);
assert.match(reportsPrimary, /PlanFactWorkspaceShell/);
assert.doesNotMatch(ptoPrimary, /features\/app\/usePlanFactWorkspaceController/);
assert.doesNotMatch(reportsPrimary, /features\/reports\/PlanFactWorkspaceTabs/);
assert.match(appStateBundle, /usePlanFactWorkspaceState/);
assert.doesNotMatch(reportUiState, /planFactEditing/);
assert.match(workspaceController, /setPtoDateEditing\(false\)/);
assert.match(workspaceController, /clonePlanFactReportCustomer/);
assert.doesNotMatch(workspaceTabs, /window\.prompt/);
assert.doesNotMatch(reportManager, /window\.prompt/);
assert.doesNotMatch(domainWorkspace, /from "react"|window\.|document\./);
assert.match(architectureDoc, /не имеет фиксированной продолжительности/);
assert.match(architectureDoc, /Опер учет[\s\S]*сохраняется полностью/);
assert.match(architectureDoc, /production smoke/);

const aam = defaultReportCustomers[0];
assert.equal(planFactReportTabLabel(aam), "ААМ");
assert.equal(isBuiltInPlanFactReport(aam.id), true);

const copy = clonePlanFactReportCustomer(aam, { id: "custom-test", label: " Новый отчет " });
assert.equal(copy.id, "custom-test");
assert.equal(copy.label, "Новый отчет");
assert.equal(copy.visible, true);
assert.notEqual(copy.rowKeys, aam.rowKeys);
assert.notEqual(copy.factSourceRowKeys, aam.factSourceRowKeys);

const moved = movePlanFactReportCustomer(defaultReportCustomers, defaultReportCustomers[0].id, 1);
assert.equal(moved[1].id, defaultReportCustomers[0].id);
assert.equal(defaultReportCustomers[0].id, "aa-mining");

console.log("Plan/fact architecture checks passed.");
