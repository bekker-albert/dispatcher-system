import { errorToMessage } from "@/lib/utils/normalizers";

export type DatabaseResource = "status" | "vehicles" | "settings" | "app-state" | "pto";

export type DatabaseAction =
  | "status"
  | "load"
  | "save"
  | "replace"
  | "delete"
  | "save-day"
  | "save-days"
  | "delete-year"
  | "save-bucket-row"
  | "delete-bucket-row"
  | "save-bucket-value"
  | "delete-bucket-values"
  | "save-client-snapshot"
  | "load-client-snapshots";

type DatabaseResponse<T> = {
  data?: T;
  error?: unknown;
};

const databaseRequestTimeoutMs = 30000;

function databaseApiUrl() {
  if (typeof window === "undefined") return "/api/database";

  if (window.location.hostname === "aam-dispatch.kz") {
    return "https://www.aam-dispatch.kz/api/database";
  }

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
    throw new Error(body.error ? errorToMessage(body.error) : `Database request failed: ${response.status}`);
  }

  return body.data as T;
}
