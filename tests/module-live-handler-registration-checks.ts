import assert from "node:assert/strict";
import { createGuardedLiveModuleListHandler } from "../lib/server/database/module-handler-factories";
import {
  createLiveModuleDatabaseHandlersFromRegistrations,
  createLiveModuleHandlerKey,
  getLiveModuleDatabaseHandlerRegistrationIssues,
  LiveModuleDatabaseHandlerRegistrationError,
  listLiveModuleDatabaseHandlerRegistrations,
  listRegisteredLiveModuleDatabaseHandlerKeys,
  tryHandleLiveModuleDatabaseAction,
  type LiveModuleDatabaseHandlerRegistration,
} from "../lib/server/database/module-live-handlers";

const request = new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { origin: "https://aam-dispatch.kz" },
});
const json = (data: unknown, status = 200) => Response.json(data, { status });
const listWaybillsKey = createLiveModuleHandlerKey("taxation", "list-waybills");

assert.deepEqual(listLiveModuleDatabaseHandlerRegistrations(), []);
assert.deepEqual(getLiveModuleDatabaseHandlerRegistrationIssues(), []);

const registeredListHandler = createGuardedLiveModuleListHandler(({ context, execution }) => {
  const publicResponse = execution.createPublicResponse({
    rows: [{ id: "waybill-1", status: "created" }],
    pageSize: execution.query.pageSize,
    totalCount: 1,
  });
  if (!publicResponse.ok) return context.json(publicResponse.rejection, 500);

  return context.json(publicResponse.response);
});
const registrations: LiveModuleDatabaseHandlerRegistration[] = [{
  resource: "taxation",
  databaseAction: "list-waybills",
  factoryKind: "list",
  implementationPath: "lib/server/database/handlers/taxation/list-waybills.ts",
  handler: registeredListHandler,
}];
const liveKeys = [{
  resource: "taxation",
  databaseAction: "list-waybills",
}];
const handlers = createLiveModuleDatabaseHandlersFromRegistrations(registrations, liveKeys);

assert.deepEqual(listLiveModuleDatabaseHandlerRegistrations(registrations).map((entry) => ({
  resource: entry.resource,
  databaseAction: entry.databaseAction,
  factoryKind: entry.factoryKind,
  implementationPath: entry.implementationPath,
})), [{
  resource: "taxation",
  databaseAction: "list-waybills",
  factoryKind: "list",
  implementationPath: "lib/server/database/handlers/taxation/list-waybills.ts",
}]);
assert.equal(Object.keys(handlers)[0], listWaybillsKey);
assert.deepEqual(listRegisteredLiveModuleDatabaseHandlerKeys(handlers), [{
  resource: "taxation",
  databaseAction: "list-waybills",
}]);
assert.deepEqual(getLiveModuleDatabaseHandlerRegistrationIssues(registrations, liveKeys), []);
assert.deepEqual(getLiveModuleDatabaseHandlerRegistrationIssues(registrations).map((issue) => issue.code), [
  "registration_without_live_key",
]);
assert.deepEqual(getLiveModuleDatabaseHandlerRegistrationIssues([], [{
  resource: "taxation",
  databaseAction: "list-waybills",
}]).map((issue) => issue.code), [
  "live_key_without_registration",
]);

const liveResponse = await tryHandleLiveModuleDatabaseAction({
  resource: "taxation",
  action: "list-waybills",
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
}, request, json, handlers, [{
  resource: "taxation",
  databaseAction: "list-waybills",
}]);
assert.equal(liveResponse?.status, 200);
assert.deepEqual(await liveResponse?.json(), {
  moduleId: "taxation-waybills",
  responseKind: "list",
  executionMode: "server-only",
  pageSize: 25,
  rows: [{ id: "waybill-1", status: "created" }],
  totalCount: 1,
  noClientFullScan: true,
});

const badRegistrations: LiveModuleDatabaseHandlerRegistration[] = [
  {
    ...registrations[0],
    implementationPath: "",
    factoryKind: "unknown" as LiveModuleDatabaseHandlerRegistration["factoryKind"],
  },
  registrations[0],
];
assert.deepEqual(getLiveModuleDatabaseHandlerRegistrationIssues(
  badRegistrations,
  liveKeys,
).map((issue) => issue.code), [
  "implementation_path_required",
  "unknown_factory_kind",
  "duplicate_live_handler_registration",
]);
assert.throws(() => createLiveModuleDatabaseHandlersFromRegistrations(
  badRegistrations,
  liveKeys,
), LiveModuleDatabaseHandlerRegistrationError);

assert.deepEqual(getLiveModuleDatabaseHandlerRegistrationIssues([{
  ...registrations[0],
  handler: (context) => context.json({ ok: true }),
}], liveKeys).map((issue) => issue.code), [
  "handler_factory_guard_required",
]);
assert.deepEqual(getLiveModuleDatabaseHandlerRegistrationIssues([{
  ...registrations[0],
  factoryKind: "detail",
}], liveKeys).map((issue) => issue.code), [
  "handler_factory_kind_mismatch",
]);

console.log("Module live handler registration checks passed");
