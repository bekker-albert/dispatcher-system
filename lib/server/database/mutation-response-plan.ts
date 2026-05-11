import type {
  ServerCreateWriteTransactionEnvelope,
  ServerPatchWriteTransactionEnvelope,
} from "../../domain/data-access/writeTransactionEnvelope";
import type {
  DatabaseChangeHistoryInsertResultDecision,
  DatabaseCreateDuplicateCheckDecision,
  DatabaseCreateEntityInsertResultDecision,
  DatabasePatchMutationResultDecision,
} from "./mutation-sql-builder-types";
import type { DatabasePostCommitSideEffectsPlan } from "./mutation-side-effects-plan";
import { DatabasePayloadError } from "./validation";

export type DatabaseWriteResponseSideEffectSummary = {
  queueMode: "post-commit";
  sideEffectCount: number;
  queuedAggregateRefreshIds: readonly string[];
  queuedOperationIds: readonly string[];
  noResidentProcess: true;
  noInlineReportRecalculation: true;
  noFullReportRebuild: true;
};

export type DatabaseCreateWriteSuccessResponsePlan = {
  responseKind: "create-success";
  status: 201;
  code: "create_saved";
  entity: {
    id: string;
    version: 1;
    status: string;
  };
  changeHistoryCommitted: true;
  postCommitSideEffects: DatabaseWriteResponseSideEffectSummary;
  returnsCreatedEntityId: true;
  returnsFullTable: false;
  maxResponseRows: 1;
};

export type DatabasePatchWriteSuccessResponsePlan = {
  responseKind: "patch-success";
  status: 200;
  code: "patch_saved";
  entity: {
    id: string;
    version: number;
  };
  changeHistoryCommitted: true;
  postCommitSideEffects: DatabaseWriteResponseSideEffectSummary;
  shouldReloadCurrentRow: false;
  returnsChangedFieldsOnly: true;
  returnsFullTable: false;
  maxResponseRows: 1;
};

export type DatabasePatchConflictResponsePlan = {
  responseKind: "patch-conflict";
  status: 409;
  code: "patch_conflict_or_scope_mismatch";
  entity: {
    id: string;
    openedVersion: number;
  };
  changeHistoryCommitted: false;
  postCommitSideEffectsQueued: false;
  shouldReloadCurrentRow: true;
  reloadMode: "single-row-detail-query";
  returnsFullTable: false;
  maxResponseRows: 1;
};

export type DatabaseCreateDuplicateResponsePlan = {
  responseKind: "create-duplicate";
  status: 409;
  code: "create_duplicate_found";
  canInsert: false;
  duplicateCheckIndex: number;
  duplicateKeyColumns: readonly string[];
  existingEntityId?: string;
  changeHistoryCommitted: false;
  postCommitSideEffectsQueued: false;
  returnsFullTable: false;
  maxResponseRows: 1;
};

function createSideEffectSummary(
  sideEffectsPlan: DatabasePostCommitSideEffectsPlan,
): DatabaseWriteResponseSideEffectSummary {
  if (
    !sideEffectsPlan.requiresCommittedTransaction
    || !sideEffectsPlan.afterCommitOnly
    || sideEffectsPlan.queueMode !== "post-commit"
    || !sideEffectsPlan.noInlineReportRecalculation
    || !sideEffectsPlan.noFullReportRebuild
  ) {
    throw new DatabasePayloadError(
      "Write response can include side effects only from a post-commit bounded side-effect plan.",
    );
  }

  return {
    queueMode: "post-commit",
    sideEffectCount: sideEffectsPlan.sideEffectCount,
    queuedAggregateRefreshIds: sideEffectsPlan.steps.map((step) => step.aggregateEventId),
    queuedOperationIds: sideEffectsPlan.steps.map((step) => step.queuePayload.queuedOperationId),
    noResidentProcess: true,
    noInlineReportRecalculation: true,
    noFullReportRebuild: true,
  };
}

function assertHistoryCommitted(
  historyDecision: DatabaseChangeHistoryInsertResultDecision,
) {
  if (!historyDecision.ok || !historyDecision.transactionCanCommit) {
    throw new DatabasePayloadError(
      "Write success response requires committed per-field change history.",
    );
  }
}

export function createDatabaseCreateWriteSuccessResponsePlan({
  transaction,
  duplicateDecision,
  insertDecision,
  historyDecision,
  sideEffectsPlan,
}: {
  transaction: ServerCreateWriteTransactionEnvelope;
  duplicateDecision: DatabaseCreateDuplicateCheckDecision;
  insertDecision: DatabaseCreateEntityInsertResultDecision;
  historyDecision: DatabaseChangeHistoryInsertResultDecision;
  sideEffectsPlan: DatabasePostCommitSideEffectsPlan;
}): DatabaseCreateWriteSuccessResponsePlan {
  if (!duplicateDecision.ok || !duplicateDecision.canInsert) {
    throw new DatabasePayloadError("Create success response cannot be built when duplicate checks failed.");
  }

  if (!insertDecision.ok || !insertDecision.shouldReturnCreatedEntity) {
    throw new DatabasePayloadError("Create success response requires one inserted entity row.");
  }

  assertHistoryCommitted(historyDecision);

  return {
    responseKind: "create-success",
    status: 201,
    code: "create_saved",
    entity: {
      id: transaction.entityId,
      version: transaction.initialVersion,
      status: transaction.initialStatus,
    },
    changeHistoryCommitted: true,
    postCommitSideEffects: createSideEffectSummary(sideEffectsPlan),
    returnsCreatedEntityId: true,
    returnsFullTable: false,
    maxResponseRows: 1,
  };
}

export function createDatabasePatchWriteSuccessResponsePlan({
  transaction,
  patchDecision,
  historyDecision,
  sideEffectsPlan,
}: {
  transaction: ServerPatchWriteTransactionEnvelope;
  patchDecision: DatabasePatchMutationResultDecision;
  historyDecision: DatabaseChangeHistoryInsertResultDecision;
  sideEffectsPlan: DatabasePostCommitSideEffectsPlan;
}): DatabasePatchWriteSuccessResponsePlan {
  if (!patchDecision.ok || patchDecision.shouldReloadCurrentRow) {
    throw new DatabasePayloadError("Patch success response requires one updated row.");
  }

  assertHistoryCommitted(historyDecision);

  return {
    responseKind: "patch-success",
    status: 200,
    code: "patch_saved",
    entity: {
      id: transaction.entityId,
      version: transaction.nextVersion,
    },
    changeHistoryCommitted: true,
    postCommitSideEffects: createSideEffectSummary(sideEffectsPlan),
    shouldReloadCurrentRow: false,
    returnsChangedFieldsOnly: true,
    returnsFullTable: false,
    maxResponseRows: 1,
  };
}

export function createDatabasePatchConflictResponsePlan({
  transaction,
  patchDecision,
}: {
  transaction: ServerPatchWriteTransactionEnvelope;
  patchDecision: DatabasePatchMutationResultDecision;
}): DatabasePatchConflictResponsePlan {
  if (patchDecision.ok || !patchDecision.shouldReloadCurrentRow) {
    throw new DatabasePayloadError("Patch conflict response requires a version or scope mismatch decision.");
  }

  return {
    responseKind: "patch-conflict",
    status: 409,
    code: "patch_conflict_or_scope_mismatch",
    entity: {
      id: transaction.entityId,
      openedVersion: transaction.expectedVersion,
    },
    changeHistoryCommitted: false,
    postCommitSideEffectsQueued: false,
    shouldReloadCurrentRow: true,
    reloadMode: "single-row-detail-query",
    returnsFullTable: false,
    maxResponseRows: 1,
  };
}

export function createDatabaseCreateDuplicateResponsePlan({
  duplicateDecision,
}: {
  duplicateDecision: DatabaseCreateDuplicateCheckDecision;
}): DatabaseCreateDuplicateResponsePlan {
  if (duplicateDecision.ok || duplicateDecision.canInsert) {
    throw new DatabasePayloadError("Create duplicate response requires a failed duplicate-check decision.");
  }

  return {
    responseKind: "create-duplicate",
    status: 409,
    code: "create_duplicate_found",
    canInsert: false,
    duplicateCheckIndex: duplicateDecision.duplicateCheckIndex,
    duplicateKeyColumns: duplicateDecision.duplicateKeyColumns,
    ...(duplicateDecision.existingEntityId ? { existingEntityId: duplicateDecision.existingEntityId } : {}),
    changeHistoryCommitted: false,
    postCommitSideEffectsQueued: false,
    returnsFullTable: false,
    maxResponseRows: 1,
  };
}
