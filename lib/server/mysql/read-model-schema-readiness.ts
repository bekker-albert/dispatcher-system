import type { RowDataPacket } from "mysql2/promise";
import {
  getModuleReadModelSchemaRequirement,
  listModuleReadModelSchemaRequirements,
  reviewModuleReadModelSchemaRequirementsSnapshot,
  reviewModuleReadModelSchemaSnapshot,
  type ModuleReadModelSchemaRequirement,
  type ModuleReadModelSchemaSnapshot,
} from "../../domain/data-access/moduleReadModelSchemaReadiness";
import type { DispatchWorkspaceId } from "../../domain/workspaces/workspaces";
import { dbRows } from "./pool";

type MysqlInformationSchemaColumnRow = RowDataPacket & {
  table_name: string;
  column_name: string;
};

export type MysqlReadModelSchemaPreflightResult = {
  workspaceId?: DispatchWorkspaceId;
  requirements: ModuleReadModelSchemaRequirement[];
  snapshot: ModuleReadModelSchemaSnapshot;
  ready: boolean;
  issues: ReturnType<typeof reviewModuleReadModelSchemaSnapshot>;
};

function placeholders(count: number) {
  return Array.from({ length: count }, () => "?").join(", ");
}

export async function loadMysqlReadModelSchemaSnapshot(
  requirements: readonly ModuleReadModelSchemaRequirement[],
): Promise<ModuleReadModelSchemaSnapshot> {
  const tableNames = [...new Set(requirements.map((requirement) => requirement.tableName))];
  if (tableNames.length === 0) return { tables: [] };

  const rows = await dbRows<MysqlInformationSchemaColumnRow>(
    `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN (${placeholders(tableNames.length)})
     ORDER BY TABLE_NAME ASC, ORDINAL_POSITION ASC`,
    tableNames,
  );
  const columnsByTable = rows.reduce<Map<string, string[]>>((tables, row) => {
    const columns = tables.get(row.table_name) ?? [];
    columns.push(row.column_name);
    tables.set(row.table_name, columns);
    return tables;
  }, new Map<string, string[]>());

  return {
    tables: [...columnsByTable.entries()].map(([tableName, columns]) => ({
      tableName,
      columns,
    })),
  };
}

export async function reviewMysqlReadModelSchemaReadiness(
  workspaceId?: DispatchWorkspaceId,
): Promise<MysqlReadModelSchemaPreflightResult> {
  const requirements = listModuleReadModelSchemaRequirements(workspaceId);
  const snapshot = await loadMysqlReadModelSchemaSnapshot(requirements);
  const issues = reviewModuleReadModelSchemaSnapshot(snapshot, workspaceId);

  return {
    workspaceId,
    requirements,
    snapshot,
    ready: issues.length === 0,
    issues,
  };
}

export async function reviewMysqlReadModelSchemaReadinessForModule(
  moduleId: string,
): Promise<MysqlReadModelSchemaPreflightResult> {
  const requirement = getModuleReadModelSchemaRequirement(moduleId);
  const requirements = requirement ? [requirement] : [];
  const snapshot = await loadMysqlReadModelSchemaSnapshot(requirements);
  const issues = requirement
    ? reviewModuleReadModelSchemaRequirementsSnapshot(snapshot, requirements)
    : [];

  return {
    workspaceId: requirement?.workspaceId,
    requirements,
    snapshot,
    ready: Boolean(requirement) && issues.length === 0,
    issues,
  };
}
