import type { AccessCapability } from "../access-control/accessMatrix";
import type { ChangeHistoryBatch, ChangeHistoryReasonKind } from "../audit/changeHistory";
import type {
  PatchSaveCommand,
  PatchSaveConflict,
  PatchSaveResult,
  VersionedEntityReference,
} from "./patchEditing";

export type VersionedPatchRecord = VersionedEntityReference & Record<string, unknown>;

export type PatchAuditContext = {
  workspaceId: ChangeHistoryBatch["workspaceId"];
  changedAt: string;
  changedBy: string;
  reasonKind: ChangeHistoryReasonKind;
  reasonText?: string;
  capability: AccessCapability;
};

export type VersionedPatchSaveEvaluation =
  | {
      ok: true;
      saveResult: PatchSaveResult;
      auditBatch: ChangeHistoryBatch;
    }
  | {
      ok: false;
      conflict: PatchSaveConflict;
    };

export const createPatchChangeHistoryBatch = (
  command: PatchSaveCommand,
  context: PatchAuditContext,
): ChangeHistoryBatch => ({
  id: `${command.entityType}:${command.entity.id}:${command.entity.version}:${context.changedAt}`,
  workspaceId: context.workspaceId,
  entityType: command.entityType,
  entity: command.entity,
  changes: command.changes,
  changedAt: context.changedAt,
  changedBy: context.changedBy,
  reasonKind: context.reasonKind,
  reasonText: context.reasonText ?? command.reason,
  capability: context.capability,
});

export const createPatchSaveConflict = (
  command: PatchSaveCommand,
  currentRecord: VersionedPatchRecord,
): PatchSaveConflict => ({
  entityType: command.entityType,
  id: command.entity.id,
  openedVersion: command.entity.version,
  currentVersion: currentRecord.version,
  serverChanges: command.changes.map((change) => ({
    field: change.field,
    previousValue: change.previousValue,
    nextValue: currentRecord[change.field],
  })),
  attemptedChanges: command.changes,
});

export const evaluateVersionedPatchSave = (
  command: PatchSaveCommand,
  currentRecord: VersionedPatchRecord,
  context: PatchAuditContext,
): VersionedPatchSaveEvaluation => {
  if (command.entity.version !== currentRecord.version) {
    return {
      ok: false,
      conflict: createPatchSaveConflict(command, currentRecord),
    };
  }

  const nextVersion = currentRecord.version + 1;

  return {
    ok: true,
    saveResult: {
      id: command.entity.id,
      version: nextVersion,
      updatedAt: context.changedAt,
      updatedBy: context.changedBy,
    },
    auditBatch: createPatchChangeHistoryBatch(
      {
        ...command,
        entity: {
          ...command.entity,
          version: nextVersion,
        },
      },
      context,
    ),
  };
};
