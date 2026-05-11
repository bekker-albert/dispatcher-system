import type { WorkspaceModuleAccessAction } from "../access-control/moduleAccessPolicies";
import { getModuleActionRequiredCapability } from "../access-control/moduleAccessPolicies";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import type {
  ImportBatchFormat,
  ImportBatchMode,
  ServerImportBatchDraft,
} from "./importBatchEnvelope";
import type {
  ImportValidationIssue,
  ImportValidationSummary,
  ServerImportValidationDraft,
} from "./importValidationEnvelope";
import { isSafeMysqlIdentifier } from "./mysqlIdentifiers";
import { moduleImportPlans } from "./moduleImportPlanCatalog";
import { getModuleDataRouteContract } from "./moduleDataRoutes";

export type ModuleImportSourceKind = "legacy-excel" | "csv-register";

export type ModuleImportPlan = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  endpoint: "/api/database";
  routeKind: "single-database-router";
  resource: string;
  databaseAction: string;
  importBatchEntity: string;
  sourceKind: ModuleImportSourceKind;
  allowedFormats: ImportBatchFormat[];
  allowedModes: ImportBatchMode[];
  requiredAccessAction: WorkspaceModuleAccessAction;
  maxRows: number;
  previewRowLimit: number;
  issuePageSize: number;
  requiresStoredFileReference: true;
  requiresStagedValidation: true;
  returnsValidationSummaryOnly: true;
  persistsAcceptedRowsIndividually: true;
  forbidsWholeTableReplacement: true;
};

export type ModuleImportPlanIssue = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  code:
    | "import_plan_outside_single_router"
    | "import_plan_route_metadata_mismatch"
    | "import_plan_unsafe_identifier"
    | "import_plan_without_access_policy"
    | "import_plan_without_bounded_limits"
    | "import_plan_without_staged_validation";
  value?: string;
};

export type ModuleImportBatchDraftInput = {
  requestedBy: string;
  sourceFileId?: string;
  originalFileName?: string;
  worksheetName?: string;
  format: unknown;
  mode: ImportBatchMode;
  declaredRowCount?: number;
  previewRowCount?: number;
} & Record<string, unknown>;

export type ModuleImportValidationDraftInput = {
  requestedBy: string;
  batchId?: string;
  sourceFileId?: string;
  summary: ImportValidationSummary;
  totalIssueCount?: number;
  issues: ImportValidationIssue[];
} & Record<string, unknown>;

export { moduleImportPlans };

export function getModuleImportPlan(moduleId: string) {
  return moduleImportPlans.find((plan) => plan.moduleId === moduleId);
}

export function getModuleImportPlanByDatabaseAction(resource?: string, databaseAction?: string) {
  if (!resource || !databaseAction) return undefined;

  return moduleImportPlans.find((plan) => (
    plan.resource === resource && plan.databaseAction === databaseAction
  ));
}

export function listModuleImportPlans(workspaceId?: DispatchWorkspaceId) {
  return moduleImportPlans.filter((plan) => (
    workspaceId ? plan.workspaceId === workspaceId : true
  ));
}

export function isModuleImportFormatAllowed(moduleId: string, format: unknown) {
  const plan = getModuleImportPlan(moduleId);
  return typeof format === "string" && Boolean(plan?.allowedFormats.includes(format as ImportBatchFormat));
}

export function createModuleImportBatchDraft(
  plan: ModuleImportPlan,
  input: ModuleImportBatchDraftInput,
): ServerImportBatchDraft {
  return {
    ...input,
    moduleId: plan.moduleId,
    maxRows: plan.maxRows,
    maxPreviewRows: plan.previewRowLimit,
  };
}

export function createModuleImportValidationDraft(
  plan: ModuleImportPlan,
  input: ModuleImportValidationDraftInput,
): ServerImportValidationDraft {
  return {
    ...input,
    moduleId: plan.moduleId,
    issuePageSize: plan.issuePageSize,
    maxIssuePageSize: plan.issuePageSize,
  };
}

export function getImportPlansOutsideSingleRouter(workspaceId?: DispatchWorkspaceId) {
  return listModuleImportPlans(workspaceId).filter((plan) => (
    plan.endpoint !== "/api/database" || plan.routeKind !== "single-database-router"
  )).map((plan): ModuleImportPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "import_plan_outside_single_router",
    value: plan.databaseAction,
  }));
}

export function getImportPlansWithRouteMetadataMismatch(
  plans: readonly ModuleImportPlan[] = moduleImportPlans,
) {
  return plans.flatMap((plan): ModuleImportPlanIssue[] => {
    const routeContract = getModuleDataRouteContract(plan.moduleId);
    if (!routeContract) return [];

    const issues: ModuleImportPlanIssue[] = [];

    if (plan.workspaceId !== routeContract.workspaceId) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "import_plan_route_metadata_mismatch",
        value: plan.workspaceId,
      });
    }

    if (plan.resource !== routeContract.resource) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        code: "import_plan_route_metadata_mismatch",
        value: plan.resource,
      });
    }

    return issues;
  });
}

export function getImportPlansWithoutAccessPolicy(workspaceId?: DispatchWorkspaceId) {
  return listModuleImportPlans(workspaceId).filter((plan) => (
    !getModuleActionRequiredCapability(plan.moduleId, plan.requiredAccessAction)
  )).map((plan): ModuleImportPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "import_plan_without_access_policy",
    value: plan.requiredAccessAction,
  }));
}

export function getImportPlansWithoutBoundedLimits(workspaceId?: DispatchWorkspaceId) {
  return listModuleImportPlans(workspaceId).filter((plan) => (
    plan.maxRows < 1 ||
    plan.previewRowLimit < 1 ||
    plan.previewRowLimit > plan.maxRows ||
    plan.issuePageSize < 1 ||
    plan.allowedFormats.length === 0 ||
    plan.allowedModes.length === 0
  )).map((plan): ModuleImportPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "import_plan_without_bounded_limits",
  }));
}

export function getImportPlansWithoutStagedValidation(workspaceId?: DispatchWorkspaceId) {
  return listModuleImportPlans(workspaceId).filter((plan) => (
    !plan.requiresStoredFileReference ||
    !plan.requiresStagedValidation ||
    !plan.returnsValidationSummaryOnly ||
    !plan.persistsAcceptedRowsIndividually ||
    !plan.forbidsWholeTableReplacement
  )).map((plan): ModuleImportPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "import_plan_without_staged_validation",
  }));
}

export function getUnsafeImportPlanIdentifiers(workspaceId?: DispatchWorkspaceId) {
  return listModuleImportPlans(workspaceId).filter((plan) => (
    !isSafeMysqlIdentifier(plan.importBatchEntity)
  )).map((plan): ModuleImportPlanIssue => ({
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    code: "import_plan_unsafe_identifier",
    value: plan.importBatchEntity,
  }));
}
