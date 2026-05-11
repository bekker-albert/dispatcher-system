import type { ModuleImportPlan } from "./moduleImportPlans";

const defaultAllowedFormats: ModuleImportPlan["allowedFormats"] = ["xlsx", "csv"];
const defaultAllowedModes: ModuleImportPlan["allowedModes"] = ["preview", "stage", "validate"];

function createImportPlan(input: Omit<
  ModuleImportPlan,
  | "allowedFormats"
  | "allowedModes"
  | "endpoint"
  | "routeKind"
  | "requiresStoredFileReference"
  | "requiresStagedValidation"
  | "returnsValidationSummaryOnly"
  | "persistsAcceptedRowsIndividually"
  | "forbidsWholeTableReplacement"
> & Partial<Pick<ModuleImportPlan, "allowedFormats" | "allowedModes">>) {
  return {
    endpoint: "/api/database",
    routeKind: "single-database-router",
    allowedFormats: defaultAllowedFormats,
    allowedModes: defaultAllowedModes,
    requiresStoredFileReference: true,
    requiresStagedValidation: true,
    returnsValidationSummaryOnly: true,
    persistsAcceptedRowsIndividually: true,
    forbidsWholeTableReplacement: true,
    ...input,
  } satisfies ModuleImportPlan;
}

export const moduleImportPlans: ModuleImportPlan[] = [
  createImportPlan({
    moduleId: "mining-shift-reports",
    workspaceId: "mining-dispatch",
    resource: "dispatch",
    databaseAction: "stage-shift-report-import",
    importBatchEntity: "dispatch_import_batches",
    sourceKind: "legacy-excel",
    requiredAccessAction: "edit",
    maxRows: 1000,
    previewRowLimit: 50,
    issuePageSize: 50,
  }),
  createImportPlan({
    moduleId: "taxation-fuel-periods",
    workspaceId: "taxation",
    resource: "taxation",
    databaseAction: "stage-fuel-statement-import",
    importBatchEntity: "taxation_import_batches",
    sourceKind: "legacy-excel",
    requiredAccessAction: "edit",
    maxRows: 2000,
    previewRowLimit: 50,
    issuePageSize: 50,
  }),
  createImportPlan({
    moduleId: "smts-vehicle-cards",
    workspaceId: "smts-gps",
    resource: "smts",
    databaseAction: "stage-smts-equipment-import",
    importBatchEntity: "smts_import_batches",
    sourceKind: "legacy-excel",
    requiredAccessAction: "edit",
    maxRows: 1000,
    previewRowLimit: 50,
    issuePageSize: 50,
  }),
  createImportPlan({
    moduleId: "fleet-movements",
    workspaceId: "fleet",
    resource: "fleet",
    databaseAction: "stage-vehicle-movement-import",
    importBatchEntity: "fleet_import_batches",
    sourceKind: "legacy-excel",
    requiredAccessAction: "edit",
    maxRows: 1000,
    previewRowLimit: 50,
    issuePageSize: 50,
  }),
  createImportPlan({
    moduleId: "access-matrix",
    workspaceId: "admin",
    resource: "admin",
    databaseAction: "stage-access-grants-import",
    importBatchEntity: "admin_import_batches",
    sourceKind: "csv-register",
    allowedFormats: ["csv", "xlsx"],
    requiredAccessAction: "admin",
    maxRows: 500,
    previewRowLimit: 50,
    issuePageSize: 50,
  }),
];
