import assert from "node:assert/strict";
import {
  getMissingPatchMutationPlans,
  getModulePatchMutationPlan,
  getPatchMutationPlansMissingSectionScopeForSectionScopedPolicies,
  getPatchMutationPlansWithRouteMetadataMismatch,
  getPatchMutationPlansWithoutRouteAction,
  getPatchMutationPlansWithoutVersionHistory,
  getPatchPersistenceContractsWithoutMutationPlan,
  getUnsafePatchMutationPlanIdentifiers,
  listModulePatchMutationPlans,
  listRequiredPatchMutationActions,
  modulePatchMutationPlans,
  validateModulePatchPayload,
} from "../lib/domain/data-access/modulePatchMutationPlans";
import {
  createServerPatchMutationEnvelope,
  validateServerPatchMutationDraft,
} from "../lib/domain/data-access/patchMutationEnvelope";
import { createServerChangeHistoryEnvelope } from "../lib/domain/audit/changeHistoryEnvelope";
import {
  createServerPatchWriteTransactionEnvelope,
  validateServerPatchWriteTransactionDraft,
} from "../lib/domain/data-access/writeTransactionEnvelope";

const requiredPatchActions = listRequiredPatchMutationActions();

assert.equal(modulePatchMutationPlans.length, requiredPatchActions.length);
assert.equal(getMissingPatchMutationPlans().length, 0);
assert.equal(getPatchMutationPlansWithoutRouteAction().length, 0);
assert.equal(getPatchMutationPlansWithRouteMetadataMismatch().length, 0);
assert.equal(getPatchMutationPlansWithoutVersionHistory().length, 0);
assert.equal(getPatchMutationPlansMissingSectionScopeForSectionScopedPolicies().length, 0);
assert.equal(getUnsafePatchMutationPlanIdentifiers().length, 0);
assert.equal(getPatchPersistenceContractsWithoutMutationPlan().length, 0);

const waybillPatch = getModulePatchMutationPlan("taxation-waybills", "edit");
assert.ok(waybillPatch);
assert.equal(waybillPatch.resource, "taxation");
assert.equal(waybillPatch.databaseAction, "patch-waybill");
assert.equal(waybillPatch.tableName, "taxation_waybills");
assert.equal(waybillPatch.idColumn, "id");
assert.equal(waybillPatch.versionColumn, "version");
assert.equal(waybillPatch.updatedAtColumn, "updated_at");
assert.equal(waybillPatch.updatedByColumn, "updated_by");
assert.equal(waybillPatch.statusColumn, "status");
assert.deepEqual(waybillPatch.scopeColumns, { section_id: "section_id" });
assert.equal(waybillPatch.patchOnly, true);
assert.equal(waybillPatch.requiresExpectedVersion, true);
assert.equal(waybillPatch.writesChangeHistory, true);
assert.ok(waybillPatch.allowedFieldGroups.includes("driver"));
assert.ok(waybillPatch.allowedFieldGroups.includes("vehicle"));
assert.deepEqual(validateModulePatchPayload(waybillPatch, {
  entityType: "waybill",
  entity: { id: "waybill-1", version: 3 },
  changes: [
    { field: "shift", previousValue: "day", nextValue: "night" },
    { field: "driverId", previousValue: "driver-1", nextValue: "driver-2" },
  ],
}), []);
assert.deepEqual(validateModulePatchPayload(waybillPatch, {
  entityType: "waybill",
  entity: { id: "waybill-1", version: 3 },
  changes: [{ field: "fuelLiters", previousValue: 10, nextValue: 20 }],
}).map((issue) => issue.code), ["patch_field_not_allowed"]);

const waybillPatchEnvelope = createServerPatchMutationEnvelope({
  moduleId: "taxation-waybills",
  action: "edit",
  patch: {
    entityType: "waybill",
    entity: { id: "waybill-1", version: 3 },
    changes: [{ field: "driverId", previousValue: "driver-1", nextValue: "driver-2" }],
    reason: "driver replacement",
  },
});
assert.equal(waybillPatchEnvelope.ok, true);
if (waybillPatchEnvelope.ok) {
  assert.equal(waybillPatchEnvelope.envelope.executionMode, "server-only");
  assert.equal(waybillPatchEnvelope.envelope.patchOnly, true);
  assert.equal(waybillPatchEnvelope.envelope.writesChangeHistory, true);
  assert.equal(waybillPatchEnvelope.envelope.expectedVersion, 3);
  assert.equal(waybillPatchEnvelope.envelope.entityId, "waybill-1");
  assert.equal(waybillPatchEnvelope.envelope.changeCount, 1);
  assert.equal(waybillPatchEnvelope.envelope.databaseAction, "patch-waybill");
}

const waybillHistoryEnvelope = waybillPatchEnvelope.ok
  ? createServerChangeHistoryEnvelope({
      id: "history-batch-1",
      workspaceId: "taxation",
      entityType: "waybill",
      entity: { id: "waybill-1", version: 4 },
      changes: waybillPatchEnvelope.envelope.patch.changes,
      changedAt: "2026-05-09T09:00:00.000Z",
      changedBy: "dispatcher-1",
      reasonKind: "user_edit",
      reasonText: "driver replacement",
      capability: "edit",
    })
  : undefined;
assert.equal(waybillHistoryEnvelope?.ok, true);

const waybillTransactionEnvelope = waybillPatchEnvelope.ok && waybillHistoryEnvelope?.ok
  ? createServerPatchWriteTransactionEnvelope({
      actorId: "dispatcher-1",
      patchEnvelope: waybillPatchEnvelope.envelope,
      historyEnvelope: waybillHistoryEnvelope.envelope,
    })
  : undefined;
assert.equal(waybillTransactionEnvelope?.ok, true);
if (waybillTransactionEnvelope?.ok) {
  assert.equal(waybillTransactionEnvelope.envelope.transactionKind, "versioned-patch-with-history");
  assert.equal(waybillTransactionEnvelope.envelope.atomic, true);
  assert.equal(waybillTransactionEnvelope.envelope.maxEntityRowWrites, 1);
  if (waybillTransactionEnvelope.envelope.transactionKind === "versioned-patch-with-history") {
    assert.equal(waybillTransactionEnvelope.envelope.expectedVersion, 3);
    assert.equal(waybillTransactionEnvelope.envelope.nextVersion, 4);
  }
  assert.equal(waybillTransactionEnvelope.envelope.writesChangeHistory, true);
  assert.deepEqual(waybillTransactionEnvelope.envelope.steps.map((step) => step.kind), [
    "entity-patch",
    "change-history",
  ]);
}

assert.deepEqual(
  waybillPatchEnvelope.ok && waybillHistoryEnvelope?.ok
    ? validateServerPatchWriteTransactionDraft({
        actorId: "other-user",
        patchEnvelope: waybillPatchEnvelope.envelope,
        historyEnvelope: {
          ...waybillHistoryEnvelope.envelope,
          entityVersion: 3,
        },
      }).map((issue) => issue.code)
    : [],
  ["actor_mismatch", "version_mismatch"],
);

assert.deepEqual(validateServerPatchMutationDraft({
  moduleId: "taxation-waybills",
  action: "edit",
  patch: {
    entityType: "waybill",
    entity: { id: "", version: 0 },
    changes: [{ field: "rows", nextValue: [] }],
  },
}).map((issue) => issue.code), [
  "entity_id_required",
  "version_required",
  "whole_table_patch_forbidden",
  "patch_field_not_allowed",
]);

const waybillTransition = getModulePatchMutationPlan("taxation-waybills", "approve");
assert.ok(waybillTransition);
assert.equal(waybillTransition.databaseAction, "transition-waybill");
assert.deepEqual(waybillTransition.allowedFieldGroups, ["status"]);

assert.deepEqual(validateServerPatchMutationDraft({
  moduleId: "taxation-waybills",
  action: "approve",
  patch: {
    entityType: "waybill",
    entity: { id: "waybill-1", version: 3 },
    changes: [{ field: "status", previousValue: "created", nextValue: "printed" }],
  },
}).map((issue) => issue.code), ["reason_required"]);

assert.deepEqual(listModulePatchMutationPlans("fleet").map((plan) => `${plan.moduleId}:${plan.action}`), [
  "fleet-movements:edit",
  "fleet-movements:approve",
  "service-vehicle:edit",
]);

assert.deepEqual(listModulePatchMutationPlans("admin").map((plan) => plan.action), [
  "edit",
  "delete",
  "admin",
]);

assert.equal(getModulePatchMutationPlan("prepared-reports"), undefined);
assert.equal(getModulePatchMutationPlan("ai-on-demand"), undefined);
assert.deepEqual(getPatchMutationPlansWithRouteMetadataMismatch([
  {
    ...waybillPatch,
    workspaceId: "fleet",
    resource: "fleet",
  },
]).map((issue) => issue.code), [
  "patch_mutation_plan_route_metadata_mismatch",
  "patch_mutation_plan_route_metadata_mismatch",
]);
assert.deepEqual(getPatchMutationPlansMissingSectionScopeForSectionScopedPolicies(undefined, [
  {
    ...waybillPatch,
    scopeColumns: {},
  },
]).map((issue) => issue.code), ["patch_mutation_plan_missing_section_scope"]);

console.log("Module patch mutation plans checks passed");
