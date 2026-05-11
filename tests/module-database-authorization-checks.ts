import assert from "node:assert/strict";
import {
  createModuleDatabaseAuthorizationContext,
  getModuleDatabaseAuthorizationGaps,
  getModuleDatabaseAuthorizationRequirement,
  listModuleDatabaseAuthorizationRequirements,
  resolveModuleDatabaseSectionId,
} from "../lib/domain/data-access/moduleDatabaseAuthorization";
import {
  createModuleDatabaseAuthorizationEnvelope,
  validateModuleDatabaseAuthorizationEnvelopeDraft,
} from "../lib/domain/data-access/moduleDatabaseAuthorizationEnvelope";

assert.equal(getModuleDatabaseAuthorizationGaps().length, 0);

const waybillListRequirement = getModuleDatabaseAuthorizationRequirement({
  resource: "taxation",
  action: "list-waybills",
});
assert.ok(waybillListRequirement);
assert.equal(waybillListRequirement.moduleId, "taxation-waybills");
assert.equal(waybillListRequirement.workspaceId, "taxation");
assert.equal(waybillListRequirement.accessAction, "list");
assert.equal(waybillListRequirement.requiredCapability, "view");
assert.equal(waybillListRequirement.sectionScoped, true);
assert.equal(waybillListRequirement.requiresAccessMatrix, true);

const waybillPatchRequirement = getModuleDatabaseAuthorizationRequirement({
  resource: "taxation",
  action: "patch-waybill",
});
assert.ok(waybillPatchRequirement);
assert.equal(waybillPatchRequirement.accessAction, "edit");
assert.equal(waybillPatchRequirement.requiredCapability, "edit");

const reportsExportRequirement = getModuleDatabaseAuthorizationRequirement({
  resource: "reports",
  action: "create-report-export-request",
});
assert.ok(reportsExportRequirement);
assert.equal(reportsExportRequirement.moduleId, "prepared-reports");
assert.equal(reportsExportRequirement.requiredCapability, "export");

const shiftImportRequirement = getModuleDatabaseAuthorizationRequirement({
  resource: "dispatch",
  action: "stage-shift-report-import",
});
assert.ok(shiftImportRequirement);
assert.equal(shiftImportRequirement.moduleId, "mining-shift-reports");
assert.equal(shiftImportRequirement.accessAction, "edit");
assert.equal(shiftImportRequirement.requiredCapability, "edit");
assert.equal(shiftImportRequirement.sectionScoped, true);

const accessAdminRequirement = getModuleDatabaseAuthorizationRequirement({
  resource: "admin",
  action: "admin-access-grant",
});
assert.ok(accessAdminRequirement);
assert.equal(accessAdminRequirement.accessAction, "admin");
assert.equal(accessAdminRequirement.requiredCapability, "admin");
assert.equal(accessAdminRequirement.sectionScoped, false);

assert.equal(getModuleDatabaseAuthorizationRequirement({
  resource: "pto",
  action: "load",
}), undefined);
assert.equal(getModuleDatabaseAuthorizationRequirement({
  resource: "taxation",
  action: "unknown-action",
}), undefined);

assert.deepEqual(
  listModuleDatabaseAuthorizationRequirements("smts-gps").map((requirement) => requirement.moduleId),
  [
    "smts-vehicle-cards",
    "smts-vehicle-cards",
    "smts-vehicle-cards",
    "smts-vehicle-cards",
    "smts-fuel-drains",
    "smts-fuel-drains",
    "smts-fuel-drains",
    "smts-fuel-drains",
    "smts-fuel-drains",
    "smts-vehicle-cards",
  ],
);
assert.ok(listModuleDatabaseAuthorizationRequirements().length > 40);

assert.equal(resolveModuleDatabaseSectionId({
  scope: { sectionId: "baktay" },
}), "baktay");
assert.equal(resolveModuleDatabaseSectionId({
  query: { filters: { section_id: "aktogay" } },
}), "aktogay");
assert.equal(resolveModuleDatabaseSectionId({
  data: { sectionId: "kounrad" },
}), "kounrad");
assert.equal(resolveModuleDatabaseSectionId({
  data: { section_id: "sayak" },
}), "sayak");
assert.equal(resolveModuleDatabaseSectionId({
  query: { filters: { section_id: "" } },
  data: { sectionId: " fallback " },
}), "fallback");
assert.equal(resolveModuleDatabaseSectionId(undefined), undefined);

const waybillAuthorizationContext = createModuleDatabaseAuthorizationContext({
  resource: "taxation",
  action: "list-waybills",
  payload: {
    query: { filters: { section_id: "baktay" } },
  },
});
assert.ok(waybillAuthorizationContext);
assert.equal(waybillAuthorizationContext.requirement.moduleId, "taxation-waybills");
assert.equal(waybillAuthorizationContext.sectionId, "baktay");
assert.deepEqual(waybillAuthorizationContext.scope, {
  workspaceId: "taxation",
  moduleId: "taxation-waybills",
  sectionId: "baktay",
});
assert.equal(waybillAuthorizationContext.missingSectionScope, false);

const viewAccess = {
  canView: true,
  canEdit: false,
  canApprove: false,
  canDelete: false,
  canExport: false,
  canAdmin: false,
  matchedGrantIds: ["grant-view-baktay"],
};

const waybillAuthorizationEnvelope = createModuleDatabaseAuthorizationEnvelope({
  request: {
    resource: "taxation",
    action: "list-waybills",
    payload: {
      query: { filters: { section_id: "baktay" } },
    },
  },
  access: viewAccess,
});
assert.equal(waybillAuthorizationEnvelope.ok, true);
if (waybillAuthorizationEnvelope.ok) {
  assert.equal(waybillAuthorizationEnvelope.envelope.moduleId, "taxation-waybills");
  assert.equal(waybillAuthorizationEnvelope.envelope.requiredCapability, "view");
  assert.equal(waybillAuthorizationEnvelope.envelope.sectionId, "baktay");
  assert.equal(waybillAuthorizationEnvelope.envelope.accessMatrixRequired, true);
  assert.deepEqual(waybillAuthorizationEnvelope.envelope.matchedGrantIds, ["grant-view-baktay"]);
}

assert.deepEqual(validateModuleDatabaseAuthorizationEnvelopeDraft({
  request: {
    resource: "taxation",
    action: "patch-waybill",
    payload: {
      query: { filters: { section_id: "baktay" } },
    },
  },
  access: viewAccess,
}).map((issue) => issue.code), ["access_denied"]);

const missingWaybillSectionContext = createModuleDatabaseAuthorizationContext({
  resource: "taxation",
  action: "list-waybills",
  payload: { query: { filters: {} } },
});
assert.ok(missingWaybillSectionContext);
assert.equal(missingWaybillSectionContext.missingSectionScope, true);

const shiftImportAuthorizationContext = createModuleDatabaseAuthorizationContext({
  resource: "dispatch",
  action: "stage-shift-report-import",
  payload: {
    scope: { sectionId: "baktay" },
  },
});
assert.ok(shiftImportAuthorizationContext);
assert.equal(shiftImportAuthorizationContext.requirement.moduleId, "mining-shift-reports");
assert.equal(shiftImportAuthorizationContext.requirement.requiredCapability, "edit");
assert.equal(shiftImportAuthorizationContext.sectionId, "baktay");
assert.equal(shiftImportAuthorizationContext.missingSectionScope, false);

assert.deepEqual(validateModuleDatabaseAuthorizationEnvelopeDraft({
  request: {
    resource: "taxation",
    action: "list-waybills",
    payload: { query: { filters: {} } },
  },
  access: viewAccess,
}).map((issue) => issue.code), ["missing_section_scope"]);

const adminAuthorizationContext = createModuleDatabaseAuthorizationContext({
  resource: "admin",
  action: "admin-access-grant",
  payload: {},
});
assert.ok(adminAuthorizationContext);
assert.equal(adminAuthorizationContext.requirement.sectionScoped, false);
assert.equal(adminAuthorizationContext.missingSectionScope, false);

assert.equal(createModuleDatabaseAuthorizationContext({
  resource: "pto",
  action: "load",
  payload: {},
}), undefined);

console.log("Module database authorization checks passed");
