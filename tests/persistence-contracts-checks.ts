import assert from "node:assert/strict";
import {
  getContractsWithUnsupportedIndexes,
  getModulePersistenceContract,
  getPatchContractsWithoutVersioning,
  getWorkspaceModulesWithoutPersistenceContract,
  listModulePersistenceContracts,
  modulePersistenceContracts,
} from "../lib/domain/data-access/persistenceContracts";
import { workspaceModuleCatalog } from "../lib/domain/workspaces/moduleCatalog";

assert.equal(getWorkspaceModulesWithoutPersistenceContract().length, 0);
assert.equal(modulePersistenceContracts.length, workspaceModuleCatalog.length);
assert.equal(getPatchContractsWithoutVersioning().length, 0);
assert.equal(getContractsWithUnsupportedIndexes().length, 0);

const miningShiftReports = getModulePersistenceContract("mining-shift-reports");
assert.ok(miningShiftReports);
assert.equal(miningShiftReports.writeMode, "workflow-patch");
assert.equal(miningShiftReports.versioned, true);
assert.equal(miningShiftReports.patchOnly, true);
assert.equal(miningShiftReports.writesChangeHistory, true);
assert.ok(miningShiftReports.primaryEntities.includes("mining_shift_report_lines"));
assert.ok(miningShiftReports.requiredIndexes.includes("date"));
assert.ok(miningShiftReports.requiredIndexes.includes("section_id"));

const fuelPeriods = getModulePersistenceContract("taxation-fuel-periods");
assert.ok(fuelPeriods);
assert.ok(fuelPeriods.primaryEntities.includes("supplier_fuel_invoices"));
assert.ok(fuelPeriods.primaryEntities.includes("contractor_fuel_debts"));
assert.ok(fuelPeriods.requiredIndexes.includes("period_id"));
assert.ok(fuelPeriods.requiredIndexes.includes("contractor_id"));

const smtsCards = getModulePersistenceContract("smts-vehicle-cards");
assert.ok(smtsCards);
assert.ok(smtsCards.historyEntities?.includes("smts_equipment_events"));
assert.ok(smtsCards.primaryEntities.includes("smts_terminals"));
assert.ok(smtsCards.primaryEntities.includes("smts_sim_cards"));

const preparedReports = getModulePersistenceContract("prepared-reports");
assert.ok(preparedReports);
assert.equal(preparedReports.writeMode, "queued-export");
assert.equal(preparedReports.aggregateOnly, true);
assert.equal(preparedReports.exportOnDemand, true);
assert.equal(preparedReports.patchOnly, false);
assert.equal(preparedReports.writesChangeHistory, false);

const aiOnDemand = getModulePersistenceContract("ai-on-demand");
assert.ok(aiOnDemand);
assert.equal(aiOnDemand.writeMode, "on-demand");
assert.equal(aiOnDemand.versioned, false);
assert.equal(aiOnDemand.notes.includes("continuous background analysis"), true);

assert.deepEqual(listModulePersistenceContracts("taxation").map((contract) => contract.moduleId), [
  "taxation-waybills",
  "taxation-fuel-periods",
]);

console.log("Persistence contracts checks passed");
