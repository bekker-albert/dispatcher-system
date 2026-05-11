import type { WorkspaceModuleAccessAction } from "../access-control/moduleAccessPolicies";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import { workspaceModuleCatalog } from "../workspaces/moduleCatalog";
import { getModuleDatabaseAuthorizationRequirement } from "./moduleDatabaseAuthorization";
import {
  getModuleDataRouteContractByDatabaseAction,
  listModuleDataRouteActionBindings,
  type ModuleDataRouteKind,
} from "./moduleDataRoutes";
import { getModuleDetailQueryPlan } from "./moduleDetailQueryPlans";
import { getModuleExportPlan } from "./moduleExportPlans";
import {
  getModuleImportPlanByDatabaseAction,
  listModuleImportPlans,
} from "./moduleImportPlans";
import { getModuleListQueryPlan } from "./moduleListQueryPlans";
import { getModuleWritePipelinePlan } from "./moduleWritePipelinePlans";

export type ModuleHandlerContractKind =
  | "list"
  | "detail"
  | "write"
  | "export"
  | "import"
  | "on-demand";

export type ModuleHandlerReadinessIssueCode =
  | "outside_single_database_router"
  | "missing_authorization_requirement"
  | "missing_list_query_plan"
  | "missing_detail_query_plan"
  | "missing_write_pipeline"
  | "missing_export_plan"
  | "missing_import_plan";

export type ModuleHandlerReadiness = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  accessAction: WorkspaceModuleAccessAction;
  endpoint: "/api/database";
  routeKind: ModuleDataRouteKind;
  contractKind: ModuleHandlerContractKind;
  hasAuthorizationRequirement: boolean;
  hasRequiredHandlerContract: boolean;
  implementationReady: boolean;
  issues: ModuleHandlerReadinessIssueCode[];
};

type HandlerReadinessInput = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  accessAction: WorkspaceModuleAccessAction;
  endpoint: "/api/database";
  routeKind: ModuleDataRouteKind;
};

const writeActions: WorkspaceModuleAccessAction[] = [
  "create",
  "edit",
  "approve",
  "delete",
  "admin",
];

function getModuleTableStrategy(moduleId: string) {
  return workspaceModuleCatalog.find((module) => module.id === moduleId)?.tableStrategy;
}

function getContractKind(input: Pick<HandlerReadinessInput, "accessAction" | "moduleId">): ModuleHandlerContractKind {
  if (input.accessAction === "list") {
    return getModuleTableStrategy(input.moduleId) === "none" ? "on-demand" : "list";
  }
  if (input.accessAction === "open") {
    return getModuleTableStrategy(input.moduleId) === "none" ? "on-demand" : "detail";
  }
  if (input.accessAction === "export") return "export";
  if (writeActions.includes(input.accessAction)) return "write";

  return "on-demand";
}

function hasRequiredHandlerContract(input: HandlerReadinessInput, contractKind: ModuleHandlerContractKind) {
  if (contractKind === "list") {
    return getModuleListQueryPlan(input.moduleId)?.databaseAction === input.databaseAction;
  }
  if (contractKind === "detail") {
    return getModuleDetailQueryPlan(input.moduleId)?.databaseAction === input.databaseAction;
  }
  if (contractKind === "write") {
    return Boolean(getModuleWritePipelinePlan(input.moduleId, input.databaseAction));
  }
  if (contractKind === "export") {
    return getModuleExportPlan(input.moduleId)?.databaseAction === input.databaseAction;
  }
  if (contractKind === "import") {
    return Boolean(getModuleImportPlanByDatabaseAction(input.resource, input.databaseAction));
  }

  return true;
}

function missingContractIssue(contractKind: ModuleHandlerContractKind): ModuleHandlerReadinessIssueCode | undefined {
  if (contractKind === "list") return "missing_list_query_plan";
  if (contractKind === "detail") return "missing_detail_query_plan";
  if (contractKind === "write") return "missing_write_pipeline";
  if (contractKind === "export") return "missing_export_plan";
  if (contractKind === "import") return "missing_import_plan";
  return undefined;
}

function createReadiness(input: HandlerReadinessInput, forcedKind?: ModuleHandlerContractKind): ModuleHandlerReadiness {
  const contractKind = forcedKind ?? getContractKind(input);
  const hasAuthorizationRequirement = Boolean(getModuleDatabaseAuthorizationRequirement({
    resource: input.resource,
    action: input.databaseAction,
  }));
  const hasRequiredContract = hasRequiredHandlerContract(input, contractKind);
  const usesSingleRouter = input.endpoint === "/api/database" && input.routeKind === "single-database-router";
  const contractIssue = hasRequiredContract ? undefined : missingContractIssue(contractKind);
  const issues = [
    ...(usesSingleRouter ? [] : ["outside_single_database_router" as const]),
    ...(hasAuthorizationRequirement ? [] : ["missing_authorization_requirement" as const]),
    ...(contractIssue ? [contractIssue] : []),
  ];

  return {
    ...input,
    contractKind,
    hasAuthorizationRequirement,
    hasRequiredHandlerContract: hasRequiredContract,
    implementationReady: issues.length === 0,
    issues,
  };
}

export function listModuleHandlerReadiness(workspaceId?: DispatchWorkspaceId) {
  const routeReadiness = listModuleDataRouteActionBindings(workspaceId).flatMap((binding) => {
    const route = getModuleDataRouteContractByDatabaseAction(binding.resource, binding.databaseAction);
    if (!route) return [];

    return [createReadiness({
      moduleId: binding.moduleId,
      workspaceId: binding.workspaceId,
      resource: binding.resource,
      databaseAction: binding.databaseAction,
      accessAction: binding.accessAction,
      endpoint: route.contract.endpoint,
      routeKind: route.contract.routeKind,
    })];
  });
  const importReadiness = listModuleImportPlans(workspaceId).map((plan) => createReadiness({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    resource: plan.resource,
    databaseAction: plan.databaseAction,
    accessAction: plan.requiredAccessAction,
    endpoint: plan.endpoint,
    routeKind: plan.routeKind,
  }, "import"));

  return [...routeReadiness, ...importReadiness];
}

export function getModuleHandlerReadiness(resource: string, databaseAction: string) {
  return listModuleHandlerReadiness().find((readiness) => (
    readiness.resource === resource && readiness.databaseAction === databaseAction
  ));
}

export function getModuleHandlerReadinessIssues(workspaceId?: DispatchWorkspaceId) {
  return listModuleHandlerReadiness(workspaceId).filter((readiness) => !readiness.implementationReady);
}
