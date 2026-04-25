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

export async function databaseRequest<T>(
  resource: DatabaseResource,
  action: DatabaseAction,
  payload?: unknown,
): Promise<T> {
  const response = await fetch("/api/database", {
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
