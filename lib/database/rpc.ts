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

const databaseRequestTimeoutMs = 30000;

function databaseApiUrl() {
  return "/api/database";
}

export async function databaseRequest<T>(
  resource: DatabaseResource,
  action: DatabaseAction,
  payload?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), databaseRequestTimeoutMs);

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
      throw new Error("Сервер базы данных не ответил за 30 секунд.");
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
