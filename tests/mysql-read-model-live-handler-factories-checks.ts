import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getGuardedLiveModuleHandlerFactoryKind } from "../lib/server/database/module-handler-factories";
import {
  createMysqlLiveModuleDetailReadModelHandler,
  createMysqlLiveModuleListReadModelHandler,
} from "../lib/server/database/mysql-read-model-handlers";

const source = readFileSync(resolve("lib/server/database/mysql-read-model-handlers.ts"), "utf8");

assert.match(source, /mysqlReadModelRowsClient/);
assert.match(source, /createGuardedLiveModuleListHandler/);
assert.match(source, /createGuardedLiveModuleDetailHandler/);
assert.match(source, /executeLiveModuleListReadModelWithRowsClient/);
assert.match(source, /executeLiveModuleDetailReadModelWithRowsClient/);
assert.match(source, /createLiveReadModelJsonResponse/);
assert.doesNotMatch(source, /createLiveModuleDatabaseHandlersFromRegistrations/);
assert.doesNotMatch(source, /listConfiguredLiveModuleHandlerKeys/);

assert.equal(
  getGuardedLiveModuleHandlerFactoryKind(createMysqlLiveModuleListReadModelHandler()),
  "list",
);
assert.equal(
  getGuardedLiveModuleHandlerFactoryKind(createMysqlLiveModuleDetailReadModelHandler()),
  "detail",
);

console.log("MySQL read-model live handler factories checks passed");
