import assert from "node:assert/strict";
import {
  getListQueryPlansMissingRequiredFilterColumns,
  getListQueryPlansWithRouteMetadataMismatch,
  getListQueryPlansWithoutRouteAction,
  getModuleListQueryPlan,
  getUnsafeListQueryPlanIdentifiers,
  getWorkspaceModulesRequiringListQueryPlan,
  getWorkspaceModulesWithoutListQueryPlan,
  listModuleListQueryPlans,
  moduleListQueryPlans,
} from "../lib/domain/data-access/moduleListQueryPlans";
import {
  createDatabaseListQuerySqlPlan,
  createDatabaseListSelectSqlPlan,
} from "../lib/server/database/list-query-builder";
import { normalizeServerPageQueryDraft } from "../lib/domain/data-access/queryPolicy";
import { workspaceModuleCatalog } from "../lib/domain/workspaces/moduleCatalog";

const modulesRequiringPlan = getWorkspaceModulesRequiringListQueryPlan(workspaceModuleCatalog);

assert.equal(getWorkspaceModulesWithoutListQueryPlan().length, 0);
assert.equal(moduleListQueryPlans.length, modulesRequiringPlan.length);
assert.equal(getListQueryPlansWithoutRouteAction().length, 0);
assert.equal(getListQueryPlansWithRouteMetadataMismatch().length, 0);
assert.equal(getListQueryPlansMissingRequiredFilterColumns().length, 0);
assert.equal(getUnsafeListQueryPlanIdentifiers().length, 0);

const waybillPlan = getModuleListQueryPlan("taxation-waybills");
assert.ok(waybillPlan);
assert.equal(waybillPlan.resource, "taxation");
assert.equal(waybillPlan.databaseAction, "list-waybills");
assert.equal(waybillPlan.tableName, "taxation_waybills");
assert.ok(waybillPlan.selectColumns.includes("id"));
assert.ok(waybillPlan.selectColumns.includes("version"));
assert.ok(waybillPlan.selectColumns.includes("waybill_number"));
assert.equal(waybillPlan.selectColumns.includes("*"), false);
assert.equal(waybillPlan.filterColumns.date, "work_date");
assert.equal(waybillPlan.filterColumns.driver_id, "driver_id");
assert.equal(waybillPlan.filterColumns.vehicle_id, "vehicle_id");
assert.ok(waybillPlan.searchColumns.includes("waybill_number"));
assert.equal(waybillPlan.sortColumns.date, "work_date");

const waybillSqlPlan = createDatabaseListQuerySqlPlan(normalizeServerPageQueryDraft({
  pageSize: 50,
  filters: {
    date: "2026-05-08",
    section_id: "baktai",
    shift: "day",
    status: "created",
    driver_id: "driver-1",
    vehicle_id: "truck-101",
  },
  search: "101",
  sort: {
    field: "vehicle",
    direction: "asc",
  },
}), {
  filterColumns: waybillPlan.filterColumns,
  searchColumns: waybillPlan.searchColumns,
  sortColumns: waybillPlan.sortColumns,
  defaultSort: waybillPlan.defaultSort,
});

assert.equal(
  waybillSqlPlan.whereSql,
  "WHERE `work_date` = ? AND `section_id` = ? AND `shift` = ? AND `driver_id` = ? AND `vehicle_id` = ? AND `status` = ? AND (`waybill_number` LIKE ? OR `driver_name` LIKE ? OR `vehicle_number` LIKE ?)",
);
assert.equal(waybillSqlPlan.orderBySql, "ORDER BY `vehicle_number` ASC");
assert.deepEqual(waybillSqlPlan.params.slice(-2), [50, 0]);

const waybillSelectSqlPlan = createDatabaseListSelectSqlPlan(normalizeServerPageQueryDraft({
  pageSize: 25,
  filters: {
    date: "2026-05-08",
    section_id: "baktai",
    status: "created",
  },
}), waybillPlan);
assert.ok(waybillSelectSqlPlan.sql.includes("FROM `taxation_waybills`"));
assert.equal(waybillSelectSqlPlan.sql.includes("SELECT *"), false);

assert.deepEqual(listModuleListQueryPlans("fleet").map((plan) => plan.moduleId), [
  "fleet-movements",
  "service-vehicle",
]);

assert.ok(listModuleListQueryPlans().every((plan) => plan.selectColumns.length > 0));
assert.ok(listModuleListQueryPlans().every((plan) => !plan.selectColumns.includes("*")));

assert.equal(getModuleListQueryPlan("ai-on-demand"), undefined);

assert.deepEqual(getListQueryPlansWithRouteMetadataMismatch([
  {
    ...waybillPlan,
    workspaceId: "fleet",
    resource: "fleet",
  },
]).map((issue) => issue.code), [
  "route_metadata_mismatch",
  "route_metadata_mismatch",
]);

console.log("Module list query plans checks passed");
