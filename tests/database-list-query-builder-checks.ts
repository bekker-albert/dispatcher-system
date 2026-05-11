import assert from "node:assert/strict";
import { normalizeServerPageQueryDraft } from "../lib/domain/data-access/queryPolicy";
import {
  createDatabaseListQuerySqlPlan,
  createDatabaseListSelectSqlPlan,
} from "../lib/server/database/list-query-builder";
import { getModuleListQueryPlan } from "../lib/domain/data-access/moduleListQueryPlans";

const query = normalizeServerPageQueryDraft({
  pageSize: 50,
  offset: 25,
  filters: {
    date_from: "2026-05-01",
    date_to: "2026-05-15",
    section_id: "baktai",
    shift: "day",
    status: "accepted",
  },
  sort: {
    field: "date",
    direction: "desc",
  },
  search: "EX-1200",
});

const plan = createDatabaseListQuerySqlPlan(query, {
  filterColumns: {
    date: "reports.report_date",
    section_id: "reports.section_id",
    shift: "reports.shift",
    status: "reports.status",
  },
  searchColumns: ["reports.excavator_name", "reports.vehicle_number"],
  sortColumns: {
    date: "reports.report_date",
    status: "reports.status",
  },
  defaultSort: {
    field: "date",
    direction: "desc",
  },
});

assert.equal(
  plan.whereSql,
  "WHERE `reports`.`report_date` BETWEEN ? AND ? AND `reports`.`section_id` = ? AND `reports`.`shift` = ? AND `reports`.`status` = ? AND (`reports`.`excavator_name` LIKE ? OR `reports`.`vehicle_number` LIKE ?)",
);
assert.equal(plan.orderBySql, "ORDER BY `reports`.`report_date` DESC");
assert.equal(plan.limitSql, "LIMIT ? OFFSET ?");
assert.deepEqual(plan.params, [
  "2026-05-01",
  "2026-05-15",
  "baktai",
  "day",
  "accepted",
  "%EX-1200%",
  "%EX-1200%",
  50,
  25,
]);

const exactDatePlan = createDatabaseListQuerySqlPlan(normalizeServerPageQueryDraft({
  pageSize: 100,
  filters: {
    date: "2026-05-08",
    vehicle_id: "truck-101",
  },
}), {
  filterColumns: {
    date: "work_date",
    vehicle_id: "vehicle_id",
  },
  sortColumns: {
    vehicle: "vehicle_id",
  },
  defaultSort: {
    field: "vehicle",
    direction: "asc",
  },
});

assert.equal(exactDatePlan.whereSql, "WHERE `work_date` = ? AND `vehicle_id` = ?");
assert.equal(exactDatePlan.orderBySql, "ORDER BY `vehicle_id` ASC");
assert.deepEqual(exactDatePlan.params, ["2026-05-08", "truck-101", 100, 0]);

const waybillPlan = getModuleListQueryPlan("taxation-waybills");
assert.ok(waybillPlan);
const selectPlan = createDatabaseListSelectSqlPlan(normalizeServerPageQueryDraft({
  pageSize: 25,
  filters: {
    date: "2026-05-09",
    section_id: "baktai",
    status: "created",
  },
}), waybillPlan);

assert.ok(selectPlan.sql.startsWith("SELECT `id`, `version`, `work_date`, `section_id`, `shift`, `waybill_number`"));
assert.ok(selectPlan.sql.includes("FROM `taxation_waybills`"));
assert.ok(selectPlan.sql.includes("WHERE `work_date` = ? AND `section_id` = ? AND `status` = ?"));
assert.ok(selectPlan.sql.includes("ORDER BY `work_date` DESC LIMIT ? OFFSET ?"));
assert.equal(selectPlan.sql.includes("SELECT *"), false);
assert.deepEqual(selectPlan.params, ["2026-05-09", "baktai", "created", 25, 0]);

assert.throws(() => createDatabaseListQuerySqlPlan(query, {
  filterColumns: {
    section_id: "reports.section-id",
  },
}), /Unsafe MySQL identifier/);

console.log("Database list query builder checks passed");
