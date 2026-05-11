import assert from "node:assert/strict";
import { createReportAggregateInvalidationEnvelope } from "../lib/domain/reports/aggregateInvalidation";
import {
  createServerWriteSideEffectsEnvelope,
} from "../lib/domain/data-access/writeSideEffectsEnvelope";
import type {
  ServerCreateWriteTransactionEnvelope,
  ServerPatchWriteTransactionEnvelope,
} from "../lib/domain/data-access/writeTransactionEnvelope";
import {
  createDatabaseCreateDuplicateResponsePlan,
  createDatabaseCreateWriteSuccessResponsePlan,
  createDatabasePatchConflictResponsePlan,
  createDatabasePatchWriteSuccessResponsePlan,
} from "../lib/server/database/mutation-response-plan";
import {
  createDatabasePostCommitSideEffectsPlan,
  type DatabasePostCommitSideEffectsPlan,
} from "../lib/server/database/mutation-side-effects-plan";
import type {
  DatabasePatchWriteTransactionSqlPlan,
} from "../lib/server/database/mutation-transaction-plan";
import { isDatabasePayloadError } from "../lib/server/database/validation";

const noPostCommitSideEffects: DatabasePostCommitSideEffectsPlan = {
  executionMode: "server-only",
  transactionKind: "versioned-patch-with-history",
  transactionCommitCondition: "all_steps_ok",
  requiresCommittedTransaction: true,
  afterCommitOnly: true,
  queueMode: "post-commit",
  noPostCommitSideEffectsBeforeCommit: true,
  noInlineReportRecalculation: true,
  noFullReportRebuild: true,
  sideEffectCount: 0,
  steps: [],
};

const waybillCreateTransaction: ServerCreateWriteTransactionEnvelope = {
  transactionKind: "versioned-create-with-history",
  executionMode: "server-only",
  atomic: true,
  moduleId: "taxation-waybills",
  workspaceId: "taxation",
  databaseAction: "create-waybill",
  actorId: "dispatcher-1",
  entityId: "waybill-1",
  initialVersion: 1,
  initialStatus: "created",
  duplicateCheckRequired: true,
  duplicateKeyGroupCount: 2,
  changeCount: 2,
  maxEntityRowWrites: 1,
  writesChangeHistory: true,
  steps: [
    { kind: "duplicate-check", tableRole: "unique-check", expectedRowCount: 0 },
    { kind: "entity-insert", tableRole: "entity", expectedRowCount: 1 },
    { kind: "change-history", tableRole: "audit", expectedRowCount: 2 },
  ],
};

const createSuccess = createDatabaseCreateWriteSuccessResponsePlan({
  transaction: waybillCreateTransaction,
  duplicateDecision: {
    ok: true,
    code: "create_no_duplicate",
    canInsert: true,
    duplicateChecksPassed: 2,
  },
  insertDecision: {
    ok: true,
    code: "create_entity_inserted",
    affectedRows: 1,
    changeHistoryAllowed: true,
    shouldReturnCreatedEntity: true,
  },
  historyDecision: {
    ok: true,
    code: "change_history_inserted",
    affectedRows: 2,
    expectedRowCount: 2,
    transactionCanCommit: true,
  },
  sideEffectsPlan: {
    ...noPostCommitSideEffects,
    transactionKind: "versioned-create-with-history",
  },
});
assert.equal(createSuccess.status, 201);
assert.equal(createSuccess.code, "create_saved");
assert.deepEqual(createSuccess.entity, {
  id: "waybill-1",
  version: 1,
  status: "created",
});
assert.equal(createSuccess.changeHistoryCommitted, true);
assert.equal(createSuccess.returnsCreatedEntityId, true);
assert.equal(createSuccess.returnsFullTable, false);
assert.equal(createSuccess.maxResponseRows, 1);
assert.equal(createSuccess.postCommitSideEffects.sideEffectCount, 0);

const waybillPatchTransaction: ServerPatchWriteTransactionEnvelope = {
  transactionKind: "versioned-patch-with-history",
  executionMode: "server-only",
  atomic: true,
  moduleId: "taxation-waybills",
  workspaceId: "taxation",
  databaseAction: "patch-waybill",
  actorId: "dispatcher-1",
  entityId: "waybill-1",
  expectedVersion: 2,
  nextVersion: 3,
  changeCount: 1,
  maxEntityRowWrites: 1,
  writesChangeHistory: true,
  steps: [
    {
      kind: "entity-patch",
      tableRole: "entity",
      expectedRowCount: 1,
      requiresVersionMatch: true,
    },
    { kind: "change-history", tableRole: "audit", expectedRowCount: 1 },
  ],
};

const patchSuccess = createDatabasePatchWriteSuccessResponsePlan({
  transaction: waybillPatchTransaction,
  patchDecision: {
    ok: true,
    code: "patch_row_updated",
    affectedRows: 1,
    changeHistoryAllowed: true,
    shouldReloadCurrentRow: false,
  },
  historyDecision: {
    ok: true,
    code: "change_history_inserted",
    affectedRows: 1,
    expectedRowCount: 1,
    transactionCanCommit: true,
  },
  sideEffectsPlan: noPostCommitSideEffects,
});
assert.equal(patchSuccess.status, 200);
assert.equal(patchSuccess.code, "patch_saved");
assert.deepEqual(patchSuccess.entity, { id: "waybill-1", version: 3 });
assert.equal(patchSuccess.shouldReloadCurrentRow, false);
assert.equal(patchSuccess.returnsChangedFieldsOnly, true);
assert.equal(patchSuccess.returnsFullTable, false);
assert.equal(patchSuccess.maxResponseRows, 1);

const patchConflict = createDatabasePatchConflictResponsePlan({
  transaction: waybillPatchTransaction,
  patchDecision: {
    ok: false,
    code: "patch_conflict_or_scope_mismatch",
    affectedRows: 0,
    changeHistoryAllowed: false,
    shouldReloadCurrentRow: true,
  },
});
assert.equal(patchConflict.status, 409);
assert.equal(patchConflict.changeHistoryCommitted, false);
assert.equal(patchConflict.postCommitSideEffectsQueued, false);
assert.equal(patchConflict.reloadMode, "single-row-detail-query");
assert.equal(patchConflict.returnsFullTable, false);
assert.equal(patchConflict.maxResponseRows, 1);

const duplicateResponse = createDatabaseCreateDuplicateResponsePlan({
  duplicateDecision: {
    ok: false,
    code: "create_duplicate_found",
    canInsert: false,
    duplicateCheckIndex: 0,
    duplicateKeyColumns: ["work_date", "section_id", "shift", "driver_id"],
    existingEntityId: "waybill-existing",
  },
});
assert.equal(duplicateResponse.status, 409);
assert.equal(duplicateResponse.canInsert, false);
assert.equal(duplicateResponse.changeHistoryCommitted, false);
assert.equal(duplicateResponse.postCommitSideEffectsQueued, false);
assert.equal(duplicateResponse.existingEntityId, "waybill-existing");
assert.equal(duplicateResponse.returnsFullTable, false);

const fuelPatchTransaction: ServerPatchWriteTransactionEnvelope = {
  ...waybillPatchTransaction,
  moduleId: "taxation-fuel-periods",
  workspaceId: "taxation",
  databaseAction: "patch-fuel-period",
  actorId: "taxer-1",
  entityId: "fuel-period-2026-05-a",
  expectedVersion: 4,
  nextVersion: 5,
};

const fuelPatchTransactionSqlPlan: DatabasePatchWriteTransactionSqlPlan = {
  transactionKind: "versioned-patch-with-history",
  executionMode: "server-only",
  atomic: true,
  commitCondition: "all_steps_ok",
  rollbackOnAnyStepFailure: true,
  maxEntityRowWrites: 1,
  writesChangeHistory: true,
  noPostCommitSideEffectsBeforeCommit: true,
  steps: [
    {
      kind: "entity-patch",
      tableRole: "entity",
      sql: "UPDATE `fuel_accounting_periods` SET `status` = ? WHERE `id` = ? AND `version` = ?",
      params: ["on-review", "fuel-period-2026-05-a", 4],
      expectedRowCount: 1,
      requiresVersionMatch: true,
      resultEvaluator: "evaluateDatabasePatchMutationResult",
    },
    {
      kind: "change-history",
      tableRole: "audit",
      sql: "INSERT INTO `change_history_entries` (`id`) VALUES (?)",
      params: ["history-1"],
      expectedRowCount: 1,
      resultEvaluator: "evaluateDatabaseChangeHistoryInsertResult",
    },
  ],
};

const fuelInvalidation = createReportAggregateInvalidationEnvelope({
  id: "fuel-period-patch-response-1",
  sourceModuleId: "taxation-fuel-periods",
  entityId: "fuel-period-2026-05-a",
  changedBy: "taxer-1",
  changedAt: "2026-05-16T04:00:00.000Z",
  reason: "patch-saved",
  grain: "fuel_period",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  sectionId: "baktay",
  sourceVersion: "fuel-period-v5",
  changedFields: ["contractorDebtLiters"],
  estimatedInputRows: 250,
});
assert.equal(fuelInvalidation.ok, true);

if (fuelInvalidation.ok) {
  const sideEffects = createServerWriteSideEffectsEnvelope({
    transaction: fuelPatchTransaction,
    aggregateInvalidation: fuelInvalidation.envelope,
  });
  assert.equal(sideEffects.ok, true);

  if (sideEffects.ok) {
    const sideEffectsPlan = createDatabasePostCommitSideEffectsPlan({
      sideEffects: sideEffects.envelope,
      transactionSqlPlan: fuelPatchTransactionSqlPlan,
    });
    const response = createDatabasePatchWriteSuccessResponsePlan({
      transaction: fuelPatchTransaction,
      patchDecision: {
        ok: true,
        code: "patch_row_updated",
        affectedRows: 1,
        changeHistoryAllowed: true,
        shouldReloadCurrentRow: false,
      },
      historyDecision: {
        ok: true,
        code: "change_history_inserted",
        affectedRows: 1,
        expectedRowCount: 1,
        transactionCanCommit: true,
      },
      sideEffectsPlan,
    });

    assert.equal(response.postCommitSideEffects.sideEffectCount, 1);
    assert.deepEqual(response.postCommitSideEffects.queuedAggregateRefreshIds, [
      "fuel-period-patch-response-1",
    ]);
    assert.deepEqual(response.postCommitSideEffects.queuedOperationIds, [
      "aggregate-refresh:fuel-period-patch-response-1",
    ]);
  }
}

assert.throws(() => createDatabasePatchWriteSuccessResponsePlan({
  transaction: waybillPatchTransaction,
  patchDecision: {
    ok: false,
    code: "patch_conflict_or_scope_mismatch",
    affectedRows: 0,
    changeHistoryAllowed: false,
    shouldReloadCurrentRow: true,
  },
  historyDecision: {
    ok: true,
    code: "change_history_inserted",
    affectedRows: 1,
    expectedRowCount: 1,
    transactionCanCommit: true,
  },
  sideEffectsPlan: noPostCommitSideEffects,
}), isDatabasePayloadError);

assert.throws(() => createDatabaseCreateWriteSuccessResponsePlan({
  transaction: waybillCreateTransaction,
  duplicateDecision: {
    ok: true,
    code: "create_no_duplicate",
    canInsert: true,
    duplicateChecksPassed: 2,
  },
  insertDecision: {
    ok: true,
    code: "create_entity_inserted",
    affectedRows: 1,
    changeHistoryAllowed: true,
    shouldReturnCreatedEntity: true,
  },
  historyDecision: {
    ok: false,
    code: "change_history_row_count_mismatch",
    affectedRows: 1,
    expectedRowCount: 2,
    transactionCanCommit: false,
  },
  sideEffectsPlan: noPostCommitSideEffects,
}), isDatabasePayloadError);

assert.throws(() => createDatabaseCreateDuplicateResponsePlan({
  duplicateDecision: {
    ok: true,
    code: "create_no_duplicate",
    canInsert: true,
    duplicateChecksPassed: 2,
  },
}), isDatabasePayloadError);

console.log("Database mutation response plan checks passed");
