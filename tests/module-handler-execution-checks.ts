import assert from "node:assert/strict";
import {
  createLiveModuleDetailExecutionContext,
  createLiveModuleListExecutionContext,
} from "../lib/server/database/module-handler-execution";
import type { LiveModuleDatabaseHandlerContext } from "../lib/server/database/module-live-handlers";
import { isDatabasePayloadError } from "../lib/server/database/validation";

const request = new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { origin: "https://aam-dispatch.kz" },
});
const json = (data: unknown, status = 200) => Response.json(data, { status });

function createContext(
  input: Partial<LiveModuleDatabaseHandlerContext>,
): LiveModuleDatabaseHandlerContext {
  return {
    resource: "taxation",
    action: "list-waybills",
    payload: {},
    request,
    json,
    moduleId: "taxation-waybills",
    workspaceId: "taxation",
    ...input,
  };
}

const listContext = createLiveModuleListExecutionContext(createContext({
  payload: {
    query: {
      pageSize: 25,
      filters: {
        date: "2026-05-09",
        section_id: "baktai",
        status: "draft",
      },
      sort: { field: "date", direction: "desc" },
    },
  },
}));
assert.equal(listContext.moduleId, "taxation-waybills");
assert.equal(listContext.workspaceId, "taxation");
assert.equal(listContext.plan.databaseAction, "list-waybills");
assert.equal(listContext.query.pageSize, 25);
assert.equal(listContext.maxRows, 25);
assert.equal(listContext.requiresServerSideFilters, true);
assert.equal(listContext.noClientFullScan, true);
const listSqlPlan = listContext.createSqlPlan();
assert.ok(listSqlPlan.sql.includes("FROM `taxation_waybills`"));
assert.equal(listSqlPlan.sql.includes("SELECT *"), false);
assert.deepEqual(listSqlPlan.params, ["2026-05-09", "baktai", "draft", 25, 0]);
const listPublicResponse = listContext.createPublicResponse({
  rows: [{ id: "waybill-1", status: "created" }],
  pageSize: listContext.query.pageSize,
  totalCount: 1,
});
assert.equal(listPublicResponse.ok, true);
if (!listPublicResponse.ok) {
  throw new Error("Expected valid list public response.");
}
assert.deepEqual(listPublicResponse.response, {
  moduleId: "taxation-waybills",
  responseKind: "list",
  executionMode: "server-only",
  pageSize: 25,
  rows: [{ id: "waybill-1", status: "created" }],
  totalCount: 1,
  noClientFullScan: true,
});

const rejectedListPublicResponse = listContext.createPublicResponse({
  rows: Array.from({ length: 26 }, (_, index) => ({ id: `waybill-${index}` })),
  pageSize: listContext.query.pageSize,
});
assert.equal(rejectedListPublicResponse.ok, false);

assert.throws(() => createLiveModuleListExecutionContext(createContext({
  payload: {
    query: {
      pageSize: 25,
      filters: { date: "2026-05-09", section_id: "baktai" },
    },
  },
})), isDatabasePayloadError);

assert.throws(() => createLiveModuleListExecutionContext(createContext({
  action: "get-waybill",
})), isDatabasePayloadError);

const detailContext = createLiveModuleDetailExecutionContext(createContext({
  action: "get-waybill",
  payload: {
    id: "waybill-1",
    scope: { section_id: "baktai" },
    expectedVersion: 3,
  },
}));
assert.equal(detailContext.moduleId, "taxation-waybills");
assert.equal(detailContext.workspaceId, "taxation");
assert.equal(detailContext.plan.databaseAction, "get-waybill");
assert.equal(detailContext.id, "waybill-1");
assert.equal(detailContext.maxRows, 1);
assert.equal(detailContext.requiresId, true);
assert.equal(detailContext.requiresScopeFilter, true);
assert.equal(detailContext.returnsVersion, true);
assert.equal(detailContext.expectedVersion, 3);
const detailSqlPlan = detailContext.createSqlPlan();
assert.ok(detailSqlPlan.sql.includes("FROM `taxation_waybills`"));
assert.ok(detailSqlPlan.sql.includes("WHERE `id` = ? AND `section_id` = ? LIMIT 1"));
assert.equal(detailSqlPlan.sql.includes("SELECT *"), false);
assert.deepEqual(detailSqlPlan.params, ["waybill-1", "baktai"]);
const detailPublicResponse = detailContext.createPublicResponse({
  row: { id: "waybill-1", version: 3, status: "created" },
  rowCount: 1,
});
assert.equal(detailPublicResponse.ok, true);
if (!detailPublicResponse.ok) {
  throw new Error("Expected valid detail public response.");
}
assert.deepEqual(detailPublicResponse.response, {
  moduleId: "taxation-waybills",
  responseKind: "detail",
  executionMode: "server-only",
  row: { id: "waybill-1", version: 3, status: "created" },
  rowCount: 1,
  maxRows: 1,
  returnsVersion: true,
  noClientFullScan: true,
});

const rejectedDetailPublicResponse = detailContext.createPublicResponse({
  row: { id: "waybill-1", status: "created" },
  rowCount: 1,
});
assert.equal(rejectedDetailPublicResponse.ok, false);

const entityIdDetailContext = createLiveModuleDetailExecutionContext(createContext({
  action: "get-waybill",
  payload: {
    entity: { id: 42 },
    section_id: "baktai",
  },
}));
assert.equal(entityIdDetailContext.id, "42");

assert.throws(() => createLiveModuleDetailExecutionContext(createContext({
  action: "get-waybill",
  payload: { scope: { section_id: "baktai" } },
})), isDatabasePayloadError);

assert.throws(() => createLiveModuleDetailExecutionContext(createContext({
  action: "get-waybill",
  payload: { id: "waybill-1" },
})), isDatabasePayloadError);

assert.throws(() => createLiveModuleDetailExecutionContext(createContext({
  action: "list-waybills",
  payload: { id: "waybill-1", scope: { section_id: "baktai" } },
})), isDatabasePayloadError);

console.log("Module handler execution checks passed");
