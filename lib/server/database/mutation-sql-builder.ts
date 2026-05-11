import type { ServerChangeHistoryEnvelope } from "../../domain/audit/changeHistoryEnvelope";
import type { ServerCreateMutationEnvelope } from "../../domain/data-access/createMutationEnvelope";
import type { ModuleCreateMutationPlan } from "../../domain/data-access/moduleCreateMutationPlans";
import type { ModulePatchMutationPlan } from "../../domain/data-access/modulePatchMutationPlans";
import type { ServerPatchMutationEnvelope } from "../../domain/data-access/patchMutationEnvelope";
import { quoteMysqlColumnPath, quoteMysqlIdentifier } from "../../domain/data-access/mysqlIdentifiers";
import { DatabasePayloadError } from "./validation";
import type {
  DatabaseChangeHistoryInsertSqlPlan,
  DatabaseCreateDuplicateCheckSqlPlan,
  DatabaseCreateEntityInsertDraft,
  DatabaseCreateEntityInsertSqlPlan,
  DatabasePatchMutationSetDraft,
  DatabasePatchMutationSetSqlPlan,
  DatabasePatchMutationWhereSqlPlan,
} from "./mutation-sql-builder-types";

export type {
  DatabaseChangeHistoryInsertSqlPlan,
  DatabaseChangeHistoryInsertResultDecision,
  DatabaseCreateDuplicateCheckDecision,
  DatabaseCreateDuplicateCheckResult,
  DatabaseCreateDuplicateCheckSqlPlan,
  DatabaseCreateEntityInsertDraft,
  DatabaseCreateEntityInsertResultDecision,
  DatabaseCreateEntityInsertSqlPlan,
  DatabasePatchMutationResultDecision,
  DatabasePatchMutationSetDraft,
  DatabasePatchMutationSetSqlPlan,
  DatabasePatchMutationWhereSqlPlan,
} from "./mutation-sql-builder-types";
export {
  evaluateDatabaseChangeHistoryInsertResult,
  evaluateDatabaseCreateDuplicateCheckResults,
  evaluateDatabaseCreateEntityInsertResult,
  evaluateDatabasePatchMutationResult,
} from "./mutation-sql-evaluators";

const changeHistoryColumns = [
  "workspace_id",
  "entity_type",
  "entity_id",
  "entity_version",
  "field",
  "old_value_json",
  "new_value_json",
  "changed_at",
  "changed_by",
  "reason_kind",
  "reason_text",
  "capability",
] as const;

function hasSqlValue(value: unknown) {
  if (typeof value === "string") return Boolean(value.trim());
  return value !== undefined && value !== null;
}

function normalizeSqlValue(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}

function snakeToCamel(value: string) {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function getScopedValue(scope: Record<string, unknown>, scopeKey: string) {
  return scope[scopeKey] ?? scope[snakeToCamel(scopeKey)];
}

function getColumnValue(values: Record<string, unknown>, column: string) {
  const columnKey = column.split(".").at(-1) ?? column;
  return values[column] ?? values[columnKey] ?? values[snakeToCamel(columnKey)];
}

function requireSqlValue(value: unknown, field: string) {
  if (hasSqlValue(value)) return normalizeSqlValue(value);
  throw new DatabasePayloadError(`Missing SQL value for ${field}.`);
}

function requireSafeColumnPath(column: string, field: string) {
  try {
    return quoteMysqlColumnPath(column);
  } catch {
    throw new DatabasePayloadError(`Unsafe SQL column for ${field}: ${column}.`);
  }
}

function requireSafeIdentifier(identifier: string, field: string) {
  try {
    return quoteMysqlIdentifier(identifier);
  } catch {
    throw new DatabasePayloadError(`Unsafe SQL identifier for ${field}: ${identifier}.`);
  }
}

function createReservedPatchColumns(plan: ModulePatchMutationPlan) {
  return new Set([
    plan.idColumn,
    plan.versionColumn,
    plan.updatedAtColumn,
    plan.updatedByColumn,
    ...Object.values(plan.scopeColumns).filter((column): column is string => Boolean(column)),
  ]);
}

function createReservedCreateColumns(plan: ModuleCreateMutationPlan) {
  return new Set([
    plan.idColumn,
    plan.versionColumn,
    plan.statusColumn,
    plan.createdAtColumn,
    plan.createdByColumn,
    plan.updatedAtColumn,
    plan.updatedByColumn,
  ]);
}

export function createDatabasePatchMutationWhereSqlPlan(
  envelope: ServerPatchMutationEnvelope,
  plan: ModulePatchMutationPlan,
  scope: Record<string, unknown> = {},
): DatabasePatchMutationWhereSqlPlan {
  const whereParts = [
    `${quoteMysqlColumnPath(plan.idColumn)} = ?`,
    `${quoteMysqlColumnPath(plan.versionColumn)} = ?`,
  ];
  const params: unknown[] = [envelope.entityId, envelope.expectedVersion];
  const scopeColumnKeys: string[] = [];

  for (const [scopeKey, column] of Object.entries(plan.scopeColumns)) {
    if (!column) continue;

    const scopeValue = requireSqlValue(getScopedValue(scope, scopeKey), `scope.${scopeKey}`);
    whereParts.push(`${quoteMysqlColumnPath(column)} = ?`);
    params.push(scopeValue);
    scopeColumnKeys.push(scopeKey);
  }

  return {
    tableSql: quoteMysqlIdentifier(plan.tableName),
    whereSql: `WHERE ${whereParts.join(" AND ")}`,
    params,
    scopeColumnKeys,
    maxEntityRowWrites: 1,
    requiresExpectedVersion: true,
  };
}

export function createDatabaseCreateEntityInsertSqlPlan(
  envelope: ServerCreateMutationEnvelope,
  plan: ModuleCreateMutationPlan,
  draft: DatabaseCreateEntityInsertDraft,
): DatabaseCreateEntityInsertSqlPlan {
  const generatedEntityId = requireSqlValue(draft.generatedEntityId, "generatedEntityId");
  const createdAt = requireSqlValue(draft.createdAt, "created_at");
  const createdBy = requireSqlValue(draft.createdBy, "created_by");
  const reservedColumns = createReservedCreateColumns(plan);
  const scopeColumnKeys: string[] = [];
  const columns: string[] = [
    plan.idColumn,
    plan.versionColumn,
    plan.statusColumn,
    plan.createdAtColumn,
    plan.createdByColumn,
    plan.updatedAtColumn,
    plan.updatedByColumn,
  ];
  const params: unknown[] = [
    generatedEntityId,
    envelope.initialVersion,
    envelope.initialStatus,
    createdAt,
    createdBy,
    createdAt,
    createdBy,
  ];

  for (const column of Object.keys(draft.columnValues)) {
    if (reservedColumns.has(column)) {
      throw new DatabasePayloadError(`Create mutation cannot override reserved column ${column}.`);
    }
  }

  for (const [scopeKey, column] of Object.entries(plan.scopeColumns)) {
    if (!column) continue;

    requireSqlValue(getColumnValue(draft.columnValues, column), `create.scope.${scopeKey}`);
    scopeColumnKeys.push(scopeKey);
  }

  for (const [column, value] of Object.entries(draft.columnValues)) {
    columns.push(column);
    params.push(value);
  }

  if (columns.length === 7) {
    throw new DatabasePayloadError("Create mutation insert plan requires at least one document column.");
  }

  const tableSql = requireSafeIdentifier(plan.tableName, "create.tableName");
  const insertSql = `INSERT INTO ${tableSql} (${
    columns.map((column) => requireSafeColumnPath(column, "create.columnValues")).join(", ")
  })`;
  const valuesSql = `VALUES (${columns.map(() => "?").join(", ")})`;

  return {
    tableSql,
    columns,
    insertSql,
    valuesSql,
    sql: `${insertSql} ${valuesSql}`,
    params,
    generatedEntityId: String(generatedEntityId),
    initialVersion: 1,
    initialStatus: envelope.initialStatus,
    maxEntityRowWrites: 1,
    writesChangeHistory: true,
    returnsCreatedEntityId: true,
    scopeColumnKeys,
    forbidsReservedColumnOverride: true,
  };
}

export function createDatabasePatchMutationSetSqlPlan(
  envelope: ServerPatchMutationEnvelope,
  plan: ModulePatchMutationPlan,
  draft: DatabasePatchMutationSetDraft,
): DatabasePatchMutationSetSqlPlan {
  const updatedAt = requireSqlValue(draft.updatedAt, "updated_at");
  const updatedBy = requireSqlValue(draft.updatedBy, "updated_by");
  const reservedColumns = createReservedPatchColumns(plan);
  const changedColumns: string[] = [];
  const setParts: string[] = [];
  const params: unknown[] = [];

  for (const [column, value] of Object.entries(draft.columnValues)) {
    if (reservedColumns.has(column)) {
      throw new DatabasePayloadError(`Patch mutation cannot set reserved column ${column}.`);
    }

    setParts.push(`${requireSafeColumnPath(column, "patch.columnValues")} = ?`);
    params.push(value);
    changedColumns.push(column);
  }

  if (changedColumns.length === 0) {
    throw new DatabasePayloadError("Patch mutation SET plan requires at least one changed column.");
  }

  const nextVersion = envelope.expectedVersion + 1;
  setParts.push(`${quoteMysqlColumnPath(plan.versionColumn)} = ?`);
  params.push(nextVersion);
  setParts.push(`${quoteMysqlColumnPath(plan.updatedAtColumn)} = ?`);
  params.push(updatedAt);
  setParts.push(`${quoteMysqlColumnPath(plan.updatedByColumn)} = ?`);
  params.push(updatedBy);

  return {
    setSql: `SET ${setParts.join(", ")}`,
    params,
    changedColumns,
    nextVersion,
    updatedAt: String(updatedAt),
    updatedBy: String(updatedBy),
    maxEntityRowWrites: 1,
    writesChangeHistory: true,
    forbidsReservedColumnPatch: true,
  };
}

function stringifyHistoryValue(value: unknown) {
  return value === undefined ? null : JSON.stringify(value);
}

export function createDatabaseChangeHistoryInsertSqlPlan(
  envelope: ServerChangeHistoryEnvelope,
  tableName = "change_history_entries",
): DatabaseChangeHistoryInsertSqlPlan {
  if (!envelope.writesPerField) {
    throw new DatabasePayloadError("Change history SQL plan requires per-field history entries.");
  }

  if (envelope.entryCount !== envelope.entries.length || envelope.entryCount < 1) {
    throw new DatabasePayloadError("Change history SQL plan entry count does not match entries.");
  }

  if (envelope.entryCount > 100) {
    throw new DatabasePayloadError(
      `Change history SQL plan has ${envelope.entryCount} entries; expected at most 100.`,
    );
  }

  const columns = [...changeHistoryColumns];
  const rowPlaceholderSql = `(${columns.map(() => "?").join(", ")})`;
  const valuesSql = envelope.entries.map(() => rowPlaceholderSql).join(", ");
  const tableSql = requireSafeIdentifier(tableName, "history.tableName");
  const insertSql = `INSERT INTO ${tableSql} (${
    columns.map(quoteMysqlIdentifier).join(", ")
  })`;
  const params = envelope.entries.flatMap((entry) => [
    envelope.workspaceId,
    envelope.entityType,
    envelope.entityId,
    envelope.entityVersion,
    entry.field,
    stringifyHistoryValue(entry.oldValue),
    stringifyHistoryValue(entry.newValue),
    envelope.changedAt,
    envelope.changedBy,
    envelope.reasonKind,
    envelope.reasonText ?? null,
    envelope.capability,
  ]);

  return {
    tableSql,
    columns,
    insertSql,
    valuesSql: `VALUES ${valuesSql}`,
    sql: `${insertSql} VALUES ${valuesSql}`,
    params,
    rowCount: envelope.entryCount,
    expectedRowCount: envelope.entryCount,
    writesPerField: true,
    maxRows: 100,
  };
}

export function createDatabaseCreateDuplicateCheckSqlPlans(
  envelope: ServerCreateMutationEnvelope,
  plan: ModuleCreateMutationPlan,
  columnValues: Record<string, unknown> = envelope.data,
): DatabaseCreateDuplicateCheckSqlPlan[] {
  return plan.duplicateKeyGroups.map((duplicateKeyColumns) => {
    const whereParts = duplicateKeyColumns.map((column) => `${quoteMysqlColumnPath(column)} = ?`);
    const params = duplicateKeyColumns.map((column) => (
      requireSqlValue(getColumnValue(columnValues, column), `duplicate.${column}`)
    ));
    const selectSql = `SELECT ${quoteMysqlColumnPath(plan.idColumn)}`;
    const fromSql = `FROM ${quoteMysqlIdentifier(plan.tableName)}`;
    const whereSql = `WHERE ${whereParts.join(" AND ")}`;
    const limitSql = "LIMIT 1" as const;

    return {
      sql: [selectSql, fromSql, whereSql, limitSql].join(" "),
      selectSql,
      fromSql,
      whereSql,
      limitSql,
      params,
      duplicateKeyColumns,
      maxRows: 1,
    };
  });
}
