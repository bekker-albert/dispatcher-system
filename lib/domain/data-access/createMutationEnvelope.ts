import {
  getModuleCreateMutationPlan,
  type ModuleCreateMutationPlan,
  validateModuleCreatePayload,
} from "./moduleCreateMutationPlans";

export type CreateMutationPayload = Record<string, unknown>;

export type ServerCreateMutationIssueCode =
  | "create_plan_missing"
  | "payload_required"
  | "whole_table_create_forbidden"
  | "create_field_group_missing"
  | "duplicate_keys_required"
  | "initial_status_required";

export type ServerCreateMutationIssue = {
  code: ServerCreateMutationIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ServerCreateMutationEnvelope = {
  moduleId: string;
  workspaceId: ModuleCreateMutationPlan["workspaceId"];
  resource: string;
  databaseAction: string;
  executionMode: "server-only";
  initialVersion: 1;
  initialStatus: string;
  duplicateCheckRequired: true;
  duplicateKeyGroups: string[][];
  returnsCreatedEntityId: true;
  writesChangeHistory: true;
  data: CreateMutationPayload;
};

export type ServerCreateMutationRejection = {
  code: "create_mutation_invalid";
  message: string;
  issues: ServerCreateMutationIssue[];
};

export type ServerCreateMutationEnvelopeResult =
  | { ok: true; envelope: ServerCreateMutationEnvelope }
  | { ok: false; rejection: ServerCreateMutationRejection };

export type ServerCreateMutationDraft = {
  moduleId: string;
  data: CreateMutationPayload;
  plan?: ModuleCreateMutationPlan;
};

const forbiddenWholeTableFields = new Set([
  "allrows",
  "dataset",
  "items",
  "records",
  "rows",
  "table",
]);

function normalizePayloadFieldName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function hasPayloadValue(value: unknown) {
  if (typeof value === "string") return Boolean(value.trim());
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== undefined && value !== null;
}

function isWholeTablePayloadField(field: string) {
  const normalizedField = normalizePayloadFieldName(field);

  return [...forbiddenWholeTableFields].some((forbiddenField) => (
    normalizedField === forbiddenField || normalizedField.startsWith(forbiddenField)
  ));
}

function createRejection(issues: ServerCreateMutationIssue[]): ServerCreateMutationRejection {
  return {
    code: "create_mutation_invalid",
    message: "Create mutation does not satisfy the server-side document creation contract.",
    issues,
  };
}

export function validateServerCreateMutationDraft(
  draft: ServerCreateMutationDraft,
): ServerCreateMutationIssue[] {
  const plan = draft.plan ?? getModuleCreateMutationPlan(draft.moduleId);

  if (!plan) {
    return [{
      code: "create_plan_missing",
      severity: "blocker",
      message: "Module has no declared create mutation plan.",
    }];
  }

  const issues: ServerCreateMutationIssue[] = [];
  const fields = Object.keys(draft.data);

  if (fields.length === 0 || !fields.some((field) => hasPayloadValue(draft.data[field]))) {
    issues.push({
      code: "payload_required",
      severity: "blocker",
      message: "Create mutation must include a bounded document payload.",
      field: "data",
    });
  }

  fields.forEach((field) => {
    if (isWholeTablePayloadField(field)) {
      issues.push({
        code: "whole_table_create_forbidden",
        severity: "blocker",
        message: "Create mutation cannot accept a whole table or dataset field.",
        field,
      });
    }
  });

  validateModuleCreatePayload(plan, draft.data).forEach((issue) => {
    issues.push({
      code: issue.code,
      severity: "blocker",
      message: issue.message,
      field: issue.field,
    });
  });

  if (plan.duplicateKeyGroups.length === 0) {
    issues.push({
      code: "duplicate_keys_required",
      severity: "blocker",
      message: "Create mutation must declare duplicate-key checks.",
      field: "duplicateKeyGroups",
    });
  }

  if (!plan.initialStatus.trim()) {
    issues.push({
      code: "initial_status_required",
      severity: "blocker",
      message: "Create mutation must declare an initial status.",
      field: "initialStatus",
    });
  }

  return issues;
}

export function createServerCreateMutationEnvelope(
  draft: ServerCreateMutationDraft,
): ServerCreateMutationEnvelopeResult {
  const plan = draft.plan ?? getModuleCreateMutationPlan(draft.moduleId);
  const issues = validateServerCreateMutationDraft({ ...draft, plan });

  if (!plan || issues.length > 0) {
    return {
      ok: false,
      rejection: createRejection(issues),
    };
  }

  return {
    ok: true,
    envelope: {
      moduleId: plan.moduleId,
      workspaceId: plan.workspaceId,
      resource: plan.resource,
      databaseAction: plan.databaseAction,
      executionMode: "server-only",
      initialVersion: 1,
      initialStatus: plan.initialStatus,
      duplicateCheckRequired: true,
      duplicateKeyGroups: plan.duplicateKeyGroups,
      returnsCreatedEntityId: true,
      writesChangeHistory: true,
      data: draft.data,
    },
  };
}
