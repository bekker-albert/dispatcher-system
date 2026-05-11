import { DatabasePayloadError } from "./validation";
import type {
  DatabaseChangeHistoryInsertResultDecision,
  DatabaseCreateDuplicateCheckDecision,
  DatabaseCreateDuplicateCheckResult,
  DatabaseCreateEntityInsertResultDecision,
  DatabasePatchMutationResultDecision,
} from "./mutation-sql-builder-types";

export function evaluateDatabasePatchMutationResult({
  affectedRows,
}: {
  affectedRows: number;
}): DatabasePatchMutationResultDecision {
  if (!Number.isInteger(affectedRows) || affectedRows < 0) {
    throw new DatabasePayloadError(`Invalid patch affectedRows value: ${affectedRows}.`);
  }

  if (affectedRows === 0) {
    return {
      ok: false,
      code: "patch_conflict_or_scope_mismatch",
      affectedRows: 0,
      changeHistoryAllowed: false,
      shouldReloadCurrentRow: true,
    };
  }

  if (affectedRows > 1) {
    throw new DatabasePayloadError(
      `Patch mutation affected ${affectedRows} rows; expected at most one row.`,
    );
  }

  return {
    ok: true,
    code: "patch_row_updated",
    affectedRows: 1,
    changeHistoryAllowed: true,
    shouldReloadCurrentRow: false,
  };
}

export function evaluateDatabaseCreateEntityInsertResult({
  affectedRows,
}: {
  affectedRows: number;
}): DatabaseCreateEntityInsertResultDecision {
  if (!Number.isInteger(affectedRows) || affectedRows < 0) {
    throw new DatabasePayloadError(`Invalid create affectedRows value: ${affectedRows}.`);
  }

  if (affectedRows === 0) {
    return {
      ok: false,
      code: "create_entity_not_inserted",
      affectedRows: 0,
      changeHistoryAllowed: false,
      shouldReturnCreatedEntity: false,
    };
  }

  if (affectedRows > 1) {
    throw new DatabasePayloadError(
      `Create mutation affected ${affectedRows} rows; expected at most one row.`,
    );
  }

  return {
    ok: true,
    code: "create_entity_inserted",
    affectedRows: 1,
    changeHistoryAllowed: true,
    shouldReturnCreatedEntity: true,
  };
}

export function evaluateDatabaseChangeHistoryInsertResult({
  affectedRows,
  expectedRowCount,
}: {
  affectedRows: number;
  expectedRowCount: number;
}): DatabaseChangeHistoryInsertResultDecision {
  if (!Number.isInteger(affectedRows) || affectedRows < 0) {
    throw new DatabasePayloadError(`Invalid change-history affectedRows value: ${affectedRows}.`);
  }

  if (!Number.isInteger(expectedRowCount) || expectedRowCount < 1 || expectedRowCount > 100) {
    throw new DatabasePayloadError(`Invalid change-history expectedRowCount value: ${expectedRowCount}.`);
  }

  if (affectedRows !== expectedRowCount) {
    return {
      ok: false,
      code: "change_history_row_count_mismatch",
      affectedRows,
      expectedRowCount,
      transactionCanCommit: false,
    };
  }

  return {
    ok: true,
    code: "change_history_inserted",
    affectedRows,
    expectedRowCount,
    transactionCanCommit: true,
  };
}

export function evaluateDatabaseCreateDuplicateCheckResults(
  results: readonly DatabaseCreateDuplicateCheckResult[],
): DatabaseCreateDuplicateCheckDecision {
  if (results.length === 0) {
    throw new DatabasePayloadError("Create duplicate checks must include at least one result.");
  }

  for (const [duplicateCheckIndex, result] of results.entries()) {
    const { rowCount } = result;
    if (!Number.isInteger(rowCount) || rowCount < 0) {
      throw new DatabasePayloadError(`Invalid duplicate-check rowCount value: ${rowCount}.`);
    }

    if (rowCount > 1) {
      throw new DatabasePayloadError(
        `Duplicate check returned ${rowCount} rows; expected at most one row.`,
      );
    }

    if (rowCount === 1) {
      return {
        ok: false,
        code: "create_duplicate_found",
        canInsert: false,
        duplicateCheckIndex,
        duplicateKeyColumns: result.duplicateKeyColumns,
        ...(result.existingEntityId ? { existingEntityId: result.existingEntityId } : {}),
      };
    }
  }

  return {
    ok: true,
    code: "create_no_duplicate",
    canInsert: true,
    duplicateChecksPassed: results.length,
  };
}
