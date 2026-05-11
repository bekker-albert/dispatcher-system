import assert from "node:assert/strict";
import {
  createLiveModuleDetailExecutionContext,
  createLiveModuleListExecutionContext,
} from "../lib/server/database/module-handler-execution";
import type { LiveModuleDatabaseHandlerContext } from "../lib/server/database/module-live-handlers";
import {
  createLiveReadModelJsonResponse,
  executeLiveModuleDetailReadModel,
  executeLiveModuleDetailReadModelWithRowsClient,
  executeLiveModuleListReadModel,
  executeLiveModuleListReadModelWithRowsClient,
  type DatabaseReadModelRowsRequest,
} from "../lib/server/database/read-model-executor";

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

const listExecution = createLiveModuleListExecutionContext(createContext({
  payload: {
    query: {
      pageSize: 25,
      filters: {
        date: "2026-05-09",
        section_id: "baktai",
        status: "created",
      },
    },
  },
}));
let listSqlSeen = "";
const listResult = await executeLiveModuleListReadModel(listExecution, (sqlPlan) => {
  listSqlSeen = sqlPlan.sql;
  assert.equal(sqlPlan.sql.includes("SELECT *"), false);
  assert.ok(sqlPlan.sql.includes("FROM `taxation_waybills`"));
  assert.ok(sqlPlan.sql.includes("LIMIT ? OFFSET ?"));
  assert.deepEqual(sqlPlan.params, ["2026-05-09", "baktai", "created", 25, 0]);

  return {
    rows: [{ id: "waybill-1", status: "created" }],
    pageSize: 25,
    totalCount: 1,
  };
});

assert.ok(listSqlSeen);
assert.equal(listResult.ok, true);
if (!listResult.ok) {
  throw new Error("Expected live list read-model executor to return a public response.");
}
assert.deepEqual(listResult.response, {
  moduleId: "taxation-waybills",
  responseKind: "list",
  executionMode: "server-only",
  pageSize: 25,
  rows: [{ id: "waybill-1", status: "created" }],
  totalCount: 1,
  noClientFullScan: true,
});

const rejectedListResult = await executeLiveModuleListReadModel(listExecution, () => ({
  rows: Array.from({ length: 26 }, (_, index) => ({ id: `waybill-${index}` })),
  pageSize: 25,
}));
assert.equal(rejectedListResult.ok, false);

let listRowsRequestSeen: DatabaseReadModelRowsRequest | undefined;
const listRowsClientResult = await executeLiveModuleListReadModelWithRowsClient(
  listExecution,
  {
    queryRows: <Row extends Record<string, unknown>>(request: DatabaseReadModelRowsRequest): Row[] => {
      listRowsRequestSeen = request;
      assert.equal(request.queryKind, "list");
      assert.equal(request.moduleId, "taxation-waybills");
      assert.equal(request.workspaceId, "taxation");
      assert.equal(request.resource, "taxation");
      assert.equal(request.action, "list-waybills");
      assert.equal(request.maxRows, 25);
      assert.equal(request.pageSize, 25);
      assert.equal(request.offset, 0);
      assert.ok(request.sql.includes("FROM `taxation_waybills`"));
      assert.deepEqual(request.params, ["2026-05-09", "baktai", "created", 25, 0]);

      return [{ id: "waybill-rows-client", status: "created" }] as unknown as Row[];
    },
  },
  { totalCount: 1 },
);

assert.ok(listRowsRequestSeen);
assert.equal(listRowsClientResult.ok, true);
if (!listRowsClientResult.ok) {
  throw new Error("Expected rows client list executor to return a public response.");
}
assert.deepEqual(listRowsClientResult.response.rows, [
  { id: "waybill-rows-client", status: "created" },
]);
assert.equal(listRowsClientResult.response.totalCount, 1);
const listRowsClientResponse = createLiveReadModelJsonResponse(listRowsClientResult, json);
assert.equal(listRowsClientResponse.status, 200);

const detailExecution = createLiveModuleDetailExecutionContext(createContext({
  action: "get-waybill",
  payload: {
    id: "waybill-1",
    scope: { section_id: "baktai" },
    expectedVersion: 3,
  },
}));
let detailSqlSeen = "";
const detailResult = await executeLiveModuleDetailReadModel(detailExecution, (sqlPlan) => {
  detailSqlSeen = sqlPlan.sql;
  assert.equal(sqlPlan.sql.includes("SELECT *"), false);
  assert.ok(sqlPlan.sql.includes("FROM `taxation_waybills`"));
  assert.ok(sqlPlan.sql.includes("WHERE `id` = ? AND `section_id` = ? LIMIT 1"));
  assert.deepEqual(sqlPlan.params, ["waybill-1", "baktai"]);

  return {
    row: { id: "waybill-1", version: 3, status: "created" },
    rowCount: 1,
  };
});

assert.ok(detailSqlSeen);
assert.equal(detailResult.ok, true);
if (!detailResult.ok) {
  throw new Error("Expected live detail read-model executor to return a public response.");
}
assert.deepEqual(detailResult.response, {
  moduleId: "taxation-waybills",
  responseKind: "detail",
  executionMode: "server-only",
  row: { id: "waybill-1", version: 3, status: "created" },
  rowCount: 1,
  maxRows: 1,
  returnsVersion: true,
  noClientFullScan: true,
});

const rejectedDetailResult = await executeLiveModuleDetailReadModel(detailExecution, () => ({
  row: { id: "waybill-1", status: "created" },
  rowCount: 1,
}));
assert.equal(rejectedDetailResult.ok, false);
const rejectedDetailResponse = createLiveReadModelJsonResponse(rejectedDetailResult, json);
assert.equal(rejectedDetailResponse.status, 422);
const rejectedDetailJson = await rejectedDetailResponse.json() as { code?: string };
assert.equal(rejectedDetailJson.code, "read_model_detail_response_invalid");

let detailRowsRequestSeen: DatabaseReadModelRowsRequest | undefined;
const detailRowsClientResult = await executeLiveModuleDetailReadModelWithRowsClient(
  detailExecution,
  {
    queryRows: <Row extends Record<string, unknown>>(request: DatabaseReadModelRowsRequest): Row[] => {
      detailRowsRequestSeen = request;
      assert.equal(request.queryKind, "detail");
      assert.equal(request.moduleId, "taxation-waybills");
      assert.equal(request.workspaceId, "taxation");
      assert.equal(request.resource, "taxation");
      assert.equal(request.action, "get-waybill");
      assert.equal(request.maxRows, 1);
      assert.equal(request.pageSize, undefined);
      assert.equal(request.offset, undefined);
      assert.ok(request.sql.includes("WHERE `id` = ? AND `section_id` = ? LIMIT 1"));
      assert.deepEqual(request.params, ["waybill-1", "baktai"]);

      return [{ id: "waybill-1", version: 3, status: "created" }] as unknown as Row[];
    },
  },
);

assert.ok(detailRowsRequestSeen);
assert.equal(detailRowsClientResult.ok, true);
if (!detailRowsClientResult.ok) {
  throw new Error("Expected rows client detail executor to return a public response.");
}
assert.deepEqual(detailRowsClientResult.response.row, {
  id: "waybill-1",
  version: 3,
  status: "created",
});

console.log("Module read-model executor checks passed");
