import assert from "node:assert/strict";
import { defaultDispatchReportBuildPolicy } from "../lib/domain/reports/aggregation-contracts";
import {
  createReportExportRequestCommand,
  getInclusiveDateRangeDays,
  selectPreparedReportAggregates,
  summarizePreparedReportAggregates,
  validatePreparedReportQuery,
} from "../lib/domain/reports/preparedReports";
import { createPreparedReportReadiness } from "../lib/domain/reports/reportReadiness";
import {
  createReportExportArtifactEnvelope,
  validateReportExportArtifactReference,
} from "../lib/domain/reports/exportArtifacts";
import {
  createReportAggregateRefreshEnvelope,
  validateReportAggregateRefreshPlan,
} from "../lib/domain/reports/aggregateRefresh";
import {
  createReportAggregateRefreshPlanFromSource,
  getInvalidReportAggregateRefreshSourcePlans,
  getReportAggregateRefreshSourcePlan,
  listReportAggregateRefreshSourcePlans,
  reportAggregateRefreshSourcePlans,
} from "../lib/domain/reports/aggregateRefreshSources";
import type {
  PreparedReportAggregate,
  ReportExportRequest,
} from "../lib/domain/reports/aggregation-contracts";

assert.equal(getInclusiveDateRangeDays("2026-05-01", "2026-05-31"), 31);
assert.equal(getInclusiveDateRangeDays("2026-05-08", "2026-05-01"), -1);

const reportQuery = {
  workspaceId: "taxation" as const,
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  grain: "fuel_period" as const,
  filters: {
    section_id: "baktay",
    status: "closed",
  },
};

assert.deepEqual(validatePreparedReportQuery(defaultDispatchReportBuildPolicy, reportQuery), []);
assert.deepEqual(validatePreparedReportQuery(defaultDispatchReportBuildPolicy, {
  ...reportQuery,
  periodEnd: "2026-06-15",
  filters: { section_id: "", status: "" },
}).map((issue) => issue.code), [
  "date_range_too_large",
  "required_filter_missing",
  "required_filter_missing",
]);

const aggregates: PreparedReportAggregate[] = [
  {
    id: "aggregate-1",
    version: 1,
    workspaceId: "taxation",
    metricKey: "fuel_issued",
    grain: "fuel_period",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-15",
    dimensions: { section_id: "baktay", status: "closed" },
    value: 1000,
    unit: "liters",
    preparedAt: "2026-05-16T00:00:00.000Z",
    sourceVersion: "fuel-period-v1",
  },
  {
    id: "aggregate-2",
    version: 1,
    workspaceId: "taxation",
    metricKey: "fuel_issued",
    grain: "fuel_period",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-15",
    dimensions: { section_id: "baktay", status: "closed" },
    value: 250,
    unit: "liters",
    preparedAt: "2026-05-16T00:00:00.000Z",
    sourceVersion: "fuel-period-v1",
  },
  {
    id: "aggregate-other-section",
    version: 1,
    workspaceId: "taxation",
    metricKey: "fuel_issued",
    grain: "fuel_period",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-15",
    dimensions: { section_id: "akbakay", status: "closed" },
    value: 999,
    unit: "liters",
    preparedAt: "2026-05-16T00:00:00.000Z",
    sourceVersion: "fuel-period-v1",
  },
  {
    id: "aggregate-too-wide",
    version: 1,
    workspaceId: "taxation",
    metricKey: "fuel_issued",
    grain: "month",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    dimensions: { section_id: "baktay", status: "closed" },
    value: 999,
    unit: "liters",
    preparedAt: "2026-06-01T00:00:00.000Z",
    sourceVersion: "fuel-month-v1",
  },
];

const selectedAggregates = selectPreparedReportAggregates(aggregates, reportQuery);
assert.deepEqual(selectedAggregates.map((aggregate) => aggregate.id), ["aggregate-1", "aggregate-2"]);
assert.deepEqual(summarizePreparedReportAggregates(selectedAggregates), [{
  metricKey: "fuel_issued",
  unit: "liters",
  value: 1250,
}]);

const exportRequest = createReportExportRequestCommand(
  defaultDispatchReportBuildPolicy,
  reportQuery,
  "dispatcher-1",
  "xlsx",
);
assert.equal(exportRequest.ok, true);
if (exportRequest.ok) {
  assert.equal(exportRequest.command.status, "queued");
  assert.equal(exportRequest.command.filters.periodStart, "2026-05-01");
  assert.equal(exportRequest.command.filters.grain, "fuel_period");
}

const readyExportRequest: ReportExportRequest = {
  id: "export-request-1",
  version: 1,
  ...(
    exportRequest.ok
      ? exportRequest.command
      : {
          reportKey: "dispatch-service-control",
          requestedBy: "dispatcher-1",
          format: "xlsx" as const,
          filters: {},
          status: "queued" as const,
        }
  ),
  status: "ready",
  fileId: "file-1",
};

const exportArtifactEnvelope = createReportExportArtifactEnvelope({
  request: readyExportRequest,
  artifact: {
    requestId: "export-request-1",
    status: "ready",
    format: "xlsx",
    fileId: "file-1",
    fileName: "dispatch-service-control.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    byteSize: 1024,
    generatedAt: "2026-05-16T02:00:00.000Z",
    expiresAt: "2026-05-23T02:00:00.000Z",
  },
  currentTime: "2026-05-16T03:00:00.000Z",
});
assert.equal(exportArtifactEnvelope.ok, true);
if (exportArtifactEnvelope.ok) {
  assert.equal(exportArtifactEnvelope.envelope.storesFileByReference, true);
  assert.equal(exportArtifactEnvelope.envelope.noInlinePayload, true);
  assert.equal(exportArtifactEnvelope.envelope.fileId, "file-1");
  assert.equal(exportArtifactEnvelope.envelope.byteSize, 1024);
}

assert.deepEqual(validateReportExportArtifactReference({
  requestId: "export-request-1",
  status: "ready",
  format: "pdf",
  fileId: "file-2",
  mimeType: "application/pdf",
  byteSize: 1024,
  generatedAt: "2026-05-16T02:00:00.000Z",
  expiresAt: "2026-05-16T02:30:00.000Z",
  inlineBytes: "forbidden",
}, "2026-05-16T03:00:00.000Z").map((issue) => issue.code), [
  "inline_file_payload_forbidden",
  "artifact_expired",
]);

assert.deepEqual(validateReportExportArtifactReference({
  requestId: "export-request-1",
  status: "ready",
  format: "csv",
  fileId: "file-3",
  mimeType: "text/plain",
  byteSize: 2048,
  generatedAt: "2026-05-16T02:00:00.000Z",
  expiresAt: "2026-05-17T02:00:00.000Z",
}, "2026-05-16T03:00:00.000Z", 1024).map((issue) => issue.code), [
  "mime_type_not_allowed",
  "byte_size_too_large",
]);

const rejectedExportRequest = createReportExportRequestCommand(
  defaultDispatchReportBuildPolicy,
  { ...reportQuery, filters: { section_id: "", status: "closed" } },
  "dispatcher-1",
  "pdf",
);
assert.equal(rejectedExportRequest.ok, false);
if (!rejectedExportRequest.ok) {
  assert.equal(rejectedExportRequest.rejection.code, "query_not_ready");
}

const readyReport = createPreparedReportReadiness({
  policy: defaultDispatchReportBuildPolicy,
  query: reportQuery,
  aggregates,
  currentTime: "2026-05-16T01:00:00.000Z",
  maxAggregateAgeMinutes: 120,
  requireSourceVersion: true,
});
assert.equal(readyReport.canBuild, true);
assert.equal(readyReport.canExport, true);
assert.deepEqual(readyReport.selectedAggregateIds, ["aggregate-1", "aggregate-2"]);
assert.deepEqual(readyReport.issues, []);

const staleReport = createPreparedReportReadiness({
  policy: defaultDispatchReportBuildPolicy,
  query: reportQuery,
  aggregates,
  currentTime: "2026-05-17T01:00:00.000Z",
  maxAggregateAgeMinutes: 120,
  requireSourceVersion: true,
});
assert.equal(staleReport.canExport, false);
assert.deepEqual(staleReport.issues.map((issue) => issue.code), [
  "aggregate_stale",
  "aggregate_stale",
]);

const missingAggregateReport = createPreparedReportReadiness({
  policy: defaultDispatchReportBuildPolicy,
  query: { ...reportQuery, filters: { section_id: "missing", status: "closed" } },
  aggregates,
  currentTime: "2026-05-16T01:00:00.000Z",
});
assert.equal(missingAggregateReport.canBuild, false);
assert.deepEqual(missingAggregateReport.issues.map((issue) => issue.code), ["aggregate_missing"]);

const refreshEnvelope = createReportAggregateRefreshEnvelope({
  id: "aggregate-refresh-1",
  workspaceId: "taxation",
  moduleId: "taxation-fuel-periods",
  reportKey: defaultDispatchReportBuildPolicy.reportKey,
  requestedBy: "dispatcher-1",
  trigger: "event-driven",
  grain: "fuel_period",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  sectionId: "baktay",
  sourceIds: ["fuel-period-1"],
  sourceVersion: "fuel-period-v2",
  metricKeys: ["fuel_issued"],
  updateMode: "upsert-affected-aggregates",
  estimatedInputRows: 250,
  maxInputRows: 1000,
  maxRuntimeSeconds: 120,
});
assert.equal(refreshEnvelope.ok, true);
if (refreshEnvelope.ok) {
  assert.equal(refreshEnvelope.envelope.queuedOperation.executionMode, "queued");
  assert.equal(refreshEnvelope.envelope.queuedOperation.noResidentProcess, true);
  assert.equal(refreshEnvelope.envelope.resultMode, "prepared-aggregate-rows-by-reference");
  assert.equal(refreshEnvelope.envelope.noFullReportRebuild, true);
  assert.equal(refreshEnvelope.envelope.avoidsClientSideRecalculation, true);
  assert.equal(refreshEnvelope.envelope.sourceVersion, "fuel-period-v2");
}

assert.deepEqual(validateReportAggregateRefreshPlan({
  id: "aggregate-refresh-bad",
  workspaceId: "reports",
  moduleId: "prepared-reports",
  reportKey: defaultDispatchReportBuildPolicy.reportKey,
  requestedBy: "",
  trigger: "continuous-background",
  grain: "month",
  periodStart: "2026-05-01",
  periodEnd: "2026-06-15",
  metricKeys: [],
  updateMode: "replace-full-report",
  estimatedInputRows: 20000,
  maxInputRows: 20000,
  maxRuntimeSeconds: 600,
  usesFullHistory: true,
  readsAllWorkspaces: true,
}).map((issue) => issue.code), [
  "continuous_background_forbidden",
  "requester_required",
  "full_history_forbidden",
  "all_workspace_scan_forbidden",
  "date_range_too_large",
  "input_limit_exceeded",
  "input_limit_exceeded",
  "runtime_limit_exceeded",
  "metric_keys_required",
  "source_version_required",
  "full_report_rebuild_forbidden",
]);

assert.equal(getInvalidReportAggregateRefreshSourcePlans().length, 0);
assert.equal(reportAggregateRefreshSourcePlans.length, 4);
assert.deepEqual(listReportAggregateRefreshSourcePlans("smts-gps").map((plan) => plan.sourceModuleId), [
  "smts-fuel-drains",
]);

const fuelRefreshSourcePlan = getReportAggregateRefreshSourcePlan("taxation-fuel-periods");
assert.ok(fuelRefreshSourcePlan);
assert.equal(fuelRefreshSourcePlan.requiresBoundedSourceQuery, true);
assert.equal(fuelRefreshSourcePlan.writesPreparedAggregateRows, true);
assert.equal(fuelRefreshSourcePlan.storesResultByReference, true);
assert.deepEqual(fuelRefreshSourcePlan.requiredSourceFilters, ["section_id", "period_id", "status"]);

const fuelRefreshPlan = createReportAggregateRefreshPlanFromSource(fuelRefreshSourcePlan, {
  id: "fuel-aggregate-refresh-1",
  requestedBy: "taxer-1",
  trigger: "manual-request",
  grain: "fuel_period",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  sectionId: "baktay",
  sourceIds: ["fuel-period-2026-05-a"],
  sourceVersion: "fuel-period-v3",
  estimatedInputRows: 300,
});
assert.equal(fuelRefreshPlan.ok, true);
if (fuelRefreshPlan.ok) {
  assert.equal(fuelRefreshPlan.plan.moduleId, "taxation-fuel-periods");
  assert.equal(fuelRefreshPlan.plan.maxInputRows, 10000);
  assert.equal(fuelRefreshPlan.plan.updateMode, "upsert-affected-aggregates");
  const envelope = createReportAggregateRefreshEnvelope(fuelRefreshPlan.plan);
  assert.equal(envelope.ok, true);
}

const rejectedFuelRefreshPlan = createReportAggregateRefreshPlanFromSource(fuelRefreshSourcePlan, {
  id: "fuel-aggregate-refresh-bad",
  requestedBy: "taxer-1",
  trigger: "continuous-background",
  grain: "shift",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  sectionId: "baktay",
  sourceVersion: "fuel-period-v3",
});
assert.equal(rejectedFuelRefreshPlan.ok, false);
if (!rejectedFuelRefreshPlan.ok) {
  assert.deepEqual(rejectedFuelRefreshPlan.rejection.issues.map((issue) => issue.code), [
    "grain_not_allowed",
    "trigger_not_allowed",
  ]);
}

console.log("Reports domain checks passed");
