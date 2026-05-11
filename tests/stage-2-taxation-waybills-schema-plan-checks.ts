import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getModuleReadModelSchemaRequirement } from "../lib/domain/data-access/moduleReadModelSchemaReadiness";
import { createModuleDatabaseIndexMigrationStatements } from "../lib/domain/data-access/indexMigrationPlan";

const testDir = dirname(fileURLToPath(import.meta.url));
const schemaPlanPath = resolve(testDir, "..", "docs", "STAGE_2_TAXATION_WAYBILLS_SCHEMA_PLAN.md");

assert.equal(existsSync(schemaPlanPath), true);

const schemaPlan = readFileSync(schemaPlanPath, "utf8");
const requirement = getModuleReadModelSchemaRequirement("taxation-waybills");
assert.ok(requirement);

assert.match(schemaPlan, /Stage 2 Taxation Waybills Schema Plan/);
assert.match(schemaPlan, /feature\/dispatch-service-architecture/);
assert.match(schemaPlan, /not an executed migration/);
assert.match(schemaPlan, /not a live-handler\s+activation/);
assert.match(schemaPlan, /not a new database/);
assert.match(schemaPlan, /\/api\/database/);
assert.match(schemaPlan, /`taxation-waybills`/);
assert.match(schemaPlan, /`taxation_waybills`/);
assert.match(schemaPlan, /`list-waybills`/);
assert.match(schemaPlan, /`get-waybill`/);
assert.match(schemaPlan, /planned_module_database_action/);
assert.match(schemaPlan, /planned-only/);

for (const column of requirement.requiredColumns) {
  assert.ok(schemaPlan.includes(`\`${column}\``), `schema plan must include ${column}.`);
}

assert.match(schemaPlan, /CREATE TABLE `taxation_waybills`/);
assert.match(schemaPlan, /PRIMARY KEY \(`id`\)/);
assert.match(schemaPlan, /ENGINE=InnoDB DEFAULT CHARSET=utf8mb4/);
assert.match(schemaPlan, /`version` int unsigned NOT NULL DEFAULT 1/);
assert.match(schemaPlan, /`updated_at` datetime\(3\) NOT NULL/);
assert.doesNotMatch(schemaPlan, /CREATE DATABASE|USE `|FOREIGN KEY|TRIGGER|PROCEDURE/);

const waybillIndexStatements = createModuleDatabaseIndexMigrationStatements()
  .filter((statement) => statement.moduleId === "taxation-waybills");
assert.equal(waybillIndexStatements.length, 3);

for (const indexStatement of waybillIndexStatements) {
  assert.match(schemaPlan, new RegExp(escapeRegExp(indexStatement.statement)));
}

assert.match(schemaPlan, /npm run check:read-model-schema -- --module taxation-waybills/);
assert.match(schemaPlan, /npm run review:live-handler -- --resource taxation --action list-waybills/);
assert.match(schemaPlan, /live registry\s+must stay empty/);
assert.match(schemaPlan, /another backend process/);
assert.match(schemaPlan, /another database/);
assert.match(schemaPlan, /full table scan/);
assert.match(schemaPlan, /useAppStateBundle/);
assert.match(schemaPlan, /AppRoot/);

console.log("Stage 2 taxation waybills schema plan checks passed");

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
