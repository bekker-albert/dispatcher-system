import assert from "node:assert/strict";
import {
  createModuleDatabaseIndexMigrationStatements,
  createMysqlAddIndexStatement,
  getDuplicateModuleDatabaseIndexNames,
  getModuleDatabaseIndexDefinitionIssues,
  quoteMysqlIdentifier,
  summarizeModuleDatabaseIndexMigrationPlan,
} from "../lib/domain/data-access/indexMigrationPlan";
import { moduleDatabaseIndexContracts } from "../lib/domain/data-access/indexContracts";

const statements = createModuleDatabaseIndexMigrationStatements();
const expectedStatementCount = moduleDatabaseIndexContracts.reduce(
  (count, contract) => count + contract.indexes.length,
  0,
);

assert.equal(statements.length, expectedStatementCount);
assert.equal(getModuleDatabaseIndexDefinitionIssues().length, 0);
assert.equal(getDuplicateModuleDatabaseIndexNames().length, 0);

const waybillDriverIndex = statements.find((statement) => (
  statement.moduleId === "taxation-waybills"
    && statement.indexName === "taxation_waybills_driver_date_idx"
));

assert.ok(waybillDriverIndex);
assert.equal(waybillDriverIndex.tableName, "taxation_waybills");
assert.equal(
  waybillDriverIndex.statement,
  "ALTER TABLE `taxation_waybills` ADD INDEX `taxation_waybills_driver_date_idx` (`driver_id`, `work_date`)",
);

const fleetStatements = createModuleDatabaseIndexMigrationStatements("fleet");
assert.deepEqual(fleetStatements.map((statement) => statement.moduleId), [
  "fleet-movements",
  "service-vehicle",
]);
assert.ok(fleetStatements.every((statement) => statement.statement.startsWith("ALTER TABLE ")));

assert.equal(quoteMysqlIdentifier("safe_identifier_1"), "`safe_identifier_1`");
assert.throws(() => quoteMysqlIdentifier("unsafe-identifier"), /Unsafe MySQL identifier/);
assert.throws(() => createMysqlAddIndexStatement("safe_table", "safe_idx", []), /must include/);

const summary = summarizeModuleDatabaseIndexMigrationPlan();
assert.equal(summary.moduleCount, moduleDatabaseIndexContracts.length);
assert.equal(summary.statementCount, expectedStatementCount);
assert.equal(summary.definitionIssueCount, 0);
assert.equal(summary.indexNameCollisionCount, 0);

console.log("Index migration plan checks passed");
