import assert from "node:assert/strict";
import {
  createDatabasePostHandler,
  createDatabaseErrorResponse,
  handleDatabaseGet,
  handleDatabaseOptions,
  handleDatabasePost,
} from "../lib/server/database/router";
import {
  authorizeDatabaseRequest,
  getDatabaseAccessRequirement,
} from "../lib/server/database/authorization";
import type { AuthUser } from "../lib/domain/auth/types";
import {
  createSharedAppSettingsDatabaseSnapshot,
  createSharedAppSettingsSaveDelta,
} from "../lib/domain/app/shared-settings-snapshot";
import {
  createAppStateSaveCheckpoint,
  createAppStateStorageSnapshot,
  parseAppStateSaveCheckpoint,
} from "../lib/data/app-state";
import { adminStorageKeys } from "../lib/storage/keys";
import { DatabasePayloadError } from "../lib/server/database/validation";

process.env.AUTH_REQUIRED = "false";

const authUserBase: AuthUser = {
  id: "test-user",
  login: "test",
  displayName: "Test User",
  lastName: "Test",
  firstName: "User",
  middleName: "",
  email: "",
  phone: "",
  positionTitle: "",
  role: "dispatcher",
  canManageUsers: false,
  tabPermissions: {},
};

function authUserWithPermissions(tabPermissions: AuthUser["tabPermissions"]): AuthUser {
  return { ...authUserBase, tabPermissions };
}

function isAllowedFor(user: AuthUser, resource: string, action: string, payload?: unknown) {
  return authorizeDatabaseRequest(user, { resource, action, payload }).allowed;
}

const ptoViewer = authUserWithPermissions({
  pto: { view: true, edit: false },
  fleet: { view: true, edit: false },
});
assert.equal(isAllowedFor(ptoViewer, "pto", "load"), true);
assert.equal(isAllowedFor(ptoViewer, "pto", "save-day"), false);
assert.equal(isAllowedFor(ptoViewer, "vehicles", "load"), true);
assert.equal(isAllowedFor(ptoViewer, "vehicles", "delete"), false);
assert.equal(isAllowedFor(ptoViewer, "settings", "load"), true);

const ptoEditor = authUserWithPermissions({
  pto: { view: true, edit: true },
});
assert.equal(isAllowedFor(ptoEditor, "pto", "save-days-with-row"), true);

const reportsEditor = authUserWithPermissions({
  reports: { view: true, edit: true },
});
assert.equal(
  isAllowedFor(reportsEditor, "settings", "save", { settings: { "dispatcher:report-reasons": {} } }),
  true,
);
assert.equal(
  isAllowedFor(reportsEditor, "settings", "save", { settings: { "dispatcher:top-tabs": [] } }),
  false,
);

const adminEditor = authUserWithPermissions({
  admin: { view: true, edit: true },
});
assert.equal(
  isAllowedFor(adminEditor, "settings", "save", { settings: { "dispatcher:top-tabs": [] } }),
  true,
);
assert.equal(isAllowedFor(adminEditor, "app-state", "load-bootstrap"), true);
assert.equal(isAllowedFor(adminEditor, "app-state", "load-client-snapshots"), true);

const ordinaryUserWithoutPermissions = authUserWithPermissions({});
assert.equal(isAllowedFor(ordinaryUserWithoutPermissions, "vehicles", "load"), false);
assert.equal(isAllowedFor(ordinaryUserWithoutPermissions, "vehicles", "replace"), false);
assert.equal(isAllowedFor(ordinaryUserWithoutPermissions, "settings", "save", { settings: { "unknown": true } }), false);

const delegatedUserManager = { ...authUserBase, canManageUsers: true, tabPermissions: {} };
assert.equal(isAllowedFor(delegatedUserManager, "app-state", "load-client-snapshots"), true);
assert.equal(isAllowedFor(delegatedUserManager, "vehicles", "replace"), false);

const superuser = { ...authUserBase, role: "dispatch-chief" as const, tabPermissions: {} };
assert.equal(isAllowedFor(superuser, "vehicles", "replace"), true);
assert.equal(isAllowedFor(superuser, "settings", "save", { settings: { "unknown": true } }), true);

assert.deepEqual(getDatabaseAccessRequirement({ resource: "status", action: "status" }), {
  level: "authenticated",
});
assert.deepEqual(getDatabaseAccessRequirement({ resource: "app-state", action: "save", payload: { storage: {} } }), {
  level: "edit",
  tabIds: ["admin"],
});

async function responseJson(response: Response) {
  return await response.json() as { data?: unknown; error?: unknown };
}

const origin = "https://aam-dispatch.kz";

const settingsSnapshot = createSharedAppSettingsDatabaseSnapshot([
  { key: adminStorageKeys.reportCustomers, value: ["old"], updated_at: "2026-04-28T01:00:00.000Z" },
  { key: adminStorageKeys.reportReasons, value: { row1: "same" }, updated_at: "2026-04-28T01:01:00.000Z" },
]);
assert.deepEqual(createSharedAppSettingsSaveDelta({
  [adminStorageKeys.reportCustomers]: ["new"],
  [adminStorageKeys.reportReasons]: { row1: "same" },
}, settingsSnapshot), {
  settings: {
    [adminStorageKeys.reportCustomers]: ["new"],
  },
  expectedUpdatedAt: {
    [adminStorageKeys.reportCustomers]: "2026-04-28T01:00:00.000Z",
  },
});

const appStateCheckpoint = createAppStateSaveCheckpoint({
  [adminStorageKeys.reportCustomers]: "[\"old\"]",
}, "2026-04-28T01:00:00.000Z");
assert.deepEqual(parseAppStateSaveCheckpoint(appStateCheckpoint), {
  storage: {
    [adminStorageKeys.reportCustomers]: "[\"old\"]",
  },
  storageSnapshot: createAppStateStorageSnapshot({
    [adminStorageKeys.reportCustomers]: "[\"old\"]",
  }),
  updatedAt: "2026-04-28T01:00:00.000Z",
});
assert.equal(
  createAppStateStorageSnapshot({ b: "2", a: "1" }),
  createAppStateStorageSnapshot({ a: "1", b: "2" }),
);
assert.equal(
  parseAppStateSaveCheckpoint(JSON.stringify({
    storage: { b: "2", a: "1" },
    storageSnapshot: "stale-raw-provider-order",
    updatedAt: "2026-04-28T01:02:00.000Z",
  })).storageSnapshot,
  createAppStateStorageSnapshot({ a: "1", b: "2" }),
);
assert.deepEqual(parseAppStateSaveCheckpoint(""), { storage: {}, storageSnapshot: createAppStateStorageSnapshot({}), updatedAt: null });
assert.deepEqual(parseAppStateSaveCheckpoint(JSON.stringify({
  [adminStorageKeys.reportCustomers]: "[\"legacy\"]",
})), {
  storage: {
    [adminStorageKeys.reportCustomers]: "[\"legacy\"]",
  },
  storageSnapshot: createAppStateStorageSnapshot({
    [adminStorageKeys.reportCustomers]: "[\"legacy\"]",
  }),
  updatedAt: null,
});

const optionsResponse = await handleDatabaseOptions(new Request("https://aam-dispatch.kz/api/database", {
  method: "OPTIONS",
  headers: { origin },
}));
assert.equal(optionsResponse.status, 204);
assert.equal(optionsResponse.headers.get("Access-Control-Allow-Origin"), origin);
assert.equal(optionsResponse.headers.get("Vary"), "Origin");
assert.equal(optionsResponse.headers.get("Access-Control-Allow-Methods"), "GET, POST, OPTIONS");
assert.equal(optionsResponse.headers.get("Access-Control-Allow-Headers"), "Content-Type, X-Dispatcher-Request");

const blockedOptionsResponse = await handleDatabaseOptions(new Request("https://aam-dispatch.kz/api/database", {
  method: "OPTIONS",
  headers: { origin: "https://evil.example" },
}));
assert.equal(blockedOptionsResponse.status, 204);
assert.equal(blockedOptionsResponse.headers.get("Vary"), "Origin");
assert.equal(blockedOptionsResponse.headers.get("Access-Control-Allow-Origin"), null);

const getResponse = await handleDatabaseGet(new Request("https://aam-dispatch.kz/api/database", {
  method: "GET",
  headers: { origin },
}));
assert.equal(getResponse.status, 200);
assert.equal(getResponse.headers.get("Access-Control-Allow-Origin"), origin);
assert.equal(getResponse.headers.get("Vary"), "Origin");
const getBody = await responseJson(getResponse);
assert.equal(typeof (getBody.data as { configured?: unknown }).configured, "boolean");
assert.equal((getBody.data as { provider?: unknown }).provider, "mysql");

const statusResponse = await handleDatabasePost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { "Content-Type": "application/json", origin },
  body: JSON.stringify({ resource: "status", action: "status" }),
}));
assert.equal(statusResponse.status, 200);
assert.equal(statusResponse.headers.get("Access-Control-Allow-Origin"), origin);
assert.equal(statusResponse.headers.get("Vary"), "Origin");
assert.deepEqual(await responseJson(statusResponse), getBody);

const blockedStatusResponse = await handleDatabasePost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { "Content-Type": "application/json", origin: "https://evil.example" },
  body: JSON.stringify({ resource: "status", action: "status" }),
}));
assert.equal(blockedStatusResponse.status, 200);
assert.equal(blockedStatusResponse.headers.get("Vary"), "Origin");
assert.equal(blockedStatusResponse.headers.get("Access-Control-Allow-Origin"), null);

const routedCalls: Array<{ action?: string; payload?: unknown }> = [];
const routedPost = createDatabasePostHandler({
  fake: ({ action, payload, json }) => {
    routedCalls.push({ action, payload });
    return json({ routed: true, action, payload }, 202);
  },
  empty: () => undefined,
  throwing: () => {
    throw new Error("Injected database failure");
  },
});

process.env.AUTH_REQUIRED = "true";
const authRequiredResponse = await routedPost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { "Content-Type": "application/json", origin },
  body: JSON.stringify({ resource: "fake", action: "load", payload: { id: 6 } }),
}));
assert.equal(authRequiredResponse.status, 401);
assert.deepEqual(routedCalls, []);
process.env.AUTH_REQUIRED = "false";

const routedResponse = await routedPost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { "Content-Type": "application/json", origin },
  body: JSON.stringify({ resource: "fake", action: "save", payload: { id: 7 } }),
}));
assert.equal(routedResponse.status, 202);
assert.equal(routedResponse.headers.get("Access-Control-Allow-Origin"), origin);
assert.deepEqual(routedCalls, [{ action: "save", payload: { id: 7 } }]);
assert.deepEqual(await responseJson(routedResponse), {
  data: { routed: true, action: "save", payload: { id: 7 } },
});

const internalWriteResponse = await routedPost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Dispatcher-Request": "same-origin", "Sec-Fetch-Site": "same-origin" },
  body: JSON.stringify({ resource: "fake", action: "save", payload: { id: 10 } }),
}));
assert.equal(internalWriteResponse.status, 202);
assert.deepEqual(routedCalls.at(-1), { action: "save", payload: { id: 10 } });

const forgedInternalWriteResponse = await routedPost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Dispatcher-Request": "same-origin", origin: "https://evil.example" },
  body: JSON.stringify({ resource: "fake", action: "save", payload: { id: 11 } }),
}));
assert.equal(forgedInternalWriteResponse.status, 403);
assert.deepEqual(routedCalls.at(-1), { action: "save", payload: { id: 10 } });

const proxiedWriteResponse = await routedPost(new Request("http://127.0.0.1:10000/api/database", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    origin: "https://www.aam-dispatch.kz",
    "x-forwarded-host": "aam-dispatch.kz",
    "x-forwarded-proto": "https",
  },
  body: JSON.stringify({ resource: "fake", action: "save", payload: { id: 9 } }),
}));
assert.equal(proxiedWriteResponse.status, 202);
assert.equal(proxiedWriteResponse.headers.get("Access-Control-Allow-Origin"), "https://www.aam-dispatch.kz");
assert.deepEqual(routedCalls.at(-1), { action: "save", payload: { id: 9 } });

const apexPageToCanonicalApiResponse = await routedPost(new Request("https://www.aam-dispatch.kz/api/database", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    origin,
    referer: `${origin}/`,
  },
  body: JSON.stringify({ resource: "fake", action: "save", payload: { id: 12 } }),
}));
assert.equal(apexPageToCanonicalApiResponse.status, 202);
assert.equal(apexPageToCanonicalApiResponse.headers.get("Access-Control-Allow-Origin"), origin);
assert.deepEqual(routedCalls.at(-1), { action: "save", payload: { id: 12 } });

const rejectedWriteResponse = await routedPost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { "Content-Type": "application/json", origin: "https://evil.example" },
  body: JSON.stringify({ resource: "fake", action: "save", payload: { id: 8 } }),
}));
assert.equal(rejectedWriteResponse.status, 403);
assert.equal(rejectedWriteResponse.headers.get("Vary"), "Origin");
assert.equal(rejectedWriteResponse.headers.get("Access-Control-Allow-Origin"), null);
assert.deepEqual(routedCalls, [
  { action: "save", payload: { id: 7 } },
  { action: "save", payload: { id: 10 } },
  { action: "save", payload: { id: 9 } },
  { action: "save", payload: { id: 12 } },
]);
assert.deepEqual(await responseJson(rejectedWriteResponse), {
  error: "Запись в базу данных отклонена: запрос должен идти с этого же сайта.",
});

const unknownActionResponse = await routedPost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { "Content-Type": "application/json", origin },
  body: JSON.stringify({ resource: "empty", action: "missing" }),
}));
assert.equal(unknownActionResponse.status, 400);
assert.equal(unknownActionResponse.headers.get("Access-Control-Allow-Origin"), origin);
assert.equal((await responseJson(unknownActionResponse)).error, "Неизвестное действие базы данных.");

const routedErrorResponse = await routedPost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { "Content-Type": "application/json", origin },
  body: JSON.stringify({ resource: "throwing", action: "load" }),
}));
assert.equal(routedErrorResponse.status, 500);
assert.equal(routedErrorResponse.headers.get("Access-Control-Allow-Origin"), origin);
assert.equal(routedErrorResponse.headers.get("Vary"), "Origin");
assert.deepEqual(await responseJson(routedErrorResponse), { error: "Injected database failure" });

const invalidResponse = await handleDatabasePost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { "Content-Type": "application/json", origin },
  body: JSON.stringify({ resource: "unknown", action: "unknown" }),
}));
assert.equal(invalidResponse.status, 400);
assert.equal(invalidResponse.headers.get("Access-Control-Allow-Origin"), origin);
assert.equal((await responseJson(invalidResponse)).error, "Неизвестное действие базы данных.");

const malformedResponse = await handleDatabasePost(new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { "Content-Type": "application/json", origin },
  body: "{",
}));
assert.equal(malformedResponse.status, 400);
assert.equal((await responseJson(malformedResponse)).error, "Неизвестное действие базы данных.");

const errorResponse = createDatabaseErrorResponse(new Error("Database unavailable"), new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { origin },
}));
assert.equal(errorResponse.status, 500);
assert.equal(errorResponse.headers.get("Access-Control-Allow-Origin"), origin);
assert.equal(errorResponse.headers.get("Vary"), "Origin");
assert.deepEqual(await responseJson(errorResponse), { error: "Database unavailable" });

const rawDatabaseError = {
  message: "Connection failed password=super-secret",
  sqlMessage: "Access denied for user dispatcher_ad on database aam_dispatch",
  details: "SELECT * FROM auth_users WHERE password = 'super-secret'",
  hint: "check DB_PASSWORD",
  query: "SELECT * FROM auth_users",
  stack: "stack trace with host db.aam-dispatch.kz",
  code: "ER_ACCESS_DENIED_ERROR",
};
const mutableProcessEnv = process.env as Record<string, string | undefined>;
const previousNodeEnv = process.env.NODE_ENV;
const previousConsoleError = console.error;
const productionErrorLogs: unknown[][] = [];

mutableProcessEnv.NODE_ENV = "production";
console.error = (...args: unknown[]) => {
  productionErrorLogs.push(args);
};
const productionErrorResponse = createDatabaseErrorResponse(rawDatabaseError, new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { origin },
}));
restoreNodeEnv(previousNodeEnv);
console.error = previousConsoleError;
assert.equal(productionErrorResponse.status, 500);
const productionErrorBody = await responseJson(productionErrorResponse);
assert.deepEqual(productionErrorBody, { error: "Database operation failed" });
assert.doesNotMatch(JSON.stringify(productionErrorBody), /sqlMessage|details|hint|query|stack|super-secret|dispatcher_ad|aam_dispatch/i);
assert.equal(productionErrorLogs.length, 1);
assert.doesNotMatch(JSON.stringify(productionErrorLogs), /super-secret|SELECT \*|DB_PASSWORD|dispatcher_ad|aam_dispatch/i);

mutableProcessEnv.NODE_ENV = "development";
const developmentErrorResponse = createDatabaseErrorResponse(rawDatabaseError, new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { origin },
}));
restoreNodeEnv(previousNodeEnv);
assert.equal(developmentErrorResponse.status, 500);
const developmentErrorBody = await responseJson(developmentErrorResponse);
assert.match(String(developmentErrorBody.error), /Connection failed password=\[redacted\]/);
assert.match(String(developmentErrorBody.error), /ER_ACCESS_DENIED_ERROR/);
assert.doesNotMatch(JSON.stringify(developmentErrorBody), /sqlMessage|details|hint|query|stack|super-secret|SELECT \*|DB_PASSWORD/i);

const payloadErrorResponse = createDatabaseErrorResponse(
  new DatabasePayloadError("Некорректный запрос"),
  new Request("https://aam-dispatch.kz/api/database", {
    method: "POST",
    headers: { origin },
  }),
);
assert.equal(payloadErrorResponse.status, 400);
assert.deepEqual(await responseJson(payloadErrorResponse), { error: "Некорректный запрос" });

function restoreNodeEnv(value: string | undefined) {
  if (value === undefined) {
    delete mutableProcessEnv.NODE_ENV;
    return;
  }

  mutableProcessEnv.NODE_ENV = value;
}
