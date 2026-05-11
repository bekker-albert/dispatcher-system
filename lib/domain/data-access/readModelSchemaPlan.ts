import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import { createModuleDatabaseIndexMigrationStatements } from "./indexMigrationPlan";
import { quoteMysqlIdentifier } from "./mysqlIdentifiers";
import {
  getModuleReadModelSchemaRequirement,
  getModuleReadModelTableMismatchIssues,
  listModuleReadModelSchemaRequirements,
  type ModuleReadModelSchemaRequirement,
} from "./moduleReadModelSchemaReadiness";

export type ReadModelSchemaPlanColumn = {
  name: string;
  type: string;
  nullable: false;
  defaultClause?: string;
};

export type ReadModelSchemaPlan = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  tableName: string;
  requiredColumns: string[];
  columns: ReadModelSchemaPlanColumn[];
  createTableStatement: string;
  indexStatements: string[];
  listAction?: string;
  detailAction?: string;
};

export type ReadModelSchemaReviewPlan = {
  workspaceId?: DispatchWorkspaceId;
  moduleId?: string;
  mode: "plan-only";
  appliesChanges: false;
  schemaChecked: false;
  liveHandlerActivation: false;
  plans: ReadModelSchemaPlan[];
  issues: ReturnType<typeof getModuleReadModelTableMismatchIssues>;
};

const preferredColumnOrder = [
  "id",
  "work_date",
  "date",
  "section_id",
  "shift",
  "status",
  "version",
  "updated_at",
  "updated_by",
  "created_at",
  "created_by",
];

const explicitColumnTypes: Record<string, string> = {
  created_at: "datetime(3)",
  created_by: "varchar(64)",
  driver_id: "varchar(64)",
  driver_name: "varchar(255)",
  id: "varchar(64)",
  section_id: "varchar(64)",
  shift: "varchar(16)",
  status: "varchar(32)",
  updated_at: "datetime(3)",
  updated_by: "varchar(64)",
  vehicle_id: "varchar(64)",
  vehicle_number: "varchar(64)",
  version: "int unsigned",
  waybill_number: "varchar(64)",
  work_date: "date",
};

function inferMysqlColumnType(columnName: string) {
  const explicitType = explicitColumnTypes[columnName];
  if (explicitType) return explicitType;
  if (columnName.endsWith("_id")) return "varchar(64)";
  if (columnName === "date" || columnName.endsWith("_date")) return "date";
  if (columnName.endsWith("_at")) return "datetime(3)";
  if (columnName.endsWith("_by")) return "varchar(64)";
  if (columnName.includes("number")) return "varchar(64)";
  return "varchar(255)";
}

function columnDefaultClause(columnName: string) {
  return columnName === "version" ? "DEFAULT 1" : undefined;
}

function orderedColumns(columns: readonly string[]) {
  const preferredPositions = new Map(preferredColumnOrder.map((column, index) => [column, index]));

  return [...columns].sort((left, right) => {
    const leftPosition = preferredPositions.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightPosition = preferredPositions.get(right) ?? Number.MAX_SAFE_INTEGER;
    if (leftPosition !== rightPosition) return leftPosition - rightPosition;
    return left.localeCompare(right);
  });
}

export function createReadModelSchemaPlanColumns(
  requirement: ModuleReadModelSchemaRequirement,
): ReadModelSchemaPlanColumn[] {
  return orderedColumns(requirement.requiredColumns).map((columnName) => ({
    name: columnName,
    type: inferMysqlColumnType(columnName),
    nullable: false,
    ...(columnDefaultClause(columnName)
      ? { defaultClause: columnDefaultClause(columnName) }
      : {}),
  }));
}

export function createMysqlReadModelTableStatement(
  requirement: ModuleReadModelSchemaRequirement,
) {
  const columns = createReadModelSchemaPlanColumns(requirement);
  const columnLines = columns.map((column) => [
    "  ",
    quoteMysqlIdentifier(column.name),
    " ",
    column.type,
    " NOT NULL",
    column.defaultClause ? ` ${column.defaultClause}` : "",
  ].join(""));
  const primaryKeyLines = requirement.requiredColumns.includes("id")
    ? [`  PRIMARY KEY (${quoteMysqlIdentifier("id")})`]
    : [];
  const body = [...columnLines, ...primaryKeyLines].join(",\n");

  return [
    `CREATE TABLE ${quoteMysqlIdentifier(requirement.tableName)} (`,
    body,
    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
  ].join("\n");
}

export function createReadModelSchemaPlan(
  requirement: ModuleReadModelSchemaRequirement,
): ReadModelSchemaPlan {
  const indexStatements = createModuleDatabaseIndexMigrationStatements(requirement.workspaceId)
    .filter((statement) => statement.moduleId === requirement.moduleId)
    .map((statement) => `${statement.statement};`);

  return {
    moduleId: requirement.moduleId,
    workspaceId: requirement.workspaceId,
    tableName: requirement.tableName,
    requiredColumns: [...requirement.requiredColumns],
    columns: createReadModelSchemaPlanColumns(requirement),
    createTableStatement: createMysqlReadModelTableStatement(requirement),
    indexStatements,
    ...(requirement.listAction ? { listAction: requirement.listAction } : {}),
    ...(requirement.detailAction ? { detailAction: requirement.detailAction } : {}),
  };
}

export function createReadModelSchemaReviewPlan(options: {
  moduleId?: string;
  workspaceId?: DispatchWorkspaceId;
} = {}): ReadModelSchemaReviewPlan {
  const requirements = options.moduleId
    ? [getModuleReadModelSchemaRequirement(options.moduleId)].filter(Boolean) as ModuleReadModelSchemaRequirement[]
    : listModuleReadModelSchemaRequirements(options.workspaceId);
  const scopedRequirements = options.workspaceId
    ? requirements.filter((requirement) => requirement.workspaceId === options.workspaceId)
    : requirements;

  return {
    workspaceId: options.workspaceId,
    moduleId: options.moduleId,
    mode: "plan-only",
    appliesChanges: false,
    schemaChecked: false,
    liveHandlerActivation: false,
    plans: scopedRequirements.map(createReadModelSchemaPlan),
    issues: getModuleReadModelTableMismatchIssues(options.workspaceId)
      .filter((issue) => options.moduleId ? issue.moduleId === options.moduleId : true),
  };
}
