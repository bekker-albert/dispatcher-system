import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createLiveModuleHandlerKey,
  listRegisteredLiveModuleDatabaseHandlerKeys,
  liveModuleHandlerMissingCode,
  tryHandleLiveModuleDatabaseAction,
  type LiveModuleDatabaseHandlers,
} from "../lib/server/database/module-live-handlers";

const testDir = dirname(fileURLToPath(import.meta.url));
const databaseRouterSource = readFileSync(resolve(testDir, "../lib/server/database/router.ts"), "utf8");

const request = new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { origin: "https://aam-dispatch.kz" },
});
const json = (data: unknown, status = 200) => Response.json(data, { status });
const waybillListKey = createLiveModuleHandlerKey("taxation", "list-waybills");

assert.match(databaseRouterSource, /tryHandleLiveModuleDatabaseAction\(body, request, jsonForRequest\)/);
assert.ok(
  databaseRouterSource.indexOf("tryHandleLiveModuleDatabaseAction(body, request, jsonForRequest)")
  < databaseRouterSource.indexOf("createPlannedModuleDatabaseActionResponse(body, request)"),
);
assert.deepEqual(listRegisteredLiveModuleDatabaseHandlerKeys(), []);
assert.deepEqual(listRegisteredLiveModuleDatabaseHandlerKeys({
  [waybillListKey]: () => undefined,
}), [{
  resource: "taxation",
  databaseAction: "list-waybills",
}]);

const plannedOnlyResponse = await tryHandleLiveModuleDatabaseAction({
  resource: "taxation",
  action: "list-waybills",
}, request, json);
assert.equal(plannedOnlyResponse, undefined);

const missingHandlerResponse = await tryHandleLiveModuleDatabaseAction({
  resource: "taxation",
  action: "list-waybills",
}, request, json, {}, [{
  resource: "taxation",
  databaseAction: "list-waybills",
}]);
assert.ok(missingHandlerResponse);
assert.equal(missingHandlerResponse.status, 501);
const missingHandlerBody = await missingHandlerResponse.json();
assert.equal(missingHandlerBody.code, liveModuleHandlerMissingCode);
assert.equal(missingHandlerBody.moduleId, "taxation-waybills");
assert.equal(missingHandlerBody.workspaceId, "taxation");

const handlers: LiveModuleDatabaseHandlers = {
  [waybillListKey]: ({ moduleId, workspaceId, payload, json: respond }) => respond({
    ok: true,
    moduleId,
    workspaceId,
    payload,
  }),
};
const liveResponse = await tryHandleLiveModuleDatabaseAction({
  resource: "taxation",
  action: "list-waybills",
  payload: { pageSize: 25 },
}, request, json, handlers, [{
  resource: "taxation",
  databaseAction: "list-waybills",
}]);
assert.ok(liveResponse);
assert.equal(liveResponse.status, 200);
assert.deepEqual(await liveResponse.json(), {
  ok: true,
  moduleId: "taxation-waybills",
  workspaceId: "taxation",
  payload: { pageSize: 25 },
});

console.log("Module live handler dispatch checks passed");
