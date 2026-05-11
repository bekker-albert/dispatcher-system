import assert from "node:assert/strict";
import { createServerChangeHistoryEnvelope } from "../lib/domain/audit/changeHistoryEnvelope";
import {
  createServerCreateWriteTransactionEnvelope,
  createServerPatchWriteTransactionEnvelope,
} from "../lib/domain/data-access/writeTransactionEnvelope";
import {
  createServerWriteSideEffectsEnvelope,
} from "../lib/domain/data-access/writeSideEffectsEnvelope";
import {
  createLiveModuleCreateWriteExecutionContext,
  createLiveModulePatchWriteExecutionContext,
} from "../lib/server/database/module-write-execution";
import type { LiveModuleDatabaseHandlerContext } from "../lib/server/database/module-live-handlers";
import { isDatabasePayloadError } from "../lib/server/database/validation";

const request = new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { origin: "https://aam-dispatch.kz" },
});
const json = (data: unknown, status = 200) => Response.json(data, { status });

function createContext(
  input: Partial<LiveModuleDatabaseHandlerContext>,
): LiveModuleDatabaseHandlerContext {
  return {
    resource: "taxation",
    action: "create-waybill",
    payload: {},
    request,
    json,
    moduleId: "taxation-waybills",
    workspaceId: "taxation",
    ...input,
  };
}

const createContextResult = createLiveModuleCreateWriteExecutionContext(createContext({
  payload: {
    data: {
      workDate: "2026-05-09",
      sectionId: "baktai",
      shift: "day",
      driverId: "driver-1",
      vehicleId: "vehicle-1",
    },
  },
}));
assert.equal(createContextResult.pipelineKind, "create");
assert.equal(createContextResult.createPlan.databaseAction, "create-waybill");
assert.equal(createContextResult.createEnvelope.initialVersion, 1);
assert.equal(createContextResult.createEnvelope.duplicateCheckRequired, true);
assert.equal(createContextResult.createEnvelope.writesChangeHistory, true);
assert.equal(createContextResult.maxEntityRowWrites, 1);
assert.equal(createContextResult.requiresAtomicTransaction, true);
assert.equal(createContextResult.requiresChangeHistory, true);
assert.equal(createContextResult.requiresPostCommitSideEffects, true);
assert.equal(createContextResult.requiresSectionScope, true);
assert.deepEqual(createContextResult.sectionScope, { sectionId: "baktai" });
assert.equal(createContextResult.noInlineReportRecalculation, true);
assert.equal(createContextResult.noFullReportRebuild, true);
const createInsertSqlPlan = createContextResult.createEntityInsertSqlPlan({
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
});
assert.equal(createInsertSqlPlan.tableSql, "`taxation_waybills`");
assert.equal(createInsertSqlPlan.initialVersion, 1);
assert.equal(createInsertSqlPlan.initialStatus, "created");
assert.equal(createInsertSqlPlan.generatedEntityId, "waybill-1");
assert.deepEqual(createInsertSqlPlan.scopeColumnKeys, ["section_id"]);
assert.deepEqual(createContextResult.evaluateEntityInsertResult({ affectedRows: 1 }), {
  ok: true,
  code: "create_entity_inserted",
  affectedRows: 1,
  changeHistoryAllowed: true,
  shouldReturnCreatedEntity: true,
});
const createDuplicateSqlPlans = createContextResult.createDuplicateCheckSqlPlans();
assert.equal(createDuplicateSqlPlans.length, 2);
assert.equal(
  createDuplicateSqlPlans[0].whereSql,
  "WHERE `work_date` = ? AND `section_id` = ? AND `shift` = ? AND `driver_id` = ?",
);
assert.deepEqual(createDuplicateSqlPlans[0].params, ["2026-05-09", "baktai", "day", "driver-1"]);
assert.deepEqual(
  createContextResult.evaluateDuplicateCheckResults(createDuplicateSqlPlans.map((plan) => ({
    duplicateKeyColumns: plan.duplicateKeyColumns,
    rowCount: 0,
  }))),
  {
    ok: true,
    code: "create_no_duplicate",
    canInsert: true,
    duplicateChecksPassed: 2,
  },
);
assert.deepEqual(
  createContextResult.evaluateDuplicateCheckResults([{
    duplicateKeyColumns: createDuplicateSqlPlans[0].duplicateKeyColumns,
    rowCount: 1,
    existingEntityId: "waybill-1",
  }]),
  {
    ok: false,
    code: "create_duplicate_found",
    canInsert: false,
    duplicateCheckIndex: 0,
    duplicateKeyColumns: createDuplicateSqlPlans[0].duplicateKeyColumns,
    existingEntityId: "waybill-1",
  },
);
const createHistoryEnvelope = createServerChangeHistoryEnvelope({
  id: "history-create-waybill-1",
  workspaceId: "taxation",
  entityType: "waybill",
  entity: { id: "waybill-1", version: 1 },
  changes: [
    { field: "driverId", nextValue: "driver-1" },
    { field: "vehicleId", nextValue: "vehicle-1" },
  ],
  changedAt: "2026-05-09T12:00:00.000Z",
  changedBy: "dispatcher-1",
  reasonKind: "user_edit",
  capability: "edit",
});
assert.equal(createHistoryEnvelope.ok, true);
if (createHistoryEnvelope.ok) {
  const createHistorySqlPlan = createContextResult.createChangeHistoryInsertSqlPlan(
    createHistoryEnvelope.envelope,
  );
  assert.equal(createHistorySqlPlan.tableSql, "`change_history_entries`");
  assert.equal(createHistorySqlPlan.rowCount, 2);
  assert.equal(createHistorySqlPlan.expectedRowCount, 2);
  assert.deepEqual(createContextResult.evaluateChangeHistoryInsertResult({
    affectedRows: 2,
    expectedRowCount: createHistorySqlPlan.expectedRowCount,
  }), {
    ok: true,
    code: "change_history_inserted",
    affectedRows: 2,
    expectedRowCount: 2,
    transactionCanCommit: true,
  });
  const createTransaction = createServerCreateWriteTransactionEnvelope({
    actorId: "dispatcher-1",
    generatedEntityId: "waybill-1",
    createEnvelope: createContextResult.createEnvelope,
    historyEnvelope: createHistoryEnvelope.envelope,
  });
  assert.equal(createTransaction.ok, true);
  if (createTransaction.ok && createTransaction.envelope.transactionKind === "versioned-create-with-history") {
    const createTransactionSqlPlan = createContextResult.createWriteTransactionSqlPlan({
      transaction: createTransaction.envelope,
      duplicateCheckSqlPlans: createDuplicateSqlPlans,
      entityInsertSqlPlan: createInsertSqlPlan,
      historyInsertSqlPlan: createHistorySqlPlan,
    });
    assert.deepEqual(createTransactionSqlPlan.steps.map((step) => step.kind), [
      "duplicate-check",
      "entity-insert",
      "change-history",
    ]);
    assert.equal(createTransactionSqlPlan.commitCondition, "all_steps_ok");
    assert.equal(createTransactionSqlPlan.noPostCommitSideEffectsBeforeCommit, true);

    const createSideEffects = createServerWriteSideEffectsEnvelope({
      transaction: createTransaction.envelope,
    });
    assert.equal(createSideEffects.ok, true);
    if (createSideEffects.ok) {
      const postCommitPlan = createContextResult.createPostCommitSideEffectsPlan({
        sideEffects: createSideEffects.envelope,
        transactionSqlPlan: createTransactionSqlPlan,
      });
      assert.equal(postCommitPlan.afterCommitOnly, true);
      assert.equal(postCommitPlan.requiresCommittedTransaction, true);
      assert.equal(postCommitPlan.queueMode, "post-commit");
      assert.equal(postCommitPlan.sideEffectCount, 0);
    }
  }
}

assert.throws(() => createLiveModuleCreateWriteExecutionContext(createContext({
  payload: {
    data: {
      workDate: "2026-05-09",
      sectionId: "baktai",
      shift: "day",
      rows: [],
    },
  },
})), isDatabasePayloadError);

const patchContextResult = createLiveModulePatchWriteExecutionContext(createContext({
  action: "patch-waybill",
  payload: {
    scope: { sectionId: "baktai" },
    patch: {
      entityType: "waybill",
      entity: { id: "waybill-1", version: 2 },
      changes: [{
        field: "driverId",
        previousValue: "driver-1",
        nextValue: "driver-2",
      }],
      reason: "driver replacement",
    },
  },
}));
assert.equal(patchContextResult.pipelineKind, "patch");
assert.equal(patchContextResult.patchPlan.action, "edit");
assert.equal(patchContextResult.patchEnvelope.entityId, "waybill-1");
assert.equal(patchContextResult.patchEnvelope.expectedVersion, 2);
assert.equal(patchContextResult.patchEnvelope.patchOnly, true);
assert.equal(patchContextResult.patchEnvelope.writesChangeHistory, true);
assert.equal(patchContextResult.requiresExpectedVersion, true);
assert.equal(patchContextResult.maxEntityRowWrites, 1);
assert.equal(patchContextResult.requiresAtomicTransaction, true);
assert.equal(patchContextResult.requiresChangeHistory, true);
assert.equal(patchContextResult.requiresPostCommitSideEffects, true);
assert.equal(patchContextResult.requiresSectionScope, true);
assert.deepEqual(patchContextResult.sectionScope, { sectionId: "baktai" });
const patchWhereSqlPlan = patchContextResult.createPatchWhereSqlPlan();
assert.equal(patchWhereSqlPlan.whereSql, "WHERE `id` = ? AND `version` = ? AND `section_id` = ?");
assert.deepEqual(patchWhereSqlPlan.params, ["waybill-1", 2, "baktai"]);
const patchSetSqlPlan = patchContextResult.createPatchSetSqlPlan({
  columnValues: { driver_id: "driver-2" },
  updatedAt: "2026-05-09T12:00:00.000Z",
  updatedBy: "dispatcher-1",
});
assert.equal(
  patchSetSqlPlan.setSql,
  "SET `driver_id` = ?, `version` = ?, `updated_at` = ?, `updated_by` = ?",
);
assert.deepEqual(
  patchSetSqlPlan.params,
  ["driver-2", 3, "2026-05-09T12:00:00.000Z", "dispatcher-1"],
);
assert.deepEqual(patchSetSqlPlan.changedColumns, ["driver_id"]);
const patchHistoryEnvelope = createServerChangeHistoryEnvelope({
  id: "history-patch-waybill-1",
  workspaceId: "taxation",
  entityType: "waybill",
  entity: { id: "waybill-1", version: 3 },
  changes: [{ field: "driverId", previousValue: "driver-1", nextValue: "driver-2" }],
  changedAt: "2026-05-09T12:00:00.000Z",
  changedBy: "dispatcher-1",
  reasonKind: "user_edit",
  capability: "edit",
});
assert.equal(patchHistoryEnvelope.ok, true);
if (patchHistoryEnvelope.ok) {
  const patchHistorySqlPlan = patchContextResult.createChangeHistoryInsertSqlPlan(
    patchHistoryEnvelope.envelope,
  );
  assert.equal(patchHistorySqlPlan.tableSql, "`change_history_entries`");
  assert.equal(patchHistorySqlPlan.rowCount, 1);
  assert.match(patchHistorySqlPlan.sql, /^INSERT INTO `change_history_entries`/);
  assert.deepEqual(patchContextResult.evaluateChangeHistoryInsertResult({
    affectedRows: 0,
    expectedRowCount: patchHistorySqlPlan.expectedRowCount,
  }), {
    ok: false,
    code: "change_history_row_count_mismatch",
    affectedRows: 0,
    expectedRowCount: 1,
    transactionCanCommit: false,
  });
  const patchTransaction = createServerPatchWriteTransactionEnvelope({
    actorId: "dispatcher-1",
    patchEnvelope: patchContextResult.patchEnvelope,
    historyEnvelope: patchHistoryEnvelope.envelope,
  });
  assert.equal(patchTransaction.ok, true);
  if (patchTransaction.ok && patchTransaction.envelope.transactionKind === "versioned-patch-with-history") {
    const patchTransactionSqlPlan = patchContextResult.createWriteTransactionSqlPlan({
      transaction: patchTransaction.envelope,
      patchSetSqlPlan,
      patchWhereSqlPlan,
      historyInsertSqlPlan: patchHistorySqlPlan,
    });
    assert.deepEqual(patchTransactionSqlPlan.steps.map((step) => step.kind), [
      "entity-patch",
      "change-history",
    ]);
    assert.equal(patchTransactionSqlPlan.steps[0].expectedRowCount, 1);
    assert.equal(patchTransactionSqlPlan.noPostCommitSideEffectsBeforeCommit, true);

    const patchSideEffects = createServerWriteSideEffectsEnvelope({
      transaction: patchTransaction.envelope,
    });
    assert.equal(patchSideEffects.ok, true);
    if (patchSideEffects.ok) {
      const postCommitPlan = patchContextResult.createPostCommitSideEffectsPlan({
        sideEffects: patchSideEffects.envelope,
        transactionSqlPlan: patchTransactionSqlPlan,
      });
      assert.equal(postCommitPlan.afterCommitOnly, true);
      assert.equal(postCommitPlan.requiresCommittedTransaction, true);
      assert.equal(postCommitPlan.sideEffectCount, 0);
    }
  }
}
assert.deepEqual(patchContextResult.evaluatePatchResult({ affectedRows: 1 }), {
  ok: true,
  code: "patch_row_updated",
  affectedRows: 1,
  changeHistoryAllowed: true,
  shouldReloadCurrentRow: false,
});
assert.deepEqual(patchContextResult.evaluatePatchResult({ affectedRows: 0 }), {
  ok: false,
  code: "patch_conflict_or_scope_mismatch",
  affectedRows: 0,
  changeHistoryAllowed: false,
  shouldReloadCurrentRow: true,
});

const transitionContextResult = createLiveModulePatchWriteExecutionContext(createContext({
  action: "transition-waybill",
  payload: {
    scope: { sectionId: "baktai" },
    reason: "dispatcher accepted the waybill",
    patch: {
      entityType: "waybill",
      entity: { id: "waybill-1", version: 3 },
      changes: [{
        field: "status",
        previousValue: "created",
        nextValue: "accepted",
      }],
    },
  },
}));
assert.equal(transitionContextResult.pipelineKind, "workflow-transition");
assert.equal(transitionContextResult.patchPlan.action, "approve");
assert.equal(transitionContextResult.patchEnvelope.reason, "dispatcher accepted the waybill");
assert.deepEqual(transitionContextResult.sectionScope, { sectionId: "baktai" });

assert.throws(() => createLiveModulePatchWriteExecutionContext(createContext({
  action: "patch-waybill",
  payload: {
    patch: {
      entityType: "waybill",
      entity: { id: "waybill-1", version: 2 },
      changes: [{ field: "driverId", nextValue: "driver-2" }],
    },
  },
})), isDatabasePayloadError);

assert.throws(() => createLiveModulePatchWriteExecutionContext(createContext({
  action: "patch-waybill",
  payload: {
    patch: {
      entityType: "waybill",
      entity: { id: "waybill-1" },
      changes: [{ field: "driverId", nextValue: "driver-2" }],
    },
  },
})), isDatabasePayloadError);

assert.throws(() => createLiveModulePatchWriteExecutionContext(createContext({
  action: "patch-waybill",
  payload: {
    patch: {
      entityType: "waybill",
      entity: { id: "waybill-1", version: 2 },
      changes: [{ field: "rows", nextValue: [] }],
    },
  },
})), isDatabasePayloadError);

assert.throws(() => createLiveModulePatchWriteExecutionContext(createContext({
  action: "transition-waybill",
  payload: {
    patch: {
      entityType: "waybill",
      entity: { id: "waybill-1", version: 3 },
      changes: [{ field: "status", nextValue: "accepted" }],
    },
  },
})), isDatabasePayloadError);

assert.throws(() => createLiveModuleCreateWriteExecutionContext(createContext({
  action: "list-waybills",
})), isDatabasePayloadError);

console.log("Module write execution checks passed");
