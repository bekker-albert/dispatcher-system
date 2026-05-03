import { errorToMessage } from "../utils/normalizers";

export type DatabaseResource = "status" | "vehicles" | "settings" | "app-state" | "pto";

export type DatabaseAction =
  | "status"
  | "load"
  | "load-bootstrap"
  | "load-year"
  | "load-buckets"
  | "load-updated-at"
  | "save"
  | "replace"
  | "delete"
  | "save-day"
  | "save-day-with-row"
  | "save-days"
  | "save-days-with-row"
  | "delete-year"
  | "save-bucket-row"
  | "delete-bucket-row"
  | "save-bucket-value"
  | "delete-bucket-values"
  | "save-client-snapshot"
  | "load-client-snapshots"
  | "savePatch";

type DatabaseResponse<T> = {
  data?: T;
  error?: unknown;
  code?: string;
};

type DatabaseStatusPayload = {
  configured?: boolean;
  provider?: string;
};

const databaseRequestTimeoutMs = 30000;
const databaseReadinessTimeoutMs = 3000;
const databaseReadinessCacheMs = 10000;

let databaseReadinessCheckedUntil = 0;
let activeDatabaseReadinessCheck: Promise<void> | null = null;

function databaseApiUrl() {
  return "/api/database";
}

function databaseTimeoutMessage(timeoutMs: number) {
  return timeoutMs === databaseRequestTimeoutMs
    ? "Сервер базы данных не ответил за 30 секунд."
    : `Сервер базы данных не ответил на короткую проверку готовности за ${Math.round(timeoutMs / 1000)} сек.`;
}

function isDatabaseStatusRequest(resource: DatabaseResource, action: DatabaseAction) {
  return resource === "status" || action === "status";
}

async function sendDatabaseRequest<T>(
  resource: DatabaseResource,
  action: DatabaseAction,
  payload?: unknown,
  timeoutMs = databaseRequestTimeoutMs,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  try {
    response = await fetch(databaseApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dispatcher-Request": "same-origin",
      },
      body: JSON.stringify({ resource, action, payload }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(databaseTimeoutMessage(timeoutMs));
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const body = await response.json().catch(() => ({})) as DatabaseResponse<T>;

  if (!response.ok) {
    const message = body.error ? errorToMessage(body.error) : `Database request failed: ${response.status}`;
    throw Object.assign(new Error(message), {
      code: body.code,
      status: response.status,
    });
  }

  return body.data as T;
}

function assertDatabaseReadyStatus(status: DatabaseStatusPayload) {
  if (status.configured === false) {
    throw new Error("Серверная база данных не настроена.");
  }
}

function markDatabaseReadyForCachedWindow() {
  databaseReadinessCheckedUntil = Date.now() + databaseReadinessCacheMs;
}

function rememberDatabaseReadiness<T>(resource: DatabaseResource, action: DatabaseAction, result: T) {
  if (isDatabaseStatusRequest(resource, action)) {
    const status = result as DatabaseStatusPayload;
    if (status.configured === false) {
      databaseReadinessCheckedUntil = 0;
      return;
    }
  }

  markDatabaseReadyForCachedWindow();
}

async function runDatabaseReadinessCheck() {
  try {
    const status = await sendDatabaseRequest<DatabaseStatusPayload>(
      "status",
      "status",
      undefined,
      databaseReadinessTimeoutMs,
    );
    assertDatabaseReadyStatus(status);
    markDatabaseReadyForCachedWindow();
  } catch (error) {
    const message = errorToMessage(error);
    throw new Error(`Сервер базы данных не готов: ${message}`);
  }
}

async function ensureDatabaseReady(resource: DatabaseResource, action: DatabaseAction) {
  if (isDatabaseStatusRequest(resource, action)) return;
  if (Date.now() < databaseReadinessCheckedUntil) return;

  activeDatabaseReadinessCheck = activeDatabaseReadinessCheck ?? runDatabaseReadinessCheck().finally(() => {
    activeDatabaseReadinessCheck = null;
  });

  await activeDatabaseReadinessCheck;
}

export async function databaseRequest<T>(
  resource: DatabaseResource,
  action: DatabaseAction,
  payload?: unknown,
): Promise<T> {
  await ensureDatabaseReady(resource, action);
  const result = await sendDatabaseRequest<T>(resource, action, payload);
  rememberDatabaseReadiness(resource, action, result);
  return result;
}
