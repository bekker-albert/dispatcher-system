import assert from "node:assert/strict";
import {
  listModuleDataRouteActionBindings,
} from "../lib/domain/data-access/moduleDataRoutes";
import { moduleImportPlans } from "../lib/domain/data-access/moduleImportPlans";
import {
  getModuleHandlerReadiness,
  getModuleHandlerReadinessIssues,
  listModuleHandlerReadiness,
} from "../lib/domain/data-access/moduleHandlerReadiness";

const readiness = listModuleHandlerReadiness();

assert.equal(readiness.length, listModuleDataRouteActionBindings().length + moduleImportPlans.length);
assert.deepEqual(getModuleHandlerReadinessIssues(), []);

const waybillList = getModuleHandlerReadiness("taxation", "list-waybills");
assert.ok(waybillList);
assert.equal(waybillList.moduleId, "taxation-waybills");
assert.equal(waybillList.contractKind, "list");
assert.equal(waybillList.hasAuthorizationRequirement, true);
assert.equal(waybillList.hasRequiredHandlerContract, true);
assert.equal(waybillList.implementationReady, true);

const waybillDetail = getModuleHandlerReadiness("taxation", "get-waybill");
assert.ok(waybillDetail);
assert.equal(waybillDetail.contractKind, "detail");
assert.equal(waybillDetail.implementationReady, true);

const waybillCreate = getModuleHandlerReadiness("taxation", "create-waybill");
assert.ok(waybillCreate);
assert.equal(waybillCreate.contractKind, "write");
assert.equal(waybillCreate.implementationReady, true);

const fuelPeriodPatch = getModuleHandlerReadiness("taxation", "patch-fuel-period");
assert.ok(fuelPeriodPatch);
assert.equal(fuelPeriodPatch.contractKind, "write");
assert.equal(fuelPeriodPatch.implementationReady, true);

const waybillExport = getModuleHandlerReadiness("taxation", "export-waybills");
assert.ok(waybillExport);
assert.equal(waybillExport.contractKind, "export");
assert.equal(waybillExport.implementationReady, true);

const shiftImport = getModuleHandlerReadiness("dispatch", "stage-shift-report-import");
assert.ok(shiftImport);
assert.equal(shiftImport.contractKind, "import");
assert.equal(shiftImport.hasAuthorizationRequirement, true);
assert.equal(shiftImport.hasRequiredHandlerContract, true);
assert.equal(shiftImport.implementationReady, true);

const aiContext = getModuleHandlerReadiness("ai-assistant", "load-ai-context");
assert.ok(aiContext);
assert.equal(aiContext.contractKind, "on-demand");
assert.equal(aiContext.implementationReady, true);

const taxationReadiness = listModuleHandlerReadiness("taxation");
assert.ok(taxationReadiness.length > 0);
assert.ok(taxationReadiness.every((item) => item.workspaceId === "taxation"));
assert.ok(taxationReadiness.every((item) => item.endpoint === "/api/database"));
assert.ok(taxationReadiness.every((item) => item.routeKind === "single-database-router"));

console.log("Module handler readiness checks passed");
