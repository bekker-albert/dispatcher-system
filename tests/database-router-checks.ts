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

const testDir = dirname(fileURLToPath(import.meta.url));
const mysqlSchemaSource = readFileSync(resolve(testDir, "../lib/server/mysql/schema.ts"), "utf8");
const mysqlSchemaDefinitionsSource = readFileSync(resolve(testDir, "../lib/server/mysql/schema-definitions.ts"), "utf8");
const mysqlPtoCommandsSource = readFileSync(resolve(testDir, "../lib/server/mysql/pto-commands.ts"), "utf8");
const mysqlPtoVersionSource = readFileSync(resolve(testDir, "../lib/server/mysql/pto-version.ts"), "utf8");
const mysqlPtoLoadSource = readFileSync(resolve(testDir, "../lib/server/mysql/pto-load.ts"), "utf8");

assert.match(mysqlSchemaSource, /const schemaVersionMetaKey = createSchemaVersionMetaKey\(\);/);
assert.match(mysqlSchemaSource, /createHash\("sha256"\)/);
assert.match(mysqlSchemaSource, /SELECT 1 AS schema_ready FROM pto_meta WHERE meta_key = \? LIMIT 1/);
assert.match(mysqlSchemaSource, /if \(await mysqlSchemaVersionExists\(\)\) return;[\s\S]*await getMysqlPool\(\)\.execute\(ptoMetaTableStatement\);/);
assert.doesNotMatch(mysqlSchemaSource, /SELECT meta_key FROM pto_meta WHERE meta_key = \? LIMIT 1/);
assert.match(mysqlSchemaSource, /for \(const statement of schemaStatements\) \{[\s\S]*await getMysqlPool\(\)\.execute\(statement\);[\s\S]*\}/);
assert.match(mysqlSchemaSource, /for \(const migration of schemaMigrations\) \{[\s\S]*await applyMysqlSchemaMigration\(migration\);[\s\S]*\}/);
assert.match(mysqlSchemaSource, /INSERT IGNORE INTO pto_meta \(meta_key\) VALUES \(\?\)/);
assert.match(mysqlSchemaDefinitionsSource, /ALTER TABLE vehicles ADD INDEX vehicles_sort_index_idx \(sort_index\)/);
assert.match(mysqlSchemaDefinitionsSource, /ALTER TABLE pto_rows ADD INDEX pto_rows_sort_idx \(table_type, sort_index\)/);
assert.match(mysqlSchemaDefinitionsSource, /ALTER TABLE pto_day_values ADD INDEX pto_day_values_date_idx \(work_date\)/);
assert.match(mysqlSchemaDefinitionsSource, /ALTER TABLE pto_day_values ADD INDEX pto_day_values_date_row_idx \(work_date, table_type, row_id\)/);
assert.match(mysqlSchemaDefinitionsSource, /ALTER TABLE pto_day_values ADD INDEX pto_day_values_table_date_row_idx \(table_type, work_date, row_id\)/);
assert.match(mysqlSchemaDefinitionsSource, /CREATE TABLE IF NOT EXISTS pto_row_years/);
assert.match(mysqlSchemaDefinitionsSource, /PRIMARY KEY \(year_value, table_type, row_id\)/);
assert.match(mysqlSchemaDefinitionsSource, /ALTER TABLE pto_row_years ADD INDEX pto_row_years_row_idx \(table_type, row_id, year_value\)/);
assert.match(mysqlSchemaSource, /rebuildPtoRowYearMembership\(createSchemaSetupExecutor\(\)\)/);
assert.match(mysqlSchemaDefinitionsSource, /ALTER TABLE pto_bucket_rows ADD INDEX pto_bucket_rows_sort_idx \(sort_index\)/);
assert.doesNotMatch(mysqlPtoCommandsSource, /loadPtoUpdatedAtFromMysql/);
assert.match(mysqlPtoCommandsSource, /return await touchPtoVersion\(execute\)/);
assert.match(mysqlPtoVersionSource, /SELECT updated_at FROM pto_meta WHERE meta_key = \? LIMIT 1/);
assert.match(mysqlPtoLoadSource, /JOIN pto_rows AS rows_for_year/);
assert.match(mysqlPtoLoadSource, /const ptoRowSelectColumns = \[/);
assert.match(mysqlPtoLoadSource, /const ptoDayValueSelectColumns = \[/);
assert.match(mysqlPtoLoadSource, /SELECT \$\{ptoRowSelectColumns\} FROM pto_rows ORDER BY table_type ASC, sort_index ASC/);
assert.match(mysqlPtoLoadSource, /SELECT \$\{ptoDayValueSelectColumns\} FROM pto_day_values ORDER BY work_date ASC/);
assert.match(mysqlPtoLoadSource, /rows_for_year\.\$\{column\}/);
assert.doesNotMatch(mysqlPtoLoadSource, /SELECT rows_for_year\.\*/);
assert.doesNotMatch(mysqlPtoLoadSource, /SELECT \* FROM pto_rows/);
assert.match(mysqlPtoLoadSource, /FROM pto_row_years AS row_years/);
assert.match(mysqlPtoLoadSource, /JOIN pto_rows AS rows_for_year/);
assert.match(mysqlPtoLoadSource, /WHERE row_years\.year_value = \?/);
assert.doesNotMatch(mysqlPtoLoadSource, /WITH values_for_year AS \(/);
assert.doesNotMatch(mysqlPtoLoadSource, /JSON_CONTAINS\(COALESCE\(rows_for_year\.years, JSON_ARRAY\(\)\), JSON_QUOTE\(\?\)\)/);
assert.doesNotMatch(mysqlPtoLoadSource, /LEFT JOIN values_for_year/);
assert.doesNotMatch(mysqlPtoLoadSource, /EXISTS \(\s*SELECT 1\s*FROM pto_day_values AS values_for_year/);
assert.doesNotMatch(mysqlPtoLoadSource, /loadPtoStateFromMysqlForYear[\s\S]*SELECT \* FROM pto_rows ORDER BY table_type ASC, sort_index ASC/);

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
