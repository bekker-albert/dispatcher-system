import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import type { PatchSaveCommand } from "../editing/patchEditing";
import {
  getModuleWorkflowTransitionBinding,
  type ModuleWorkflowTransitionIssue,
  validateModuleWorkflowTransitionPayload,
} from "./moduleWorkflowTransitions";
import {
  createServerPatchMutationEnvelope,
  type ServerPatchMutationEnvelope,
  type ServerPatchMutationIssue,
} from "./patchMutationEnvelope";

export type ServerWorkflowTransitionIssueCode =
  | ModuleWorkflowTransitionIssue["code"]
  | ServerPatchMutationIssue["code"]
  | "workflow_access_required";

export type ServerWorkflowTransitionIssue = {
  code: ServerWorkflowTransitionIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ServerWorkflowTransitionEnvelope = {
  moduleId: string;
  workspaceId: ServerPatchMutationEnvelope["workspaceId"];
  resource: string;
  databaseAction: string;
  workflowId: string;
  executionMode: "server-only";
  patchOnly: true;
  expectedVersion: number;
  entityId: string;
  currentStatus: string;
  nextStatus: string;
  requestedByGrantIds: string[];
  writesChangeHistory: true;
  reason: string;
  patchEnvelope: ServerPatchMutationEnvelope;
};

export type ServerWorkflowTransitionRejection = {
  code: "workflow_transition_invalid";
  message: string;
  issues: ServerWorkflowTransitionIssue[];
};

export type ServerWorkflowTransitionEnvelopeResult =
  | { ok: true; envelope: ServerWorkflowTransitionEnvelope }
  | { ok: false; rejection: ServerWorkflowTransitionRejection };

export type ServerWorkflowTransitionDraft = {
  moduleId: string;
  patch: PatchSaveCommand;
  access: EffectiveAccessDecision;
  reason?: string;
};

function createRejection(
  issues: ServerWorkflowTransitionIssue[],
): ServerWorkflowTransitionRejection {
  return {
    code: "workflow_transition_invalid",
    message: "Workflow transition does not satisfy the server-side status transition contract.",
    issues,
  };
}

function getStatusPatch(patch: PatchSaveCommand) {
  const statusChange = patch.changes.find((change) => change.field === "status");

  return {
    currentStatus: typeof statusChange?.previousValue === "string" ? statusChange.previousValue : undefined,
    nextStatus: typeof statusChange?.nextValue === "string" ? statusChange.nextValue : undefined,
  };
}

function hasWorkflowMutationAccess(access: EffectiveAccessDecision) {
  return access.canEdit || access.canApprove || access.canAdmin;
}

export function validateServerWorkflowTransitionDraft(
  draft: ServerWorkflowTransitionDraft,
): ServerWorkflowTransitionIssue[] {
  const issues: ServerWorkflowTransitionIssue[] = [];
  const patchEnvelopeResult = createServerPatchMutationEnvelope({
    moduleId: draft.moduleId,
    action: "approve",
    patch: draft.patch,
    reason: draft.reason,
  });

  if (!patchEnvelopeResult.ok) {
    patchEnvelopeResult.rejection.issues.forEach((issue) => {
      issues.push(issue);
    });
  }

  if (!hasWorkflowMutationAccess(draft.access)) {
    issues.push({
      code: "workflow_access_required",
      severity: "blocker",
      message: "Workflow transition requires edit, approval, or admin access.",
      field: "access",
    });
  }

  validateModuleWorkflowTransitionPayload({
    moduleId: draft.moduleId,
    patch: draft.patch,
    access: draft.access,
    reason: draft.reason,
  }).forEach((issue) => {
    issues.push({
      ...issue,
      severity: "blocker",
    });
  });

  return issues;
}

export function createServerWorkflowTransitionEnvelope(
  draft: ServerWorkflowTransitionDraft,
): ServerWorkflowTransitionEnvelopeResult {
  const issues = validateServerWorkflowTransitionDraft(draft);
  const patchEnvelopeResult = createServerPatchMutationEnvelope({
    moduleId: draft.moduleId,
    action: "approve",
    patch: draft.patch,
    reason: draft.reason,
  });
  const binding = getModuleWorkflowTransitionBinding(draft.moduleId);
  const { currentStatus, nextStatus } = getStatusPatch(draft.patch);
  const reason = (draft.reason ?? draft.patch.reason)?.trim();

  if (!patchEnvelopeResult.ok || !binding || !currentStatus || !nextStatus || !reason || issues.length > 0) {
    return {
      ok: false,
      rejection: createRejection(issues),
    };
  }

  return {
    ok: true,
    envelope: {
      moduleId: patchEnvelopeResult.envelope.moduleId,
      workspaceId: patchEnvelopeResult.envelope.workspaceId,
      resource: patchEnvelopeResult.envelope.resource,
      databaseAction: patchEnvelopeResult.envelope.databaseAction,
      workflowId: binding.workflowId,
      executionMode: "server-only",
      patchOnly: true,
      expectedVersion: patchEnvelopeResult.envelope.expectedVersion,
      entityId: patchEnvelopeResult.envelope.entityId,
      currentStatus,
      nextStatus,
      requestedByGrantIds: draft.access.matchedGrantIds,
      writesChangeHistory: true,
      reason,
      patchEnvelope: patchEnvelopeResult.envelope,
    },
  };
}
