import type { ServerPageQuery } from "../../domain/data-access/pagination";
import type {
  DataAccessQueryPolicy,
  DataAccessQueryValidationIssue,
  ServerPageQueryDraft,
} from "../../domain/data-access/queryPolicy";
import {
  normalizeServerPageQueryDraft,
  validateServerPageQueryPolicy,
} from "../../domain/data-access/queryPolicy";
import { DatabasePayloadError } from "./validation";

export type DatabaseListQueryPolicyResult = {
  ok: true;
  query: ServerPageQuery;
} | {
  ok: false;
  query: ServerPageQuery;
  issues: DataAccessQueryValidationIssue[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getDatabaseListQueryDraft(payload: unknown): ServerPageQueryDraft {
  if (!isRecord(payload)) {
    return {};
  }

  const query = payload.query;
  if (isRecord(query)) {
    return query;
  }

  return payload;
}

export function evaluateDatabaseListQueryPolicy(
  payload: unknown,
  policy: DataAccessQueryPolicy,
): DatabaseListQueryPolicyResult {
  const query = normalizeServerPageQueryDraft(getDatabaseListQueryDraft(payload));
  const issues = validateServerPageQueryPolicy(query, policy);

  return issues.length === 0
    ? { ok: true, query }
    : { ok: false, query, issues };
}

export function assertDatabaseListQueryPolicy(
  payload: unknown,
  policy: DataAccessQueryPolicy,
  resourceName = policy.id,
): ServerPageQuery {
  const result = evaluateDatabaseListQueryPolicy(payload, policy);

  if (result.ok) {
    return result.query;
  }

  const issueCodes = result.issues.map((issue) => issue.code).join(", ");
  throw new DatabasePayloadError(`Database list query rejected for ${resourceName}: ${issueCodes}.`);
}
