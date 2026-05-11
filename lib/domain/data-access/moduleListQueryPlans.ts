import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import type { WorkspaceModuleCatalogItem } from "../workspaces/moduleCatalog";
import { workspaceModuleCatalog } from "../workspaces/moduleCatalog";
import type { RequiredFilterKey, SortDirection } from "./pagination";
import {
  getModuleDataRouteAction,
  getModuleDataRouteContract,
} from "./moduleDataRoutes";
import {
  getWorkspaceModuleQueryPolicy,
  getWorkspaceModulesRequiringQueryPolicy,
} from "./workspaceQueryPolicies";
import {
  isSafeMysqlIdentifier,
  quoteMysqlColumnPath,
} from "./mysqlIdentifiers";
import { moduleListQueryPlans } from "./moduleListQueryPlanCatalog";

export type ModuleListQueryPlan = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  tableName: string;
  selectColumns: string[];
  filterColumns: Partial<Record<RequiredFilterKey, string>>;
  searchColumns: string[];
  sortColumns: Record<string, string>;
  defaultSort: {
    field: string;
    direction: SortDirection;
  };
};

export type ModuleListQueryPlanIssue = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  code:
    | "missing_list_query_plan"
    | "missing_route_action"
    | "route_metadata_mismatch"
    | "missing_required_filter_column"
    | "unsafe_table_name"
    | "unsafe_select_column"
    | "unsafe_filter_column"
    | "unsafe_search_column"
    | "unsafe_sort_column"
    | "missing_default_sort_column";
  field?: string;
  value?: string;
};

export { moduleListQueryPlans };

function isSafeMysqlColumnPath(columnPath: string) {
  try {
    quoteMysqlColumnPath(columnPath);
    return true;
  } catch {
    return false;
  }
}

export function getModuleListQueryPlan(moduleId: string) {
  return moduleListQueryPlans.find((plan) => plan.moduleId === moduleId);
}

export function listModuleListQueryPlans(workspaceId?: DispatchWorkspaceId) {
  return moduleListQueryPlans.filter((plan) => (
    workspaceId ? plan.workspaceId === workspaceId : true
  ));
}

export function getWorkspaceModulesRequiringListQueryPlan(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  return getWorkspaceModulesRequiringQueryPolicy(modules).filter((module) => (
    Boolean(getModuleDataRouteAction(module.id, "list"))
  ));
}

export function getWorkspaceModulesWithoutListQueryPlan(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  const coveredModuleIds = new Set(moduleListQueryPlans.map((plan) => plan.moduleId));
  return getWorkspaceModulesRequiringListQueryPlan(modules).filter((module) => !coveredModuleIds.has(module.id));
}

export function getListQueryPlansWithoutRouteAction() {
  return moduleListQueryPlans.filter((plan) => (
    getModuleDataRouteAction(plan.moduleId, "list") !== plan.databaseAction
  ));
}

export function getListQueryPlansWithRouteMetadataMismatch(
  plans: readonly ModuleListQueryPlan[] = moduleListQueryPlans,
): ModuleListQueryPlanIssue[] {
  return plans.flatMap((plan) => {
    const routeContract = getModuleDataRouteContract(plan.moduleId);
    if (!routeContract) return [];

    const issues: ModuleListQueryPlanIssue[] = [];

    if (plan.workspaceId !== routeContract.workspaceId) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "route_metadata_mismatch",
        field: "workspaceId",
        value: plan.workspaceId,
      });
    }

    if (plan.resource !== routeContract.resource) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "route_metadata_mismatch",
        field: "resource",
        value: plan.resource,
      });
    }

    return issues;
  });
}

export function getListQueryPlansMissingRequiredFilterColumns(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
): ModuleListQueryPlanIssue[] {
  return getWorkspaceModulesRequiringListQueryPlan(modules).flatMap((module) => {
    const plan = getModuleListQueryPlan(module.id);
    const queryPolicy = getWorkspaceModuleQueryPolicy(module.id);
    if (!plan || !queryPolicy) return [];

    return queryPolicy.policy.requiredFilters.flatMap((filterKey) => (
      plan.filterColumns[filterKey]
        ? []
        : [{
            moduleId: module.id,
            workspaceId: module.workspaceId,
            code: "missing_required_filter_column" as const,
            field: filterKey,
          }]
    ));
  });
}

export function getUnsafeListQueryPlanIdentifiers(): ModuleListQueryPlanIssue[] {
  return moduleListQueryPlans.flatMap((plan) => {
    const issues: ModuleListQueryPlanIssue[] = [];

    if (!isSafeMysqlIdentifier(plan.tableName)) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "unsafe_table_name",
        value: plan.tableName,
      });
    }

    for (const [filterKey, column] of Object.entries(plan.filterColumns)) {
      if (column && !isSafeMysqlColumnPath(column)) {
        issues.push({
          moduleId: plan.moduleId,
          workspaceId: plan.workspaceId,
          code: "unsafe_filter_column",
          field: filterKey,
          value: column,
        });
      }
    }

    for (const column of plan.selectColumns) {
      if (!isSafeMysqlColumnPath(column)) {
        issues.push({
          moduleId: plan.moduleId,
          workspaceId: plan.workspaceId,
          code: "unsafe_select_column",
          value: column,
        });
      }
    }

    for (const column of plan.searchColumns) {
      if (!isSafeMysqlColumnPath(column)) {
        issues.push({
          moduleId: plan.moduleId,
          workspaceId: plan.workspaceId,
          code: "unsafe_search_column",
          value: column,
        });
      }
    }

    for (const [field, column] of Object.entries(plan.sortColumns)) {
      if (!isSafeMysqlColumnPath(column)) {
        issues.push({
          moduleId: plan.moduleId,
          workspaceId: plan.workspaceId,
          code: "unsafe_sort_column",
          field,
          value: column,
        });
      }
    }

    if (!plan.sortColumns[plan.defaultSort.field]) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "missing_default_sort_column",
        field: plan.defaultSort.field,
      });
    }

    return issues;
  });
}
