import assert from "node:assert/strict";
import {
  getIndexContractCoveredFilters,
  getIndexContractsMissingRequiredFilters,
  getModuleDatabaseIndexContract,
  getWorkspaceModulesWithoutIndexContract,
  listModuleDatabaseIndexContracts,
  moduleDatabaseIndexContracts,
} from "../lib/domain/data-access/indexContracts";
import { getWorkspaceModulesRequiringQueryPolicy } from "../lib/domain/data-access/workspaceQueryPolicies";

const modulesRequiringQueryPolicy = getWorkspaceModulesRequiringQueryPolicy();

assert.equal(getWorkspaceModulesWithoutIndexContract().length, 0);
assert.equal(getIndexContractsMissingRequiredFilters().length, 0);
assert.equal(moduleDatabaseIndexContracts.length, modulesRequiringQueryPolicy.length);

const waybillIndexes = getModuleDatabaseIndexContract("taxation-waybills");
assert.ok(waybillIndexes);
assert.equal(waybillIndexes.primaryEntity, "taxation_waybills");
assert.deepEqual(getIndexContractCoveredFilters("taxation-waybills"), [
  "date",
  "section_id",
  "shift",
  "status",
  "driver_id",
  "vehicle_id",
]);
assert.ok(waybillIndexes.indexes.some((index) => index.fields.includes("driver_id")));
assert.ok(waybillIndexes.indexes.some((index) => index.fields.includes("vehicle_id")));

const fuelPeriodIndexes = getModuleDatabaseIndexContract("taxation-fuel-periods");
assert.ok(fuelPeriodIndexes);
assert.ok(fuelPeriodIndexes.indexes.some((index) => (
  index.fields.includes("contractor_id") && index.fields.includes("period_id")
)));

const smtsDrainsIndexes = getModuleDatabaseIndexContract("smts-fuel-drains");
assert.ok(smtsDrainsIndexes);
assert.deepEqual(smtsDrainsIndexes.indexes[0]?.coversFilters, [
  "date",
  "section_id",
  "vehicle_id",
  "status",
]);

assert.deepEqual(listModuleDatabaseIndexContracts("fleet").map((contract) => contract.moduleId), [
  "fleet-movements",
  "service-vehicle",
]);

assert.equal(getModuleDatabaseIndexContract("ai-on-demand"), undefined);

console.log("Index contracts checks passed");
