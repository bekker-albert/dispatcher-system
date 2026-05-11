import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import type { PatchSaveCommand, VersionedEntityReference } from "../editing/patchEditing";
import type { ChangeHistoryEntry } from "./changeHistory";

export type UndoableRecord = VersionedEntityReference & Record<string, unknown>;

export type UndoHistoryIssueCode =
  | "history_empty"
  | "edit_permission_required"
  | "reason_required"
  | "entity_mismatch"
  | "current_value_changed";

export type UndoHistoryIssue = {
  code: UndoHistoryIssueCode;
  field?: string;
  message: string;
};

export type UndoHistoryCommandResult =
  | { ok: true; command: PatchSaveCommand }
  | {
      ok: false;
      rejection: {
        code: "undo_not_allowed";
        message: string;
        issues: UndoHistoryIssue[];
      };
    };

export function createUndoPatchCommand(input: {
  entries: readonly ChangeHistoryEntry[];
  currentRecord: UndoableRecord;
  access: EffectiveAccessDecision;
  reason?: string;
}): UndoHistoryCommandResult {
  const issues = validateUndoHistory(input);

  if (issues.length > 0) {
    return {
      ok: false,
      rejection: {
        code: "undo_not_allowed",
        message: "Undo patch cannot be created safely.",
        issues,
      },
    };
  }

  const [firstEntry] = input.entries;

  return {
    ok: true,
    command: {
      entityType: firstEntry.entityType,
      entity: {
        id: input.currentRecord.id,
        version: input.currentRecord.version,
        updatedAt: input.currentRecord.updatedAt,
        updatedBy: input.currentRecord.updatedBy,
      },
      changes: input.entries.map((entry) => ({
        field: entry.field,
        previousValue: entry.newValue,
        nextValue: entry.oldValue,
      })),
      reason: input.reason,
    },
  };
}

export function validateUndoHistory(input: {
  entries: readonly ChangeHistoryEntry[];
  currentRecord: UndoableRecord;
  access: EffectiveAccessDecision;
  reason?: string;
}): UndoHistoryIssue[] {
  const issues: UndoHistoryIssue[] = [];

  if (!input.access.canEdit && !input.access.canAdmin) {
    issues.push({
      code: "edit_permission_required",
      message: "Edit permission is required to undo field changes.",
    });
  }

  if (!input.reason?.trim()) {
    issues.push({
      code: "reason_required",
      message: "Undo operation must keep a reason for audit.",
    });
  }

  if (input.entries.length === 0) {
    issues.push({
      code: "history_empty",
      message: "Undo operation requires at least one history entry.",
    });
    return issues;
  }

  const [firstEntry] = input.entries;
  for (const entry of input.entries) {
    if (entry.entityType !== firstEntry.entityType || entry.entity.id !== input.currentRecord.id) {
      issues.push({
        code: "entity_mismatch",
        field: entry.field,
        message: "Undo history entries must belong to the current entity.",
      });
      continue;
    }

    if (!Object.is(input.currentRecord[entry.field], entry.newValue)) {
      issues.push({
        code: "current_value_changed",
        field: entry.field,
        message: "Current field value differs from the history value; undo would overwrite another change.",
      });
    }
  }

  return issues;
}
