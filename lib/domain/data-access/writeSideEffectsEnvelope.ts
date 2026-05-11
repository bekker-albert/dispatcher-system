import {
  type ReportAggregateInvalidationEnvelope,
} from "../reports/aggregateInvalidation";
import {
  reportAggregateInvalidationPlans,
} from "../reports/aggregateInvalidationPlans";
import type { ServerWriteTransactionEnvelope } from "./writeTransactionEnvelope";

export type ServerWriteSideEffectIssueCode =
  | "aggregate_invalidation_actor_mismatch"
  | "aggregate_invalidation_entity_mismatch"
  | "aggregate_invalidation_missing"
  | "aggregate_invalidation_module_mismatch"
  | "history_step_required"
  | "inline_report_recalculation_forbidden"
  | "transaction_required";

export type ServerWriteSideEffectIssue = {
  code: ServerWriteSideEffectIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ServerWriteSideEffectsEnvelope = {
  executionMode: "server-only";
  afterCommitOnly: true;
  transactionKind: ServerWriteTransactionEnvelope["transactionKind"];
  moduleId: string;
  workspaceId: ServerWriteTransactionEnvelope["workspaceId"];
  databaseAction: string;
  actorId: string;
  entityId: string;
  writesChangeHistory: true;
  queuesAggregateRefresh: boolean;
  aggregateInvalidation?: ReportAggregateInvalidationEnvelope;
  noInlineReportRecalculation: true;
  noFullReportRebuild: true;
};

export type ServerWriteSideEffectsRejection = {
  code: "write_side_effects_invalid";
  message: string;
  issues: ServerWriteSideEffectIssue[];
};

export type ServerWriteSideEffectsEnvelopeResult =
  | { ok: true; envelope: ServerWriteSideEffectsEnvelope }
  | { ok: false; rejection: ServerWriteSideEffectsRejection };

export type ServerWriteSideEffectsDraft = {
  transaction?: ServerWriteTransactionEnvelope;
  aggregateInvalidation?: ReportAggregateInvalidationEnvelope;
  inlineReportRows?: unknown;
};

function createRejection(issues: ServerWriteSideEffectIssue[]): ServerWriteSideEffectsRejection {
  return {
    code: "write_side_effects_invalid",
    message: "Write side effects do not satisfy the post-commit bounded refresh contract.",
    issues,
  };
}

function getAggregateInvalidationPlan(transaction: ServerWriteTransactionEnvelope) {
  return reportAggregateInvalidationPlans.find((plan) => (
    plan.sourceModuleId === transaction.moduleId &&
    plan.databaseAction === transaction.databaseAction
  ));
}

function hasChangeHistoryStep(transaction: ServerWriteTransactionEnvelope) {
  return transaction.writesChangeHistory &&
    transaction.steps.some((step) => step.kind === "change-history" && step.tableRole === "audit");
}

export function validateServerWriteSideEffectsDraft(
  draft: ServerWriteSideEffectsDraft,
): ServerWriteSideEffectIssue[] {
  const issues: ServerWriteSideEffectIssue[] = [];
  const { transaction, aggregateInvalidation } = draft;

  if (!transaction) {
    return [{
      code: "transaction_required",
      severity: "blocker",
      message: "Write side effects must be attached to a completed server write transaction.",
      field: "transaction",
    }];
  }

  if (!hasChangeHistoryStep(transaction)) {
    issues.push({
      code: "history_step_required",
      severity: "blocker",
      message: "Post-commit side effects require a write transaction that already writes change history.",
      field: "transaction.steps",
    });
  }

  if (draft.inlineReportRows !== undefined) {
    issues.push({
      code: "inline_report_recalculation_forbidden",
      severity: "blocker",
      message: "Write side effects cannot carry report rows or inline recalculation results.",
      field: "inlineReportRows",
    });
  }

  const invalidationPlan = getAggregateInvalidationPlan(transaction);
  if (invalidationPlan && !aggregateInvalidation) {
    issues.push({
      code: "aggregate_invalidation_missing",
      severity: "blocker",
      message: "This source write must queue prepared aggregate invalidation after commit.",
      field: "aggregateInvalidation",
    });
  }

  if (aggregateInvalidation) {
    if (aggregateInvalidation.sourceModuleId !== transaction.moduleId) {
      issues.push({
        code: "aggregate_invalidation_module_mismatch",
        severity: "blocker",
        message: "Aggregate invalidation source module must match the committed write transaction.",
        field: "aggregateInvalidation.sourceModuleId",
      });
    }

    if (aggregateInvalidation.entityId !== transaction.entityId) {
      issues.push({
        code: "aggregate_invalidation_entity_mismatch",
        severity: "blocker",
        message: "Aggregate invalidation entity id must match the committed write entity.",
        field: "aggregateInvalidation.entityId",
      });
    }

    if (aggregateInvalidation.changedBy !== transaction.actorId) {
      issues.push({
        code: "aggregate_invalidation_actor_mismatch",
        severity: "blocker",
        message: "Aggregate invalidation actor must match the committed write actor.",
        field: "aggregateInvalidation.changedBy",
      });
    }

    if (!aggregateInvalidation.noClientSideRecalculation || !aggregateInvalidation.noFullReportRebuild) {
      issues.push({
        code: "inline_report_recalculation_forbidden",
        severity: "blocker",
        message: "Aggregate invalidation must avoid client-side recalculation and full report rebuilds.",
        field: "aggregateInvalidation",
      });
    }
  }

  return issues;
}

export function createServerWriteSideEffectsEnvelope(
  draft: ServerWriteSideEffectsDraft,
): ServerWriteSideEffectsEnvelopeResult {
  const issues = validateServerWriteSideEffectsDraft(draft);
  const { transaction } = draft;

  if (issues.length > 0 || !transaction) {
    return {
      ok: false,
      rejection: createRejection(issues),
    };
  }

  return {
    ok: true,
    envelope: {
      executionMode: "server-only",
      afterCommitOnly: true,
      transactionKind: transaction.transactionKind,
      moduleId: transaction.moduleId,
      workspaceId: transaction.workspaceId,
      databaseAction: transaction.databaseAction,
      actorId: transaction.actorId,
      entityId: transaction.entityId,
      writesChangeHistory: true,
      queuesAggregateRefresh: Boolean(draft.aggregateInvalidation),
      ...(draft.aggregateInvalidation ? { aggregateInvalidation: draft.aggregateInvalidation } : {}),
      noInlineReportRecalculation: true,
      noFullReportRebuild: true,
    },
  };
}
