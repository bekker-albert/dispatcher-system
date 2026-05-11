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
import { moduleCreateMutationPlans } from "./moduleCreateMutationPlanCatalog";

export type ModuleCreateMutationPlan = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  tableName: string;
  idColumn: string;
  versionColumn: string;
  createdAtColumn: string;
  createdByColumn: string;
  updatedAtColumn: string;
  updatedByColumn: string;
  statusColumn: string;
  initialStatus: string;
  initialVersion: 1;
  requiredFieldGroups: string[];
  scopeColumns: Partial<Record<string, string>>;
  duplicateKeyGroups: string[][];
  returnsCreatedEntityId: true;
  writesChangeHistory: true;
};

export type ModuleCreateMutationRequirement = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  databaseAction: string;
};

export type ModuleCreateMutationPlanIssue = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  code:
    | "missing_create_mutation_plan"
    | "create_mutation_plan_without_route_action"
    | "create_mutation_plan_route_metadata_mismatch"
    | "create_mutation_plan_without_version_history"
    | "create_mutation_plan_without_duplicate_keys"
    | "create_mutation_plan_missing_section_scope"
    | "create_mutation_plan_unsafe_identifier";
  field?: string;
  value?: string;
};

export type ModuleCreatePayloadValidationIssue = {
  code: "create_field_group_missing";
  message: string;
  field: string;
};

const createWriteModes: Array<ModulePersistenceContract["writeMode"]> = [
  "versioned-patch",
  "workflow-patch",
];

const requiredFieldGroupAliases: Record<string, string[]> = {
  basis: ["basis", "basisDocument", "reason"],
  capabilities: ["capabilities", "canView", "can_view"],
  crew_links: ["crewLinks", "crew_links", "lines", "productionLinks"],
  date: ["date", "workDate", "work_date", "reportDate", "report_date"],
  driver: ["driverId", "driver_id", "driver"],
  employee: ["employeeId", "employee_id", "employee"],
  from_section: ["fromSectionId", "from_section_id", "fromSection", "from_section"],
  goal: ["goal", "purpose"],
  hours: ["hours", "hoursCount"],
  period: ["periodId", "period_id", "period"],
  reason: ["reason", "basis"],
  record_type: ["recordType", "record_type"],
  route: ["route", "routeHash", "route_hash"],
  scope: ["scope", "sectionId", "section_id", "moduleId", "module_id"],
  section: ["sectionId", "section_id", "section"],
  shift: ["shift"],
  subject: ["subject", "userId", "user_id", "roleId", "role_id"],
  to_section: ["toSectionId", "to_section_id", "toSection", "to_section"],
  vehicle: ["vehicleId", "vehicle_id", "vehicle"],
};

export { moduleCreateMutationPlans };

function isCreatePersistenceContract(contract: ModulePersistenceContract) {
  return createWriteModes.includes(contract.writeMode);
}

function safeIdentifiers(values: string[]) {
  return values.every(isSafeMysqlIdentifier);
}

function hasCreatePayloadValue(value: unknown): boolean {
  if (typeof value === "string") return Boolean(value.trim());
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== undefined && value !== null;
}

function hasRequiredFieldGroupPayload(data: Record<string, unknown>, group: string) {
  const aliases = new Set([group, ...(requiredFieldGroupAliases[group] ?? [])]);
  return [...aliases].some((alias) => hasCreatePayloadValue(data[alias]));
}

export function getModuleCreateMutationPlan(moduleId: string) {
  return moduleCreateMutationPlans.find((plan) => plan.moduleId === moduleId);
}

export function validateModuleCreatePayload(
  plan: ModuleCreateMutationPlan,
  data: Record<string, unknown>,
): ModuleCreatePayloadValidationIssue[] {
  return plan.requiredFieldGroups.flatMap((group): ModuleCreatePayloadValidationIssue[] => (
    hasRequiredFieldGroupPayload(data, group)
      ? []
      : [{
          code: "create_field_group_missing",
          message: "Create payload is missing a required field group.",
          field: group,
        }]
  ));
}

export function listModuleCreateMutationPlans(workspaceId?: DispatchWorkspaceId) {
  return moduleCreateMutationPlans.filter((plan) => (
    workspaceId ? plan.workspaceId === workspaceId : true
  ));
}

export function listRequiredCreateMutationActions(
  workspaceId?: DispatchWorkspaceId,
): ModuleCreateMutationRequirement[] {
  return listModulePersistenceContracts(workspaceId).flatMap((contract) => {
    const databaseAction = getModuleDataRouteAction(contract.moduleId, "create");
    if (!databaseAction || !isCreatePersistenceContract(contract)) return [];

    return [{
      moduleId: contract.moduleId,
      workspaceId: contract.workspaceId,
      databaseAction,
    }];
  });
}

export function getMissingCreateMutationPlans(workspaceId?: DispatchWorkspaceId) {
  const plannedModuleIds = new Set(moduleCreateMutationPlans.map((plan) => plan.moduleId));

  return listRequiredCreateMutationActions(workspaceId).flatMap((requirement): ModuleCreateMutationPlanIssue[] => (
    plannedModuleIds.has(requirement.moduleId)
      ? []
      : [{
          moduleId: requirement.moduleId,
          workspaceId: requirement.workspaceId,
          code: "missing_create_mutation_plan",
          value: requirement.databaseAction,
        }]
  ));
}

export function getCreateMutationPlansWithoutRouteAction(workspaceId?: DispatchWorkspaceId) {
  return listModuleCreateMutationPlans(workspaceId).filter((plan) => (
    getModuleDataRouteAction(plan.moduleId, "create") !== plan.databaseAction
  )).map((plan): ModuleCreateMutationPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "create_mutation_plan_without_route_action",
    value: plan.databaseAction,
  }));
}

export function getCreateMutationPlansWithRouteMetadataMismatch(
  plans: readonly ModuleCreateMutationPlan[] = moduleCreateMutationPlans,
) {
  return plans.flatMap((plan): ModuleCreateMutationPlanIssue[] => {
    const routeContract = getModuleDataRouteContract(plan.moduleId);
    if (!routeContract) return [];

    const issues: ModuleCreateMutationPlanIssue[] = [];

    if (plan.workspaceId !== routeContract.workspaceId) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "create_mutation_plan_route_metadata_mismatch",
        field: "workspaceId",
        value: plan.workspaceId,
      });
    }

    if (plan.resource !== routeContract.resource) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "create_mutation_plan_route_metadata_mismatch",
        field: "resource",
        value: plan.resource,
      });
    }

    return issues;
  });
}

export function getCreateMutationPlansWithoutVersionHistory(workspaceId?: DispatchWorkspaceId) {
  return listModuleCreateMutationPlans(workspaceId).filter((plan) => (
    plan.initialVersion !== 1
    || !plan.versionColumn
    || !plan.createdAtColumn
    || !plan.createdByColumn
    || !plan.updatedAtColumn
    || !plan.updatedByColumn
    || !plan.returnsCreatedEntityId
    || !plan.writesChangeHistory
  )).map((plan): ModuleCreateMutationPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "create_mutation_plan_without_version_history",
  }));
}

export function getCreateMutationPlansWithoutDuplicateKeys(workspaceId?: DispatchWorkspaceId) {
  return listModuleCreateMutationPlans(workspaceId).filter((plan) => (
    plan.duplicateKeyGroups.length === 0
    || plan.duplicateKeyGroups.some((group) => group.length === 0)
  )).map((plan): ModuleCreateMutationPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "create_mutation_plan_without_duplicate_keys",
  }));
}

export function getCreateMutationPlansMissingSectionScopeForSectionScopedPolicies(
  workspaceId?: DispatchWorkspaceId,
  plans: readonly ModuleCreateMutationPlan[] = moduleCreateMutationPlans,
) {
  return plans.filter((plan) => (
    (workspaceId ? plan.workspaceId === workspaceId : true)
    && getWorkspaceModuleAccessPolicy(plan.moduleId)?.sectionScoped
    && !plan.scopeColumns.section_id
  )).map((plan): ModuleCreateMutationPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "create_mutation_plan_missing_section_scope",
    field: "scopeColumns.section_id",
  }));
}

export function getUnsafeCreateMutationPlanIdentifiers(workspaceId?: DispatchWorkspaceId) {
  return listModuleCreateMutationPlans(workspaceId).flatMap((plan): ModuleCreateMutationPlanIssue[] => {
    const identifiers = [
      plan.tableName,
      plan.idColumn,
      plan.versionColumn,
      plan.createdAtColumn,
      plan.createdByColumn,
      plan.updatedAtColumn,
      plan.updatedByColumn,
      plan.statusColumn,
      ...plan.duplicateKeyGroups.flat(),
      ...Object.values(plan.scopeColumns).filter((value): value is string => Boolean(value)),
    ];

    return safeIdentifiers(identifiers)
      ? []
      : [{
          moduleId: plan.moduleId,
          workspaceId: plan.workspaceId,
          code: "create_mutation_plan_unsafe_identifier",
        }];
  });
}
