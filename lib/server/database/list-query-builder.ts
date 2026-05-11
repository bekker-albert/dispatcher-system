import type { RequiredFilterKey, ServerPageQuery } from "../../domain/data-access/pagination";
import type { ModuleListQueryPlan } from "../../domain/data-access/moduleListQueryPlans";
import { quoteMysqlColumnPath, quoteMysqlIdentifier } from "../../domain/data-access/mysqlIdentifiers";

export type DatabaseListQueryColumnMap = Partial<Record<RequiredFilterKey, string>> & {
  date?: string;
};

export type DatabaseListQuerySortMap = Record<string, string>;

export type DatabaseListQuerySqlPlan = {
  whereSql: string;
  orderBySql: string;
  limitSql: string;
  params: unknown[];
  pageSize: number;
  offset: number;
};

export type DatabaseListSelectSqlPlan = DatabaseListQuerySqlPlan & {
  sql: string;
  selectSql: string;
  fromSql: string;
};

export type DatabaseListQuerySqlPlanConfig = {
  filterColumns: DatabaseListQueryColumnMap;
  searchColumns?: string[];
  sortColumns?: DatabaseListQuerySortMap;
  defaultSort?: {
    field: string;
    direction: "asc" | "desc";
  };
};

function isFilledFilterValue(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

function normalizeFilterValue(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}

function getDateRange(query: ServerPageQuery) {
  const date = query.filters.date;
  if (isFilledFilterValue(date)) {
    return { mode: "exact" as const, params: [normalizeFilterValue(date)] };
  }

  const dateFrom = query.filters.date_from ?? query.filters.dateFrom;
  const dateTo = query.filters.date_to ?? query.filters.dateTo;
  if (isFilledFilterValue(dateFrom) && isFilledFilterValue(dateTo)) {
    return {
      mode: "range" as const,
      params: [normalizeFilterValue(dateFrom), normalizeFilterValue(dateTo)],
    };
  }

  return undefined;
}

function createSortSql(
  query: ServerPageQuery,
  config: DatabaseListQuerySqlPlanConfig,
) {
  const requestedSortColumn = query.sort?.field
    ? config.sortColumns?.[query.sort.field]
    : undefined;
  const fallbackSortColumn = config.defaultSort
    ? config.sortColumns?.[config.defaultSort.field]
    : undefined;
  const sortColumn = requestedSortColumn ?? fallbackSortColumn;
  if (!sortColumn) return "";

  const direction = requestedSortColumn
    ? query.sort?.direction ?? "asc"
    : config.defaultSort?.direction ?? "asc";

  return `ORDER BY ${quoteMysqlColumnPath(sortColumn)} ${direction.toUpperCase()}`;
}

export function createDatabaseListQuerySqlPlan(
  query: ServerPageQuery,
  config: DatabaseListQuerySqlPlanConfig,
): DatabaseListQuerySqlPlan {
  const whereParts: string[] = [];
  const params: unknown[] = [];

  const dateColumn = config.filterColumns.date;
  const dateRange = dateColumn ? getDateRange(query) : undefined;
  if (dateColumn && dateRange?.mode === "exact") {
    whereParts.push(`${quoteMysqlColumnPath(dateColumn)} = ?`);
    params.push(...dateRange.params);
  } else if (dateColumn && dateRange?.mode === "range") {
    whereParts.push(`${quoteMysqlColumnPath(dateColumn)} BETWEEN ? AND ?`);
    params.push(...dateRange.params);
  }

  for (const [filterKey, column] of Object.entries(config.filterColumns)) {
    if (filterKey === "date" || !column) continue;

    const value = query.filters[filterKey];
    if (!isFilledFilterValue(value)) continue;

    whereParts.push(`${quoteMysqlColumnPath(column)} = ?`);
    params.push(normalizeFilterValue(value));
  }

  const search = query.search?.trim();
  if (search && config.searchColumns?.length) {
    const searchParts = config.searchColumns.map((column) => `${quoteMysqlColumnPath(column)} LIKE ?`);
    whereParts.push(`(${searchParts.join(" OR ")})`);
    params.push(...config.searchColumns.map(() => `%${search}%`));
  }

  const offset = query.offset ?? 0;

  return {
    whereSql: whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "",
    orderBySql: createSortSql(query, config),
    limitSql: "LIMIT ? OFFSET ?",
    params: [...params, query.pageSize, offset],
    pageSize: query.pageSize,
    offset,
  };
}

export function createDatabaseListSelectSqlPlan(
  query: ServerPageQuery,
  plan: ModuleListQueryPlan,
): DatabaseListSelectSqlPlan {
  const sqlPlan = createDatabaseListQuerySqlPlan(query, {
    filterColumns: plan.filterColumns,
    searchColumns: plan.searchColumns,
    sortColumns: plan.sortColumns,
    defaultSort: plan.defaultSort,
  });
  const selectSql = `SELECT ${plan.selectColumns.map(quoteMysqlColumnPath).join(", ")}`;
  const fromSql = `FROM ${quoteMysqlIdentifier(plan.tableName)}`;
  const sql = [
    selectSql,
    fromSql,
    sqlPlan.whereSql,
    sqlPlan.orderBySql,
    sqlPlan.limitSql,
  ].filter(Boolean).join(" ");

  return {
    ...sqlPlan,
    sql,
    selectSql,
    fromSql,
  };
}
