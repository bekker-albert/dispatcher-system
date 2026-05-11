export type DatabasePatchMutationWhereSqlPlan = {
  tableSql: string;
  whereSql: string;
  params: unknown[];
  scopeColumnKeys: string[];
  maxEntityRowWrites: 1;
  requiresExpectedVersion: true;
};

export type DatabasePatchMutationSetDraft = {
  columnValues: Record<string, unknown>;
  updatedAt: string;
  updatedBy: string;
};

export type DatabasePatchMutationSetSqlPlan = {
  setSql: string;
  params: unknown[];
  changedColumns: string[];
  nextVersion: number;
  updatedAt: string;
  updatedBy: string;
  maxEntityRowWrites: 1;
  writesChangeHistory: true;
  forbidsReservedColumnPatch: true;
};

export type DatabaseChangeHistoryInsertSqlPlan = {
  tableSql: string;
  columns: string[];
  insertSql: string;
  valuesSql: string;
  sql: string;
  params: unknown[];
  rowCount: number;
  expectedRowCount: number;
  writesPerField: true;
  maxRows: 100;
};

export type DatabaseCreateEntityInsertDraft = {
  generatedEntityId: string;
  columnValues: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
};

export type DatabaseCreateEntityInsertSqlPlan = {
  tableSql: string;
  columns: string[];
  insertSql: string;
  valuesSql: string;
  sql: string;
  params: unknown[];
  generatedEntityId: string;
  initialVersion: 1;
  initialStatus: string;
  maxEntityRowWrites: 1;
  writesChangeHistory: true;
  returnsCreatedEntityId: true;
  scopeColumnKeys: string[];
  forbidsReservedColumnOverride: true;
};

export type DatabaseCreateDuplicateCheckSqlPlan = {
  sql: string;
  selectSql: string;
  fromSql: string;
  whereSql: string;
  limitSql: "LIMIT 1";
  params: unknown[];
  duplicateKeyColumns: string[];
  maxRows: 1;
};

export type DatabaseCreateDuplicateCheckResult = {
  duplicateKeyColumns: string[];
  rowCount: number;
  existingEntityId?: string;
};

export type DatabaseCreateDuplicateCheckDecision =
  | {
      ok: true;
      code: "create_no_duplicate";
      canInsert: true;
      duplicateChecksPassed: number;
    }
  | {
      ok: false;
      code: "create_duplicate_found";
      canInsert: false;
      duplicateCheckIndex: number;
      duplicateKeyColumns: string[];
      existingEntityId?: string;
    };

export type DatabasePatchMutationResultDecision =
  | {
      ok: true;
      code: "patch_row_updated";
      affectedRows: 1;
      changeHistoryAllowed: true;
      shouldReloadCurrentRow: false;
    }
  | {
      ok: false;
      code: "patch_conflict_or_scope_mismatch";
      affectedRows: 0;
      changeHistoryAllowed: false;
      shouldReloadCurrentRow: true;
    };

export type DatabaseCreateEntityInsertResultDecision =
  | {
      ok: true;
      code: "create_entity_inserted";
      affectedRows: 1;
      changeHistoryAllowed: true;
      shouldReturnCreatedEntity: true;
    }
  | {
      ok: false;
      code: "create_entity_not_inserted";
      affectedRows: 0;
      changeHistoryAllowed: false;
      shouldReturnCreatedEntity: false;
    };

export type DatabaseChangeHistoryInsertResultDecision =
  | {
      ok: true;
      code: "change_history_inserted";
      affectedRows: number;
      expectedRowCount: number;
      transactionCanCommit: true;
    }
  | {
      ok: false;
      code: "change_history_row_count_mismatch";
      affectedRows: number;
      expectedRowCount: number;
      transactionCanCommit: false;
    };
