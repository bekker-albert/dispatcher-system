import assert from "node:assert/strict";
import type { EffectiveAccessDecision } from "../lib/domain/access-control/effectivePermissions";
import { createWorkspaceModuleDatabaseRequest } from "../lib/domain/data-access/moduleDatabaseRequests";
import type { ServerPageQuery } from "../lib/domain/data-access/pagination";

const editApproveExportAccess: EffectiveAccessDecision = {
  canView: true,
  canEdit: true,
  canApprove: true,
  canDelete: false,
  canExport: true,
  canAdmin: false,
  matchedGrantIds: ["grant-edit-approve-export"],
};

const viewOnlyAccess: EffectiveAccessDecision = {
  canView: true,
  canEdit: false,
  canApprove: false,
  canDelete: false,
  canExport: false,
  canAdmin: false,
  matchedGrantIds: ["grant-view"],
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

const listRequest = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "list",
  access: editApproveExportAccess,
  query: boundedWaybillQuery,
  requestId: "request-1",
  actorUserId: "user-1",
});
assert.equal(listRequest.ok, true);
if (listRequest.ok) {
  assert.equal(listRequest.request.endpoint, "/api/database");
  assert.equal(listRequest.request.resource, "taxation");
  assert.equal(listRequest.request.action, "list-waybills");
  assert.equal(listRequest.request.payload.moduleId, "taxation-waybills");
  assert.equal(listRequest.request.payload.workspaceId, "taxation");
  assert.equal(listRequest.request.payload.accessAction, "list");
  assert.equal(listRequest.request.payload.query, boundedWaybillQuery);
  assert.equal(listRequest.request.payload.scope?.sectionId, "baktay");
  assert.deepEqual(listRequest.request.payload.data, {});
  assert.equal(listRequest.request.payload.requestMeta?.requestId, "request-1");
  assert.equal(listRequest.preflight.databaseAction, "list-waybills");
}

const boundedWaybillExportQuery: ServerPageQuery = {
  ...boundedWaybillQuery,
  filters: {
    ...boundedWaybillQuery.filters,
    shift: "day",
  },
};

const exportWithoutFormat = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "export",
  access: editApproveExportAccess,
  query: boundedWaybillExportQuery,
});
assert.equal(exportWithoutFormat.ok, false);
if (!exportWithoutFormat.ok) {
  assert.deepEqual(exportWithoutFormat.failures.map((failure) => failure.code), ["export_format_required"]);
}

const exportWithUnsupportedFormat = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "export",
  access: editApproveExportAccess,
  query: boundedWaybillExportQuery,
  data: { format: "zip" },
});
assert.equal(exportWithUnsupportedFormat.ok, false);
if (!exportWithUnsupportedFormat.ok) {
  assert.deepEqual(exportWithUnsupportedFormat.failures.map((failure) => failure.code), ["export_format_unsupported"]);
}

const exportRequest = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "export",
  access: editApproveExportAccess,
  query: boundedWaybillExportQuery,
  data: { format: "xlsx" },
});
assert.equal(exportRequest.ok, true);
if (exportRequest.ok) {
  assert.equal(exportRequest.request.resource, "taxation");
  assert.equal(exportRequest.request.action, "export-waybills");
  assert.equal(exportRequest.request.payload.data.format, "xlsx");
  assert.equal(exportRequest.request.payload.scope?.sectionId, "baktay");
}

const editWithoutPatch = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "edit",
  access: editApproveExportAccess,
  sectionId: "baktay",
});
assert.equal(editWithoutPatch.ok, false);
if (!editWithoutPatch.ok) {
  assert.deepEqual(editWithoutPatch.failures.map((failure) => failure.code), ["patch_payload_required"]);
}

const editWithEmptyPatch = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "edit",
  access: editApproveExportAccess,
  sectionId: "baktay",
  patch: {
    entityType: "waybill",
    entity: { id: "waybill-1", version: 3 },
    changes: [],
  },
});
assert.equal(editWithEmptyPatch.ok, false);
if (!editWithEmptyPatch.ok) {
  assert.deepEqual(editWithEmptyPatch.failures.map((failure) => failure.code), ["patch_payload_empty"]);
}

const editWithUnsupportedField = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "edit",
  access: editApproveExportAccess,
  sectionId: "baktay",
  patch: {
    entityType: "waybill",
    entity: { id: "waybill-1", version: 3 },
    changes: [{ field: "fuelLiters", previousValue: 10, nextValue: 20 }],
  },
});
assert.equal(editWithUnsupportedField.ok, false);
if (!editWithUnsupportedField.ok) {
  assert.deepEqual(editWithUnsupportedField.failures.map((failure) => failure.code), ["patch_field_not_allowed"]);
  assert.deepEqual(editWithUnsupportedField.failures.map((failure) => failure.field), ["patch.changes.fuelLiters"]);
}

const editWithPatch = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "edit",
  access: editApproveExportAccess,
  sectionId: "baktay",
  patch: {
    entityType: "waybill",
    entity: { id: "waybill-1", version: 3 },
    changes: [{ field: "shift", previousValue: "day", nextValue: "night" }],
    reason: "driver replacement",
  },
  reason: "driver replacement",
});
assert.equal(editWithPatch.ok, true);
if (editWithPatch.ok) {
  assert.equal(editWithPatch.request.resource, "taxation");
  assert.equal(editWithPatch.request.action, "patch-waybill");
  assert.equal(editWithPatch.request.payload.patch?.entity.version, 3);
  assert.equal(editWithPatch.request.payload.patch?.changes[0]?.field, "shift");
  assert.equal(editWithPatch.request.payload.scope?.sectionId, "baktay");
  assert.equal(editWithPatch.request.payload.requestMeta?.reason, "driver replacement");
}

const fleetApproveWithoutReason = createWorkspaceModuleDatabaseRequest({
  moduleId: "fleet-movements",
  action: "approve",
  access: editApproveExportAccess,
  sectionId: "baktay",
  patch: {
    entityType: "vehicle_movement",
    entity: { id: "movement-1", version: 2 },
    changes: [{ field: "status", previousValue: "approval", nextValue: "approved" }],
  },
});
assert.equal(fleetApproveWithoutReason.ok, false);
if (!fleetApproveWithoutReason.ok) {
  assert.deepEqual(fleetApproveWithoutReason.failures.map((failure) => failure.code), ["workflow_reason_required"]);
}

const fleetApproveInvalidTransition = createWorkspaceModuleDatabaseRequest({
  moduleId: "fleet-movements",
  action: "approve",
  access: editApproveExportAccess,
  sectionId: "baktay",
  reason: "skip approval",
  patch: {
    entityType: "vehicle_movement",
    entity: { id: "movement-1", version: 2 },
    changes: [{ field: "status", previousValue: "draft", nextValue: "approved" }],
    reason: "skip approval",
  },
});
assert.equal(fleetApproveInvalidTransition.ok, false);
if (!fleetApproveInvalidTransition.ok) {
  assert.deepEqual(fleetApproveInvalidTransition.failures.map((failure) => failure.code), [
    "workflow_transition_not_allowed",
  ]);
}

const fleetApproveWithReason = createWorkspaceModuleDatabaseRequest({
  moduleId: "fleet-movements",
  action: "approve",
  access: editApproveExportAccess,
  sectionId: "baktay",
  reason: "section approved",
  patch: {
    entityType: "vehicle_movement",
    entity: { id: "movement-1", version: 2 },
    changes: [{ field: "status", previousValue: "approval", nextValue: "approved" }],
    reason: "section approved",
  },
});
assert.equal(fleetApproveWithReason.ok, true);
if (fleetApproveWithReason.ok) {
  assert.equal(fleetApproveWithReason.request.action, "transition-vehicle-movement");
  assert.equal(fleetApproveWithReason.request.payload.patch?.changes[0]?.nextValue, "approved");
}

const createMissingRequiredFields = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "create",
  access: editApproveExportAccess,
  data: {
    sectionId: "baktay",
    shift: "day",
  },
});
assert.equal(createMissingRequiredFields.ok, false);
if (!createMissingRequiredFields.ok) {
  assert.deepEqual(createMissingRequiredFields.failures.map((failure) => failure.code), [
    "create_field_group_missing",
    "create_field_group_missing",
    "create_field_group_missing",
  ]);
  assert.deepEqual(createMissingRequiredFields.failures.map((failure) => failure.field), [
    "data.date",
    "data.driver",
    "data.vehicle",
  ]);
}

const createRequest = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "create",
  access: editApproveExportAccess,
  sectionId: "baktay",
  data: {
    workDate: "2026-05-08",
    shift: "day",
    driverId: "driver-1",
    vehicleId: "vehicle-1",
  },
});
assert.equal(createRequest.ok, true);
if (createRequest.ok) {
  assert.equal(createRequest.request.action, "create-waybill");
  assert.deepEqual(createRequest.request.payload.data, {
    workDate: "2026-05-08",
    shift: "day",
    driverId: "driver-1",
    vehicleId: "vehicle-1",
  });
  assert.equal(createRequest.request.payload.scope?.sectionId, "baktay");
}

const sectionScopedWithoutSection = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "create",
  access: editApproveExportAccess,
  data: {
    shift: "day",
  },
});
assert.equal(sectionScopedWithoutSection.ok, false);
if (!sectionScopedWithoutSection.ok) {
  assert.deepEqual(sectionScopedWithoutSection.failures.map((failure) => failure.code), [
    "section_scope_required",
    "create_field_group_missing",
    "create_field_group_missing",
    "create_field_group_missing",
    "create_field_group_missing",
  ]);
  assert.deepEqual(sectionScopedWithoutSection.failures.map((failure) => failure.field), [
    "sectionId",
    "data.date",
    "data.section",
    "data.driver",
    "data.vehicle",
  ]);
}

const deniedEdit = createWorkspaceModuleDatabaseRequest({
  moduleId: "taxation-waybills",
  action: "edit",
  access: viewOnlyAccess,
  sectionId: "baktay",
  patch: {
    entityType: "waybill",
    entity: { id: "waybill-1", version: 3 },
    changes: [{ field: "shift", previousValue: "day", nextValue: "night" }],
  },
});
assert.equal(deniedEdit.ok, false);
if (!deniedEdit.ok) {
  assert.deepEqual(deniedEdit.failures.map((failure) => failure.code), ["access_denied"]);
}

const aiOpenRequest = createWorkspaceModuleDatabaseRequest({
  moduleId: "ai-on-demand",
  action: "open",
  access: editApproveExportAccess,
});
assert.equal(aiOpenRequest.ok, true);
if (aiOpenRequest.ok) {
  assert.equal(aiOpenRequest.request.resource, "ai-assistant");
  assert.equal(aiOpenRequest.request.action, "load-ai-context");
}

console.log("Module database requests checks passed");
