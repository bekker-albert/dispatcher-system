import assert from "node:assert/strict";
import {
  getCreateMutationPlansMissingSectionScopeForSectionScopedPolicies,
  getCreateMutationPlansWithRouteMetadataMismatch,
  getCreateMutationPlansWithoutDuplicateKeys,
  getCreateMutationPlansWithoutRouteAction,
  getCreateMutationPlansWithoutVersionHistory,
  getMissingCreateMutationPlans,
  getModuleCreateMutationPlan,
  getUnsafeCreateMutationPlanIdentifiers,
  listModuleCreateMutationPlans,
  listRequiredCreateMutationActions,
  moduleCreateMutationPlans,
  validateModuleCreatePayload,
} from "../lib/domain/data-access/moduleCreateMutationPlans";
import {
  createServerCreateMutationEnvelope,
  validateServerCreateMutationDraft,
} from "../lib/domain/data-access/createMutationEnvelope";
import { createServerChangeHistoryEnvelope } from "../lib/domain/audit/changeHistoryEnvelope";
import {
  createServerCreateWriteTransactionEnvelope,
  validateServerCreateWriteTransactionDraft,
} from "../lib/domain/data-access/writeTransactionEnvelope";

const requiredCreateActions = listRequiredCreateMutationActions();
assert.equal(moduleCreateMutationPlans.length, requiredCreateActions.length);
assert.equal(getMissingCreateMutationPlans().length, 0);
assert.equal(getCreateMutationPlansWithoutRouteAction().length, 0);
assert.equal(getCreateMutationPlansWithRouteMetadataMismatch().length, 0);
assert.equal(getCreateMutationPlansWithoutVersionHistory().length, 0);
assert.equal(getCreateMutationPlansWithoutDuplicateKeys().length, 0);
assert.equal(getCreateMutationPlansMissingSectionScopeForSectionScopedPolicies().length, 0);
assert.equal(getUnsafeCreateMutationPlanIdentifiers().length, 0);

const waybillPlan = getModuleCreateMutationPlan("taxation-waybills");
assert.ok(waybillPlan);
assert.equal(waybillPlan.databaseAction, "create-waybill");
assert.equal(waybillPlan.tableName, "taxation_waybills");
assert.equal(waybillPlan.initialVersion, 1);
assert.equal(waybillPlan.initialStatus, "created");
assert.deepEqual(waybillPlan.duplicateKeyGroups, [
  ["work_date", "section_id", "shift", "driver_id"],
  ["work_date", "section_id", "shift", "vehicle_id"],
]);
assert.deepEqual(waybillPlan.scopeColumns, { section_id: "section_id" });
assert.equal(waybillPlan.requiredFieldGroups.includes("driver"), true);
assert.equal(waybillPlan.writesChangeHistory, true);
assert.equal(waybillPlan.returnsCreatedEntityId, true);
assert.deepEqual(validateModuleCreatePayload(waybillPlan, {
  workDate: "2026-05-08",
  sectionId: "baktay",
  shift: "day",
  driverId: "driver-1",
  vehicleId: "vehicle-1",
}), []);
assert.deepEqual(validateModuleCreatePayload(waybillPlan, {
  workDate: "2026-05-08",
  sectionId: "baktay",
  shift: "day",
}).map((issue) => issue.field), ["driver", "vehicle"]);

const waybillCreateEnvelope = createServerCreateMutationEnvelope({
  moduleId: "taxation-waybills",
  data: {
    workDate: "2026-05-08",
    sectionId: "baktay",
    shift: "day",
    driverId: "driver-1",
    vehicleId: "vehicle-1",
  },
});
assert.equal(waybillCreateEnvelope.ok, true);
if (waybillCreateEnvelope.ok) {
  assert.equal(waybillCreateEnvelope.envelope.executionMode, "server-only");
  assert.equal(waybillCreateEnvelope.envelope.initialVersion, 1);
  assert.equal(waybillCreateEnvelope.envelope.initialStatus, "created");
  assert.equal(waybillCreateEnvelope.envelope.duplicateCheckRequired, true);
  assert.equal(waybillCreateEnvelope.envelope.returnsCreatedEntityId, true);
  assert.equal(waybillCreateEnvelope.envelope.writesChangeHistory, true);
  assert.equal(waybillCreateEnvelope.envelope.databaseAction, "create-waybill");
}

const waybillCreateHistoryEnvelope = waybillCreateEnvelope.ok
  ? createServerChangeHistoryEnvelope({
      id: "history-batch-create-waybill-1",
      workspaceId: "taxation",
      entityType: "waybill",
      entity: { id: "waybill-created-1", version: 1 },
      changes: Object.entries(waybillCreateEnvelope.envelope.data).map(([field, nextValue]) => ({
        field,
        nextValue,
      })),
      changedAt: "2026-05-09T10:00:00.000Z",
      changedBy: "dispatcher-1",
      reasonKind: "user_edit",
      reasonText: "create waybill",
      capability: "edit",
    })
  : undefined;
assert.equal(waybillCreateHistoryEnvelope?.ok, true);

const waybillCreateTransactionEnvelope = waybillCreateEnvelope.ok && waybillCreateHistoryEnvelope?.ok
  ? createServerCreateWriteTransactionEnvelope({
      actorId: "dispatcher-1",
      generatedEntityId: "waybill-created-1",
      createEnvelope: waybillCreateEnvelope.envelope,
      historyEnvelope: waybillCreateHistoryEnvelope.envelope,
    })
  : undefined;
assert.equal(waybillCreateTransactionEnvelope?.ok, true);
if (waybillCreateTransactionEnvelope?.ok) {
  assert.equal(waybillCreateTransactionEnvelope.envelope.transactionKind, "versioned-create-with-history");
  assert.equal(waybillCreateTransactionEnvelope.envelope.atomic, true);
  assert.equal(waybillCreateTransactionEnvelope.envelope.initialVersion, 1);
  assert.equal(waybillCreateTransactionEnvelope.envelope.duplicateCheckRequired, true);
  assert.equal(waybillCreateTransactionEnvelope.envelope.maxEntityRowWrites, 1);
  assert.deepEqual(waybillCreateTransactionEnvelope.envelope.steps.map((step) => step.kind), [
    "duplicate-check",
    "entity-insert",
    "change-history",
  ]);
}

assert.deepEqual(
  waybillCreateEnvelope.ok && waybillCreateHistoryEnvelope?.ok
    ? validateServerCreateWriteTransactionDraft({
        actorId: "dispatcher-1",
        generatedEntityId: "other-waybill",
        createEnvelope: waybillCreateEnvelope.envelope,
        historyEnvelope: waybillCreateHistoryEnvelope.envelope,
      }).map((issue) => issue.code)
    : [],
  ["history_entity_mismatch"],
);

assert.deepEqual(validateServerCreateMutationDraft({
  moduleId: "taxation-waybills",
  data: {
    workDate: "2026-05-08",
    sectionId: "baktay",
    shift: "day",
    rows: [],
  },
}).map((issue) => issue.code), [
  "whole_table_create_forbidden",
  "create_field_group_missing",
  "create_field_group_missing",
]);

assert.deepEqual(validateServerCreateMutationDraft({
  moduleId: "unknown-module",
  data: {},
}).map((issue) => issue.code), ["create_plan_missing"]);

assert.deepEqual(listModuleCreateMutationPlans("fleet").map((plan) => plan.moduleId), [
  "fleet-movements",
  "service-vehicle",
]);
assert.equal(getModuleCreateMutationPlan("prepared-reports"), undefined);
assert.equal(getModuleCreateMutationPlan("ai-on-demand"), undefined);
assert.deepEqual(getCreateMutationPlansWithRouteMetadataMismatch([
  {
    ...waybillPlan,
    workspaceId: "fleet",
    resource: "fleet",
  },
]).map((issue) => issue.code), [
  "create_mutation_plan_route_metadata_mismatch",
  "create_mutation_plan_route_metadata_mismatch",
]);
assert.deepEqual(getCreateMutationPlansMissingSectionScopeForSectionScopedPolicies(undefined, [
  {
    ...waybillPlan,
    scopeColumns: {},
  },
]).map((issue) => issue.code), ["create_mutation_plan_missing_section_scope"]);

console.log("Module create mutation plans checks passed");
