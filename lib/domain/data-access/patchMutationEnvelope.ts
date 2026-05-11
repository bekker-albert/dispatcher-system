import type { PatchSaveCommand } from "../editing/patchEditing";
import {
  getModulePatchMutationPlan,
  type ModulePatchMutationAction,
  type ModulePatchMutationPlan,
} from "./modulePatchMutationPlans";
import { validateModulePatchPayload } from "./modulePatchPayloadValidation";

export type ServerPatchMutationIssueCode =
  | "patch_plan_missing"
  | "entity_id_required"
  | "version_required"
  | "changes_required"
  | "whole_table_patch_forbidden"
  | "patch_field_not_allowed"
  | "reason_required";

export type ServerPatchMutationIssue = {
  code: ServerPatchMutationIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ServerPatchMutationEnvelope = {
  moduleId: string;
  action: ModulePatchMutationAction;
  workspaceId: ModulePatchMutationPlan["workspaceId"];
  resource: string;
  databaseAction: string;
  executionMode: "server-only";
  patchOnly: true;
  expectedVersion: number;
  entityId: string;
  changeCount: number;
  writesChangeHistory: true;
  reason?: string;
  patch: PatchSaveCommand;
};

export type ServerPatchMutationRejection = {
  code: "patch_mutation_invalid";
  message: string;
  issues: ServerPatchMutationIssue[];
};

export type ServerPatchMutationEnvelopeResult =
  | { ok: true; envelope: ServerPatchMutationEnvelope }
  | { ok: false; rejection: ServerPatchMutationRejection };

export type ServerPatchMutationDraft = {
  moduleId: string;
  action: ModulePatchMutationAction;
  patch: PatchSaveCommand;
  reason?: string;
  plan?: ModulePatchMutationPlan;
};

const forbiddenWholeTableFields = new Set([
  "allrows",
  "dataset",
  "records",
  "rows",
  "table",
]);

const maxPatchFieldChanges = 100;

function normalizePatchFieldName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getAuditReason(draft: ServerPatchMutationDraft) {
  return (draft.reason ?? draft.patch.reason)?.trim();
}

function isWholeTableField(field: string) {
  const normalizedField = normalizePatchFieldName(field);

  return [...forbiddenWholeTableFields].some((forbiddenField) => (
    normalizedField === forbiddenField || normalizedField.startsWith(forbiddenField)
  ));
}

function createRejection(issues: ServerPatchMutationIssue[]): ServerPatchMutationRejection {
  return {
    code: "patch_mutation_invalid",
    message: "Patch mutation does not satisfy the server-side versioned patch contract.",
    issues,
  };
}

export function validateServerPatchMutationDraft(
  draft: ServerPatchMutationDraft,
): ServerPatchMutationIssue[] {
  const plan = draft.plan ?? getModulePatchMutationPlan(draft.moduleId, draft.action);

  if (!plan) {
    return [{
      code: "patch_plan_missing",
      severity: "blocker",
      message: "Module action has no declared patch mutation plan.",
    }];
  }

  const issues: ServerPatchMutationIssue[] = [];
  const { patch } = draft;

  if (!patch.entity.id.trim()) {
    issues.push({
      code: "entity_id_required",
      severity: "blocker",
      message: "Patch mutation must target one existing entity id.",
      field: "entity.id",
    });
  }

  if (!Number.isInteger(patch.entity.version) || patch.entity.version < 1) {
    issues.push({
      code: "version_required",
      severity: "blocker",
      message: "Patch mutation must include the opened positive integer version.",
      field: "entity.version",
    });
  }

  if (patch.changes.length === 0) {
    issues.push({
      code: "changes_required",
      severity: "blocker",
      message: "Patch mutation must include at least one changed field.",
      field: "changes",
    });
  }

  if (patch.changes.length > maxPatchFieldChanges) {
    issues.push({
      code: "whole_table_patch_forbidden",
      severity: "blocker",
      message: "Patch mutation is too large for a single row/document save.",
      field: "changes",
    });
  }

  patch.changes.forEach((change) => {
    if (isWholeTableField(change.field)) {
      issues.push({
        code: "whole_table_patch_forbidden",
        severity: "blocker",
        message: "Patch mutation cannot save a whole table or dataset field.",
        field: change.field,
      });
    }
  });

  validateModulePatchPayload(plan, patch).forEach((issue) => {
    issues.push({
      code: issue.code,
      severity: "blocker",
      message: issue.message,
      field: issue.field,
    });
  });

  if (draft.action !== "edit" && !getAuditReason(draft)) {
    issues.push({
      code: "reason_required",
      severity: "blocker",
      message: "Workflow, delete, and admin patch actions must include an audit reason.",
      field: "reason",
    });
  }

  return issues;
}

export function createServerPatchMutationEnvelope(
  draft: ServerPatchMutationDraft,
): ServerPatchMutationEnvelopeResult {
  const plan = draft.plan ?? getModulePatchMutationPlan(draft.moduleId, draft.action);
  const issues = validateServerPatchMutationDraft({ ...draft, plan });

  if (!plan || issues.length > 0) {
    return {
      ok: false,
      rejection: createRejection(issues),
    };
  }

  const reason = getAuditReason(draft);

  return {
    ok: true,
    envelope: {
      moduleId: plan.moduleId,
      action: plan.action,
      workspaceId: plan.workspaceId,
      resource: plan.resource,
      databaseAction: plan.databaseAction,
      executionMode: "server-only",
      patchOnly: true,
      expectedVersion: draft.patch.entity.version,
      entityId: draft.patch.entity.id,
      changeCount: draft.patch.changes.length,
      writesChangeHistory: true,
      ...(reason ? { reason } : {}),
      patch: draft.patch,
    },
  };
}
