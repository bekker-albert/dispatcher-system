import assert from "node:assert/strict";
import type {
  ServerCreateWriteTransactionEnvelope,
  ServerPatchWriteTransactionEnvelope,
} from "../lib/domain/data-access/writeTransactionEnvelope";
import {
  createLiveModuleCreateWriteExecutionContext,
  createLiveModulePatchWriteExecutionContext,
} from "../lib/server/database/module-write-execution";
import type { LiveModuleDatabaseHandlerContext } from "../lib/server/database/module-live-handlers";
import type { DatabasePostCommitSideEffectsPlan } from "../lib/server/database/mutation-side-effects-plan";

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

const createExecutionContext = createLiveModuleCreateWriteExecutionContext(createContext({
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

const createTransaction: ServerCreateWriteTransactionEnvelope = {
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

const createResponse = createExecutionContext.createWriteSuccessResponsePlan({
  transaction: createTransaction,
  duplicateDecision: {
    ok: true,
    code: "create_no_duplicate",
    canInsert: true,
    duplicateChecksPassed: 2,
  },
  insertDecision: createExecutionContext.evaluateEntityInsertResult({ affectedRows: 1 }),
  historyDecision: createExecutionContext.evaluateChangeHistoryInsertResult({
    affectedRows: 2,
    expectedRowCount: 2,
  }),
  sideEffectsPlan: {
    ...noPostCommitSideEffects,
    transactionKind: "versioned-create-with-history",
  },
});
assert.equal(createResponse.status, 201);
assert.equal(createResponse.entity.id, "waybill-1");
assert.equal(createResponse.returnsFullTable, false);

const duplicateResponse = createExecutionContext.createDuplicateResponsePlan({
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
assert.equal(duplicateResponse.postCommitSideEffectsQueued, false);
assert.equal(duplicateResponse.returnsFullTable, false);

const patchExecutionContext = createLiveModulePatchWriteExecutionContext(createContext({
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
    },
  },
}));

const patchTransaction: ServerPatchWriteTransactionEnvelope = {
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

const patchResponse = patchExecutionContext.createWriteSuccessResponsePlan({
  transaction: patchTransaction,
  patchDecision: patchExecutionContext.evaluatePatchResult({ affectedRows: 1 }),
  historyDecision: patchExecutionContext.evaluateChangeHistoryInsertResult({
    affectedRows: 1,
    expectedRowCount: 1,
  }),
  sideEffectsPlan: noPostCommitSideEffects,
});
assert.equal(patchResponse.status, 200);
assert.deepEqual(patchResponse.entity, { id: "waybill-1", version: 3 });
assert.equal(patchResponse.returnsFullTable, false);

const patchConflict = patchExecutionContext.createConflictResponsePlan({
  transaction: patchTransaction,
  patchDecision: patchExecutionContext.evaluatePatchResult({ affectedRows: 0 }),
});
assert.equal(patchConflict.status, 409);
assert.equal(patchConflict.reloadMode, "single-row-detail-query");
assert.equal(patchConflict.returnsFullTable, false);

console.log("Module write response context checks passed");
