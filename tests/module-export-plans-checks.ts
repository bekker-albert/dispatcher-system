import assert from "node:assert/strict";
import {
  getExportPlansWithRouteMetadataMismatch,
  getExportPlansWithoutBoundedQuery,
  getExportPlansWithoutQueuedRequest,
  getExportPlansWithoutRouteAction,
  getMissingExportPlans,
  getModuleExportPlan,
  getUnsafeExportPlanIdentifiers,
  isModuleExportFormatAllowed,
  listModuleExportPlans,
  listRequiredModuleExportActions,
  moduleExportPlans,
  validateModuleExportQuery,
} from "../lib/domain/data-access/moduleExportPlans";
import {
  createServerExportRequestEnvelope,
  validateServerExportRequestDraft,
} from "../lib/domain/data-access/exportRequestEnvelope";

const requiredExportActions = listRequiredModuleExportActions();
assert.equal(moduleExportPlans.length, requiredExportActions.length);
assert.equal(getMissingExportPlans().length, 0);
assert.equal(getExportPlansWithoutRouteAction().length, 0);
assert.equal(getExportPlansWithRouteMetadataMismatch().length, 0);
assert.equal(getExportPlansWithoutBoundedQuery().length, 0);
assert.equal(getExportPlansWithoutQueuedRequest().length, 0);
assert.equal(getUnsafeExportPlanIdentifiers().length, 0);

const reportExportPlan = getModuleExportPlan("prepared-reports");
assert.ok(reportExportPlan);
assert.equal(reportExportPlan.databaseAction, "create-report-export-request");
assert.equal(reportExportPlan.sourceKind, "prepared-aggregate");
assert.equal(reportExportPlan.exportRequestEntity, "report_export_requests");
assert.equal(reportExportPlan.createsQueuedRequest, true);
assert.equal(reportExportPlan.storesFileByReference, true);
assert.equal(reportExportPlan.avoidsClientSideRecalculation, true);
assert.deepEqual(reportExportPlan.allowedFormats, ["xlsx", "pdf", "csv"]);
assert.equal(reportExportPlan.requiredFilters.includes("date"), true);
assert.equal(reportExportPlan.requiredFilters.includes("section_id"), true);
assert.equal(reportExportPlan.maxDateRangeDays, 31);
assert.equal(isModuleExportFormatAllowed("prepared-reports", "xlsx"), true);
assert.equal(isModuleExportFormatAllowed("prepared-reports", "zip"), false);
const reportExportEnvelope = createServerExportRequestEnvelope({
  moduleId: "prepared-reports",
  format: "xlsx",
  grain: "day",
  requestedBy: "user-1",
  query: {
    pageSize: 50,
    filters: {
      date_from: "2026-05-01",
      date_to: "2026-05-15",
      section_id: "baktay",
      status: "ready",
    },
  },
});
assert.equal(reportExportEnvelope.ok, true);
if (reportExportEnvelope.ok) {
  assert.equal(reportExportEnvelope.envelope.executionMode, "server-only");
  assert.equal(reportExportEnvelope.envelope.generationMode, "queued");
  assert.equal(reportExportEnvelope.envelope.sourceKind, "prepared-aggregate");
  assert.equal(reportExportEnvelope.envelope.rowLimit, 10000);
  assert.equal(reportExportEnvelope.envelope.storesFileByReference, true);
  assert.equal(reportExportEnvelope.envelope.avoidsClientSideRecalculation, true);
}
assert.deepEqual(validateServerExportRequestDraft({
  moduleId: "prepared-reports",
  format: "zip",
  grain: "hour",
  requestedBy: "",
  query: {
    pageSize: 50,
    filters: {
      rows: [],
    },
  },
}).map((issue) => issue.code), [
  "export_format_not_allowed",
  "export_grain_not_allowed",
  "requested_by_required",
  "client_rows_forbidden",
  "export_date_range_required",
  "export_filter_missing",
  "export_filter_missing",
]);
assert.deepEqual(validateModuleExportQuery(reportExportPlan, {
  pageSize: 50,
  filters: {
    date_from: "2026-05-01",
    date_to: "2026-06-15",
    section_id: "baktay",
    status: "ready",
  },
}), [{
  code: "export_date_range_too_large",
  message: "Export date range exceeds the module export limit.",
  field: "date",
}]);

const fuelExportPlan = getModuleExportPlan("taxation-fuel-periods");
assert.ok(fuelExportPlan);
assert.equal(fuelExportPlan.sourceKind, "prepared-aggregate");
assert.deepEqual(fuelExportPlan.allowedGrains, ["fuel_period", "month", "year"]);
assert.equal(fuelExportPlan.requiredFilters.includes("period_id"), true);

const adminExportPlan = getModuleExportPlan("access-matrix");
assert.ok(adminExportPlan);
assert.deepEqual(adminExportPlan.allowedFormats, ["csv", "xlsx"]);
assert.equal(adminExportPlan.maxRowsPerExport, 5000);

assert.deepEqual(listModuleExportPlans("smts-gps").map((plan) => plan.moduleId), [
  "smts-vehicle-cards",
  "smts-fuel-drains",
]);
assert.equal(getModuleExportPlan("ai-on-demand"), undefined);
assert.deepEqual(getExportPlansWithRouteMetadataMismatch([
  {
    ...reportExportPlan,
    workspaceId: "fleet",
    resource: "fleet",
  },
]).map((issue) => issue.code), [
  "export_plan_route_metadata_mismatch",
  "export_plan_route_metadata_mismatch",
]);

console.log("Module export plans checks passed");
