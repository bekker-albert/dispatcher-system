import assert from "node:assert/strict";
import { defaultHeavyTableQueryPolicy, gpsEventsQueryPolicy } from "../lib/domain/data-access/queryPolicy";
import {
  assertDatabaseListQueryPolicy,
  evaluateDatabaseListQueryPolicy,
  getDatabaseListQueryDraft,
} from "../lib/server/database/query-policy";
import { DatabasePayloadError } from "../lib/server/database/validation";

assert.deepEqual(getDatabaseListQueryDraft({
  query: {
    pageSize: 25,
    filters: { date: "2026-05-08" },
  },
}), {
  pageSize: 25,
  filters: { date: "2026-05-08" },
});

const accepted = evaluateDatabaseListQueryPolicy({
  query: {
    pageSize: 100,
    filters: {
      date_from: "2026-05-01",
      date_to: "2026-05-07",
      section_id: "baktay",
      vehicle_id: "truck-101",
    },
  },
}, gpsEventsQueryPolicy);

assert.equal(accepted.ok, true);
if (accepted.ok) {
  assert.equal(accepted.query.pageSize, 100);
  assert.equal(accepted.query.filters.vehicle_id, "truck-101");
}

const rejected = evaluateDatabaseListQueryPolicy({
  pageSize: 100,
  filters: {
    date_from: "2026-05-01",
    date_to: "2026-06-10",
    status: "accepted",
  },
}, defaultHeavyTableQueryPolicy);

assert.equal(rejected.ok, false);
if (!rejected.ok) {
  assert.deepEqual(rejected.issues.map((issue) => issue.code), [
    "date_range_too_large",
    "required_filter_missing",
  ]);
}

assert.throws(
  () => assertDatabaseListQueryPolicy({ search: "truck", filters: {} }, defaultHeavyTableQueryPolicy, "test-resource"),
  (error: unknown) => error instanceof DatabasePayloadError
    && error.message.includes("test-resource")
    && error.message.includes("date_range_required")
    && error.message.includes("search_requires_filters"),
);

console.log("Database query policy checks passed");
