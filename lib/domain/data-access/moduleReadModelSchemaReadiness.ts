import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import {
  listModuleDetailQueryPlans,
  type ModuleDetailQueryPlan,
} from "./moduleDetailQueryPlans";
import {
  listModuleListQueryPlans,
  type ModuleListQueryPlan,
} from "./moduleListQueryPlans";

export type ModuleReadModelSchemaRequirement = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  tableName: string;
  requiredColumns: string[];
  listAction?: string;
  detailAction?: string;
};

export type ModuleReadModelSchemaSnapshotTable = {
  tableName: string;
  columns: readonly string[];
};

export type ModuleReadModelSchemaSnapshot = {
  tables: readonly ModuleReadModelSchemaSnapshotTable[];
};

export type ModuleReadModelSchemaIssueCode =
  | "missing_required_column"
  | "missing_required_table"
  | "read_model_table_mismatch";

export type ModuleReadModelSchemaIssue = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  tableName: string;
  code: ModuleReadModelSchemaIssueCode;
  column?: string;
  listTableName?: string;
  detailTableName?: string;
};

function columnNameFromPath(columnPath: string) {
  return columnPath.split(".").at(-1) ?? columnPath;
}

function addColumns(columns: Set<string>, values: Iterable<string | undefined>) {
  for (const value of values) {
    if (value) columns.add(columnNameFromPath(value));
  }
}

function collectListPlanColumns(plan: ModuleListQueryPlan) {
  const columns = new Set<string>();
  addColumns(columns, plan.selectColumns);
  addColumns(columns, Object.values(plan.filterColumns));
  addColumns(columns, plan.searchColumns);
  addColumns(columns, Object.values(plan.sortColumns));

  return columns;
}

function collectDetailPlanColumns(plan: ModuleDetailQueryPlan) {
  const columns = new Set<string>();
  addColumns(columns, plan.selectColumns);
  addColumns(columns, [
    plan.idColumn,
    plan.versionColumn,
    plan.statusColumn,
    plan.updatedAtColumn,
    plan.updatedByColumn,
  ]);
  addColumns(columns, Object.values(plan.scopeColumns));

  return columns;
}

function sortedColumns(columns: Set<string>) {
  return [...columns].sort((left, right) => left.localeCompare(right));
}

export function getModuleReadModelTableMismatchIssues(
  workspaceId?: DispatchWorkspaceId,
): ModuleReadModelSchemaIssue[] {
  const detailPlansByModuleId = new Map(
    listModuleDetailQueryPlans(workspaceId).map((plan) => [plan.moduleId, plan]),
  );

  return listModuleListQueryPlans(workspaceId).flatMap((listPlan): ModuleReadModelSchemaIssue[] => {
    const detailPlan = detailPlansByModuleId.get(listPlan.moduleId);
    if (!detailPlan || detailPlan.tableName === listPlan.tableName) return [];

    return [{
      moduleId: listPlan.moduleId,
      workspaceId: listPlan.workspaceId,
      tableName: listPlan.tableName,
      code: "read_model_table_mismatch",
      listTableName: listPlan.tableName,
      detailTableName: detailPlan.tableName,
    }];
  });
}

export function listModuleReadModelSchemaRequirements(
  workspaceId?: DispatchWorkspaceId,
): ModuleReadModelSchemaRequirement[] {
  const detailPlansByModuleId = new Map(
    listModuleDetailQueryPlans(workspaceId).map((plan) => [plan.moduleId, plan]),
  );
  const listRequirements = listModuleListQueryPlans(workspaceId).map((listPlan): ModuleReadModelSchemaRequirement => {
    const detailPlan = detailPlansByModuleId.get(listPlan.moduleId);
    const columns = collectListPlanColumns(listPlan);
    if (detailPlan && detailPlan.tableName === listPlan.tableName) {
      addColumns(columns, collectDetailPlanColumns(detailPlan));
    }

    return {
      moduleId: listPlan.moduleId,
      workspaceId: listPlan.workspaceId,
      tableName: listPlan.tableName,
      requiredColumns: sortedColumns(columns),
      listAction: listPlan.databaseAction,
      ...(detailPlan && detailPlan.tableName === listPlan.tableName
        ? { detailAction: detailPlan.databaseAction }
        : {}),
    };
  });
  const coveredModuleIds = new Set(listRequirements.map((requirement) => requirement.moduleId));
  const detailOnlyRequirements = listModuleDetailQueryPlans(workspaceId).flatMap((detailPlan): ModuleReadModelSchemaRequirement[] => {
    if (coveredModuleIds.has(detailPlan.moduleId)) return [];

    return [{
      moduleId: detailPlan.moduleId,
      workspaceId: detailPlan.workspaceId,
      tableName: detailPlan.tableName,
      requiredColumns: sortedColumns(collectDetailPlanColumns(detailPlan)),
      detailAction: detailPlan.databaseAction,
    }];
  });

  return [...listRequirements, ...detailOnlyRequirements];
}

export function getModuleReadModelSchemaRequirement(moduleId: string) {
  return listModuleReadModelSchemaRequirements().find((requirement) => requirement.moduleId === moduleId);
}

export function reviewModuleReadModelSchemaRequirementsSnapshot(
  snapshot: ModuleReadModelSchemaSnapshot,
  requirements: readonly ModuleReadModelSchemaRequirement[],
): ModuleReadModelSchemaIssue[] {
  const tables = new Map(snapshot.tables.map((table) => [
    table.tableName,
    new Set(table.columns),
  ]));

  return requirements.flatMap((requirement): ModuleReadModelSchemaIssue[] => {
    const tableColumns = tables.get(requirement.tableName);
    if (!tableColumns) {
      return [{
        moduleId: requirement.moduleId,
        workspaceId: requirement.workspaceId,
        tableName: requirement.tableName,
        code: "missing_required_table",
      }];
    }

    return requirement.requiredColumns.flatMap((column): ModuleReadModelSchemaIssue[] => (
      tableColumns.has(column)
        ? []
        : [{
            moduleId: requirement.moduleId,
            workspaceId: requirement.workspaceId,
            tableName: requirement.tableName,
            code: "missing_required_column",
            column,
          }]
    ));
  });
}

export function reviewModuleReadModelSchemaSnapshot(
  snapshot: ModuleReadModelSchemaSnapshot,
  workspaceId?: DispatchWorkspaceId,
): ModuleReadModelSchemaIssue[] {
  return [
    ...getModuleReadModelTableMismatchIssues(workspaceId),
    ...reviewModuleReadModelSchemaRequirementsSnapshot(
      snapshot,
      listModuleReadModelSchemaRequirements(workspaceId),
    ),
  ];
}
