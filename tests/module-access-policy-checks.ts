import assert from "node:assert/strict";
import {
  canUseWorkspaceModuleAction,
  getAllowedWorkspaceModuleActions,
  getModuleActionRequiredCapability,
  getWorkspaceModuleAccessPolicy,
  getWorkspaceModulesWithoutAccessPolicy,
  listWorkspaceModuleAccessPolicies,
  validateWorkspaceModuleAccessPolicies,
  workspaceModuleAccessPolicies,
} from "../lib/domain/access-control/moduleAccessPolicies";
import type { EffectiveAccessDecision } from "../lib/domain/access-control/effectivePermissions";
import { workspaceModuleCatalog } from "../lib/domain/workspaces/moduleCatalog";

assert.equal(getWorkspaceModulesWithoutAccessPolicy().length, 0);
assert.equal(workspaceModuleAccessPolicies.length, workspaceModuleCatalog.length);
assert.deepEqual(validateWorkspaceModuleAccessPolicies().map((issue) => issue.code), []);

assert.equal(getWorkspaceModuleAccessPolicy("mining-shift-reports")?.sectionScoped, true);
assert.equal(getWorkspaceModuleAccessPolicy("service-vehicle")?.sectionScoped, false);
assert.equal(getModuleActionRequiredCapability("mining-shift-reports", "approve"), "approve");
assert.equal(getModuleActionRequiredCapability("prepared-reports", "edit"), undefined);
assert.equal(getModuleActionRequiredCapability("prepared-reports", "export"), "export");
assert.equal(getModuleActionRequiredCapability("access-matrix", "admin"), "admin");

assert.deepEqual(listWorkspaceModuleAccessPolicies("taxation").map((policy) => policy.moduleId), [
  "taxation-waybills",
  "taxation-fuel-periods",
]);

const editOnlyDecision: EffectiveAccessDecision = {
  canView: true,
  canEdit: true,
  canApprove: false,
  canDelete: false,
  canExport: false,
  canAdmin: false,
  matchedGrantIds: ["grant-edit"],
};

assert.equal(canUseWorkspaceModuleAction(editOnlyDecision, "taxation-waybills", "open"), true);
assert.equal(canUseWorkspaceModuleAction(editOnlyDecision, "taxation-waybills", "edit"), true);
assert.equal(canUseWorkspaceModuleAction(editOnlyDecision, "taxation-waybills", "approve"), false);
assert.equal(canUseWorkspaceModuleAction(editOnlyDecision, "taxation-waybills", "export"), false);
assert.deepEqual(getAllowedWorkspaceModuleActions(editOnlyDecision, "taxation-waybills"), [
  "open",
  "list",
  "create",
  "edit",
]);

const adminDecision: EffectiveAccessDecision = {
  ...editOnlyDecision,
  canApprove: true,
  canDelete: true,
  canExport: true,
  canAdmin: true,
  matchedGrantIds: ["grant-admin"],
};

assert.equal(canUseWorkspaceModuleAction(adminDecision, "access-matrix", "admin"), true);
assert.equal(canUseWorkspaceModuleAction(adminDecision, "prepared-reports", "export"), true);
assert.ok(getAllowedWorkspaceModuleActions(adminDecision, "access-matrix").includes("admin"));

const serviceVehicleModule = workspaceModuleCatalog.find((module) => module.id === "service-vehicle");
assert.ok(serviceVehicleModule);
assert.deepEqual(validateWorkspaceModuleAccessPolicies([serviceVehicleModule], [{
  moduleId: "service-vehicle",
  workspaceId: "fleet",
  sectionScoped: true,
  actionCapabilities: {
    open: "view",
    list: "view",
    edit: "edit",
  },
  reason: "Should fail because service vehicle records do not require section_id.",
}]).map((issue) => issue.code), [
  "access_policy_section_scope_without_filter",
]);

console.log("Module access policy checks passed");
