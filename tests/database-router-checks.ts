import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDatabasePostHandler,
  createDatabaseErrorResponse,
  handleDatabaseGet,
  handleDatabaseOptions,
  handleDatabasePost,
} from "../lib/server/database/router";
import { shouldRoutePtoThroughServerDatabase } from "../lib/supabase/pto";
import {
  createSharedAppSettingsDatabaseSnapshot,
  createSharedAppSettingsSaveDelta,
} from "../lib/domain/app/shared-settings-snapshot";
import {
  createAppStateSaveCheckpoint,
  parseAppStateSaveCheckpoint,
} from "../lib/data/app-state";
import { adminStorageKeys } from "../lib/storage/keys";
import { DatabasePayloadError } from "../lib/server/database/validation";

const testDir = dirname(fileURLToPath(import.meta.url));
const mysqlSchemaSource = readFileSync(resolve(testDir, "../lib/server/mysql/schema.ts"), "utf8");
const mysqlPtoCommandsSource = readFileSync(resolve(testDir, "../lib/server/mysql/pto-commands.ts"), "utf8");
const mysqlPtoVersionSource = readFileSync(resolve(testDir, "../lib/server/mysql/pto-version.ts"), "utf8");

assert.match(mysqlSchemaSource, /const schemaVersionMetaKey = "schema:v/);
assert.match(mysqlSchemaSource, /SELECT meta_key FROM pto_meta WHERE meta_key = \? LIMIT 1/);
assert.match(mysqlSchemaSource, /if \(schemaVersionRows\.length > 0\) return;/);
assert.match(mysqlSchemaSource, /INSERT IGNORE INTO pto_meta \(meta_key\) VALUES \(\?\)/);
assert.match(mysqlSchemaSource, /ALTER TABLE vehicles ADD INDEX vehicles_sort_index_idx \(sort_index\)/);
assert.match(mysqlSchemaSource, /ALTER TABLE pto_rows ADD INDEX pto_rows_sort_idx \(table_type, sort_index\)/);
assert.match(mysqlSchemaSource, /ALTER TABLE pto_day_values ADD INDEX pto_day_values_date_idx \(work_date\)/);
assert.match(mysqlSchemaSource, /ALTER TABLE pto_bucket_rows ADD INDEX pto_bucket_rows_sort_idx \(sort_index\)/);
assert.doesNotMatch(mysqlPtoCommandsSource, /loadPtoUpdatedAtFromMysql/);
assert.match(mysqlPtoCommandsSource, /return await touchPtoVersion\(execute\)/);
assert.match(mysqlPtoVersionSource, /SELECT updated_at FROM pto_meta WHERE meta_key = \? LIMIT 1/);

async function responseJson(response: Response) {
  return await response.json() as { data?: unknown; error?: unknown };
}

const origin = "https://aam-dispatch.kz";

assert.equal(shouldRoutePtoThroughServerDatabase({ configured: true, hasWindow: true }), true);
assert.equal(shouldRoutePtoThroughServerDatabase({ configured: true, hasWindow: false }), false);
assert.equal(shouldRoutePtoThroughServerDatabase({ configured: false, hasWindow: true }), false);

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
  updatedAt: "2026-04-28T01:00:00.000Z",
});
assert.deepEqual(parseAppStateSaveCheckpoint(""), { storage: {}, updatedAt: null });
assert.deepEqual(parseAppStateSaveCheckpoint(JSON.stringify({
  [adminStorageKeys.reportCustomers]: "[\"legacy\"]",
})), {
  storage: {
    [adminStorageKeys.reportCustomers]: "[\"legacy\"]",
  },
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
assert.equal(optionsResponse.headers.get("Access-Control-Allow-Headers"), "Content-Type");

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
  { action: "save", payload: { id: 9 } },
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

const payloadErrorResponse = createDatabaseErrorResponse(
  new DatabasePayloadError("Некорректный запрос"),
  new Request("https://aam-dispatch.kz/api/database", {
    method: "POST",
    headers: { origin },
  }),
);
assert.equal(payloadErrorResponse.status, 400);
assert.deepEqual(await responseJson(payloadErrorResponse), { error: "Некорректный запрос" });
