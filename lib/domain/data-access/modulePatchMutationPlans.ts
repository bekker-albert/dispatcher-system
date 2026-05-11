import type { WorkspaceModuleAccessAction } from "../access-control/moduleAccessPolicies";
import { getWorkspaceModuleAccessPolicy } from "../access-control/moduleAccessPolicies";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import {
  getModuleDataRouteAction,
  getModuleDataRouteContract,
} from "./moduleDataRoutes";
import {
  listModulePersistenceContracts,
  type ModulePersistenceContract,
} from "./persistenceContracts";
import { isSafeMysqlIdentifier } from "./mysqlIdentifiers";
import { modulePatchMutationPlans } from "./modulePatchMutationPlanCatalog";

export type ModulePatchMutationAction = Extract<
  WorkspaceModuleAccessAction,
  "edit" | "approve" | "delete" | "admin"
>;

export type ModulePatchMutationPlan = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  action: ModulePatchMutationAction;
  databaseAction: string;
  tableName: string;
  idColumn: string;
  versionColumn: string;
  updatedAtColumn: string;
  updatedByColumn: string;
  statusColumn?: string;
  changeHistoryEntity: string;
  patchOnly: true;
  requiresExpectedVersion: true;
  writesChangeHistory: true;
  scopeColumns: Partial<Record<string, string>>;
  allowedFieldGroups: string[];
};

export type ModulePatchMutationRequirement = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  action: ModulePatchMutationAction;
  databaseAction: string;
};

export type ModulePatchMutationPlanIssue = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  action: ModulePatchMutationAction;
  code:
    | "missing_patch_mutation_plan"
    | "patch_mutation_plan_without_route_action"
    | "patch_mutation_plan_route_metadata_mismatch"
    | "patch_mutation_plan_without_version_history"
    | "patch_mutation_plan_missing_section_scope"
    | "patch_mutation_plan_unsafe_identifier";
  field?: string;
  value?: string;
};

const patchMutationActions: ModulePatchMutationAction[] = [
  "edit",
  "approve",
  "delete",
  "admin",
];

const patchWriteModes: Array<ModulePersistenceContract["writeMode"]> = [
  "versioned-patch",
  "workflow-patch",
];

export { modulePatchMutationPlans };

function isPatchPersistenceContract(contract: ModulePersistenceContract) {
  return patchWriteModes.includes(contract.writeMode);
}

function isSafeColumnName(value: string) {
  return isSafeMysqlIdentifier(value);
}

export function getModulePatchMutationPlan(
  moduleId: string,
  action?: ModulePatchMutationAction,
) {
  return modulePatchMutationPlans.find((plan) => (
    plan.moduleId === moduleId && (action ? plan.action === action : true)
  ));
}

export function listModulePatchMutationPlans(workspaceId?: DispatchWorkspaceId) {
  return modulePatchMutationPlans.filter((plan) => (
    workspaceId ? plan.workspaceId === workspaceId : true
  ));
}

export function listRequiredPatchMutationActions(
  workspaceId?: DispatchWorkspaceId,
): ModulePatchMutationRequirement[] {
  return listModulePersistenceContracts(workspaceId).flatMap((contract) => {
    if (!isPatchPersistenceContract(contract)) return [];

    return patchMutationActions.flatMap((action) => {
      const databaseAction = getModuleDataRouteAction(contract.moduleId, action);
      if (!databaseAction) return [];

      return [{
        moduleId: contract.moduleId,
        workspaceId: contract.workspaceId,
        action,
        databaseAction,
      }];
    });
  });
}

export function getMissingPatchMutationPlans(workspaceId?: DispatchWorkspaceId) {
  const planKeys = new Set(modulePatchMutationPlans.map((plan) => `${plan.moduleId}:${plan.action}`));

  return listRequiredPatchMutationActions(workspaceId).flatMap((requirement): ModulePatchMutationPlanIssue[] => (
    planKeys.has(`${requirement.moduleId}:${requirement.action}`)
      ? []
      : [{
          ...requirement,
          code: "missing_patch_mutation_plan",
        }]
  ));
}

export function getPatchMutationPlansWithoutRouteAction(workspaceId?: DispatchWorkspaceId) {
  return listModulePatchMutationPlans(workspaceId).filter((plan) => (
    getModuleDataRouteAction(plan.moduleId, plan.action) !== plan.databaseAction
  )).map((plan): ModulePatchMutationPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    action: plan.action,
    code: "patch_mutation_plan_without_route_action",
    value: plan.databaseAction,
  }));
}

export function getPatchMutationPlansWithRouteMetadataMismatch(
  plans: readonly ModulePatchMutationPlan[] = modulePatchMutationPlans,
) {
  return plans.flatMap((plan): ModulePatchMutationPlanIssue[] => {
    const routeContract = getModuleDataRouteContract(plan.moduleId);
    if (!routeContract) return [];

    const issues: ModulePatchMutationPlanIssue[] = [];

    if (plan.workspaceId !== routeContract.workspaceId) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        action: plan.action,
        code: "patch_mutation_plan_route_metadata_mismatch",
        field: "workspaceId",
        value: plan.workspaceId,
      });
    }

    if (plan.resource !== routeContract.resource) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        action: plan.action,
        code: "patch_mutation_plan_route_metadata_mismatch",
        field: "resource",
        value: plan.resource,
      });
    }

    return issues;
  });
}

export function getPatchMutationPlansWithoutVersionHistory(workspaceId?: DispatchWorkspaceId) {
  return listModulePatchMutationPlans(workspaceId).filter((plan) => (
    !plan.patchOnly
    || !plan.requiresExpectedVersion
    || !plan.writesChangeHistory
    || !plan.versionColumn
    || !plan.updatedAtColumn
    || !plan.updatedByColumn
    || !plan.changeHistoryEntity
  )).map((plan): ModulePatchMutationPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    action: plan.action,
    code: "patch_mutation_plan_without_version_history",
  }));
}

export function getPatchMutationPlansMissingSectionScopeForSectionScopedPolicies(
  workspaceId?: DispatchWorkspaceId,
  plans: readonly ModulePatchMutationPlan[] = modulePatchMutationPlans,
) {
  return plans.filter((plan) => (
    (workspaceId ? plan.workspaceId === workspaceId : true)
    && getWorkspaceModuleAccessPolicy(plan.moduleId)?.sectionScoped
    && !plan.scopeColumns.section_id
  )).map((plan): ModulePatchMutationPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    action: plan.action,
    code: "patch_mutation_plan_missing_section_scope",
    field: "scopeColumns.section_id",
  }));
}

export function getUnsafePatchMutationPlanIdentifiers(workspaceId?: DispatchWorkspaceId) {
  return listModulePatchMutationPlans(workspaceId).flatMap((plan): ModulePatchMutationPlanIssue[] => {
    const identifiers = [
      ["tableName", plan.tableName],
      ["idColumn", plan.idColumn],
      ["versionColumn", plan.versionColumn],
      ["updatedAtColumn", plan.updatedAtColumn],
      ["updatedByColumn", plan.updatedByColumn],
      ["statusColumn", plan.statusColumn],
      ["changeHistoryEntity", plan.changeHistoryEntity],
      ...Object.entries(plan.scopeColumns).map(([field, value]) => [`scopeColumns.${field}`, value] as const),
    ] as const;

    return identifiers.flatMap(([field, value]) => (
      value && !isSafeColumnName(value)
        ? [{
            moduleId: plan.moduleId,
            workspaceId: plan.workspaceId,
            action: plan.action,
            code: "patch_mutation_plan_unsafe_identifier" as const,
            field,
            value,
          }]
        : []
    ));
  });
}

export function getPatchPersistenceContractsWithoutMutationPlan() {
  const plannedModuleIds = new Set(modulePatchMutationPlans.map((plan) => plan.moduleId));

  return listModulePersistenceContracts().filter((contract) => (
    isPatchPersistenceContract(contract)
    && getModuleDataRouteContract(contract.moduleId)
    && listRequiredPatchMutationActions(contract.workspaceId)
      .some((requirement) => requirement.moduleId === contract.moduleId)
    && !plannedModuleIds.has(contract.moduleId)
  ));
}

export { validateModulePatchPayload } from "./modulePatchPayloadValidation";
export type { ModulePatchPayloadValidationIssue } from "./modulePatchPayloadValidation";
