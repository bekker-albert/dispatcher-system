import assert from "node:assert/strict";
import { createReportAggregateInvalidationEnvelope } from "../lib/domain/reports/aggregateInvalidation";
import {
  createServerWriteSideEffectsEnvelope,
} from "../lib/domain/data-access/writeSideEffectsEnvelope";
import type { ServerWriteTransactionEnvelope } from "../lib/domain/data-access/writeTransactionEnvelope";
import {
  createDatabasePostCommitSideEffectsPlan,
} from "../lib/server/database/mutation-side-effects-plan";
import type {
  DatabasePatchWriteTransactionSqlPlan,
} from "../lib/server/database/mutation-transaction-plan";
import { isDatabasePayloadError } from "../lib/server/database/validation";

const fuelPatchTransaction: ServerWriteTransactionEnvelope = {
  transactionKind: "versioned-patch-with-history",
  executionMode: "server-only",
  atomic: true,
  moduleId: "taxation-fuel-periods",
  workspaceId: "taxation",
  databaseAction: "patch-fuel-period",
  actorId: "taxer-1",
  entityId: "fuel-period-2026-05-a",
  expectedVersion: 4,
  nextVersion: 5,
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
    {
      kind: "change-history",
      tableRole: "audit",
      expectedRowCount: 1,
    },
  ],
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
  id: "fuel-period-patch-3",
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
    const plan = createDatabasePostCommitSideEffectsPlan({
      sideEffects: sideEffects.envelope,
      transactionSqlPlan: fuelPatchTransactionSqlPlan,
    });

    assert.equal(plan.executionMode, "server-only");
    assert.equal(plan.requiresCommittedTransaction, true);
    assert.equal(plan.afterCommitOnly, true);
    assert.equal(plan.queueMode, "post-commit");
    assert.equal(plan.transactionCommitCondition, "all_steps_ok");
    assert.equal(plan.noPostCommitSideEffectsBeforeCommit, true);
    assert.equal(plan.noInlineReportRecalculation, true);
    assert.equal(plan.noFullReportRebuild, true);
    assert.equal(plan.sideEffectCount, 1);
    assert.equal(plan.steps[0].kind, "queue-prepared-aggregate-refresh");
    assert.equal(plan.steps[0].executionMode, "queued");
    assert.equal(plan.steps[0].afterCommitOnly, true);
    assert.equal(plan.steps[0].noResidentProcess, true);
    assert.equal(plan.steps[0].storesResultByReference, true);
    assert.equal(plan.steps[0].refreshEnvelope.queuedOperation.noResidentProcess, true);
    assert.equal(plan.steps[0].refreshEnvelope.updateMode, "upsert-affected-aggregates");
    assert.deepEqual(plan.steps[0].queuePayload.sourceIds, ["fuel-period-2026-05-a"]);
    assert.equal(plan.steps[0].queuePayload.sourceVersion, "fuel-period-v5");
  }
}

const overtimeTransaction: ServerWriteTransactionEnvelope = {
  ...fuelPatchTransaction,
  moduleId: "common-overtime",
  workspaceId: "common-processes",
  databaseAction: "patch-overtime-request",
  actorId: "dispatcher-1",
  entityId: "overtime-1",
};

const overtimeSideEffects = createServerWriteSideEffectsEnvelope({
  transaction: overtimeTransaction,
});
assert.equal(overtimeSideEffects.ok, true);

if (overtimeSideEffects.ok) {
  const noOpPlan = createDatabasePostCommitSideEffectsPlan({
    sideEffects: overtimeSideEffects.envelope,
    transactionSqlPlan: fuelPatchTransactionSqlPlan,
  });
  assert.equal(noOpPlan.sideEffectCount, 0);
  assert.deepEqual(noOpPlan.steps, []);
}

if (fuelInvalidation.ok) {
  const invalidRefreshSideEffects = createServerWriteSideEffectsEnvelope({
    transaction: fuelPatchTransaction,
    aggregateInvalidation: {
      ...fuelInvalidation.envelope,
      refreshPlan: {
        ...fuelInvalidation.envelope.refreshPlan,
        estimatedInputRows: 20_000,
      },
    },
  });
  assert.equal(invalidRefreshSideEffects.ok, true);

  if (invalidRefreshSideEffects.ok) {
    assert.throws(() => createDatabasePostCommitSideEffectsPlan({
      sideEffects: invalidRefreshSideEffects.envelope,
      transactionSqlPlan: fuelPatchTransactionSqlPlan,
    }), isDatabasePayloadError);
  }
}

if (fuelInvalidation.ok) {
  const sideEffects = createServerWriteSideEffectsEnvelope({
    transaction: fuelPatchTransaction,
    aggregateInvalidation: fuelInvalidation.envelope,
  });
  assert.equal(sideEffects.ok, true);

  if (sideEffects.ok) {
    assert.throws(() => createDatabasePostCommitSideEffectsPlan({
      sideEffects: {
        ...sideEffects.envelope,
        noInlineReportRecalculation: false as true,
      },
      transactionSqlPlan: fuelPatchTransactionSqlPlan,
    }), isDatabasePayloadError);

    assert.throws(() => createDatabasePostCommitSideEffectsPlan({
      sideEffects: sideEffects.envelope,
      transactionSqlPlan: {
        ...fuelPatchTransactionSqlPlan,
        noPostCommitSideEffectsBeforeCommit: false as true,
      },
    }), isDatabasePayloadError);
  }
}

console.log("Database mutation side-effects plan checks passed");
