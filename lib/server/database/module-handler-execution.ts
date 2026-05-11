import type { ServerDetailQueryResult } from "../../domain/data-access/detailQueryEnvelope";
import {
  createServerDetailQueryCacheKey,
  type ServerDetailQueryEnvelope,
} from "../../domain/data-access/detailQueryEnvelope";
import type { ServerListQueryEnvelope } from "../../domain/data-access/listQueryEnvelope";
import { createServerListQueryCacheKey } from "../../domain/data-access/listQueryEnvelope";
import type { ServerPageQuery, ServerPageResult } from "../../domain/data-access/pagination";
import {
  getModuleDetailQueryPlan,
  type ModuleDetailQueryPlan,
} from "../../domain/data-access/moduleDetailQueryPlans";
import {
  getModuleListQueryPlan,
  type ModuleListQueryPlan,
} from "../../domain/data-access/moduleListQueryPlans";
import {
  createPublicReadModelDetailResponse,
  createPublicReadModelListResponse,
  type PublicReadModelDetailResponseResult,
  type PublicReadModelListResponseResult,
} from "../../domain/data-access/readModelResponseEnvelope";
import { getWorkspaceModuleQueryPolicy } from "../../domain/data-access/workspaceQueryPolicies";
import { assertDatabaseListQueryPolicy } from "./query-policy";
import {
  createDatabaseListSelectSqlPlan,
  type DatabaseListSelectSqlPlan,
} from "./list-query-builder";
import {
  createDatabaseDetailSelectSqlPlan,
  type DatabaseDetailSelectSqlPlan,
} from "./detail-query-builder";
import { DatabasePayloadError, requirePayloadRecord } from "./validation";
import type { LiveModuleDatabaseHandlerContext } from "./module-live-handlers";

export type LiveModuleListExecutionContext = {
  moduleId: string;
  workspaceId: LiveModuleDatabaseHandlerContext["workspaceId"];
  resource: string;
  action: string;
  query: ServerPageQuery;
  plan: ModuleListQueryPlan;
  maxRows: number;
  requiresServerSideFilters: true;
  noClientFullScan: true;
  createPublicResponse: <Row extends Record<string, unknown>>(
    result: ServerPageResult<Row>,
  ) => PublicReadModelListResponseResult<Row>;
  createSqlPlan: () => DatabaseListSelectSqlPlan;
};

export type LiveModuleDetailExecutionContext = {
  moduleId: string;
  workspaceId: LiveModuleDatabaseHandlerContext["workspaceId"];
  resource: string;
  action: string;
  id: string;
  plan: ModuleDetailQueryPlan;
  maxRows: 1;
  requiresId: true;
  requiresScopeFilter: boolean;
  returnsVersion: boolean;
  expectedVersion?: number;
  createPublicResponse: <Row extends Record<string, unknown>>(
    result: ServerDetailQueryResult<Row>,
  ) => PublicReadModelDetailResponseResult<Row>;
  createSqlPlan: () => DatabaseDetailSelectSqlPlan;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getPayloadId(payload: Record<string, unknown>) {
  const directId = payload.id;
  if (typeof directId === "string" && directId.trim()) return directId.trim();
  if (typeof directId === "number" && Number.isFinite(directId)) return String(directId);

  const entity = payload.entity;
  if (!isRecord(entity)) return undefined;
  const entityId = entity.id;
  if (typeof entityId === "string" && entityId.trim()) return entityId.trim();
  if (typeof entityId === "number" && Number.isFinite(entityId)) return String(entityId);

  return undefined;
}

function normalizeExpectedVersion(value: unknown): number | undefined {
  const version = Number(value);
  return Number.isInteger(version) && version > 0 ? version : undefined;
}

function getDetailScope(payload: Record<string, unknown>, plan: ModuleDetailQueryPlan) {
  const payloadScope = isRecord(payload.scope) ? payload.scope : {};
  const scopeKeys = Object.keys(plan.scopeColumns);

  return scopeKeys.reduce<Record<string, string>>((scope, key) => {
    const scopedValue = payloadScope[key];
    const directValue = payload[key];
    const value = typeof scopedValue === "string" && scopedValue.trim()
      ? scopedValue.trim()
      : typeof directValue === "string" && directValue.trim()
        ? directValue.trim()
        : undefined;

    return value ? { ...scope, [key]: value } : scope;
  }, {});
}

function hasScopeFilterValue(payload: Record<string, unknown>, scopeKeys: string[]) {
  const scope = isRecord(payload.scope) ? payload.scope : {};

  return scopeKeys.some((key) => {
    const scopedValue = scope[key];
    const directValue = payload[key];

    return typeof scopedValue === "string" && scopedValue.trim()
      ? true
      : typeof directValue === "string" && directValue.trim();
  });
}

function assertMatchingListPlan(context: LiveModuleDatabaseHandlerContext) {
  const plan = getModuleListQueryPlan(context.moduleId);
  if (!plan || plan.resource !== context.resource || plan.databaseAction !== context.action) {
    throw new DatabasePayloadError(
      `Live module list handler has no matching list query plan for ${context.resource}/${context.action}.`,
    );
  }

  return plan;
}

function assertMatchingDetailPlan(context: LiveModuleDatabaseHandlerContext) {
  const plan = getModuleDetailQueryPlan(context.moduleId);
  if (!plan || plan.resource !== context.resource || plan.databaseAction !== context.action) {
    throw new DatabasePayloadError(
      `Live module detail handler has no matching detail query plan for ${context.resource}/${context.action}.`,
    );
  }

  return plan;
}

export function createLiveModuleListExecutionContext(
  context: LiveModuleDatabaseHandlerContext,
): LiveModuleListExecutionContext {
  const plan = assertMatchingListPlan(context);
  const queryPolicy = getWorkspaceModuleQueryPolicy(context.moduleId);
  if (!queryPolicy) {
    throw new DatabasePayloadError(
      `Live module list handler has no query policy for module ${context.moduleId}.`,
    );
  }

  const query = assertDatabaseListQueryPolicy(context.payload, queryPolicy.policy, context.moduleId);
  const listEnvelope: ServerListQueryEnvelope = {
    moduleId: context.moduleId,
    executionMode: "server-only",
    query,
    maxClientRows: query.pageSize,
    cacheKey: createServerListQueryCacheKey(context.moduleId, query),
  };

  return {
    moduleId: context.moduleId,
    workspaceId: context.workspaceId,
    resource: context.resource,
    action: context.action,
    query,
    plan,
    maxRows: query.pageSize,
    requiresServerSideFilters: true,
    noClientFullScan: true,
    createPublicResponse: (result) => createPublicReadModelListResponse(listEnvelope, result),
    createSqlPlan: () => createDatabaseListSelectSqlPlan(query, plan),
  };
}

export function createLiveModuleDetailExecutionContext(
  context: LiveModuleDatabaseHandlerContext,
): LiveModuleDetailExecutionContext {
  const plan = assertMatchingDetailPlan(context);
  const payload = requirePayloadRecord(context.payload, "payload");
  const id = getPayloadId(payload);
  if (!id) {
    throw new DatabasePayloadError(
      `Live module detail handler requires id for ${context.resource}/${context.action}.`,
    );
  }

  const scopeKeys = Object.keys(plan.scopeColumns);
  if (scopeKeys.length > 0 && !hasScopeFilterValue(payload, scopeKeys)) {
    throw new DatabasePayloadError(
      `Live module detail handler requires scope filter for ${context.resource}/${context.action}.`,
    );
  }
  const scope = getDetailScope(payload, plan);
  const expectedVersion = normalizeExpectedVersion(payload.expectedVersion);
  const detailEnvelope: ServerDetailQueryEnvelope = {
    moduleId: plan.moduleId,
    workspaceId: plan.workspaceId,
    resource: plan.resource,
    databaseAction: plan.databaseAction,
    executionMode: "server-only" as const,
    id,
    scope,
    expectedVersion,
    maxRows: 1 as const,
    returnsVersion: plan.returnsVersion,
    cacheKey: createServerDetailQueryCacheKey(plan.moduleId, id, scope, expectedVersion),
  };

  return {
    moduleId: context.moduleId,
    workspaceId: context.workspaceId,
    resource: context.resource,
    action: context.action,
    id,
    plan,
    maxRows: 1,
    requiresId: true,
    requiresScopeFilter: scopeKeys.length > 0,
    returnsVersion: plan.returnsVersion,
    expectedVersion,
    createPublicResponse: (result) => createPublicReadModelDetailResponse(detailEnvelope, result),
    createSqlPlan: () => createDatabaseDetailSelectSqlPlan(detailEnvelope, plan),
  };
}
