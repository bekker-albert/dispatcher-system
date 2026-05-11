import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  loadMysqlReadModelSchemaSnapshot,
  reviewMysqlReadModelSchemaReadiness,
  reviewMysqlReadModelSchemaReadinessForModule,
} from "../lib/server/mysql/read-model-schema-readiness";

const source = readFileSync(resolve("lib/server/mysql/read-model-schema-readiness.ts"), "utf8");

assert.match(source, /information_schema\.COLUMNS/);
assert.match(source, /TABLE_SCHEMA = DATABASE\(\)/);
assert.match(source, /TABLE_NAME IN/);
assert.match(source, /ORDER BY TABLE_NAME ASC, ORDINAL_POSITION ASC/);
assert.match(source, /dbRows/);
assert.match(source, /listModuleReadModelSchemaRequirements/);
assert.match(source, /reviewModuleReadModelSchemaSnapshot/);
assert.match(source, /reviewMysqlReadModelSchemaReadinessForModule/);
assert.match(source, /getModuleReadModelSchemaRequirement/);
assert.match(source, /reviewModuleReadModelSchemaRequirementsSnapshot/);
assert.doesNotMatch(source, /createPool/);
assert.doesNotMatch(source, /getMysqlPool\(\)\.query/);

assert.equal(typeof loadMysqlReadModelSchemaSnapshot, "function");
assert.equal(typeof reviewMysqlReadModelSchemaReadiness, "function");
assert.equal(typeof reviewMysqlReadModelSchemaReadinessForModule, "function");

console.log("MySQL read-model schema readiness checks passed");
