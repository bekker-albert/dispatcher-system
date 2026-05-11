import assert from "node:assert/strict";
import type { AccessMatrixGrant } from "../lib/domain/access-control/accessMatrix";
import {
  createAccessMatrixGrantCreateCommand,
  createAccessMatrixGrantPatchCommand,
  normalizeAccessGrantCapabilities,
  validateAccessMatrixGrantDraft,
} from "../lib/domain/access-control/grantCommands";
import { getEffectiveAccess, hasAccessCapability } from "../lib/domain/access-control/effectivePermissions";
import {
  reviewAccessMatrixGrants,
  summarizeAccessMatrixReviewIssues,
} from "../lib/domain/access-control/accessMatrixReview";
import {
  canUseWorkspaceModuleAction,
  getAllowedWorkspaceModuleActions,
  getWorkspaceModulesWithoutAccessPolicy,
  validateWorkspaceModuleAccessPolicies,
} from "../lib/domain/access-control/moduleAccessPolicies";

assert.deepEqual(normalizeAccessGrantCapabilities({ edit: true, export: true }), {
  canView: true,
  canEdit: true,
  canApprove: false,
  canDelete: false,
  canExport: true,
  canAdmin: false,
});
assert.deepEqual(normalizeAccessGrantCapabilities({ admin: true }), {
  canView: true,
  canEdit: true,
  canApprove: true,
  canDelete: true,
  canExport: true,
  canAdmin: true,
});

assert.deepEqual(validateAccessMatrixGrantDraft({
  workspaceId: "taxation",
  capabilities: { admin: true },
}).map((issue) => issue.code), [
  "subject_required",
  "elevated_reason_required",
]);

const createGrant = createAccessMatrixGrantCreateCommand({
  roleId: "taxation-dispatcher",
  sectionId: "baktay",
  workspaceId: "taxation",
  moduleId: "waybills",
  capabilities: { edit: true, export: true },
  reason: "section waybill work",
});
assert.equal(createGrant.ok, true);
if (createGrant.ok) {
  assert.equal(createGrant.command.entityType, "access_matrix_grant");
  assert.equal(createGrant.command.grant.canView, true);
  assert.equal(createGrant.command.grant.canEdit, true);
  assert.equal(createGrant.command.grant.canExport, true);
  assert.equal(createGrant.command.grant.canAdmin, false);
}

const currentGrant: AccessMatrixGrant = {
  id: "grant-1",
  version: 4,
  roleId: "taxation-dispatcher",
  sectionId: "baktay",
  workspaceId: "taxation",
  moduleId: "waybills",
  canView: true,
  canEdit: true,
  canApprove: false,
  canDelete: false,
  canExport: false,
  canAdmin: false,
};
const grantPatch = createAccessMatrixGrantPatchCommand(
  currentGrant,
  { view: true, edit: true, approve: true, export: true },
  "allow approval and export",
);
assert.equal(grantPatch.entityType, "access_matrix_grant");
assert.equal(grantPatch.entity.version, 4);
assert.deepEqual(grantPatch.changes, [
  { field: "canApprove", previousValue: false, nextValue: true },
  { field: "canExport", previousValue: false, nextValue: true },
]);

const effectiveAccess = getEffectiveAccess(
  [currentGrant, {
    ...currentGrant,
    id: "grant-user-admin",
    userId: "user-1",
    roleId: undefined,
    canAdmin: true,
  }],
  { userId: "user-1", roleIds: ["taxation-dispatcher"] },
  { workspaceId: "taxation", sectionId: "baktay", moduleId: "waybills" },
);
assert.equal(hasAccessCapability(effectiveAccess, "admin"), true);
assert.equal(hasAccessCapability(effectiveAccess, "delete"), true);
assert.deepEqual(effectiveAccess.matchedGrantIds, ["grant-1", "grant-user-admin"]);
assert.equal(getWorkspaceModulesWithoutAccessPolicy().length, 0);
const editorAccess = getEffectiveAccess(
  [currentGrant],
  { userId: "user-1", roleIds: ["taxation-dispatcher"] },
  { workspaceId: "taxation", sectionId: "baktay", moduleId: "waybills" },
);
assert.equal(canUseWorkspaceModuleAction(editorAccess, "taxation-waybills", "edit"), true);
assert.equal(canUseWorkspaceModuleAction(editorAccess, "taxation-waybills", "approve"), false);
assert.equal(canUseWorkspaceModuleAction(effectiveAccess, "taxation-waybills", "approve"), true);
assert.ok(getAllowedWorkspaceModuleActions(effectiveAccess, "taxation-waybills").includes("export"));
assert.deepEqual(validateWorkspaceModuleAccessPolicies(), []);
assert.deepEqual(validateWorkspaceModuleAccessPolicies([
  {
    id: "access-policy-test",
    workspaceId: "taxation",
    title: "Access policy test",
    status: "planned",
    contractSource: "lib/domain/taxation/service-contracts.ts",
    tableStrategy: "aggregate",
    editingStrategy: "workflow",
    requiredFilters: ["date"],
    nextStep: "Keep access policies aligned before implementation.",
  },
], [
  {
    moduleId: "access-policy-test",
    workspaceId: "fleet",
    sectionScoped: true,
    actionCapabilities: {
      open: "view",
      list: "view",
      edit: "edit",
    },
    reason: "Intentional broken policy for source check.",
  },
  {
    moduleId: "access-policy-test",
    workspaceId: "taxation",
    sectionScoped: true,
    actionCapabilities: {
      create: "edit",
    },
    reason: "Intentional duplicate and missing view/approve/export policy.",
  },
  {
    moduleId: "unknown-access-module",
    workspaceId: "taxation",
    sectionScoped: false,
    actionCapabilities: {
      open: "view",
      list: "view",
    },
    reason: "Intentional unknown module policy.",
  },
]).map((issue) => issue.code), [
  "duplicate_access_policy",
  "access_policy_workspace_mismatch",
  "access_policy_section_scope_without_filter",
  "access_policy_missing_approve",
  "access_policy_missing_export",
  "access_policy_section_scope_without_filter",
  "access_policy_missing_open_view",
  "access_policy_missing_list_view",
  "access_policy_missing_approve",
  "access_policy_missing_export",
  "access_policy_unknown_module",
]);
assert.deepEqual(validateWorkspaceModuleAccessPolicies([
  {
    id: "readonly-policy-test",
    workspaceId: "reports",
    title: "Readonly policy test",
    status: "planned",
    contractSource: "lib/domain/reports/aggregation-contracts.ts",
    tableStrategy: "none",
    editingStrategy: "readonly",
    requiredFilters: [],
    nextStep: "Readonly modules must stay readonly.",
  },
], [
  {
    moduleId: "readonly-policy-test",
    workspaceId: "reports",
    sectionScoped: false,
    actionCapabilities: {
      open: "view",
      list: "view",
      edit: "edit",
    },
    reason: "Intentional readonly write grant.",
  },
]).map((issue) => issue.code), [
  "access_policy_readonly_grants_write",
]);

const accessReviewIssues = reviewAccessMatrixGrants([
  {
    ...currentGrant,
    id: "contractor-edit",
    roleId: "contractor",
    sectionId: "baktay",
    canEdit: true,
    canExport: true,
  },
  {
    ...currentGrant,
    id: "unscoped-taxer",
    sectionId: undefined,
    moduleId: "taxation-waybills",
  },
  {
    ...currentGrant,
    id: "report-edit",
    workspaceId: "reports",
    moduleId: "prepared-reports",
    canEdit: true,
  },
  {
    ...currentGrant,
    id: "duplicate-a",
    userId: "user-2",
    roleId: undefined,
  },
  {
    ...currentGrant,
    id: "duplicate-b",
    userId: "user-2",
    roleId: undefined,
  },
  {
    ...currentGrant,
    id: "admin-no-reason",
    roleId: "system-admin",
    canAdmin: true,
    reason: undefined,
  },
]);
assert.deepEqual(accessReviewIssues.map((issue) => issue.code), [
  "contractor_elevated_access",
  "contractor_export_access",
  "section_scope_missing",
  "module_capability_not_supported",
  "elevated_reason_missing",
  "duplicate_grant_scope",
]);
assert.deepEqual(summarizeAccessMatrixReviewIssues(accessReviewIssues), {
  total: 6,
  blocker: 2,
  warning: 4,
});

console.log("Access control domain checks passed");
