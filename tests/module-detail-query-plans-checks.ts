import assert from "node:assert/strict";
import {
  getDetailQueryPlansMissingSectionScopeForSectionScopedPolicies,
  getDetailQueryPlansMissingVersionForVersionedContracts,
  getDetailQueryPlansWithRouteMetadataMismatch,
  getDetailQueryPlansWithoutId,
  getDetailQueryPlansWithoutRouteAction,
  getMissingDetailQueryPlans,
  getModuleDetailQueryPlan,
  getUnsafeDetailQueryPlanIdentifiers,
  listModuleDetailQueryPlans,
  listRequiredDetailQueryActions,
  moduleDetailQueryPlans,
} from "../lib/domain/data-access/moduleDetailQueryPlans";
import {
  createServerDetailQueryCacheKey,
  createServerDetailQueryEnvelope,
  validateServerDetailResult,
} from "../lib/domain/data-access/detailQueryEnvelope";
import { createDatabaseDetailSelectSqlPlan } from "../lib/server/database/detail-query-builder";

const requiredDetailActions = listRequiredDetailQueryActions();

assert.equal(moduleDetailQueryPlans.length, requiredDetailActions.length);
assert.equal(getMissingDetailQueryPlans().length, 0);
assert.equal(getDetailQueryPlansWithoutRouteAction().length, 0);
assert.equal(getDetailQueryPlansWithRouteMetadataMismatch().length, 0);
assert.equal(getDetailQueryPlansWithoutId().length, 0);
assert.equal(getDetailQueryPlansMissingVersionForVersionedContracts().length, 0);
assert.equal(getDetailQueryPlansMissingSectionScopeForSectionScopedPolicies().length, 0);
assert.equal(getUnsafeDetailQueryPlanIdentifiers().length, 0);

const waybillDetail = getModuleDetailQueryPlan("taxation-waybills");
assert.ok(waybillDetail);
assert.equal(waybillDetail.resource, "taxation");
assert.equal(waybillDetail.databaseAction, "get-waybill");
assert.equal(waybillDetail.tableName, "taxation_waybills");
assert.equal(waybillDetail.idColumn, "id");
assert.equal(waybillDetail.versionColumn, "version");
assert.equal(waybillDetail.statusColumn, "status");
assert.equal(waybillDetail.requiresId, true);
assert.equal(waybillDetail.maxRows, 1);
assert.equal(waybillDetail.returnsVersion, true);
assert.equal(waybillDetail.scopeColumns.section_id, "section_id");
assert.ok(waybillDetail.selectColumns.includes("driver_id"));
assert.ok(waybillDetail.selectColumns.includes("vehicle_id"));

const preparedReportDetail = getModuleDetailQueryPlan("prepared-reports");
assert.ok(preparedReportDetail);
assert.equal(preparedReportDetail.returnsVersion, false);
assert.equal(preparedReportDetail.versionColumn, undefined);
assert.ok(preparedReportDetail.selectColumns.includes("aggregate_payload"));

assert.deepEqual(listModuleDetailQueryPlans("fleet").map((plan) => plan.moduleId), [
  "fleet-movements",
  "service-vehicle",
]);

assert.equal(getModuleDetailQueryPlan("ai-on-demand"), undefined);
assert.equal(listRequiredDetailQueryActions("ai-assistant").length, 0);
assert.deepEqual(getDetailQueryPlansWithRouteMetadataMismatch([
  {
    ...waybillDetail,
    workspaceId: "fleet",
    resource: "fleet",
  },
]).map((issue) => issue.code), [
  "detail_query_plan_route_metadata_mismatch",
  "detail_query_plan_route_metadata_mismatch",
]);
assert.deepEqual(getDetailQueryPlansMissingSectionScopeForSectionScopedPolicies(undefined, [
  {
    ...waybillDetail,
    scopeColumns: {},
  },
]).map((issue) => issue.code), [
  "detail_query_plan_missing_section_scope",
]);

const waybillEnvelope = createServerDetailQueryEnvelope({
  moduleId: "taxation-waybills",
  draft: {
    id: "waybill-1",
    scope: { section_id: "baktay", ignored: "not-allowed" },
    expectedVersion: "4",
  },
});
assert.equal(waybillEnvelope.ok, true);
if (waybillEnvelope.ok) {
  assert.equal(waybillEnvelope.envelope.executionMode, "server-only");
  assert.equal(waybillEnvelope.envelope.maxRows, 1);
  assert.equal(waybillEnvelope.envelope.expectedVersion, 4);
  assert.deepEqual(waybillEnvelope.envelope.scope, { section_id: "baktay" });
  assert.equal(
    waybillEnvelope.envelope.cacheKey,
    createServerDetailQueryCacheKey("taxation-waybills", "waybill-1", { section_id: "baktay" }, 4),
  );
  assert.deepEqual(validateServerDetailResult(waybillEnvelope.envelope, {
    row: { id: "other-waybill", status: "created" },
    rowCount: 2,
  }).map((issue) => issue.code), [
    "row_count_exceeds_one",
    "row_id_mismatch",
    "version_missing",
  ]);
  const detailSqlPlan = createDatabaseDetailSelectSqlPlan(waybillEnvelope.envelope, waybillDetail);
  assert.ok(detailSqlPlan.sql.startsWith("SELECT `id`, `version`, `work_date`, `section_id`, `shift`, `driver_id`"));
  assert.ok(detailSqlPlan.sql.includes("FROM `taxation_waybills`"));
  assert.ok(detailSqlPlan.sql.includes("WHERE `id` = ? AND `section_id` = ? LIMIT 1"));
  assert.equal(detailSqlPlan.sql.includes("SELECT *"), false);
  assert.deepEqual(detailSqlPlan.params, ["waybill-1", "baktay"]);
  assert.equal(detailSqlPlan.maxRows, 1);
}

assert.deepEqual(createServerDetailQueryEnvelope({
  moduleId: "taxation-waybills",
  draft: { id: "", scope: { section_id: "baktay" } },
}).ok, false);

const unscopedDetail = createServerDetailQueryEnvelope({
  moduleId: "taxation-waybills",
  draft: { id: "waybill-1", expectedVersion: 0 },
});
assert.equal(unscopedDetail.ok, false);
if (!unscopedDetail.ok) {
  assert.deepEqual(unscopedDetail.rejection.issues.map((issue) => issue.code), [
    "scope_required",
    "expected_version_invalid",
  ]);
}

console.log("Module detail query plans checks passed");
