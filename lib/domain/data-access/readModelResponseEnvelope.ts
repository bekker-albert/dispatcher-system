import type { ServerDetailQueryEnvelope, ServerDetailQueryResult } from "./detailQueryEnvelope";
import { validateServerDetailResult } from "./detailQueryEnvelope";
import type { ServerListQueryEnvelope } from "./listQueryEnvelope";
import { validateServerPageResult } from "./listQueryEnvelope";
import type { DispatchPageSize, PageCursor, ServerPageResult } from "./pagination";

export type PublicReadModelResponseKind = "list" | "detail";

export type PublicReadModelListResponse<Row extends Record<string, unknown> = Record<string, unknown>> = {
  moduleId: string;
  responseKind: "list";
  executionMode: "server-only";
  pageSize: DispatchPageSize;
  rows: Row[];
  nextCursor?: PageCursor;
  totalCount?: number;
  noClientFullScan: true;
};

export type PublicReadModelDetailResponse<Row extends Record<string, unknown> = Record<string, unknown>> = {
  moduleId: string;
  responseKind: "detail";
  executionMode: "server-only";
  row?: Row | null;
  rowCount: number;
  maxRows: 1;
  returnsVersion: boolean;
  noClientFullScan: true;
};

export type PublicReadModelResponseIssueCode =
  | "server_result_invalid"
  | "internal_key_exposed";

export type PublicReadModelResponseIssue = {
  code: PublicReadModelResponseIssueCode;
  severity: "blocker" | "warning";
  message: string;
  key?: string;
};

export type PublicReadModelListResponseResult<Row extends Record<string, unknown> = Record<string, unknown>> =
  | { ok: true; response: PublicReadModelListResponse<Row> }
  | {
      ok: false;
      rejection: {
        code: "read_model_list_response_invalid";
        message: string;
        issues: PublicReadModelResponseIssue[];
      };
    };

export type PublicReadModelDetailResponseResult<Row extends Record<string, unknown> = Record<string, unknown>> =
  | { ok: true; response: PublicReadModelDetailResponse<Row> }
  | {
      ok: false;
      rejection: {
        code: "read_model_detail_response_invalid";
        message: string;
        issues: PublicReadModelResponseIssue[];
      };
    };

const internalPublicPayloadKeys = new Set([
  "cacheKey",
  "filterColumns",
  "fromSql",
  "idColumn",
  "limitSql",
  "orderBySql",
  "params",
  "scopeColumns",
  "searchColumns",
  "selectColumns",
  "selectSql",
  "sql",
  "sortColumns",
  "statusColumn",
  "tableName",
  "updatedAtColumn",
  "updatedByColumn",
  "versionColumn",
  "whereSql",
]);

export function createPublicReadModelListResponse<Row extends Record<string, unknown>>(
  envelope: ServerListQueryEnvelope,
  result: ServerPageResult<Row>,
): PublicReadModelListResponseResult<Row> {
  const response: PublicReadModelListResponse<Row> = {
    moduleId: envelope.moduleId,
    responseKind: "list",
    executionMode: "server-only",
    pageSize: result.pageSize,
    rows: result.rows,
    ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
    ...(result.totalCount !== undefined ? { totalCount: result.totalCount } : {}),
    noClientFullScan: true,
  };
  const issues = [
    ...validateServerPageResult(envelope.query, result)
      .map((issue): PublicReadModelResponseIssue => ({
        code: "server_result_invalid",
        severity: issue.severity,
        message: issue.message,
      })),
    ...validatePublicReadModelPayload(response),
  ];

  if (issues.some((issue) => issue.severity === "blocker")) {
    return {
      ok: false,
      rejection: {
        code: "read_model_list_response_invalid",
        message: "Read-model list response cannot be returned safely.",
        issues,
      },
    };
  }

  return { ok: true, response };
}

export function createPublicReadModelDetailResponse<Row extends Record<string, unknown>>(
  envelope: ServerDetailQueryEnvelope,
  result: ServerDetailQueryResult<Row>,
): PublicReadModelDetailResponseResult<Row> {
  const response: PublicReadModelDetailResponse<Row> = {
    moduleId: envelope.moduleId,
    responseKind: "detail",
    executionMode: "server-only",
    row: result.row ?? null,
    rowCount: result.rowCount,
    maxRows: 1,
    returnsVersion: envelope.returnsVersion,
    noClientFullScan: true,
  };
  const issues = [
    ...validateServerDetailResult(envelope, result)
      .map((issue): PublicReadModelResponseIssue => ({
        code: "server_result_invalid",
        severity: issue.severity,
        message: issue.message,
        ...(issue.field ? { key: issue.field } : {}),
      })),
    ...validatePublicReadModelPayload(response),
  ];

  if (issues.some((issue) => issue.severity === "blocker")) {
    return {
      ok: false,
      rejection: {
        code: "read_model_detail_response_invalid",
        message: "Read-model detail response cannot be returned safely.",
        issues,
      },
    };
  }

  return { ok: true, response };
}

export function validatePublicReadModelPayload(value: unknown): PublicReadModelResponseIssue[] {
  return collectObjectKeys(value).flatMap((key): PublicReadModelResponseIssue[] => (
    internalPublicPayloadKeys.has(key)
      ? [{
          code: "internal_key_exposed",
          severity: "blocker",
          key,
          message: "Public read-model response must not expose internal persistence metadata.",
        }]
      : []
  ));
}

function collectObjectKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectObjectKeys);

  return Object.entries(value).flatMap(([key, childValue]) => [
    key,
    ...collectObjectKeys(childValue),
  ]);
}
