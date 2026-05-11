import assert from "node:assert/strict";
import { validateServerPageQueryPolicy } from "../lib/domain/data-access/queryPolicy";
import {
  getWorkspaceModuleQueryPolicy,
  getWorkspaceModulesRequiringQueryPolicy,
  getWorkspaceModulesWithoutQueryPolicy,
  listWorkspaceModuleQueryPolicies,
  workspaceModuleQueryPolicyBindings,
} from "../lib/domain/data-access/workspaceQueryPolicies";
import { workspaceModuleCatalog } from "../lib/domain/workspaces/moduleCatalog";

assert.equal(getWorkspaceModulesWithoutQueryPolicy().length, 0);
assert.equal(
  workspaceModuleQueryPolicyBindings.length,
  getWorkspaceModulesRequiringQueryPolicy(workspaceModuleCatalog).length,
);

assert.equal(getWorkspaceModuleQueryPolicy("mining-shift-reports")?.policy.id, "shift-section-status");
assert.equal(getWorkspaceModuleQueryPolicy("mining-operational-accounting")?.policy.id, "dated-section");
assert.equal(getWorkspaceModuleQueryPolicy("taxation-fuel-periods")?.policy.id, "period-section-status");
assert.equal(getWorkspaceModuleQueryPolicy("smts-fuel-drains")?.policy.id, "gps-events");
assert.equal(getWorkspaceModuleQueryPolicy("service-vehicle")?.policy.id, "vehicle-status");
assert.equal(getWorkspaceModuleQueryPolicy("access-matrix")?.policy.id, "admin-matrix");

assert.deepEqual(listWorkspaceModuleQueryPolicies("taxation").map((binding) => binding.moduleId), [
  "taxation-waybills",
  "taxation-fuel-periods",
]);

const gpsPolicy = getWorkspaceModuleQueryPolicy("smts-fuel-drains");
assert.ok(gpsPolicy);
assert.deepEqual(validateServerPageQueryPolicy({
  pageSize: 100,
  filters: {
    date_from: "2026-05-01",
    date_to: "2026-05-10",
    section_id: "baktay",
    vehicle_id: "truck-101",
  },
}, gpsPolicy.policy).map((issue) => issue.code), ["date_range_too_large"]);

const shiftReportPolicy = getWorkspaceModuleQueryPolicy("mining-shift-reports");
assert.ok(shiftReportPolicy);
assert.deepEqual(validateServerPageQueryPolicy({
  pageSize: 25,
  filters: {
    date: "2026-05-01",
    section_id: "baktay",
    status: "submitted",
  },
}, shiftReportPolicy.policy).map((issue) => issue.field), ["shift"]);

const fuelPeriodPolicy = getWorkspaceModuleQueryPolicy("taxation-fuel-periods");
assert.ok(fuelPeriodPolicy);
assert.deepEqual(validateServerPageQueryPolicy({
  pageSize: 50,
  filters: {
    section_id: "baktay",
    period_id: "2026-05-01-15",
    status: "open",
  },
}, fuelPeriodPolicy.policy), []);

console.log("Workspace query policy checks passed");
