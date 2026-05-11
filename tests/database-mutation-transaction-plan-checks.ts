import assert from "node:assert/strict";
import { createServerChangeHistoryEnvelope } from "../lib/domain/audit/changeHistoryEnvelope";
import { createServerCreateMutationEnvelope } from "../lib/domain/data-access/createMutationEnvelope";
import { getModuleCreateMutationPlan } from "../lib/domain/data-access/moduleCreateMutationPlans";
import { getModulePatchMutationPlan } from "../lib/domain/data-access/modulePatchMutationPlans";
import { createServerPatchMutationEnvelope } from "../lib/domain/data-access/patchMutationEnvelope";
import {
  createServerCreateWriteTransactionEnvelope,
  createServerPatchWriteTransactionEnvelope,
} from "../lib/domain/data-access/writeTransactionEnvelope";
import {
  createDatabaseChangeHistoryInsertSqlPlan,
  createDatabaseCreateDuplicateCheckSqlPlans,
  createDatabaseCreateEntityInsertSqlPlan,
  createDatabasePatchMutationSetSqlPlan,
  createDatabasePatchMutationWhereSqlPlan,
} from "../lib/server/database/mutation-sql-builder";
import {
  createDatabaseCreateWriteTransactionSqlPlan,
  createDatabasePatchWriteTransactionSqlPlan,
} from "../lib/server/database/mutation-transaction-plan";
import { isDatabasePayloadError } from "../lib/server/database/validation";

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
    const createTransaction = createServerCreateWriteTransactionEnvelope({
      actorId: "dispatcher-1",
      generatedEntityId: "waybill-1",
      createEnvelope: waybillCreateEnvelope.envelope,
      historyEnvelope: createHistoryEnvelope.envelope,
    });
    assert.equal(createTransaction.ok, true);

    if (createTransaction.ok && createTransaction.envelope.transactionKind === "versioned-create-with-history") {
      const createTransactionEnvelope = createTransaction.envelope;
      const duplicateCheckSqlPlans = createDatabaseCreateDuplicateCheckSqlPlans(
        waybillCreateEnvelope.envelope,
        waybillCreatePlan,
      );
      const entityInsertSqlPlan = createDatabaseCreateEntityInsertSqlPlan(
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
      const historyInsertSqlPlan = createDatabaseChangeHistoryInsertSqlPlan(
        createHistoryEnvelope.envelope,
      );

      const transactionSqlPlan = createDatabaseCreateWriteTransactionSqlPlan({
        transaction: createTransactionEnvelope,
        duplicateCheckSqlPlans,
        entityInsertSqlPlan,
        historyInsertSqlPlan,
      });

      assert.equal(transactionSqlPlan.transactionKind, "versioned-create-with-history");
      assert.equal(transactionSqlPlan.atomic, true);
      assert.equal(transactionSqlPlan.commitCondition, "all_steps_ok");
      assert.deepEqual(transactionSqlPlan.steps.map((step) => step.kind), [
        "duplicate-check",
        "entity-insert",
        "change-history",
      ]);
      assert.equal(transactionSqlPlan.steps[0].sqlPlans.length, 2);
      assert.equal(transactionSqlPlan.steps[1].expectedRowCount, 1);
      assert.equal(transactionSqlPlan.steps[2].expectedRowCount, 2);
      assert.equal(transactionSqlPlan.noPostCommitSideEffectsBeforeCommit, true);

      assert.throws(() => createDatabaseCreateWriteTransactionSqlPlan({
        transaction: createTransactionEnvelope,
        duplicateCheckSqlPlans: duplicateCheckSqlPlans.slice(0, 1),
        entityInsertSqlPlan,
        historyInsertSqlPlan,
      }), isDatabasePayloadError);

      assert.throws(() => createDatabaseCreateWriteTransactionSqlPlan({
        transaction: createTransactionEnvelope,
        duplicateCheckSqlPlans,
        entityInsertSqlPlan: {
          ...entityInsertSqlPlan,
          generatedEntityId: "other-waybill",
        },
        historyInsertSqlPlan,
      }), isDatabasePayloadError);
    }
  }
}

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
  const patchHistoryEnvelope = createServerChangeHistoryEnvelope({
    id: "history-patch-waybill-1",
    workspaceId: "taxation",
    entityType: "waybill",
    entity: { id: "waybill-1", version: 4 },
    changes: [{ field: "driverId", previousValue: "driver-1", nextValue: "driver-2" }],
    changedAt: "2026-05-09T12:00:00.000Z",
    changedBy: "dispatcher-1",
    reasonKind: "user_edit",
    capability: "edit",
  });
  assert.equal(patchHistoryEnvelope.ok, true);

  if (patchHistoryEnvelope.ok) {
    const patchTransaction = createServerPatchWriteTransactionEnvelope({
      actorId: "dispatcher-1",
      patchEnvelope: waybillPatchEnvelope.envelope,
      historyEnvelope: patchHistoryEnvelope.envelope,
    });
    assert.equal(patchTransaction.ok, true);

    if (patchTransaction.ok && patchTransaction.envelope.transactionKind === "versioned-patch-with-history") {
      const patchTransactionEnvelope = patchTransaction.envelope;
      const patchWhereSqlPlan = createDatabasePatchMutationWhereSqlPlan(
        waybillPatchEnvelope.envelope,
        waybillPatchPlan,
        { sectionId: "baktai" },
      );
      const patchSetSqlPlan = createDatabasePatchMutationSetSqlPlan(
        waybillPatchEnvelope.envelope,
        waybillPatchPlan,
        {
          columnValues: { driver_id: "driver-2" },
          updatedAt: "2026-05-09T12:00:00.000Z",
          updatedBy: "dispatcher-1",
        },
      );
      const historyInsertSqlPlan = createDatabaseChangeHistoryInsertSqlPlan(
        patchHistoryEnvelope.envelope,
      );

      const transactionSqlPlan = createDatabasePatchWriteTransactionSqlPlan({
        transaction: patchTransactionEnvelope,
        patchSetSqlPlan,
        patchWhereSqlPlan,
        historyInsertSqlPlan,
      });

      assert.equal(transactionSqlPlan.transactionKind, "versioned-patch-with-history");
      assert.equal(transactionSqlPlan.atomic, true);
      assert.equal(transactionSqlPlan.commitCondition, "all_steps_ok");
      assert.deepEqual(transactionSqlPlan.steps.map((step) => step.kind), [
        "entity-patch",
        "change-history",
      ]);
      assert.equal(
        transactionSqlPlan.steps[0].sql,
        "UPDATE `taxation_waybills` SET `driver_id` = ?, `version` = ?, `updated_at` = ?, `updated_by` = ? WHERE `id` = ? AND `version` = ? AND `section_id` = ?",
      );
      assert.deepEqual(transactionSqlPlan.steps[0].params, [
        "driver-2",
        4,
        "2026-05-09T12:00:00.000Z",
        "dispatcher-1",
        "waybill-1",
        3,
        "baktai",
      ]);
      assert.equal(transactionSqlPlan.steps[0].requiresVersionMatch, true);
      assert.equal(transactionSqlPlan.steps[1].expectedRowCount, 1);

      assert.throws(() => createDatabasePatchWriteTransactionSqlPlan({
        transaction: patchTransactionEnvelope,
        patchSetSqlPlan: {
          ...patchSetSqlPlan,
          nextVersion: 5,
        },
        patchWhereSqlPlan,
        historyInsertSqlPlan,
      }), isDatabasePayloadError);

      assert.throws(() => createDatabasePatchWriteTransactionSqlPlan({
        transaction: patchTransactionEnvelope,
        patchSetSqlPlan,
        patchWhereSqlPlan,
        historyInsertSqlPlan: {
          ...historyInsertSqlPlan,
          expectedRowCount: 2,
        },
      }), isDatabasePayloadError);
    }
  }
}

console.log("Database mutation transaction plan checks passed");
