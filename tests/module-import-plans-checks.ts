import assert from "node:assert/strict";
import {
  createModuleImportBatchDraft,
  createModuleImportValidationDraft,
  getImportPlansOutsideSingleRouter,
  getImportPlansWithRouteMetadataMismatch,
  getImportPlansWithoutAccessPolicy,
  getImportPlansWithoutBoundedLimits,
  getImportPlansWithoutStagedValidation,
  getModuleImportPlan,
  getModuleImportPlanByDatabaseAction,
  getUnsafeImportPlanIdentifiers,
  isModuleImportFormatAllowed,
  listModuleImportPlans,
  moduleImportPlans,
} from "../lib/domain/data-access/moduleImportPlans";
import { createServerImportBatchEnvelope } from "../lib/domain/data-access/importBatchEnvelope";
import { createServerImportValidationEnvelope } from "../lib/domain/data-access/importValidationEnvelope";

assert.equal(moduleImportPlans.length, 5);
assert.equal(getImportPlansOutsideSingleRouter().length, 0);
assert.equal(getImportPlansWithRouteMetadataMismatch().length, 0);
assert.equal(getImportPlansWithoutAccessPolicy().length, 0);
assert.equal(getImportPlansWithoutBoundedLimits().length, 0);
assert.equal(getImportPlansWithoutStagedValidation().length, 0);
assert.equal(getUnsafeImportPlanIdentifiers().length, 0);

const shiftImportPlan = getModuleImportPlan("mining-shift-reports");
assert.ok(shiftImportPlan);
assert.equal(shiftImportPlan.endpoint, "/api/database");
assert.equal(shiftImportPlan.routeKind, "single-database-router");
assert.equal(shiftImportPlan.importBatchEntity, "dispatch_import_batches");
assert.equal(shiftImportPlan.requiresStoredFileReference, true);
assert.equal(shiftImportPlan.requiresStagedValidation, true);
assert.equal(shiftImportPlan.returnsValidationSummaryOnly, true);
assert.equal(shiftImportPlan.persistsAcceptedRowsIndividually, true);
assert.equal(shiftImportPlan.forbidsWholeTableReplacement, true);
assert.equal(shiftImportPlan.maxRows, 1000);
assert.equal(shiftImportPlan.previewRowLimit, 50);
assert.equal(getModuleImportPlanByDatabaseAction("dispatch", "stage-shift-report-import")?.moduleId, "mining-shift-reports");
assert.equal(isModuleImportFormatAllowed("mining-shift-reports", "xlsx"), true);
assert.equal(isModuleImportFormatAllowed("mining-shift-reports", "xlsm"), false);

const shiftBatchDraft = createModuleImportBatchDraft(shiftImportPlan, {
  requestedBy: "dispatcher-1",
  sourceFileId: "file-shift-1",
  format: "xlsx",
  mode: "stage",
  declaredRowCount: 400,
  previewRowCount: 50,
});
assert.equal(shiftBatchDraft.moduleId, "mining-shift-reports");
assert.equal(shiftBatchDraft.maxRows, 1000);
assert.equal(shiftBatchDraft.maxPreviewRows, 50);
const shiftBatchEnvelope = createServerImportBatchEnvelope(shiftBatchDraft);
assert.equal(shiftBatchEnvelope.ok, true);

const shiftValidationDraft = createModuleImportValidationDraft(shiftImportPlan, {
  requestedBy: "dispatcher-1",
  batchId: "batch-shift-1",
  sourceFileId: "file-shift-1",
  summary: {
    totalRows: 400,
    validRows: 398,
    invalidRows: 2,
    warningRows: 1,
  },
  totalIssueCount: 2,
  issues: [
    {
      rowNumber: 10,
      field: "excavatorId",
      code: "missing_excavator",
      message: "Excavator must be selected.",
      severity: "error",
    },
  ],
});
assert.equal(shiftValidationDraft.issuePageSize, 50);
const shiftValidationEnvelope = createServerImportValidationEnvelope(shiftValidationDraft);
assert.equal(shiftValidationEnvelope.ok, true);
if (shiftValidationEnvelope.ok) {
  assert.equal(shiftValidationEnvelope.envelope.resultMode, "summary-with-limited-issues");
  assert.equal(shiftValidationEnvelope.envelope.hasMoreIssues, true);
  assert.equal(shiftValidationEnvelope.envelope.noInlinePayload, true);
}

const rejectedBatchEnvelope = createServerImportBatchEnvelope(createModuleImportBatchDraft(shiftImportPlan, {
  requestedBy: "dispatcher-1",
  sourceFileId: "file-shift-1",
  format: "xlsx",
  mode: "stage",
  declaredRowCount: 1001,
  previewRowCount: 51,
}));
assert.equal(rejectedBatchEnvelope.ok, false);
if (!rejectedBatchEnvelope.ok) {
  assert.deepEqual(rejectedBatchEnvelope.rejection.issues.map((issue) => issue.code), [
    "row_limit_exceeded",
    "preview_limit_exceeded",
  ]);
}

const adminImportPlan = getModuleImportPlan("access-matrix");
assert.ok(adminImportPlan);
assert.equal(adminImportPlan.requiredAccessAction, "admin");
assert.equal(adminImportPlan.maxRows, 500);
assert.deepEqual(listModuleImportPlans("taxation").map((plan) => plan.moduleId), [
  "taxation-fuel-periods",
]);
assert.deepEqual(getImportPlansWithRouteMetadataMismatch([
  {
    ...shiftImportPlan,
    workspaceId: "fleet",
    resource: "fleet",
  },
]).map((issue) => issue.code), [
  "import_plan_route_metadata_mismatch",
  "import_plan_route_metadata_mismatch",
]);

console.log("Module import plans checks passed");
