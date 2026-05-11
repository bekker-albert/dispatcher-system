import assert from "node:assert/strict";
import {
  createServerWriteSideEffectsEnvelope,
  validateServerWriteSideEffectsDraft,
} from "../lib/domain/data-access/writeSideEffectsEnvelope";
import type { ServerWriteTransactionEnvelope } from "../lib/domain/data-access/writeTransactionEnvelope";
import { createReportAggregateInvalidationEnvelope } from "../lib/domain/reports/aggregateInvalidation";

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
});
assert.equal(fuelInvalidation.ok, true);

if (fuelInvalidation.ok) {
  const sideEffects = createServerWriteSideEffectsEnvelope({
    transaction: fuelPatchTransaction,
    aggregateInvalidation: fuelInvalidation.envelope,
  });

  assert.equal(sideEffects.ok, true);
  if (sideEffects.ok) {
    assert.equal(sideEffects.envelope.executionMode, "server-only");
    assert.equal(sideEffects.envelope.afterCommitOnly, true);
    assert.equal(sideEffects.envelope.writesChangeHistory, true);
    assert.equal(sideEffects.envelope.queuesAggregateRefresh, true);
    assert.equal(sideEffects.envelope.noInlineReportRecalculation, true);
    assert.equal(sideEffects.envelope.noFullReportRebuild, true);
  }
}

assert.deepEqual(validateServerWriteSideEffectsDraft({
  transaction: fuelPatchTransaction,
}).map((issue) => issue.code), [
  "aggregate_invalidation_missing",
]);

if (fuelInvalidation.ok) {
  assert.deepEqual(validateServerWriteSideEffectsDraft({
    transaction: fuelPatchTransaction,
    aggregateInvalidation: {
      ...fuelInvalidation.envelope,
      entityId: "other-fuel-period",
      changedBy: "other-user",
    },
    inlineReportRows: [],
  }).map((issue) => issue.code), [
    "inline_report_recalculation_forbidden",
    "aggregate_invalidation_entity_mismatch",
    "aggregate_invalidation_actor_mismatch",
  ]);
}

const overtimePatchTransaction: ServerWriteTransactionEnvelope = {
  ...fuelPatchTransaction,
  moduleId: "common-overtime",
  workspaceId: "common-processes",
  databaseAction: "patch-overtime-request",
  actorId: "dispatcher-1",
  entityId: "overtime-1",
};

const overtimeSideEffects = createServerWriteSideEffectsEnvelope({
  transaction: overtimePatchTransaction,
});
assert.equal(overtimeSideEffects.ok, true);
if (overtimeSideEffects.ok) {
  assert.equal(overtimeSideEffects.envelope.queuesAggregateRefresh, false);
}

const transactionWithoutHistory: ServerWriteTransactionEnvelope = {
  ...fuelPatchTransaction,
  writesChangeHistory: false as true,
  steps: [
    {
      kind: "entity-patch",
      tableRole: "entity",
      expectedRowCount: 1,
      requiresVersionMatch: true,
    },
    {
      kind: "entity-patch",
      tableRole: "entity",
      expectedRowCount: 1,
      requiresVersionMatch: true,
    },
  ],
};
assert.deepEqual(validateServerWriteSideEffectsDraft({
  transaction: transactionWithoutHistory,
}).map((issue) => issue.code), [
  "history_step_required",
  "aggregate_invalidation_missing",
]);

console.log("Write side effects checks passed");
