import assert from "node:assert/strict";
import {
  defaultHeavyTableQueryPolicy,
  getQueryDateRangeDays,
  gpsEventsQueryPolicy,
  isServerPageQueryAllowed,
  normalizeServerPageQueryDraft,
  validateServerPageQueryPolicy,
} from "../lib/domain/data-access/queryPolicy";
import {
  createServerListQueryCacheKey,
  createServerListQueryEnvelope,
  validateServerPageResult,
} from "../lib/domain/data-access/listQueryEnvelope";
import {
  createServerImportBatchEnvelope,
  validateServerImportBatchDraft,
} from "../lib/domain/data-access/importBatchEnvelope";
import {
  createServerImportValidationEnvelope,
  validateServerImportValidationDraft,
} from "../lib/domain/data-access/importValidationEnvelope";

const boundedQuery = normalizeServerPageQueryDraft({
  pageSize: 999,
  offset: -5,
  filters: {
    date_from: "2026-05-01",
    date_to: "2026-05-15",
    section_id: "baktay",
    status: "accepted",
  },
  search: "truck",
});

assert.equal(boundedQuery.pageSize, 50);
assert.equal(boundedQuery.offset, 0);
assert.equal(getQueryDateRangeDays(boundedQuery.filters), 15);
assert.deepEqual(validateServerPageQueryPolicy(boundedQuery, defaultHeavyTableQueryPolicy), []);
assert.equal(isServerPageQueryAllowed(boundedQuery, defaultHeavyTableQueryPolicy), true);

const tooWideQuery = normalizeServerPageQueryDraft({
  pageSize: 100,
  filters: {
    date_from: "2026-05-01",
    date_to: "2026-06-15",
    status: "accepted",
  },
});

assert.deepEqual(validateServerPageQueryPolicy(tooWideQuery, defaultHeavyTableQueryPolicy).map((issue) => issue.code), [
  "date_range_too_large",
  "required_filter_missing",
]);

const unboundedSearchQuery = normalizeServerPageQueryDraft({
  pageSize: 50,
  filters: {},
  search: "vehicle",
});

assert.deepEqual(validateServerPageQueryPolicy(unboundedSearchQuery, defaultHeavyTableQueryPolicy).map((issue) => issue.code), [
  "date_range_required",
  "required_filter_missing",
  "required_filter_missing",
  "search_requires_filters",
]);

const invalidDateQuery = normalizeServerPageQueryDraft({
  pageSize: 50,
  filters: {
    date_from: "2026-05-10",
    date_to: "2026-05-01",
    section_id: "baktay",
    status: "accepted",
  },
});

assert.deepEqual(validateServerPageQueryPolicy(invalidDateQuery, defaultHeavyTableQueryPolicy).map((issue) => issue.code), [
  "date_range_invalid",
]);

const gpsTooWideQuery = normalizeServerPageQueryDraft({
  pageSize: 100,
  filters: {
    date_from: "2026-05-01",
    date_to: "2026-05-09",
    section_id: "baktay",
    vehicle_id: "truck-101",
  },
});

assert.deepEqual(validateServerPageQueryPolicy(gpsTooWideQuery, gpsEventsQueryPolicy).map((issue) => issue.code), [
  "date_range_too_large",
]);

const boundedGpsQuery = normalizeServerPageQueryDraft({
  pageSize: 100,
  filters: {
    date_from: "2026-05-01",
    date_to: "2026-05-07",
    section_id: "baktay",
    vehicle_id: "truck-101",
  },
});

assert.equal(isServerPageQueryAllowed(boundedGpsQuery, gpsEventsQueryPolicy), true);

const listEnvelope = createServerListQueryEnvelope({
  moduleId: "taxation-waybills",
  policy: defaultHeavyTableQueryPolicy,
  draft: {
    pageSize: 50,
    filters: {
      status: "accepted",
      section_id: "baktay",
      date: "2026-05-08",
    },
    sort: { field: "created_at", direction: "desc" },
  },
  requestedBy: "taxer-1",
});
assert.equal(listEnvelope.ok, true);
if (listEnvelope.ok) {
  assert.equal(listEnvelope.envelope.executionMode, "server-only");
  assert.equal(listEnvelope.envelope.maxClientRows, 50);
  assert.equal(listEnvelope.envelope.requestedBy, "taxer-1");
  assert.equal(
    listEnvelope.envelope.cacheKey,
    createServerListQueryCacheKey("taxation-waybills", listEnvelope.envelope.query),
  );
  assert.deepEqual(validateServerPageResult(listEnvelope.envelope.query, {
    rows: Array.from({ length: 51 }, (_, index) => ({ id: index })),
    pageSize: 100,
    totalCount: 10,
  }).map((issue) => issue.code), [
    "page_size_mismatch",
    "rows_exceed_page_size",
    "total_count_less_than_rows",
  ]);
}

const rejectedListEnvelope = createServerListQueryEnvelope({
  moduleId: "mining-shift-reports",
  policy: defaultHeavyTableQueryPolicy,
  draft: {
    pageSize: 50,
    filters: {},
    search: "EX-1200",
  },
});
assert.equal(rejectedListEnvelope.ok, false);
if (!rejectedListEnvelope.ok) {
  assert.equal(rejectedListEnvelope.rejection.code, "query_policy_failed");
  assert.ok(rejectedListEnvelope.rejection.issues.some((issue) => issue.code === "search_requires_filters"));
}

const importEnvelope = createServerImportBatchEnvelope({
  moduleId: "mining-shift-reports",
  requestedBy: "dispatcher-1",
  sourceFileId: "file-shift-report-1",
  originalFileName: "shift-report.xlsx",
  worksheetName: "day",
  format: "xlsx",
  mode: "stage",
  declaredRowCount: 120,
  previewRowCount: 25,
  maxRows: 500,
});
assert.equal(importEnvelope.ok, true);
if (importEnvelope.ok) {
  assert.equal(importEnvelope.envelope.executionMode, "server-only");
  assert.equal(importEnvelope.envelope.storesFileByReference, true);
  assert.equal(importEnvelope.envelope.noInlinePayload, true);
  assert.equal(importEnvelope.envelope.stagedValidationRequired, true);
  assert.equal(importEnvelope.envelope.maxRows, 500);
}

assert.deepEqual(validateServerImportBatchDraft({
  moduleId: "mining-shift-reports",
  requestedBy: "",
  sourceFileId: "",
  format: "xls",
  mode: "preview",
  declaredRowCount: 2000,
  previewRowCount: 75,
  maxRows: 1000,
  rows: [],
}).map((issue) => issue.code), [
  "requested_by_required",
  "file_reference_required",
  "format_not_allowed",
  "inline_import_payload_forbidden",
  "row_limit_exceeded",
  "preview_limit_exceeded",
]);

const importValidationEnvelope = createServerImportValidationEnvelope({
  moduleId: "mining-shift-reports",
  requestedBy: "dispatcher-1",
  batchId: "batch-shift-report-1",
  sourceFileId: "file-shift-report-1",
  summary: {
    totalRows: 120,
    validRows: 118,
    invalidRows: 2,
    warningRows: 1,
  },
  totalIssueCount: 3,
  issuePageSize: 2,
  issues: [
    {
      rowNumber: 10,
      field: "shift",
      code: "required",
      message: "Shift is required.",
      severity: "error",
    },
    {
      rowNumber: 11,
      field: "vehicleId",
      code: "unknown_vehicle",
      message: "Vehicle must exist in the fleet catalog.",
      severity: "warning",
    },
  ],
});
assert.equal(importValidationEnvelope.ok, true);
if (importValidationEnvelope.ok) {
  assert.equal(importValidationEnvelope.envelope.executionMode, "server-only");
  assert.equal(importValidationEnvelope.envelope.resultMode, "summary-with-limited-issues");
  assert.equal(importValidationEnvelope.envelope.returnedIssueCount, 2);
  assert.equal(importValidationEnvelope.envelope.hasMoreIssues, true);
  assert.equal(importValidationEnvelope.envelope.noInlinePayload, true);
}

assert.deepEqual(validateServerImportValidationDraft({
  moduleId: "mining-shift-reports",
  requestedBy: "",
  batchId: "",
  sourceFileId: "",
  summary: {
    totalRows: 1,
    validRows: 2,
    invalidRows: 0,
    warningRows: 0,
  },
  issuePageSize: 1,
  issues: [
    {
      rowNumber: 3,
      field: "shift",
      code: "bad_shift",
      message: "Bad shift.",
      severity: "error",
    },
    {
      rowNumber: 1,
      field: "vehicleId",
      code: "bad_vehicle",
      message: "Bad vehicle.",
      severity: "warning",
    },
  ],
  rows: [],
}).map((issue) => issue.code), [
  "requested_by_required",
  "batch_reference_required",
  "file_reference_required",
  "inline_validation_payload_forbidden",
  "row_summary_invalid",
  "issue_page_limit_exceeded",
  "issue_row_out_of_range",
]);

console.log("Data access query policy checks passed");
