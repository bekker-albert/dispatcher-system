import type { ServerDetailQueryEnvelope } from "../../domain/data-access/detailQueryEnvelope";
import type { ModuleDetailQueryPlan } from "../../domain/data-access/moduleDetailQueryPlans";
import { quoteMysqlColumnPath, quoteMysqlIdentifier } from "../../domain/data-access/mysqlIdentifiers";

export type DatabaseDetailSelectSqlPlan = {
  sql: string;
  selectSql: string;
  fromSql: string;
  whereSql: string;
  limitSql: "LIMIT 1";
  params: unknown[];
  maxRows: 1;
};

export function createDatabaseDetailSelectSqlPlan(
  envelope: ServerDetailQueryEnvelope,
  plan: ModuleDetailQueryPlan,
): DatabaseDetailSelectSqlPlan {
  const whereParts = [`${quoteMysqlColumnPath(plan.idColumn)} = ?`];
  const params: unknown[] = [envelope.id];

  for (const [scopeKey, scopeValue] of Object.entries(envelope.scope)) {
    const column = plan.scopeColumns[scopeKey as keyof typeof plan.scopeColumns];
    if (!column) continue;

    whereParts.push(`${quoteMysqlColumnPath(column)} = ?`);
    params.push(scopeValue);
  }

  const selectSql = `SELECT ${plan.selectColumns.map(quoteMysqlColumnPath).join(", ")}`;
  const fromSql = `FROM ${quoteMysqlIdentifier(plan.tableName)}`;
  const whereSql = `WHERE ${whereParts.join(" AND ")}`;
  const limitSql = "LIMIT 1" as const;
  const sql = [selectSql, fromSql, whereSql, limitSql].join(" ");

  return {
    sql,
    selectSql,
    fromSql,
    whereSql,
    limitSql,
    params,
    maxRows: 1,
  };
}
