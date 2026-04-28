import { serverDatabaseConfigured } from "./config";

type PtoDatabaseAction =
  | "load"
  | "load-year"
  | "load-buckets"
  | "load-updated-at"
  | "save"
  | "save-day"
  | "save-day-with-row"
  | "save-days"
  | "save-days-with-row"
  | "delete"
  | "delete-year"
  | "save-bucket-row"
  | "delete-bucket-row"
  | "save-bucket-value"
  | "delete-bucket-values";

export function shouldRoutePtoThroughServerDatabase(options: {
  configured?: boolean;
  hasWindow?: boolean;
} = {}) {
  const configured = options.configured ?? serverDatabaseConfigured;
  const hasWindow = options.hasWindow ?? typeof window !== "undefined";
  return configured && hasWindow;
}

export async function ptoDatabaseRequest<T>(action: PtoDatabaseAction, payload?: unknown): Promise<T> {
  const { databaseRequest } = await import("../database/rpc");
  return databaseRequest<T>("pto", action, payload);
}
