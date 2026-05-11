import type { ServerDetailQueryResult } from "../../domain/data-access/detailQueryEnvelope";
import type { ServerPageResult } from "../../domain/data-access/pagination";
import type {
  PublicReadModelDetailResponseResult,
  PublicReadModelListResponseResult,
} from "../../domain/data-access/readModelResponseEnvelope";
import type { DatabaseDetailSelectSqlPlan } from "./detail-query-builder";
import type { DatabaseListSelectSqlPlan } from "./list-query-builder";
import type {
  LiveModuleDetailExecutionContext,
  LiveModuleListExecutionContext,
} from "./module-handler-execution";
import type { DatabaseJsonResponse } from "./types";

export type DatabaseReadModelRowsRequest = {
  queryKind: "list" | "detail";
  moduleId: string;
  workspaceId: string;
  resource: string;
  action: string;
  sql: string;
  params: readonly unknown[];
  maxRows: number;
  pageSize?: number;
  offset?: number;
};

export type DatabaseReadModelRowsClient = {
  queryRows: <Row extends Record<string, unknown>>(
    request: DatabaseReadModelRowsRequest,
  ) => Promise<Row[]> | Row[];
};

export type DatabaseReadModelListQueryExecutor<Row extends Record<string, unknown>> = (
  sqlPlan: DatabaseListSelectSqlPlan,
) => Promise<ServerPageResult<Row>> | ServerPageResult<Row>;

export type DatabaseReadModelDetailQueryExecutor<Row extends Record<string, unknown>> = (
  sqlPlan: DatabaseDetailSelectSqlPlan,
) => Promise<ServerDetailQueryResult<Row>> | ServerDetailQueryResult<Row>;

export type LiveReadModelExecutorResult<Row extends Record<string, unknown>> =
  | PublicReadModelListResponseResult<Row>
  | PublicReadModelDetailResponseResult<Row>;

export function createLiveReadModelJsonResponse<Row extends Record<string, unknown>>(
  result: LiveReadModelExecutorResult<Row>,
  json: DatabaseJsonResponse,
) {
  return result.ok
    ? json(result.response, 200)
    : json(result.rejection, 422);
}

export async function executeLiveModuleListReadModel<Row extends Record<string, unknown>>(
  execution: LiveModuleListExecutionContext,
  runQuery: DatabaseReadModelListQueryExecutor<Row>,
): Promise<PublicReadModelListResponseResult<Row>> {
  const sqlPlan = execution.createSqlPlan();
  const result = await runQuery(sqlPlan);

  return execution.createPublicResponse(result);
}

export async function executeLiveModuleListReadModelWithRowsClient<Row extends Record<string, unknown>>(
  execution: LiveModuleListExecutionContext,
  client: DatabaseReadModelRowsClient,
  options: Pick<ServerPageResult<Row>, "nextCursor" | "totalCount"> = {},
): Promise<PublicReadModelListResponseResult<Row>> {
  const sqlPlan = execution.createSqlPlan();
  const rows = await client.queryRows<Row>({
    queryKind: "list",
    moduleId: execution.moduleId,
    workspaceId: execution.workspaceId,
    resource: execution.resource,
    action: execution.action,
    sql: sqlPlan.sql,
    params: sqlPlan.params,
    maxRows: execution.maxRows,
    pageSize: sqlPlan.pageSize,
    offset: sqlPlan.offset,
  });

  return execution.createPublicResponse({
    rows,
    pageSize: execution.query.pageSize,
    nextCursor: options.nextCursor,
    totalCount: options.totalCount,
  });
}

export async function executeLiveModuleDetailReadModel<Row extends Record<string, unknown>>(
  execution: LiveModuleDetailExecutionContext,
  runQuery: DatabaseReadModelDetailQueryExecutor<Row>,
): Promise<PublicReadModelDetailResponseResult<Row>> {
  const sqlPlan = execution.createSqlPlan();
  const result = await runQuery(sqlPlan);

  return execution.createPublicResponse(result);
}

export async function executeLiveModuleDetailReadModelWithRowsClient<Row extends Record<string, unknown>>(
  execution: LiveModuleDetailExecutionContext,
  client: DatabaseReadModelRowsClient,
): Promise<PublicReadModelDetailResponseResult<Row>> {
  const sqlPlan = execution.createSqlPlan();
  const rows = await client.queryRows<Row>({
    queryKind: "detail",
    moduleId: execution.moduleId,
    workspaceId: execution.workspaceId,
    resource: execution.resource,
    action: execution.action,
    sql: sqlPlan.sql,
    params: sqlPlan.params,
    maxRows: execution.maxRows,
  });

  return execution.createPublicResponse({
    row: rows[0] ?? null,
    rowCount: rows.length,
  });
}
