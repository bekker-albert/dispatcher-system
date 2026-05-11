import {
  createChangeHistoryEntries,
  type ChangeHistoryBatch,
  type ChangeHistoryEntry,
} from "./changeHistory";

export type ServerChangeHistoryIssueCode =
  | "entity_id_required"
  | "version_required"
  | "changed_at_required"
  | "changed_by_required"
  | "changes_required"
  | "reason_required"
  | "noop_history_forbidden"
  | "whole_table_history_forbidden";

export type ServerChangeHistoryIssue = {
  code: ServerChangeHistoryIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ServerChangeHistoryEnvelope<Value = unknown> = {
  workspaceId: ChangeHistoryBatch["workspaceId"];
  entityType: string;
  entityId: string;
  entityVersion: number;
  changedAt: string;
  changedBy: string;
  reasonKind: ChangeHistoryBatch["reasonKind"];
  reasonText?: string;
  capability: ChangeHistoryBatch["capability"];
  writesPerField: true;
  entryCount: number;
  entries: Array<Omit<ChangeHistoryEntry<Value>, "id">>;
};

export type ServerChangeHistoryRejection = {
  code: "change_history_invalid";
  message: string;
  issues: ServerChangeHistoryIssue[];
};

export type ServerChangeHistoryEnvelopeResult<Value = unknown> =
  | { ok: true; envelope: ServerChangeHistoryEnvelope<Value> }
  | { ok: false; rejection: ServerChangeHistoryRejection };

const reasonRequiredKinds: Array<ChangeHistoryBatch["reasonKind"]> = [
  "approval",
  "correction",
  "import",
  "return_for_revision",
  "undo",
];

const forbiddenWholeTableFields = new Set([
  "allrows",
  "dataset",
  "records",
  "rows",
  "table",
]);

function normalizeFieldName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isWholeTableField(field: string) {
  const normalizedField = normalizeFieldName(field);

  return [...forbiddenWholeTableFields].some((forbiddenField) => (
    normalizedField === forbiddenField || normalizedField.startsWith(forbiddenField)
  ));
}

function createRejection(issues: ServerChangeHistoryIssue[]): ServerChangeHistoryRejection {
  return {
    code: "change_history_invalid",
    message: "Change history batch does not satisfy the server-side audit contract.",
    issues,
  };
}

export function validateServerChangeHistoryDraft<Value>(
  batch: ChangeHistoryBatch<Value>,
): ServerChangeHistoryIssue[] {
  const issues: ServerChangeHistoryIssue[] = [];

  if (!batch.entity.id.trim()) {
    issues.push({
      code: "entity_id_required",
      severity: "blocker",
      message: "Change history must target one existing entity id.",
      field: "entity.id",
    });
  }

  if (!Number.isInteger(batch.entity.version) || batch.entity.version < 1) {
    issues.push({
      code: "version_required",
      severity: "blocker",
      message: "Change history must keep the written positive integer version.",
      field: "entity.version",
    });
  }

  if (!batch.changedAt.trim()) {
    issues.push({
      code: "changed_at_required",
      severity: "blocker",
      message: "Change history must keep the server write timestamp.",
      field: "changedAt",
    });
  }

  if (!batch.changedBy.trim()) {
    issues.push({
      code: "changed_by_required",
      severity: "blocker",
      message: "Change history must keep the user who made the change.",
      field: "changedBy",
    });
  }

  if (batch.changes.length === 0) {
    issues.push({
      code: "changes_required",
      severity: "blocker",
      message: "Change history must contain at least one field change.",
      field: "changes",
    });
  }

  if (reasonRequiredKinds.includes(batch.reasonKind) && !batch.reasonText?.trim()) {
    issues.push({
      code: "reason_required",
      severity: "blocker",
      message: "This change history reason kind requires a reason text.",
      field: "reasonText",
    });
  }

  batch.changes.forEach((change) => {
    if (Object.is(change.previousValue, change.nextValue)) {
      issues.push({
        code: "noop_history_forbidden",
        severity: "blocker",
        message: "Change history cannot store no-op field changes.",
        field: change.field,
      });
    }

    if (isWholeTableField(change.field)) {
      issues.push({
        code: "whole_table_history_forbidden",
        severity: "blocker",
        message: "Change history must be written per field, not for a whole table or dataset.",
        field: change.field,
      });
    }
  });

  return issues;
}

export function createServerChangeHistoryEnvelope<Value>(
  batch: ChangeHistoryBatch<Value>,
): ServerChangeHistoryEnvelopeResult<Value> {
  const issues = validateServerChangeHistoryDraft(batch);

  if (issues.length > 0) {
    return {
      ok: false,
      rejection: createRejection(issues),
    };
  }

  const entries = createChangeHistoryEntries(batch);

  return {
    ok: true,
    envelope: {
      workspaceId: batch.workspaceId,
      entityType: batch.entityType,
      entityId: batch.entity.id,
      entityVersion: batch.entity.version,
      changedAt: batch.changedAt,
      changedBy: batch.changedBy,
      reasonKind: batch.reasonKind,
      ...(batch.reasonText ? { reasonText: batch.reasonText } : {}),
      capability: batch.capability,
      writesPerField: true,
      entryCount: entries.length,
      entries,
    },
  };
}
