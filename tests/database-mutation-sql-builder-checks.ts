import assert from "node:assert/strict";
import { createServerChangeHistoryEnvelope } from "../lib/domain/audit/changeHistoryEnvelope";
import { createServerCreateMutationEnvelope } from "../lib/domain/data-access/createMutationEnvelope";
import { getModuleCreateMutationPlan } from "../lib/domain/data-access/moduleCreateMutationPlans";
import { getModulePatchMutationPlan } from "../lib/domain/data-access/modulePatchMutationPlans";
import { createServerPatchMutationEnvelope } from "../lib/domain/data-access/patchMutationEnvelope";
import {
  createDatabaseChangeHistoryInsertSqlPlan,
  createDatabaseCreateDuplicateCheckSqlPlans,
  createDatabaseCreateEntityInsertSqlPlan,
  createDatabasePatchMutationSetSqlPlan,
  createDatabasePatchMutationWhereSqlPlan,
  evaluateDatabaseChangeHistoryInsertResult,
  evaluateDatabaseCreateDuplicateCheckResults,
  evaluateDatabaseCreateEntityInsertResult,
  evaluateDatabasePatchMutationResult,
} from "../lib/server/database/mutation-sql-builder";
import { isDatabasePayloadError } from "../lib/server/database/validation";

const waybillPatchPlan = getModulePatchMutationPlan("taxation-waybills", "edit");
assert.ok(waybillPatchPlan);

const waybillPatchEnvelope = createServerPatchMutationEnvelope({
  moduleId: "taxation-waybills",
  action: "edit",
  patch: {
    entityType: "waybill",
    entity: { id: "waybill-1", version: 3 },
    changes: [{ field: "driverId", previousValue: "driver-1", nextValue: "driver-2" }],
  },
});
assert.equal(waybillPatchEnvelope.ok, true);

if (waybillPatchEnvelope.ok) {
  const wherePlan = createDatabasePatchMutationWhereSqlPlan(
    waybillPatchEnvelope.envelope,
    waybillPatchPlan,
    { sectionId: "baktai" },
  );

  assert.equal(wherePlan.tableSql, "`taxation_waybills`");
  assert.equal(wherePlan.whereSql, "WHERE `id` = ? AND `version` = ? AND `section_id` = ?");
  assert.deepEqual(wherePlan.params, ["waybill-1", 3, "baktai"]);
  assert.deepEqual(wherePlan.scopeColumnKeys, ["section_id"]);
  assert.equal(wherePlan.maxEntityRowWrites, 1);
  assert.equal(wherePlan.requiresExpectedVersion, true);

  const setPlan = createDatabasePatchMutationSetSqlPlan(
    waybillPatchEnvelope.envelope,
    waybillPatchPlan,
    {
      columnValues: { driver_id: "driver-2" },
      updatedAt: "2026-05-09T12:00:00.000Z",
      updatedBy: "dispatcher-1",
    },
  );

  assert.equal(
    setPlan.setSql,
    "SET `driver_id` = ?, `version` = ?, `updated_at` = ?, `updated_by` = ?",
  );
  assert.deepEqual(
    setPlan.params,
    ["driver-2", 4, "2026-05-09T12:00:00.000Z", "dispatcher-1"],
  );
  assert.deepEqual(setPlan.changedColumns, ["driver_id"]);
  assert.equal(setPlan.nextVersion, 4);
  assert.equal(setPlan.maxEntityRowWrites, 1);
  assert.equal(setPlan.writesChangeHistory, true);
  assert.equal(setPlan.forbidsReservedColumnPatch, true);

  const historyEnvelope = createServerChangeHistoryEnvelope({
    id: "history-batch-1",
    workspaceId: "taxation",
    entityType: "waybill",
    entity: { id: "waybill-1", version: 4 },
    changes: [{ field: "driverId", previousValue: "driver-1", nextValue: "driver-2" }],
    changedAt: "2026-05-09T12:00:00.000Z",
    changedBy: "dispatcher-1",
    reasonKind: "user_edit",
    capability: "edit",
  });
  assert.equal(historyEnvelope.ok, true);
  if (historyEnvelope.ok) {
    const historySqlPlan = createDatabaseChangeHistoryInsertSqlPlan(
      historyEnvelope.envelope,
      waybillPatchPlan.changeHistoryEntity,
    );

    assert.equal(historySqlPlan.tableSql, "`change_history_entries`");
    assert.equal(historySqlPlan.rowCount, 1);
    assert.equal(historySqlPlan.expectedRowCount, 1);
    assert.equal(historySqlPlan.writesPerField, true);
    assert.equal(historySqlPlan.maxRows, 100);
    assert.match(historySqlPlan.sql, /^INSERT INTO `change_history_entries`/);
    assert.match(historySqlPlan.sql, /`old_value_json`, `new_value_json`/);
    assert.deepEqual(historySqlPlan.params, [
      "taxation",
      "waybill",
      "waybill-1",
      4,
      "driverId",
      "\"driver-1\"",
      "\"driver-2\"",
      "2026-05-09T12:00:00.000Z",
      "dispatcher-1",
      "user_edit",
      null,
      "edit",
    ]);
  }

  assert.throws(() => createDatabasePatchMutationWhereSqlPlan(
    waybillPatchEnvelope.envelope,
    waybillPatchPlan,
    {},
  ), isDatabasePayloadError);
  assert.throws(() => createDatabasePatchMutationSetSqlPlan(
    waybillPatchEnvelope.envelope,
    waybillPatchPlan,
    {
      columnValues: {},
      updatedAt: "2026-05-09T12:00:00.000Z",
      updatedBy: "dispatcher-1",
    },
  ), isDatabasePayloadError);
  assert.throws(() => createDatabasePatchMutationSetSqlPlan(
    waybillPatchEnvelope.envelope,
    waybillPatchPlan,
    {
      columnValues: { id: "other-waybill" },
      updatedAt: "2026-05-09T12:00:00.000Z",
      updatedBy: "dispatcher-1",
    },
  ), isDatabasePayloadError);
  assert.throws(() => createDatabasePatchMutationSetSqlPlan(
    waybillPatchEnvelope.envelope,
    waybillPatchPlan,
    {
      columnValues: { section_id: "other-section" },
      updatedAt: "2026-05-09T12:00:00.000Z",
      updatedBy: "dispatcher-1",
    },
  ), isDatabasePayloadError);
  assert.throws(() => createDatabasePatchMutationSetSqlPlan(
    waybillPatchEnvelope.envelope,
    waybillPatchPlan,
    {
      columnValues: { "driver_id;DROP": "driver-2" },
      updatedAt: "2026-05-09T12:00:00.000Z",
      updatedBy: "dispatcher-1",
    },
  ), isDatabasePayloadError);
  if (historyEnvelope.ok) {
    assert.throws(() => createDatabaseChangeHistoryInsertSqlPlan({
      ...historyEnvelope.envelope,
      entryCount: 2,
    }), isDatabasePayloadError);
    assert.throws(() => createDatabaseChangeHistoryInsertSqlPlan(
      historyEnvelope.envelope,
      "change_history_entries;DROP",
    ), isDatabasePayloadError);
  }
}

const serviceVehiclePatchPlan = getModulePatchMutationPlan("service-vehicle", "edit");
assert.ok(serviceVehiclePatchPlan);
const serviceVehiclePatchEnvelope = createServerPatchMutationEnvelope({
  moduleId: "service-vehicle",
  action: "edit",
  patch: {
    entityType: "service-vehicle-record",
    entity: { id: "record-1", version: 2 },
    changes: [{ field: "maintenanceDate", nextValue: "2026-05-09" }],
  },
});
assert.equal(serviceVehiclePatchEnvelope.ok, true);
if (serviceVehiclePatchEnvelope.ok) {
  const wherePlan = createDatabasePatchMutationWhereSqlPlan(
    serviceVehiclePatchEnvelope.envelope,
    serviceVehiclePatchPlan,
  );

  assert.equal(wherePlan.whereSql, "WHERE `id` = ? AND `version` = ?");
  assert.deepEqual(wherePlan.params, ["record-1", 2]);
  assert.deepEqual(wherePlan.scopeColumnKeys, []);
}

const waybillCreatePlan = getModuleCreateMutationPlan("taxation-waybills");
assert.ok(waybillCreatePlan);
const waybillCreateEnvelope = createServerCreateMutationEnvelope({
  moduleId: "taxation-waybills",
  data: {
    workDate: "2026-05-09",
    sectionId: "baktai",
    shift: "day",
    driverId: "driver-1",
    vehicleId: "vehicle-1",
  },
});
assert.equal(waybillCreateEnvelope.ok, true);
if (waybillCreateEnvelope.ok) {
  const insertPlan = createDatabaseCreateEntityInsertSqlPlan(
    waybillCreateEnvelope.envelope,
    waybillCreatePlan,
    {
      generatedEntityId: "waybill-1",
      columnValues: {
        work_date: "2026-05-09",
        section_id: "baktai",
        shift: "day",
        driver_id: "driver-1",
        vehicle_id: "vehicle-1",
      },
      createdAt: "2026-05-09T12:00:00.000Z",
      createdBy: "dispatcher-1",
    },
  );

  assert.equal(insertPlan.tableSql, "`taxation_waybills`");
  assert.equal(
    insertPlan.insertSql,
    "INSERT INTO `taxation_waybills` (`id`, `version`, `status`, `created_at`, `created_by`, `updated_at`, `updated_by`, `work_date`, `section_id`, `shift`, `driver_id`, `vehicle_id`)",
  );
  assert.equal(insertPlan.valuesSql, "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  assert.deepEqual(insertPlan.params, [
    "waybill-1",
    1,
    "created",
    "2026-05-09T12:00:00.000Z",
    "dispatcher-1",
    "2026-05-09T12:00:00.000Z",
    "dispatcher-1",
    "2026-05-09",
    "baktai",
    "day",
    "driver-1",
    "vehicle-1",
  ]);
  assert.deepEqual(insertPlan.scopeColumnKeys, ["section_id"]);
  assert.equal(insertPlan.maxEntityRowWrites, 1);
  assert.equal(insertPlan.writesChangeHistory, true);
  assert.equal(insertPlan.returnsCreatedEntityId, true);
  assert.equal(insertPlan.forbidsReservedColumnOverride, true);
  assert.deepEqual(evaluateDatabaseCreateEntityInsertResult({ affectedRows: 1 }), {
    ok: true,
    code: "create_entity_inserted",
    affectedRows: 1,
    changeHistoryAllowed: true,
    shouldReturnCreatedEntity: true,
  });
  assert.deepEqual(evaluateDatabaseCreateEntityInsertResult({ affectedRows: 0 }), {
    ok: false,
    code: "create_entity_not_inserted",
    affectedRows: 0,
    changeHistoryAllowed: false,
    shouldReturnCreatedEntity: false,
  });

  const duplicatePlans = createDatabaseCreateDuplicateCheckSqlPlans(
    waybillCreateEnvelope.envelope,
    waybillCreatePlan,
  );

  assert.equal(duplicatePlans.length, 2);
  assert.equal(
    duplicatePlans[0].sql,
    "SELECT `id` FROM `taxation_waybills` WHERE `work_date` = ? AND `section_id` = ? AND `shift` = ? AND `driver_id` = ? LIMIT 1",
  );
  assert.deepEqual(duplicatePlans[0].params, ["2026-05-09", "baktai", "day", "driver-1"]);
  assert.equal(
    duplicatePlans[1].sql,
    "SELECT `id` FROM `taxation_waybills` WHERE `work_date` = ? AND `section_id` = ? AND `shift` = ? AND `vehicle_id` = ? LIMIT 1",
  );
  assert.deepEqual(duplicatePlans[1].params, ["2026-05-09", "baktai", "day", "vehicle-1"]);
  assert.equal(duplicatePlans.every((plan) => plan.maxRows === 1), true);

  assert.throws(() => createDatabaseCreateDuplicateCheckSqlPlans(
    waybillCreateEnvelope.envelope,
    waybillCreatePlan,
    {
      workDate: "2026-05-09",
      sectionId: "baktai",
      shift: "day",
    },
  ), isDatabasePayloadError);
  assert.throws(() => createDatabaseCreateEntityInsertSqlPlan(
    waybillCreateEnvelope.envelope,
    waybillCreatePlan,
    {
      generatedEntityId: "waybill-1",
      columnValues: { id: "other-id", work_date: "2026-05-09", section_id: "baktai" },
      createdAt: "2026-05-09T12:00:00.000Z",
      createdBy: "dispatcher-1",
    },
  ), isDatabasePayloadError);
  assert.throws(() => createDatabaseCreateEntityInsertSqlPlan(
    waybillCreateEnvelope.envelope,
    waybillCreatePlan,
    {
      generatedEntityId: "waybill-1",
      columnValues: { work_date: "2026-05-09" },
      createdAt: "2026-05-09T12:00:00.000Z",
      createdBy: "dispatcher-1",
    },
  ), isDatabasePayloadError);
  assert.throws(() => createDatabaseCreateEntityInsertSqlPlan(
    waybillCreateEnvelope.envelope,
    waybillCreatePlan,
    {
      generatedEntityId: "waybill-1",
      columnValues: { section_id: "baktai", "work_date;DROP": "2026-05-09" },
      createdAt: "2026-05-09T12:00:00.000Z",
      createdBy: "dispatcher-1",
    },
  ), isDatabasePayloadError);
  assert.throws(() => evaluateDatabaseCreateEntityInsertResult({ affectedRows: 2 }), isDatabasePayloadError);
  assert.throws(() => evaluateDatabaseCreateEntityInsertResult({ affectedRows: -1 }), isDatabasePayloadError);
  assert.throws(() => evaluateDatabaseCreateEntityInsertResult({ affectedRows: 0.5 }), isDatabasePayloadError);

  assert.deepEqual(evaluateDatabaseCreateDuplicateCheckResults(duplicatePlans.map((plan) => ({
    duplicateKeyColumns: plan.duplicateKeyColumns,
    rowCount: 0,
  }))), {
    ok: true,
    code: "create_no_duplicate",
    canInsert: true,
    duplicateChecksPassed: 2,
  });

  assert.deepEqual(evaluateDatabaseCreateDuplicateCheckResults([
    { duplicateKeyColumns: duplicatePlans[0].duplicateKeyColumns, rowCount: 0 },
    {
      duplicateKeyColumns: duplicatePlans[1].duplicateKeyColumns,
      rowCount: 1,
      existingEntityId: "existing-waybill-1",
    },
  ]), {
    ok: false,
    code: "create_duplicate_found",
    canInsert: false,
    duplicateCheckIndex: 1,
    duplicateKeyColumns: duplicatePlans[1].duplicateKeyColumns,
    existingEntityId: "existing-waybill-1",
  });

  assert.throws(() => evaluateDatabaseCreateDuplicateCheckResults([]), isDatabasePayloadError);
  assert.throws(() => evaluateDatabaseCreateDuplicateCheckResults([
    { duplicateKeyColumns: duplicatePlans[0].duplicateKeyColumns, rowCount: 2 },
  ]), isDatabasePayloadError);
  assert.throws(() => evaluateDatabaseCreateDuplicateCheckResults([
    { duplicateKeyColumns: duplicatePlans[0].duplicateKeyColumns, rowCount: -1 },
  ]), isDatabasePayloadError);
  assert.throws(() => evaluateDatabaseCreateDuplicateCheckResults([
    { duplicateKeyColumns: duplicatePlans[0].duplicateKeyColumns, rowCount: 0.5 },
  ]), isDatabasePayloadError);
}

assert.deepEqual(evaluateDatabasePatchMutationResult({ affectedRows: 1 }), {
  ok: true,
  code: "patch_row_updated",
  affectedRows: 1,
  changeHistoryAllowed: true,
  shouldReloadCurrentRow: false,
});

assert.deepEqual(evaluateDatabasePatchMutationResult({ affectedRows: 0 }), {
  ok: false,
  code: "patch_conflict_or_scope_mismatch",
  affectedRows: 0,
  changeHistoryAllowed: false,
  shouldReloadCurrentRow: true,
});

assert.throws(() => evaluateDatabasePatchMutationResult({ affectedRows: 2 }), isDatabasePayloadError);
assert.throws(() => evaluateDatabasePatchMutationResult({ affectedRows: -1 }), isDatabasePayloadError);
assert.throws(() => evaluateDatabasePatchMutationResult({ affectedRows: 0.5 }), isDatabasePayloadError);

assert.deepEqual(evaluateDatabaseChangeHistoryInsertResult({
  affectedRows: 2,
  expectedRowCount: 2,
}), {
  ok: true,
  code: "change_history_inserted",
  affectedRows: 2,
  expectedRowCount: 2,
  transactionCanCommit: true,
});
assert.deepEqual(evaluateDatabaseChangeHistoryInsertResult({
  affectedRows: 1,
  expectedRowCount: 2,
}), {
  ok: false,
  code: "change_history_row_count_mismatch",
  affectedRows: 1,
  expectedRowCount: 2,
  transactionCanCommit: false,
});
assert.throws(() => evaluateDatabaseChangeHistoryInsertResult({
  affectedRows: -1,
  expectedRowCount: 2,
}), isDatabasePayloadError);
assert.throws(() => evaluateDatabaseChangeHistoryInsertResult({
  affectedRows: 1,
  expectedRowCount: 0,
}), isDatabasePayloadError);
assert.throws(() => evaluateDatabaseChangeHistoryInsertResult({
  affectedRows: 1.5,
  expectedRowCount: 2,
}), isDatabasePayloadError);

console.log("Database mutation SQL builder checks passed");
