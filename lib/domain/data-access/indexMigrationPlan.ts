import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import { listModuleDatabaseIndexContracts } from "./indexContracts";
import {
  isSafeMysqlIdentifier,
  quoteMysqlIdentifier,
} from "./mysqlIdentifiers";

export { quoteMysqlIdentifier } from "./mysqlIdentifiers";

export type ModuleDatabaseIndexMigrationStatement = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  tableName: string;
  indexName: string;
  fields: string[];
  statement: string;
};

export type ModuleDatabaseIndexNameCollision = {
  tableName: string;
  indexName: string;
  statements: ModuleDatabaseIndexMigrationStatement[];
};

export type ModuleDatabaseIndexDefinitionIssue = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  tableName: string;
  indexName: string;
  issue: "empty_fields" | "unsafe_table_name" | "unsafe_index_name" | "unsafe_field_name";
  value?: string;
};

export type ModuleDatabaseIndexMigrationPlanSummary = {
  workspaceId?: DispatchWorkspaceId;
  moduleCount: number;
  statementCount: number;
  definitionIssueCount: number;
  indexNameCollisionCount: number;
};

export function createMysqlAddIndexStatement(
  tableName: string,
  indexName: string,
  fields: readonly string[],
) {
  if (fields.length === 0) {
    throw new Error(`Index ${indexName} on ${tableName} must include at least one field`);
  }

  return [
    "ALTER TABLE",
    quoteMysqlIdentifier(tableName),
    "ADD INDEX",
    quoteMysqlIdentifier(indexName),
    `(${fields.map((field) => quoteMysqlIdentifier(field)).join(", ")})`,
  ].join(" ");
}

export function createModuleDatabaseIndexMigrationStatements(workspaceId?: DispatchWorkspaceId) {
  return listModuleDatabaseIndexContracts(workspaceId).flatMap((contract) => (
    contract.indexes.map((index): ModuleDatabaseIndexMigrationStatement => ({
      moduleId: contract.moduleId,
      workspaceId: contract.workspaceId,
      tableName: contract.primaryEntity,
      indexName: index.name,
      fields: [...index.fields],
      statement: createMysqlAddIndexStatement(contract.primaryEntity, index.name, index.fields),
    }))
  ));
}

export function getModuleDatabaseIndexDefinitionIssues(
  workspaceId?: DispatchWorkspaceId,
): ModuleDatabaseIndexDefinitionIssue[] {
  return listModuleDatabaseIndexContracts(workspaceId).flatMap((contract) => (
    contract.indexes.flatMap((index) => {
      const issues: ModuleDatabaseIndexDefinitionIssue[] = [];

      if (index.fields.length === 0) {
        issues.push({
          moduleId: contract.moduleId,
          workspaceId: contract.workspaceId,
          tableName: contract.primaryEntity,
          indexName: index.name,
          issue: "empty_fields",
        });
      }

      if (!isSafeMysqlIdentifier(contract.primaryEntity)) {
        issues.push({
          moduleId: contract.moduleId,
          workspaceId: contract.workspaceId,
          tableName: contract.primaryEntity,
          indexName: index.name,
          issue: "unsafe_table_name",
          value: contract.primaryEntity,
        });
      }

      if (!isSafeMysqlIdentifier(index.name)) {
        issues.push({
          moduleId: contract.moduleId,
          workspaceId: contract.workspaceId,
          tableName: contract.primaryEntity,
          indexName: index.name,
          issue: "unsafe_index_name",
          value: index.name,
        });
      }

      for (const field of index.fields) {
        if (!isSafeMysqlIdentifier(field)) {
          issues.push({
            moduleId: contract.moduleId,
            workspaceId: contract.workspaceId,
            tableName: contract.primaryEntity,
            indexName: index.name,
            issue: "unsafe_field_name",
            value: field,
          });
        }
      }

      return issues;
    })
  ));
}

export function getDuplicateModuleDatabaseIndexNames(workspaceId?: DispatchWorkspaceId) {
  const statementsByTableAndIndex = new Map<string, ModuleDatabaseIndexMigrationStatement[]>();

  for (const statement of createModuleDatabaseIndexMigrationStatements(workspaceId)) {
    const key = `${statement.tableName}:${statement.indexName}`;
    statementsByTableAndIndex.set(key, [
      ...(statementsByTableAndIndex.get(key) ?? []),
      statement,
    ]);
  }

  return Array.from(statementsByTableAndIndex.values())
    .filter((statements) => statements.length > 1)
    .map((statements): ModuleDatabaseIndexNameCollision => ({
      tableName: statements[0]?.tableName ?? "",
      indexName: statements[0]?.indexName ?? "",
      statements,
    }));
}

export function summarizeModuleDatabaseIndexMigrationPlan(
  workspaceId?: DispatchWorkspaceId,
): ModuleDatabaseIndexMigrationPlanSummary {
  const contracts = listModuleDatabaseIndexContracts(workspaceId);
  const statements = createModuleDatabaseIndexMigrationStatements(workspaceId);

  return {
    workspaceId,
    moduleCount: contracts.length,
    statementCount: statements.length,
    definitionIssueCount: getModuleDatabaseIndexDefinitionIssues(workspaceId).length,
    indexNameCollisionCount: getDuplicateModuleDatabaseIndexNames(workspaceId).length,
  };
}
