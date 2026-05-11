import assert from "node:assert/strict";
import {
  getModuleReadModelSchemaRequirement,
  getModuleReadModelTableMismatchIssues,
  listModuleReadModelSchemaRequirements,
  reviewModuleReadModelSchemaRequirementsSnapshot,
  reviewModuleReadModelSchemaSnapshot,
} from "../lib/domain/data-access/moduleReadModelSchemaReadiness";
import { moduleListQueryPlans } from "../lib/domain/data-access/moduleListQueryPlans";

assert.equal(getModuleReadModelTableMismatchIssues().length, 0);

const requirements = listModuleReadModelSchemaRequirements();
assert.equal(requirements.length, moduleListQueryPlans.length);
assert.ok(requirements.every((requirement) => requirement.requiredColumns.length > 0));
assert.ok(requirements.every((requirement) => !requirement.requiredColumns.includes("*")));

const waybillRequirement = getModuleReadModelSchemaRequirement("taxation-waybills");
assert.ok(waybillRequirement);
assert.equal(waybillRequirement.workspaceId, "taxation");
assert.equal(waybillRequirement.tableName, "taxation_waybills");
assert.equal(waybillRequirement.listAction, "list-waybills");
assert.equal(waybillRequirement.detailAction, "get-waybill");
assert.deepEqual(
  [
    "id",
    "version",
    "work_date",
    "section_id",
    "shift",
    "waybill_number",
    "driver_id",
    "driver_name",
    "vehicle_id",
    "vehicle_number",
    "status",
    "updated_at",
    "updated_by",
  ].filter((column) => waybillRequirement.requiredColumns.includes(column)),
  [
    "id",
    "version",
    "work_date",
    "section_id",
    "shift",
    "waybill_number",
    "driver_id",
    "driver_name",
    "vehicle_id",
    "vehicle_number",
    "status",
    "updated_at",
    "updated_by",
  ],
);

const fuelPeriodRequirement = getModuleReadModelSchemaRequirement("taxation-fuel-periods");
assert.ok(fuelPeriodRequirement);

assert.deepEqual(reviewModuleReadModelSchemaSnapshot({
  tables: [
    {
      tableName: "taxation_waybills",
      columns: waybillRequirement.requiredColumns,
    },
    {
      tableName: "fuel_accounting_periods",
      columns: fuelPeriodRequirement.requiredColumns,
    },
  ],
}, "taxation"), []);

assert.deepEqual(reviewModuleReadModelSchemaRequirementsSnapshot({
  tables: [{
    tableName: "taxation_waybills",
    columns: waybillRequirement.requiredColumns,
  }],
}, [waybillRequirement]), []);

assert.deepEqual(
  reviewModuleReadModelSchemaSnapshot({ tables: [] }, "taxation")
    .filter((issue) => issue.moduleId === "taxation-waybills")
    .map((issue) => issue.code),
  ["missing_required_table"],
);

assert.deepEqual(
  reviewModuleReadModelSchemaSnapshot({
    tables: [{
      tableName: "taxation_waybills",
      columns: waybillRequirement.requiredColumns.filter((column) => column !== "version"),
    }],
  }, "taxation")
    .filter((issue) => issue.moduleId === "taxation-waybills")
    .map((issue) => `${issue.code}:${issue.column}`),
  ["missing_required_column:version"],
);

const smtsRequirements = listModuleReadModelSchemaRequirements("smts-gps");
assert.deepEqual(smtsRequirements.map((requirement) => requirement.moduleId), [
  "smts-vehicle-cards",
  "smts-fuel-drains",
]);

console.log("Module read-model schema readiness checks passed");
