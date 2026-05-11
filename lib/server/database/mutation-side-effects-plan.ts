import {
  createReportAggregateRefreshEnvelope,
  type ReportAggregateRefreshEnvelope,
} from "../../domain/reports/aggregateRefresh";
import type { ServerWriteSideEffectsEnvelope } from "../../domain/data-access/writeSideEffectsEnvelope";
import type {
  DatabaseCreateWriteTransactionSqlPlan,
  DatabasePatchWriteTransactionSqlPlan,
} from "./mutation-transaction-plan";
import { DatabasePayloadError } from "./validation";

export type DatabaseWriteTransactionSqlPlan =
  | DatabaseCreateWriteTransactionSqlPlan
  | DatabasePatchWriteTransactionSqlPlan;

export type DatabasePostCommitSideEffectStep = {
  kind: "queue-prepared-aggregate-refresh";
  tableRole: "post-commit-queue";
  executionMode: "queued";
  afterCommitOnly: true;
  sourceModuleId: string;
  entityId: string;
  aggregateEventId: string;
  refreshEnvelope: ReportAggregateRefreshEnvelope;
  queuePayload: {
    queuedOperationId: string;
    reportKey: string;
    workspaceId: string;
    moduleId: string;
    requestedBy: string;
    sourceIds: readonly string[];
    sourceVersion: string;
    periodStart: string;
    periodEnd: string;
    sectionId?: string;
    metricKeys: readonly string[];
  };
  storesResultByReference: true;
  noResidentProcess: true;
  noInlineReportRecalculation: true;
  noFullReportRebuild: true;
  noClientSideRecalculation: true;
};

export type DatabasePostCommitSideEffectsPlan = {
  executionMode: "server-only";
  transactionKind: DatabaseWriteTransactionSqlPlan["transactionKind"];
  transactionCommitCondition: "all_steps_ok";
  requiresCommittedTransaction: true;
  afterCommitOnly: true;
  queueMode: "post-commit";
  noPostCommitSideEffectsBeforeCommit: true;
  noInlineReportRecalculation: true;
  noFullReportRebuild: true;
  sideEffectCount: number;
  steps: readonly DatabasePostCommitSideEffectStep[];
};

function assertPostCommitGuards(
  sideEffects: ServerWriteSideEffectsEnvelope,
  transactionSqlPlan: DatabaseWriteTransactionSqlPlan,
) {
  if (
    !transactionSqlPlan.atomic
    || transactionSqlPlan.commitCondition !== "all_steps_ok"
    || !transactionSqlPlan.rollbackOnAnyStepFailure
    || !transactionSqlPlan.writesChangeHistory
    || !transactionSqlPlan.noPostCommitSideEffectsBeforeCommit
  ) {
    throw new DatabasePayloadError(
      "Post-commit side effects require an atomic transaction plan that writes history and blocks side effects before commit.",
    );
  }

  if (sideEffects.transactionKind !== transactionSqlPlan.transactionKind) {
    throw new DatabasePayloadError(
      `Side-effect transaction kind ${sideEffects.transactionKind} does not match SQL transaction plan ${transactionSqlPlan.transactionKind}.`,
    );
  }

  if (
    sideEffects.executionMode !== "server-only"
    || !sideEffects.afterCommitOnly
    || !sideEffects.writesChangeHistory
    || !sideEffects.noInlineReportRecalculation
    || !sideEffects.noFullReportRebuild
  ) {
    throw new DatabasePayloadError(
      "Write side effects must stay server-only, post-commit, history-backed, and free of inline report recalculation.",
    );
  }

  if (sideEffects.queuesAggregateRefresh !== Boolean(sideEffects.aggregateInvalidation)) {
    throw new DatabasePayloadError(
      "Aggregate refresh queue flag must match the aggregate invalidation envelope.",
    );
  }
}

function createAggregateRefreshQueueStep(
  sideEffects: ServerWriteSideEffectsEnvelope,
): DatabasePostCommitSideEffectStep | undefined {
  const invalidation = sideEffects.aggregateInvalidation;
  if (!invalidation) return undefined;

  const refreshEnvelope = createReportAggregateRefreshEnvelope(invalidation.refreshPlan);
  if (!refreshEnvelope.ok) {
    throw new DatabasePayloadError(
      "Post-commit aggregate refresh cannot be queued because its bounded refresh envelope is invalid.",
    );
  }

  if (
    refreshEnvelope.envelope.moduleId !== sideEffects.moduleId
    || refreshEnvelope.envelope.queuedOperation.requestedBy !== sideEffects.actorId
    || !refreshEnvelope.envelope.sourceIds.includes(sideEffects.entityId)
    || !refreshEnvelope.envelope.queuedOperation.noResidentProcess
    || !refreshEnvelope.envelope.queuedOperation.storesResultByReference
    || !refreshEnvelope.envelope.noFullReportRebuild
    || !refreshEnvelope.envelope.avoidsClientSideRecalculation
  ) {
    throw new DatabasePayloadError(
      "Post-commit aggregate refresh queue payload does not match the committed write side effects.",
    );
  }

  return {
    kind: "queue-prepared-aggregate-refresh",
    tableRole: "post-commit-queue",
    executionMode: "queued",
    afterCommitOnly: true,
    sourceModuleId: invalidation.sourceModuleId,
    entityId: invalidation.entityId,
    aggregateEventId: invalidation.eventId,
    refreshEnvelope: refreshEnvelope.envelope,
    queuePayload: {
      queuedOperationId: refreshEnvelope.envelope.queuedOperation.id,
      reportKey: refreshEnvelope.envelope.reportKey,
      workspaceId: refreshEnvelope.envelope.workspaceId,
      moduleId: refreshEnvelope.envelope.moduleId,
      requestedBy: refreshEnvelope.envelope.queuedOperation.requestedBy,
      sourceIds: refreshEnvelope.envelope.sourceIds,
      sourceVersion: refreshEnvelope.envelope.sourceVersion,
      periodStart: refreshEnvelope.envelope.periodStart,
      periodEnd: refreshEnvelope.envelope.periodEnd,
      ...(refreshEnvelope.envelope.sectionId ? { sectionId: refreshEnvelope.envelope.sectionId } : {}),
      metricKeys: refreshEnvelope.envelope.metricKeys,
    },
    storesResultByReference: true,
    noResidentProcess: true,
    noInlineReportRecalculation: true,
    noFullReportRebuild: true,
    noClientSideRecalculation: true,
  };
}

export function createDatabasePostCommitSideEffectsPlan({
  sideEffects,
  transactionSqlPlan,
}: {
  sideEffects: ServerWriteSideEffectsEnvelope;
  transactionSqlPlan: DatabaseWriteTransactionSqlPlan;
}): DatabasePostCommitSideEffectsPlan {
  assertPostCommitGuards(sideEffects, transactionSqlPlan);

  const aggregateStep = createAggregateRefreshQueueStep(sideEffects);
  const steps = aggregateStep ? [aggregateStep] : [];

  return {
    executionMode: "server-only",
    transactionKind: transactionSqlPlan.transactionKind,
    transactionCommitCondition: "all_steps_ok",
    requiresCommittedTransaction: true,
    afterCommitOnly: true,
    queueMode: "post-commit",
    noPostCommitSideEffectsBeforeCommit: true,
    noInlineReportRecalculation: true,
    noFullReportRebuild: true,
    sideEffectCount: steps.length,
    steps,
  };
}
