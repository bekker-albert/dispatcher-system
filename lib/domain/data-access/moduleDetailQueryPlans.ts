import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import { getWorkspaceModuleAccessPolicy } from "../access-control/moduleAccessPolicies";
import type { RequiredFilterKey } from "./pagination";
import {
  getModuleDataRouteAction,
  getModuleDataRouteContract,
} from "./moduleDataRoutes";
import {
  getModulePersistenceContract,
  listModulePersistenceContracts,
  type ModulePersistenceContract,
} from "./persistenceContracts";
import {
  isSafeMysqlIdentifier,
  quoteMysqlColumnPath,
} from "./mysqlIdentifiers";
import { moduleDetailQueryPlans } from "./moduleDetailQueryPlanCatalog";

export type ModuleDetailQueryPlan = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  tableName: string;
  idColumn: string;
  versionColumn?: string;
  statusColumn?: string;
  updatedAtColumn?: string;
  updatedByColumn?: string;
  scopeColumns: Partial<Record<RequiredFilterKey, string>>;
  selectColumns: string[];
  requiresId: true;
  maxRows: 1;
  returnsVersion: boolean;
};

export type ModuleDetailQueryRequirement = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  databaseAction: string;
};

export type ModuleDetailQueryPlanIssue = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  code:
    | "missing_detail_query_plan"
    | "detail_query_plan_without_route_action"
    | "detail_query_plan_route_metadata_mismatch"
    | "detail_query_plan_without_id"
    | "detail_query_plan_missing_version"
    | "detail_query_plan_missing_section_scope"
    | "detail_query_plan_unsafe_identifier";
  field?: string;
  value?: string;
};

export { moduleDetailQueryPlans };

function isDetailPlanRequired(contract: ModulePersistenceContract) {
  return contract.writeMode !== "on-demand";
}

function isSafeColumnPath(value: string) {
  try {
    quoteMysqlColumnPath(value);
    return true;
  } catch {
    return false;
  }
}

export function getModuleDetailQueryPlan(moduleId: string) {
  return moduleDetailQueryPlans.find((plan) => plan.moduleId === moduleId);
}

export function listModuleDetailQueryPlans(workspaceId?: DispatchWorkspaceId) {
  return moduleDetailQueryPlans.filter((plan) => (
    workspaceId ? plan.workspaceId === workspaceId : true
  ));
}

export function listRequiredDetailQueryActions(workspaceId?: DispatchWorkspaceId): ModuleDetailQueryRequirement[] {
  return listModulePersistenceContracts(workspaceId).flatMap((contract) => {
    const databaseAction = getModuleDataRouteAction(contract.moduleId, "open");
    if (!databaseAction || !isDetailPlanRequired(contract)) return [];

    return [{
      moduleId: contract.moduleId,
      workspaceId: contract.workspaceId,
      databaseAction,
    }];
  });
}

export function getMissingDetailQueryPlans(workspaceId?: DispatchWorkspaceId) {
  const plannedModuleIds = new Set(moduleDetailQueryPlans.map((plan) => plan.moduleId));

  return listRequiredDetailQueryActions(workspaceId).flatMap((requirement): ModuleDetailQueryPlanIssue[] => (
    plannedModuleIds.has(requirement.moduleId)
      ? []
      : [{
          moduleId: requirement.moduleId,
          workspaceId: requirement.workspaceId,
          code: "missing_detail_query_plan",
          value: requirement.databaseAction,
        }]
  ));
}

export function getDetailQueryPlansWithoutRouteAction(workspaceId?: DispatchWorkspaceId) {
  return listModuleDetailQueryPlans(workspaceId).filter((plan) => (
    getModuleDataRouteAction(plan.moduleId, "open") !== plan.databaseAction
  )).map((plan): ModuleDetailQueryPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "detail_query_plan_without_route_action",
    value: plan.databaseAction,
  }));
}

export function getDetailQueryPlansWithRouteMetadataMismatch(
  plans: readonly ModuleDetailQueryPlan[] = moduleDetailQueryPlans,
) {
  return plans.flatMap((plan): ModuleDetailQueryPlanIssue[] => {
    const routeContract = getModuleDataRouteContract(plan.moduleId);
    if (!routeContract) return [];

    const issues: ModuleDetailQueryPlanIssue[] = [];

    if (plan.workspaceId !== routeContract.workspaceId) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "detail_query_plan_route_metadata_mismatch",
        field: "workspaceId",
        value: plan.workspaceId,
      });
    }

    if (plan.resource !== routeContract.resource) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "detail_query_plan_route_metadata_mismatch",
        field: "resource",
        value: plan.resource,
      });
    }

    return issues;
  });
}

export function getDetailQueryPlansWithoutId(workspaceId?: DispatchWorkspaceId) {
  return listModuleDetailQueryPlans(workspaceId).filter((plan) => (
    !plan.requiresId || plan.maxRows !== 1 || !plan.idColumn
  )).map((plan): ModuleDetailQueryPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "detail_query_plan_without_id",
  }));
}

export function getDetailQueryPlansMissingVersionForVersionedContracts(workspaceId?: DispatchWorkspaceId) {
  return listModuleDetailQueryPlans(workspaceId).filter((plan) => {
    const contract = getModulePersistenceContract(plan.moduleId);
    return contract?.versioned && (!plan.returnsVersion || !plan.versionColumn);
  }).map((plan): ModuleDetailQueryPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "detail_query_plan_missing_version",
    field: "versionColumn",
  }));
}

export function getDetailQueryPlansMissingSectionScopeForSectionScopedPolicies(
  workspaceId?: DispatchWorkspaceId,
  plans: readonly ModuleDetailQueryPlan[] = moduleDetailQueryPlans,
) {
  return plans.filter((plan) => (
    (workspaceId ? plan.workspaceId === workspaceId : true)
    && getWorkspaceModuleAccessPolicy(plan.moduleId)?.sectionScoped
    && !plan.scopeColumns.section_id
  )).map((plan): ModuleDetailQueryPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "detail_query_plan_missing_section_scope",
    field: "scopeColumns.section_id",
  }));
}

export function getUnsafeDetailQueryPlanIdentifiers(workspaceId?: DispatchWorkspaceId) {
  return listModuleDetailQueryPlans(workspaceId).flatMap((plan): ModuleDetailQueryPlanIssue[] => {
    const identifiers = [
      ["tableName", plan.tableName, isSafeMysqlIdentifier],
      ["idColumn", plan.idColumn, isSafeColumnPath],
      ["versionColumn", plan.versionColumn, isSafeColumnPath],
      ["statusColumn", plan.statusColumn, isSafeColumnPath],
      ["updatedAtColumn", plan.updatedAtColumn, isSafeColumnPath],
      ["updatedByColumn", plan.updatedByColumn, isSafeColumnPath],
    ] as const;
    const identifierIssues = identifiers.flatMap(([field, value, checker]) => (
      value && !checker(value)
        ? [{
            moduleId: plan.moduleId,
            workspaceId: plan.workspaceId,
            code: "detail_query_plan_unsafe_identifier" as const,
            field,
            value,
          }]
        : []
    ));

    const scopeIssues = Object.entries(plan.scopeColumns).flatMap(([field, value]) => (
      value && !isSafeColumnPath(value)
        ? [{
            moduleId: plan.moduleId,
            workspaceId: plan.workspaceId,
            code: "detail_query_plan_unsafe_identifier" as const,
            field,
            value,
          }]
        : []
    ));

    const selectIssues = plan.selectColumns.flatMap((value) => (
      !isSafeColumnPath(value)
        ? [{
            moduleId: plan.moduleId,
            workspaceId: plan.workspaceId,
            code: "detail_query_plan_unsafe_identifier" as const,
            field: "selectColumns",
            value,
          }]
        : []
    ));

    return [...identifierIssues, ...scopeIssues, ...selectIssues];
  });
}
