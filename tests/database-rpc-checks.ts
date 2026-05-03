import assert from "node:assert/strict";
import { isDatabaseConflictError } from "../lib/data/errors";
import { databaseRequest } from "../lib/database/rpc";

const originalFetch = globalThis.fetch;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalDateNow = Date.now;

function restoreWindow() {
  if (originalWindow) {
    Object.defineProperty(globalThis, "window", originalWindow);
    return;
  }

  Reflect.deleteProperty(globalThis, "window");
}

function installWindowHostname(hostname: string) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { hostname } },
  });
}

try {
  const fetchCalls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  let nowMs = originalDateNow();
  let statusConfigured = true;

  installWindowHostname("aam-dispatch.kz");
  Date.now = () => nowMs;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({ input, init });
    const body = JSON.parse(String(init?.body ?? "{}")) as { resource?: string; action?: string };
    const data = body.resource === "status" || body.action === "status"
      ? { provider: "mysql", configured: statusConfigured }
      : { ok: true };

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  assert.deepEqual(await databaseRequest<{ provider: string; configured: boolean }>("status", "status"), {
    provider: "mysql",
    configured: true,
  });
  assert.deepEqual(await databaseRequest<{ ok: boolean }>("pto", "load-updated-at"), { ok: true });
  assert.deepEqual(await databaseRequest<{ ok: boolean }>("pto", "load-buckets"), { ok: true });
  assert.equal(fetchCalls.length, 3);
  assert.equal(fetchCalls[0]?.input, "https://www.aam-dispatch.kz/api/database");
  assert.equal(fetchCalls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(fetchCalls[0]?.init?.body)), {
    resource: "status",
    action: "status",
  });
  assert.deepEqual(JSON.parse(String(fetchCalls[1]?.init?.body)), {
    resource: "pto",
    action: "load-updated-at",
  });
  assert.deepEqual(JSON.parse(String(fetchCalls[2]?.init?.body)), {
    resource: "pto",
    action: "load-buckets",
  });

  nowMs += 20000;
  statusConfigured = false;
  fetchCalls.length = 0;
  await assert.rejects(
    () => databaseRequest("pto", "load"),
    (error) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, "Сервер базы данных не готов: Серверная база данных не настроена.");
      return true;
    },
  );
  assert.equal(fetchCalls.length, 1);
  assert.deepEqual(JSON.parse(String(fetchCalls[0]?.init?.body)), {
    resource: "status",
    action: "status",
  });

  globalThis.fetch = (async () => {
    const error = new Error("Aborted");
    error.name = "AbortError";
    throw error;
  }) as typeof fetch;

  await assert.rejects(
    () => databaseRequest("status", "status"),
    (error) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, "Сервер базы данных не ответил за 30 секунд.");
      return true;
    },
  );

  assert.equal(isDatabaseConflictError(Object.assign(new Error("Данные ПТО уже изменились в базе."), { code: "DATABASE_CONFLICT" })), true);
  assert.equal(isDatabaseConflictError(Object.assign(new Error("Список техники уже изменился в базе."), { status: 409 })), true);
  assert.equal(isDatabaseConflictError({ error: "Обновите страницу перед повторным сохранением.", status: 409 }), true);
} finally {
  globalThis.fetch = originalFetch;
  Date.now = originalDateNow;
  restoreWindow();
}
