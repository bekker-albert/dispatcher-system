import { mysqlConfigured } from "../mysql/config";
import type { DatabaseJsonResponse } from "./types";

export function isDatabaseStatusRequest(resource?: string, action?: string) {
  return resource === "status" || action === "status";
}

export function createDatabaseStatusPayload() {
  return {
    provider: "mysql",
    configured: mysqlConfigured(),
  };
}

export function createDatabaseStatusResponse(json: DatabaseJsonResponse) {
  return json(createDatabaseStatusPayload());
}
