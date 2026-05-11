import type { ModuleDetailQueryPlan } from "./moduleDetailQueryPlans";
import { getModuleDetailQueryPlan } from "./moduleDetailQueryPlans";

export type ServerDetailQueryDraft = {
  id?: unknown;
  scope?: Record<string, unknown>;
  expectedVersion?: unknown;
};

export type ServerDetailQueryEnvelope = {
  moduleId: string;
  workspaceId: ModuleDetailQueryPlan["workspaceId"];
  resource: string;
  databaseAction: string;
  executionMode: "server-only";
  id: string;
  scope: Record<string, string>;
  expectedVersion?: number;
  maxRows: 1;
  returnsVersion: boolean;
  cacheKey: string;
};

export type ServerDetailQueryIssueCode =
  | "detail_plan_missing"
  | "id_required"
  | "scope_required"
  | "expected_version_invalid"
  | "row_count_exceeds_one"
  | "row_id_mismatch"
  | "version_missing";

export type ServerDetailQueryIssue = {
  code: ServerDetailQueryIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ServerDetailQueryEnvelopeResult =
  | { ok: true; envelope: ServerDetailQueryEnvelope }
  | {
      ok: false;
      rejection: {
        code: "detail_query_invalid";
        message: string;
        issues: ServerDetailQueryIssue[];
      };
    };

export type ServerDetailQueryResult<Row extends Record<string, unknown> = Record<string, unknown>> = {
  row?: Row | null;
  rowCount: number;
};

export function createServerDetailQueryEnvelope(input: {
  moduleId: string;
  draft: ServerDetailQueryDraft;
}): ServerDetailQueryEnvelopeResult {
  const plan = getModuleDetailQueryPlan(input.moduleId);
  const issues = validateServerDetailQueryDraft(input.moduleId, input.draft, plan);

  if (!plan || issues.length > 0) {
    return {
      ok: false,
      rejection: {
        code: "detail_query_invalid",
        message: "Server detail query cannot be executed safely.",
        issues,
      },
    };
  }

  const id = String(input.draft.id).trim();
  const scope = normalizeDetailScope(input.draft.scope ?? {}, plan);
  const expectedVersion = normalizeExpectedVersion(input.draft.expectedVersion);

  return {
    ok: true,
    envelope: {
      moduleId: plan.moduleId,
      workspaceId: plan.workspaceId,
      resource: plan.resource,
      databaseAction: plan.databaseAction,
      executionMode: "server-only",
      id,
      scope,
      expectedVersion,
      maxRows: 1,
      returnsVersion: plan.returnsVersion,
      cacheKey: createServerDetailQueryCacheKey(plan.moduleId, id, scope, expectedVersion),
    },
  };
}

export function validateServerDetailQueryDraft(
  moduleId: string,
  draft: ServerDetailQueryDraft,
  plan: ModuleDetailQueryPlan | undefined = getModuleDetailQueryPlan(moduleId),
): ServerDetailQueryIssue[] {
  const issues: ServerDetailQueryIssue[] = [];

  if (!plan) {
    issues.push({
      code: "detail_plan_missing",
      severity: "blocker",
      message: "Module has no server detail query plan.",
    });
    return issues;
  }

  if (!String(draft.id ?? "").trim()) {
    issues.push({
      code: "id_required",
      severity: "blocker",
      field: plan.idColumn,
      message: "Server detail query requires a single row id.",
    });
  }

  if (Object.keys(plan.scopeColumns).length > 0 && Object.keys(normalizeDetailScope(draft.scope ?? {}, plan)).length === 0) {
    issues.push({
      code: "scope_required",
      severity: "blocker",
      message: "Server detail query requires at least one declared scope filter.",
    });
  }

  if (draft.expectedVersion !== undefined && normalizeExpectedVersion(draft.expectedVersion) === undefined) {
    issues.push({
      code: "expected_version_invalid",
      severity: "blocker",
      field: "expectedVersion",
      message: "Expected version must be a positive integer when provided.",
    });
  }

  return issues;
}

export function validateServerDetailResult<Row extends Record<string, unknown>>(
  envelope: ServerDetailQueryEnvelope,
  result: ServerDetailQueryResult<Row>,
): ServerDetailQueryIssue[] {
  const issues: ServerDetailQueryIssue[] = [];

  if (result.rowCount > 1) {
    issues.push({
      code: "row_count_exceeds_one",
      severity: "blocker",
      message: "Server detail query returned more than one row.",
    });
  }

  if (result.row && String(result.row.id ?? "") !== envelope.id) {
    issues.push({
      code: "row_id_mismatch",
      severity: "blocker",
      field: "id",
      message: "Server detail result id does not match requested id.",
    });
  }

  if (envelope.returnsVersion && result.row && typeof result.row.version !== "number") {
    issues.push({
      code: "version_missing",
      severity: "blocker",
      field: "version",
      message: "Versioned detail result must include numeric version.",
    });
  }

  return issues;
}

export function createServerDetailQueryCacheKey(
  moduleId: string,
  id: string,
  scope: Record<string, string>,
  expectedVersion?: number,
): string {
  return JSON.stringify({
    moduleId,
    id,
    scope: createStableRecord(scope),
    expectedVersion: expectedVersion ?? null,
  });
}

function normalizeDetailScope(
  scope: Record<string, unknown>,
  plan: ModuleDetailQueryPlan,
): Record<string, string> {
  const allowedKeys = new Set(Object.keys(plan.scopeColumns));
  return Object.entries(scope).reduce<Record<string, string>>((normalized, [key, value]) => {
    const stringValue = typeof value === "string" ? value.trim() : "";
    if (!allowedKeys.has(key) || !stringValue) {
      return normalized;
    }

    return {
      ...normalized,
      [key]: stringValue,
    };
  }, {});
}

function normalizeExpectedVersion(value: unknown): number | undefined {
  const version = Number(value);
  return Number.isInteger(version) && version > 0 ? version : undefined;
}

function createStableRecord(record: Record<string, string>): Record<string, string> {
  return Object.keys(record)
    .sort((left, right) => left.localeCompare(right))
    .reduce<Record<string, string>>((stable, key) => ({
      ...stable,
      [key]: record[key],
    }), {});
}
