import type { AccessCapability } from "@/lib/domain/access-control/accessMatrix";
import type { PatchFieldChange, VersionedEntityReference } from "@/lib/domain/editing/patchEditing";
import type { DispatchWorkspaceId } from "@/lib/domain/workspaces/workspaces";

export type ChangeHistoryReasonKind =
  | "user_edit"
  | "approval"
  | "return_for_revision"
  | "correction"
  | "import"
  | "system_recalculation"
  | "undo";

export type ChangeHistoryEntry<Value = unknown> = {
  id: string;
  workspaceId: DispatchWorkspaceId;
  entityType: string;
  entity: VersionedEntityReference;
  field: string;
  oldValue?: Value;
  newValue?: Value;
  changedAt: string;
  changedBy: string;
  reasonKind: ChangeHistoryReasonKind;
  reasonText?: string;
  capability: AccessCapability;
  relatedDocumentId?: string;
};

export type ChangeHistoryBatch<Value = unknown> = {
  id: string;
  workspaceId: DispatchWorkspaceId;
  entityType: string;
  entity: VersionedEntityReference;
  changes: Array<PatchFieldChange<Value>>;
  changedAt: string;
  changedBy: string;
  reasonKind: ChangeHistoryReasonKind;
  reasonText?: string;
  capability: AccessCapability;
};

export function createChangeHistoryEntries<Value>(
  batch: ChangeHistoryBatch<Value>,
): Array<Omit<ChangeHistoryEntry<Value>, "id">> {
  return batch.changes.map((change) => ({
    workspaceId: batch.workspaceId,
    entityType: batch.entityType,
    entity: batch.entity,
    field: change.field,
    oldValue: change.previousValue,
    newValue: change.nextValue,
    changedAt: batch.changedAt,
    changedBy: batch.changedBy,
    reasonKind: batch.reasonKind,
    reasonText: batch.reasonText,
    capability: batch.capability,
  }));
}
