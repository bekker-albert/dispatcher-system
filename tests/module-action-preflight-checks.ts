import assert from "node:assert/strict";
import type { EffectiveAccessDecision } from "../lib/domain/access-control/effectivePermissions";
import type { ServerPageQuery } from "../lib/domain/data-access/pagination";
import { preflightWorkspaceModuleAction } from "../lib/domain/workspaces/moduleActionPreflight";

const editExportAccess: EffectiveAccessDecision = {
  canView: true,
  canEdit: true,
  canApprove: false,
  canDelete: false,
  canExport: true,
  canAdmin: false,
  matchedGrantIds: ["grant-edit-export"],
};

const boundedWaybillQuery: ServerPageQuery = {
  pageSize: 50,
  filters: {
    date_from: "2026-05-01",
    date_to: "2026-05-15",
    section_id: "baktay",
    status: "created",
  },
};

const acceptedList = preflightWorkspaceModuleAction({
  moduleId: "taxation-waybills",
  action: "list",
  access: editExportAccess,
  query: boundedWaybillQuery,
});
assert.equal(acceptedList.ok, true);
if (acceptedList.ok) {
  assert.equal(acceptedList.moduleItem.workspaceId, "taxation");
  assert.equal(acceptedList.persistenceContract.writeMode, "workflow-patch");
  assert.equal(acceptedList.databaseEndpoint, "/api/database");
  assert.equal(acceptedList.databaseResource, "taxation");
  assert.equal(acceptedList.databaseAction, "list-waybills");
  assert.equal(acceptedList.dataRouteContract.moduleId, "taxation-waybills");
}

const rejectedExportWithoutShift = preflightWorkspaceModuleAction({
  moduleId: "taxation-waybills",
  action: "export",
  access: editExportAccess,
  query: boundedWaybillQuery,
});
assert.equal(rejectedExportWithoutShift.ok, false);
if (!rejectedExportWithoutShift.ok) {
  assert.deepEqual(rejectedExportWithoutShift.failures.map((failure) => failure.code), ["export_query_rejected"]);
  assert.deepEqual(rejectedExportWithoutShift.failures.map((failure) => failure.field), ["shift"]);
}

const acceptedExport = preflightWorkspaceModuleAction({
  moduleId: "taxation-waybills",
  action: "export",
  access: editExportAccess,
  query: {
    ...boundedWaybillQuery,
    filters: {
      ...boundedWaybillQuery.filters,
      shift: "day",
    },
  },
});
assert.equal(acceptedExport.ok, true);
if (acceptedExport.ok) {
  assert.equal(acceptedExport.databaseAction, "export-waybills");
}

const deniedApprove = preflightWorkspaceModuleAction({
  moduleId: "taxation-waybills",
  action: "approve",
  access: editExportAccess,
});
assert.equal(deniedApprove.ok, false);
if (!deniedApprove.ok) {
  assert.deepEqual(deniedApprove.failures.map((failure) => failure.code), ["access_denied"]);
}

const missingQuery = preflightWorkspaceModuleAction({
  moduleId: "taxation-waybills",
  action: "list",
  access: editExportAccess,
});
assert.equal(missingQuery.ok, false);
if (!missingQuery.ok) {
  assert.deepEqual(missingQuery.failures.map((failure) => failure.code), ["query_required"]);
}

const rejectedQuery = preflightWorkspaceModuleAction({
  moduleId: "taxation-waybills",
  action: "list",
  access: editExportAccess,
  query: {
    pageSize: 50,
    filters: {},
    search: "truck",
  },
});
assert.equal(rejectedQuery.ok, false);
if (!rejectedQuery.ok) {
  assert.deepEqual(rejectedQuery.failures.map((failure) => failure.code), [
    "query_rejected",
    "query_rejected",
    "query_rejected",
    "query_rejected",
  ]);
  assert.deepEqual(rejectedQuery.failures.map((failure) => failure.field), [
    "date",
    "section_id",
    "status",
    "search",
  ]);
}

const acceptedOpenWithoutQuery = preflightWorkspaceModuleAction({
  moduleId: "ai-on-demand",
  action: "open",
  access: editExportAccess,
});
assert.equal(acceptedOpenWithoutQuery.ok, true);
if (acceptedOpenWithoutQuery.ok) {
  assert.equal(acceptedOpenWithoutQuery.databaseAction, "load-ai-context");
}

const unsupportedAction = preflightWorkspaceModuleAction({
  moduleId: "prepared-reports",
  action: "edit",
  access: editExportAccess,
});
assert.equal(unsupportedAction.ok, false);
if (!unsupportedAction.ok) {
  assert.deepEqual(unsupportedAction.failures.map((failure) => failure.code), ["action_not_supported"]);
}

const unknownModule = preflightWorkspaceModuleAction({
  moduleId: "unknown-module",
  action: "open",
  access: editExportAccess,
});
assert.equal(unknownModule.ok, false);
if (!unknownModule.ok) {
  assert.deepEqual(unknownModule.failures.map((failure) => failure.code), ["module_not_found"]);
}

console.log("Module action preflight checks passed");
