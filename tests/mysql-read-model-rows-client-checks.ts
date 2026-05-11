import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertMysqlReadModelRowsRequest,
  getMysqlReadModelRowsRequestIssues,
  mysqlReadModelRowsClient,
} from "../lib/server/mysql/read-model-rows";
import type { DatabaseReadModelRowsRequest } from "../lib/server/database/read-model-executor";

const source = readFileSync(resolve("lib/server/mysql/read-model-rows.ts"), "utf8");

assert.match(source, /from "\.\/pool"/);
assert.match(source, /dbRows/);
assert.match(source, /DatabaseReadModelRowsClient/);
assert.match(source, /queryMysqlReadModelRows/);
assert.match(source, /mysqlReadModelRowsClient/);
assert.match(source, /SELECT\\b/);
assert.match(source, /SELECT\\s\+\\\*/);
assert.match(source, /\\bLIMIT\\b/);
assert.match(source, /multi-statement SQL/);
assert.match(source, /ALTER\|CREATE\|DELETE\|DROP\|INSERT\|REPLACE\|TRUNCATE\|UPDATE/);
assert.doesNotMatch(source, /createPool/);
assert.doesNotMatch(source, /getMysqlPool\(\)\.query/);

const validListRequest: DatabaseReadModelRowsRequest = {
  queryKind: "list",
  moduleId: "taxation-waybills",
  workspaceId: "taxation",
  resource: "taxation",
  action: "list-waybills",
  sql: "SELECT `id`, `status` FROM `taxation_waybills` WHERE `section_id` = ? LIMIT ? OFFSET ?",
  params: ["baktai", 25, 0],
  maxRows: 25,
  pageSize: 25,
  offset: 0,
};

assert.deepEqual(getMysqlReadModelRowsRequestIssues(validListRequest), []);
assert.doesNotThrow(() => assertMysqlReadModelRowsRequest(validListRequest));
assert.equal(typeof mysqlReadModelRowsClient.queryRows, "function");

assert.deepEqual(
  getMysqlReadModelRowsRequestIssues({
    ...validListRequest,
    sql: "SELECT * FROM `taxation_waybills` LIMIT ? OFFSET ?",
  }).map((issue) => issue.code),
  ["select_star_forbidden"],
);

assert.deepEqual(
  getMysqlReadModelRowsRequestIssues({
    ...validListRequest,
    sql: "UPDATE `taxation_waybills` SET `status` = ? WHERE `id` = ?",
  }).map((issue) => issue.code),
  ["write_statement_forbidden", "missing_limit"],
);

assert.deepEqual(
  getMysqlReadModelRowsRequestIssues({
    ...validListRequest,
    sql: "SELECT `id` FROM `taxation_waybills`; SELECT `id` FROM `taxation_waybills` LIMIT ?",
  }).map((issue) => issue.code),
  ["multi_statement_sql"],
);

assert.deepEqual(
  getMysqlReadModelRowsRequestIssues({
    ...validListRequest,
    maxRows: 500,
  }).map((issue) => issue.code),
  ["list_max_rows_invalid"],
);

assert.deepEqual(
  getMysqlReadModelRowsRequestIssues({
    ...validListRequest,
    queryKind: "detail",
    sql: "SELECT `id`, `version` FROM `taxation_waybills` WHERE `id` = ? LIMIT 1",
    params: ["waybill-1"],
    maxRows: 25,
    pageSize: undefined,
    offset: undefined,
  }).map((issue) => issue.code),
  ["detail_max_rows_must_be_one"],
);

console.log("MySQL read-model rows client checks passed");
