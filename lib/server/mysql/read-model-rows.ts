import type { RowDataPacket } from "mysql2/promise";
import type {
  DatabaseReadModelRowsClient,
  DatabaseReadModelRowsRequest,
} from "../database/read-model-executor";
import { dbRows } from "./pool";

export type MysqlReadModelRowsRequestIssueCode =
  | "detail_max_rows_must_be_one"
  | "empty_sql"
  | "list_max_rows_invalid"
  | "missing_limit"
  | "multi_statement_sql"
  | "select_star_forbidden"
  | "write_statement_forbidden";

export type MysqlReadModelRowsRequestIssue = {
  code: MysqlReadModelRowsRequestIssueCode;
  message: string;
};

export class MysqlReadModelRowsRequestError extends Error {
  code = "mysql_read_model_rows_request_invalid" as const;

  constructor(readonly issues: readonly MysqlReadModelRowsRequestIssue[]) {
    super(`MySQL read-model rows request is invalid: ${issues.map((issue) => issue.code).join(", ")}`);
    this.name = "MysqlReadModelRowsRequestError";
  }
}

const allowedListMaxRows = new Set([25, 50, 100]);
const writeStatementPattern = /\b(ALTER|CREATE|DELETE|DROP|INSERT|REPLACE|TRUNCATE|UPDATE)\b/i;

export function getMysqlReadModelRowsRequestIssues(
  request: DatabaseReadModelRowsRequest,
): MysqlReadModelRowsRequestIssue[] {
  const sql = request.sql.trim();
  const issues: MysqlReadModelRowsRequestIssue[] = [];

  if (!sql) {
    issues.push({
      code: "empty_sql",
      message: "Read-model request SQL must not be empty.",
    });
  }

  if (!/^SELECT\b/i.test(sql) || writeStatementPattern.test(sql)) {
    issues.push({
      code: "write_statement_forbidden",
      message: "Read-model rows adapter accepts only bounded SELECT statements.",
    });
  }

  if (/\bSELECT\s+\*/i.test(sql)) {
    issues.push({
      code: "select_star_forbidden",
      message: "Read-model rows adapter must not execute SELECT *.",
    });
  }

  if (!/\bLIMIT\b/i.test(sql)) {
    issues.push({
      code: "missing_limit",
      message: "Read-model rows adapter requires SQL with an explicit LIMIT.",
    });
  }

  if (sql.includes(";")) {
    issues.push({
      code: "multi_statement_sql",
      message: "Read-model rows adapter must not execute multi-statement SQL.",
    });
  }

  if (request.queryKind === "detail" && request.maxRows !== 1) {
    issues.push({
      code: "detail_max_rows_must_be_one",
      message: "Detail read models must request at most one row.",
    });
  }

  if (request.queryKind === "list" && !allowedListMaxRows.has(request.maxRows)) {
    issues.push({
      code: "list_max_rows_invalid",
      message: "List read models must use the approved dispatcher page sizes.",
    });
  }

  return issues;
}

export function assertMysqlReadModelRowsRequest(request: DatabaseReadModelRowsRequest) {
  const issues = getMysqlReadModelRowsRequestIssues(request);
  if (issues.length > 0) {
    throw new MysqlReadModelRowsRequestError(issues);
  }
}

export async function queryMysqlReadModelRows<Row extends Record<string, unknown>>(
  request: DatabaseReadModelRowsRequest,
): Promise<Row[]> {
  assertMysqlReadModelRowsRequest(request);
  const rows = await dbRows<RowDataPacket & Record<string, unknown>>(request.sql, [...request.params]);

  return rows as unknown as Row[];
}

export const mysqlReadModelRowsClient: DatabaseReadModelRowsClient = {
  queryRows: queryMysqlReadModelRows,
};
