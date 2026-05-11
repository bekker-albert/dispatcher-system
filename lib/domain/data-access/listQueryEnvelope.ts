import type { ServerPageQuery, ServerPageResult } from "./pagination";
import type {
  DataAccessQueryPolicy,
  DataAccessQueryValidationIssue,
  ServerPageQueryDraft,
} from "./queryPolicy";
import {
  normalizeServerPageQueryDraft,
  validateServerPageQueryPolicy,
} from "./queryPolicy";

export type ServerListQueryEnvelope = {
  moduleId: string;
  requestedBy?: string;
  executionMode: "server-only";
  query: ServerPageQuery;
  maxClientRows: number;
  cacheKey: string;
};

export type ServerListQueryEnvelopeResult =
  | { ok: true; envelope: ServerListQueryEnvelope }
  | {
      ok: false;
      rejection: {
        code: "query_policy_failed";
        message: string;
        issues: DataAccessQueryValidationIssue[];
      };
    };

export type ServerPageResultIssueCode =
  | "page_size_mismatch"
  | "rows_exceed_page_size"
  | "total_count_less_than_rows";

export type ServerPageResultIssue = {
  code: ServerPageResultIssueCode;
  severity: "blocker" | "warning";
  message: string;
};

export function createServerListQueryEnvelope(input: {
  moduleId: string;
  policy: DataAccessQueryPolicy;
  draft: ServerPageQueryDraft;
  requestedBy?: string;
}): ServerListQueryEnvelopeResult {
  const query = normalizeServerPageQueryDraft(input.draft);
  const issues = validateServerPageQueryPolicy(query, input.policy);

  if (issues.length > 0) {
    return {
      ok: false,
      rejection: {
        code: "query_policy_failed",
        message: "Server list query does not satisfy data access policy.",
        issues,
      },
    };
  }

  return {
    ok: true,
    envelope: {
      moduleId: input.moduleId,
      requestedBy: input.requestedBy,
      executionMode: "server-only",
      query,
      maxClientRows: query.pageSize,
      cacheKey: createServerListQueryCacheKey(input.moduleId, query),
    },
  };
}

export function validateServerPageResult<Row>(
  query: ServerPageQuery,
  result: ServerPageResult<Row>,
): ServerPageResultIssue[] {
  const issues: ServerPageResultIssue[] = [];

  if (result.pageSize !== query.pageSize) {
    issues.push({
      code: "page_size_mismatch",
      severity: "warning",
      message: "Server result pageSize differs from requested pageSize.",
    });
  }

  if (result.rows.length > query.pageSize) {
    issues.push({
      code: "rows_exceed_page_size",
      severity: "blocker",
      message: "Server result returned more rows than the requested pageSize.",
    });
  }

  if (result.totalCount !== undefined && result.totalCount < result.rows.length) {
    issues.push({
      code: "total_count_less_than_rows",
      severity: "warning",
      message: "Server result totalCount cannot be lower than returned row count.",
    });
  }

  return issues;
}

export function createServerListQueryCacheKey(
  moduleId: string,
  query: ServerPageQuery,
): string {
  return JSON.stringify({
    moduleId,
    pageSize: query.pageSize,
    cursor: query.cursor ?? "",
    offset: query.offset ?? 0,
    filters: createStableRecord(query.filters),
    sort: query.sort ? {
      field: query.sort.field,
      direction: query.sort.direction,
    } : null,
    search: query.search?.trim() ?? "",
  });
}

function createStableRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(record)
    .sort((left, right) => left.localeCompare(right))
    .reduce<Record<string, unknown>>((stable, key) => ({
      ...stable,
      [key]: record[key],
    }), {});
}
