import type { ServerChangeHistoryEnvelope } from "../audit/changeHistoryEnvelope";
import type { ServerCreateMutationEnvelope } from "./createMutationEnvelope";
import type { ServerPatchMutationEnvelope } from "./patchMutationEnvelope";

export type ServerWriteTransactionIssueCode =
  | "actor_required"
  | "actor_mismatch"
  | "create_entity_id_required"
  | "duplicate_check_required"
  | "history_required"
  | "history_change_count_mismatch"
  | "history_entity_mismatch"
  | "history_workspace_mismatch"
  | "multi_entity_write_forbidden"
  | "version_mismatch";

export type ServerWriteTransactionIssue = {
  code: ServerWriteTransactionIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ServerWriteTransactionStep = {
  kind: "change-history" | "duplicate-check" | "entity-insert" | "entity-patch";
  tableRole: "audit" | "entity" | "unique-check";
  expectedRowCount: number;
  requiresVersionMatch?: true;
};

export type ServerPatchWriteTransactionEnvelope = {
  transactionKind: "versioned-patch-with-history";
  executionMode: "server-only";
  atomic: true;
  moduleId: string;
  workspaceId: ServerPatchMutationEnvelope["workspaceId"];
  databaseAction: string;
  actorId: string;
  entityId: string;
  expectedVersion: number;
  nextVersion: number;
  changeCount: number;
  maxEntityRowWrites: 1;
  writesChangeHistory: true;
  steps: [ServerWriteTransactionStep, ServerWriteTransactionStep];
};

export type ServerCreateWriteTransactionEnvelope = {
  transactionKind: "versioned-create-with-history";
  executionMode: "server-only";
  atomic: true;
  moduleId: string;
  workspaceId: ServerCreateMutationEnvelope["workspaceId"];
  databaseAction: string;
  actorId: string;
  entityId: string;
  initialVersion: 1;
  initialStatus: string;
  duplicateCheckRequired: true;
  duplicateKeyGroupCount: number;
  changeCount: number;
  maxEntityRowWrites: 1;
  writesChangeHistory: true;
  steps: [ServerWriteTransactionStep, ServerWriteTransactionStep, ServerWriteTransactionStep];
};

export type ServerWriteTransactionEnvelope =
  | ServerPatchWriteTransactionEnvelope
  | ServerCreateWriteTransactionEnvelope;

export type ServerWriteTransactionRejection = {
  code: "write_transaction_invalid";
  message: string;
  issues: ServerWriteTransactionIssue[];
};

export type ServerWriteTransactionEnvelopeResult =
  | { ok: true; envelope: ServerWriteTransactionEnvelope }
  | { ok: false; rejection: ServerWriteTransactionRejection };

export type ServerPatchWriteTransactionDraft = {
  actorId: string;
  patchEnvelope: ServerPatchMutationEnvelope;
  historyEnvelope?: ServerChangeHistoryEnvelope;
};

export type ServerCreateWriteTransactionDraft = {
  actorId: string;
  generatedEntityId: string;
  createEnvelope: ServerCreateMutationEnvelope;
  historyEnvelope?: ServerChangeHistoryEnvelope;
};

function createRejection(
  issues: ServerWriteTransactionIssue[],
): ServerWriteTransactionRejection {
  return {
    code: "write_transaction_invalid",
    message: "Write transaction does not satisfy the atomic versioned-write contract.",
    issues,
  };
}

export function validateServerPatchWriteTransactionDraft(
  draft: ServerPatchWriteTransactionDraft,
): ServerWriteTransactionIssue[] {
  const issues: ServerWriteTransactionIssue[] = [];
  const actorId = draft.actorId.trim();
  const { patchEnvelope, historyEnvelope } = draft;

  if (!actorId) {
    issues.push({
      code: "actor_required",
      severity: "blocker",
      message: "Write transaction must keep the server actor id.",
      field: "actorId",
    });
  }

  if (patchEnvelope.changeCount < 1 || patchEnvelope.patch.changes.length !== patchEnvelope.changeCount) {
    issues.push({
      code: "multi_entity_write_forbidden",
      severity: "blocker",
      message: "Write transaction must describe one bounded entity patch.",
      field: "patchEnvelope.changeCount",
    });
  }

  if (!historyEnvelope) {
    issues.push({
      code: "history_required",
      severity: "blocker",
      message: "Versioned write transaction must include a change-history envelope.",
      field: "historyEnvelope",
    });
    return issues;
  }

  if (historyEnvelope.workspaceId !== patchEnvelope.workspaceId) {
    issues.push({
      code: "history_workspace_mismatch",
      severity: "blocker",
      message: "Change history workspace must match the patched module workspace.",
      field: "historyEnvelope.workspaceId",
    });
  }

  if (historyEnvelope.entityId !== patchEnvelope.entityId) {
    issues.push({
      code: "history_entity_mismatch",
      severity: "blocker",
      message: "Change history entity id must match the patched entity id.",
      field: "historyEnvelope.entityId",
    });
  }

  if (historyEnvelope.changedBy !== actorId) {
    issues.push({
      code: "actor_mismatch",
      severity: "blocker",
      message: "Change history actor must match the write transaction actor.",
      field: "historyEnvelope.changedBy",
    });
  }

  if (historyEnvelope.entryCount !== patchEnvelope.changeCount) {
    issues.push({
      code: "history_change_count_mismatch",
      severity: "blocker",
      message: "Change history must contain one entry for every patched field.",
      field: "historyEnvelope.entryCount",
    });
  }

  if (historyEnvelope.entityVersion !== patchEnvelope.expectedVersion + 1) {
    issues.push({
      code: "version_mismatch",
      severity: "blocker",
      message: "Change history must reference the version written by the entity patch.",
      field: "historyEnvelope.entityVersion",
    });
  }

  return issues;
}

export function createServerPatchWriteTransactionEnvelope(
  draft: ServerPatchWriteTransactionDraft,
): ServerWriteTransactionEnvelopeResult {
  const issues = validateServerPatchWriteTransactionDraft(draft);
  const actorId = draft.actorId.trim();

  if (issues.length > 0 || !draft.historyEnvelope || !actorId) {
    return {
      ok: false,
      rejection: createRejection(issues),
    };
  }

  return {
    ok: true,
    envelope: {
      transactionKind: "versioned-patch-with-history",
      executionMode: "server-only",
      atomic: true,
      moduleId: draft.patchEnvelope.moduleId,
      workspaceId: draft.patchEnvelope.workspaceId,
      databaseAction: draft.patchEnvelope.databaseAction,
      actorId,
      entityId: draft.patchEnvelope.entityId,
      expectedVersion: draft.patchEnvelope.expectedVersion,
      nextVersion: draft.historyEnvelope.entityVersion,
      changeCount: draft.patchEnvelope.changeCount,
      maxEntityRowWrites: 1,
      writesChangeHistory: true,
      steps: [
        {
          kind: "entity-patch",
          tableRole: "entity",
          expectedRowCount: 1,
          requiresVersionMatch: true,
        },
        {
          kind: "change-history",
          tableRole: "audit",
          expectedRowCount: draft.historyEnvelope.entryCount,
        },
      ],
    },
  };
}

export function validateServerCreateWriteTransactionDraft(
  draft: ServerCreateWriteTransactionDraft,
): ServerWriteTransactionIssue[] {
  const issues: ServerWriteTransactionIssue[] = [];
  const actorId = draft.actorId.trim();
  const generatedEntityId = draft.generatedEntityId.trim();
  const { createEnvelope, historyEnvelope } = draft;

  if (!actorId) {
    issues.push({
      code: "actor_required",
      severity: "blocker",
      message: "Write transaction must keep the server actor id.",
      field: "actorId",
    });
  }

  if (!generatedEntityId) {
    issues.push({
      code: "create_entity_id_required",
      severity: "blocker",
      message: "Create transaction must keep the generated entity id before writing history.",
      field: "generatedEntityId",
    });
  }

  if (!createEnvelope.duplicateCheckRequired || createEnvelope.duplicateKeyGroups.length === 0) {
    issues.push({
      code: "duplicate_check_required",
      severity: "blocker",
      message: "Create transaction must run duplicate checks inside the same operation.",
      field: "duplicateKeyGroups",
    });
  }

  if (!historyEnvelope) {
    issues.push({
      code: "history_required",
      severity: "blocker",
      message: "Create transaction must include the initial change-history envelope.",
      field: "historyEnvelope",
    });
    return issues;
  }

  if (historyEnvelope.workspaceId !== createEnvelope.workspaceId) {
    issues.push({
      code: "history_workspace_mismatch",
      severity: "blocker",
      message: "Initial change history workspace must match the created module workspace.",
      field: "historyEnvelope.workspaceId",
    });
  }

  if (historyEnvelope.entityId !== generatedEntityId) {
    issues.push({
      code: "history_entity_mismatch",
      severity: "blocker",
      message: "Initial change history entity id must match the generated entity id.",
      field: "historyEnvelope.entityId",
    });
  }

  if (historyEnvelope.changedBy !== actorId) {
    issues.push({
      code: "actor_mismatch",
      severity: "blocker",
      message: "Initial change history actor must match the create transaction actor.",
      field: "historyEnvelope.changedBy",
    });
  }

  if (historyEnvelope.entryCount < 1) {
    issues.push({
      code: "history_change_count_mismatch",
      severity: "blocker",
      message: "Create transaction must write initial history for created fields.",
      field: "historyEnvelope.entryCount",
    });
  }

  if (historyEnvelope.entityVersion !== createEnvelope.initialVersion) {
    issues.push({
      code: "version_mismatch",
      severity: "blocker",
      message: "Initial change history must reference the created entity version.",
      field: "historyEnvelope.entityVersion",
    });
  }

  return issues;
}

export function createServerCreateWriteTransactionEnvelope(
  draft: ServerCreateWriteTransactionDraft,
): ServerWriteTransactionEnvelopeResult {
  const issues = validateServerCreateWriteTransactionDraft(draft);
  const actorId = draft.actorId.trim();
  const entityId = draft.generatedEntityId.trim();

  if (issues.length > 0 || !draft.historyEnvelope || !actorId || !entityId) {
    return {
      ok: false,
      rejection: createRejection(issues),
    };
  }

  return {
    ok: true,
    envelope: {
      transactionKind: "versioned-create-with-history",
      executionMode: "server-only",
      atomic: true,
      moduleId: draft.createEnvelope.moduleId,
      workspaceId: draft.createEnvelope.workspaceId,
      databaseAction: draft.createEnvelope.databaseAction,
      actorId,
      entityId,
      initialVersion: 1,
      initialStatus: draft.createEnvelope.initialStatus,
      duplicateCheckRequired: true,
      duplicateKeyGroupCount: draft.createEnvelope.duplicateKeyGroups.length,
      changeCount: draft.historyEnvelope.entryCount,
      maxEntityRowWrites: 1,
      writesChangeHistory: true,
      steps: [
        {
          kind: "duplicate-check",
          tableRole: "unique-check",
          expectedRowCount: 0,
        },
        {
          kind: "entity-insert",
          tableRole: "entity",
          expectedRowCount: 1,
        },
        {
          kind: "change-history",
          tableRole: "audit",
          expectedRowCount: draft.historyEnvelope.entryCount,
        },
      ],
    },
  };
}
