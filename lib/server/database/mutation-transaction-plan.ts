import type {
  ServerCreateWriteTransactionEnvelope,
  ServerPatchWriteTransactionEnvelope,
} from "../../domain/data-access/writeTransactionEnvelope";
import { DatabasePayloadError } from "./validation";
import type {
  DatabaseChangeHistoryInsertSqlPlan,
  DatabaseCreateDuplicateCheckSqlPlan,
  DatabaseCreateEntityInsertSqlPlan,
  DatabasePatchMutationSetSqlPlan,
  DatabasePatchMutationWhereSqlPlan,
} from "./mutation-sql-builder-types";

export type DatabaseWriteTransactionSqlStep =
  | {
      kind: "duplicate-check";
      tableRole: "unique-check";
      sqlPlans: DatabaseCreateDuplicateCheckSqlPlan[];
      expectedRowCount: 0;
      resultEvaluator: "evaluateDatabaseCreateDuplicateCheckResults";
    }
  | {
      kind: "entity-insert";
      tableRole: "entity";
      sql: string;
      params: unknown[];
      expectedRowCount: 1;
      resultEvaluator: "evaluateDatabaseCreateEntityInsertResult";
    }
  | {
      kind: "entity-patch";
      tableRole: "entity";
      sql: string;
      params: unknown[];
      expectedRowCount: 1;
      requiresVersionMatch: true;
      resultEvaluator: "evaluateDatabasePatchMutationResult";
    }
  | {
      kind: "change-history";
      tableRole: "audit";
      sql: string;
      params: unknown[];
      expectedRowCount: number;
      resultEvaluator: "evaluateDatabaseChangeHistoryInsertResult";
    };

export type DatabaseCreateWriteTransactionSqlPlan = {
  transactionKind: "versioned-create-with-history";
  executionMode: "server-only";
  atomic: true;
  commitCondition: "all_steps_ok";
  rollbackOnAnyStepFailure: true;
  maxEntityRowWrites: 1;
  writesChangeHistory: true;
  noPostCommitSideEffectsBeforeCommit: true;
  steps: [
    DatabaseWriteTransactionSqlStep & { kind: "duplicate-check" },
    DatabaseWriteTransactionSqlStep & { kind: "entity-insert" },
    DatabaseWriteTransactionSqlStep & { kind: "change-history" },
  ];
};

export type DatabasePatchWriteTransactionSqlPlan = {
  transactionKind: "versioned-patch-with-history";
  executionMode: "server-only";
  atomic: true;
  commitCondition: "all_steps_ok";
  rollbackOnAnyStepFailure: true;
  maxEntityRowWrites: 1;
  writesChangeHistory: true;
  noPostCommitSideEffectsBeforeCommit: true;
  steps: [
    DatabaseWriteTransactionSqlStep & { kind: "entity-patch" },
    DatabaseWriteTransactionSqlStep & { kind: "change-history" },
  ];
};

function assertHistoryMatchesTransaction(
  transaction: ServerCreateWriteTransactionEnvelope | ServerPatchWriteTransactionEnvelope,
  historyInsertSqlPlan: DatabaseChangeHistoryInsertSqlPlan,
) {
  if (historyInsertSqlPlan.expectedRowCount !== transaction.changeCount) {
    throw new DatabasePayloadError(
      `Change-history SQL plan expected ${historyInsertSqlPlan.expectedRowCount} rows, but transaction expects ${transaction.changeCount}.`,
    );
  }
}

export function createDatabasePatchWriteTransactionSqlPlan({
  transaction,
  patchSetSqlPlan,
  patchWhereSqlPlan,
  historyInsertSqlPlan,
}: {
  transaction: ServerPatchWriteTransactionEnvelope;
  patchSetSqlPlan: DatabasePatchMutationSetSqlPlan;
  patchWhereSqlPlan: DatabasePatchMutationWhereSqlPlan;
  historyInsertSqlPlan: DatabaseChangeHistoryInsertSqlPlan;
}): DatabasePatchWriteTransactionSqlPlan {
  if (!transaction.atomic || transaction.maxEntityRowWrites !== 1 || !transaction.writesChangeHistory) {
    throw new DatabasePayloadError("Patch transaction must be atomic, one-row, and write change history.");
  }

  if (patchSetSqlPlan.nextVersion !== transaction.nextVersion) {
    throw new DatabasePayloadError(
      `Patch SET plan writes version ${patchSetSqlPlan.nextVersion}, but transaction expects ${transaction.nextVersion}.`,
    );
  }

  assertHistoryMatchesTransaction(transaction, historyInsertSqlPlan);

  return {
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
        sql: `UPDATE ${patchWhereSqlPlan.tableSql} ${patchSetSqlPlan.setSql} ${patchWhereSqlPlan.whereSql}`,
        params: [...patchSetSqlPlan.params, ...patchWhereSqlPlan.params],
        expectedRowCount: 1,
        requiresVersionMatch: true,
        resultEvaluator: "evaluateDatabasePatchMutationResult",
      },
      {
        kind: "change-history",
        tableRole: "audit",
        sql: historyInsertSqlPlan.sql,
        params: historyInsertSqlPlan.params,
        expectedRowCount: historyInsertSqlPlan.expectedRowCount,
        resultEvaluator: "evaluateDatabaseChangeHistoryInsertResult",
      },
    ],
  };
}

export function createDatabaseCreateWriteTransactionSqlPlan({
  transaction,
  duplicateCheckSqlPlans,
  entityInsertSqlPlan,
  historyInsertSqlPlan,
}: {
  transaction: ServerCreateWriteTransactionEnvelope;
  duplicateCheckSqlPlans: DatabaseCreateDuplicateCheckSqlPlan[];
  entityInsertSqlPlan: DatabaseCreateEntityInsertSqlPlan;
  historyInsertSqlPlan: DatabaseChangeHistoryInsertSqlPlan;
}): DatabaseCreateWriteTransactionSqlPlan {
  if (!transaction.atomic || transaction.maxEntityRowWrites !== 1 || !transaction.writesChangeHistory) {
    throw new DatabasePayloadError("Create transaction must be atomic, one-row, and write change history.");
  }

  if (duplicateCheckSqlPlans.length !== transaction.duplicateKeyGroupCount) {
    throw new DatabasePayloadError(
      `Create transaction expects ${transaction.duplicateKeyGroupCount} duplicate checks, got ${duplicateCheckSqlPlans.length}.`,
    );
  }

  if (entityInsertSqlPlan.generatedEntityId !== transaction.entityId) {
    throw new DatabasePayloadError("Create entity insert id must match transaction entity id.");
  }

  if (
    entityInsertSqlPlan.initialVersion !== transaction.initialVersion
    || entityInsertSqlPlan.initialStatus !== transaction.initialStatus
  ) {
    throw new DatabasePayloadError("Create entity insert version/status must match transaction envelope.");
  }

  assertHistoryMatchesTransaction(transaction, historyInsertSqlPlan);

  return {
    transactionKind: "versioned-create-with-history",
    executionMode: "server-only",
    atomic: true,
    commitCondition: "all_steps_ok",
    rollbackOnAnyStepFailure: true,
    maxEntityRowWrites: 1,
    writesChangeHistory: true,
    noPostCommitSideEffectsBeforeCommit: true,
    steps: [
      {
        kind: "duplicate-check",
        tableRole: "unique-check",
        sqlPlans: duplicateCheckSqlPlans,
        expectedRowCount: 0,
        resultEvaluator: "evaluateDatabaseCreateDuplicateCheckResults",
      },
      {
        kind: "entity-insert",
        tableRole: "entity",
        sql: entityInsertSqlPlan.sql,
        params: entityInsertSqlPlan.params,
        expectedRowCount: 1,
        resultEvaluator: "evaluateDatabaseCreateEntityInsertResult",
      },
      {
        kind: "change-history",
        tableRole: "audit",
        sql: historyInsertSqlPlan.sql,
        params: historyInsertSqlPlan.params,
        expectedRowCount: historyInsertSqlPlan.expectedRowCount,
        resultEvaluator: "evaluateDatabaseChangeHistoryInsertResult",
      },
    ],
  };
}
