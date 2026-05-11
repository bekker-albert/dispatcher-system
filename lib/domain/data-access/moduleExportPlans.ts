import type { ReportAggregationGrain, ReportExportFormat } from "../reports/aggregation-contracts";
import type { RequiredFilterKey, ServerPageQuery } from "./pagination";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import {
  getModuleDataRouteAction,
  getModuleDataRouteContract,
  listModuleDataRouteActionBindings,
} from "./moduleDataRoutes";
import { isSafeMysqlIdentifier } from "./mysqlIdentifiers";
import { getQueryDateRangeDays } from "./queryPolicy";
import { moduleExportPlans } from "./moduleExportPlanCatalog";

export type ModuleExportSourceKind = "bounded-list-query" | "prepared-aggregate";

export type ModuleExportPlan = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  sourceKind: ModuleExportSourceKind;
  exportRequestEntity: string;
  allowedFormats: ReportExportFormat[];
  allowedGrains: ReportAggregationGrain[];
  requiredFilters: RequiredFilterKey[];
  maxDateRangeDays: number;
  maxRowsPerExport: number;
  requiresServerSideFilters: true;
  createsQueuedRequest: true;
  storesFileByReference: true;
  avoidsClientSideRecalculation: true;
};

export type ModuleExportRequirement = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  databaseAction: string;
};

export type ModuleExportPlanIssue = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  code:
    | "missing_export_plan"
    | "export_plan_without_route_action"
    | "export_plan_route_metadata_mismatch"
    | "export_plan_without_bounded_query"
    | "export_plan_without_queued_request"
    | "export_plan_unsafe_identifier";
  value?: string;
};

export type ModuleExportQueryValidationIssue = {
  code:
    | "export_filter_missing"
    | "export_date_range_required"
    | "export_date_range_invalid"
    | "export_date_range_too_large";
  message: string;
  field?: string;
};

export { moduleExportPlans };

export function getModuleExportPlan(moduleId: string) {
  return moduleExportPlans.find((plan) => plan.moduleId === moduleId);
}

function hasExportFilterValue(query: ServerPageQuery, key: string) {
  const value = query.filters[key];
  return typeof value === "string" ? Boolean(value.trim()) : value !== undefined && value !== null;
}

export function validateModuleExportQuery(
  plan: ModuleExportPlan,
  query: ServerPageQuery,
): ModuleExportQueryValidationIssue[] {
  const issues: ModuleExportQueryValidationIssue[] = [];

  for (const requiredFilter of plan.requiredFilters) {
    if (requiredFilter === "date") {
      const dateRangeDays = getQueryDateRangeDays(query.filters);

      if (dateRangeDays === undefined) {
        issues.push({
          code: "export_date_range_required",
          message: "Export requires a bounded date or date range.",
          field: "date",
        });
      } else if (dateRangeDays < 1) {
        issues.push({
          code: "export_date_range_invalid",
          message: "Export date range is invalid.",
          field: "date",
        });
      } else if (dateRangeDays > plan.maxDateRangeDays) {
        issues.push({
          code: "export_date_range_too_large",
          message: "Export date range exceeds the module export limit.",
          field: "date",
        });
      }

      continue;
    }

    if (!hasExportFilterValue(query, requiredFilter)) {
      issues.push({
        code: "export_filter_missing",
        message: "Export is missing a required server-side filter.",
        field: requiredFilter,
      });
    }
  }

  return issues;
}

export function isModuleExportFormatAllowed(moduleId: string, format: unknown) {
  const plan = getModuleExportPlan(moduleId);
  return typeof format === "string" && Boolean(plan?.allowedFormats.includes(format as ReportExportFormat));
}

export function listModuleExportPlans(workspaceId?: DispatchWorkspaceId) {
  return moduleExportPlans.filter((plan) => (
    workspaceId ? plan.workspaceId === workspaceId : true
  ));
}

export function listRequiredModuleExportActions(
  workspaceId?: DispatchWorkspaceId,
): ModuleExportRequirement[] {
  return listModuleDataRouteActionBindings(workspaceId)
    .filter((binding) => binding.accessAction === "export")
    .map((binding) => ({
      moduleId: binding.moduleId,
      workspaceId: binding.workspaceId,
      databaseAction: binding.databaseAction,
    }));
}

export function getMissingExportPlans(workspaceId?: DispatchWorkspaceId) {
  const plannedModuleIds = new Set(moduleExportPlans.map((plan) => plan.moduleId));

  return listRequiredModuleExportActions(workspaceId).flatMap((requirement): ModuleExportPlanIssue[] => (
    plannedModuleIds.has(requirement.moduleId)
      ? []
      : [{
          moduleId: requirement.moduleId,
          workspaceId: requirement.workspaceId,
          code: "missing_export_plan",
          value: requirement.databaseAction,
        }]
  ));
}

export function getExportPlansWithoutRouteAction(workspaceId?: DispatchWorkspaceId) {
  return listModuleExportPlans(workspaceId).filter((plan) => (
    getModuleDataRouteAction(plan.moduleId, "export") !== plan.databaseAction
  )).map((plan): ModuleExportPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "export_plan_without_route_action",
    value: plan.databaseAction,
  }));
}

export function getExportPlansWithRouteMetadataMismatch(
  plans: readonly ModuleExportPlan[] = moduleExportPlans,
) {
  return plans.flatMap((plan): ModuleExportPlanIssue[] => {
    const routeContract = getModuleDataRouteContract(plan.moduleId);
    if (!routeContract) return [];

    const issues: ModuleExportPlanIssue[] = [];

    if (plan.workspaceId !== routeContract.workspaceId) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "export_plan_route_metadata_mismatch",
        value: plan.workspaceId,
      });
    }

    if (plan.resource !== routeContract.resource) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "export_plan_route_metadata_mismatch",
        value: plan.resource,
      });
    }

    return issues;
  });
}

export function getExportPlansWithoutBoundedQuery(workspaceId?: DispatchWorkspaceId) {
  return listModuleExportPlans(workspaceId).filter((plan) => (
    !plan.requiresServerSideFilters
    || plan.requiredFilters.length === 0
    || plan.allowedFormats.length === 0
    || plan.allowedGrains.length === 0
    || plan.maxDateRangeDays < 1
    || plan.maxRowsPerExport < 1
  )).map((plan): ModuleExportPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "export_plan_without_bounded_query",
  }));
}

export function getExportPlansWithoutQueuedRequest(workspaceId?: DispatchWorkspaceId) {
  return listModuleExportPlans(workspaceId).filter((plan) => (
    !plan.createsQueuedRequest
    || !plan.storesFileByReference
    || !plan.avoidsClientSideRecalculation
  )).map((plan): ModuleExportPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "export_plan_without_queued_request",
  }));
}

export function getUnsafeExportPlanIdentifiers(workspaceId?: DispatchWorkspaceId) {
  return listModuleExportPlans(workspaceId).filter((plan) => (
    !isSafeMysqlIdentifier(plan.exportRequestEntity)
  )).map((plan): ModuleExportPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "export_plan_unsafe_identifier",
    value: plan.exportRequestEntity,
  }));
}
