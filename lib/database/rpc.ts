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
  error?: string;
};

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
  const response = await fetch(databaseApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resource, action, payload }),
  });

  const body = await response.json().catch(() => ({})) as DatabaseResponse<T>;

  if (!response.ok) {
    throw new Error(body.error || `Database request failed: ${response.status}`);
  }

  return body.data as T;
}
