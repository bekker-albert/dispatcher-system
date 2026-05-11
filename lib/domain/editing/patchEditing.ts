export type VersionedEntityReference = {
  id: string;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
};

export type PatchFieldChange<Value = unknown> = {
  field: string;
  previousValue?: Value;
  nextValue: Value;
};

export type PatchSaveCommand<Value = unknown> = {
  entityType: string;
  entity: VersionedEntityReference;
  changes: Array<PatchFieldChange<Value>>;
  reason?: string;
};

export type PatchSaveResult = {
  id: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
};

export type PatchSaveConflict<Value = unknown> = {
  entityType: string;
  id: string;
  openedVersion: number;
  currentVersion: number;
  serverChanges: Array<PatchFieldChange<Value>>;
  attemptedChanges: Array<PatchFieldChange<Value>>;
};

export type ChangeHistoryEntry<Value = unknown> = {
  id: string;
  entityType: string;
  entityId: string;
  version: number;
  field: string;
  oldValue?: Value;
  newValue?: Value;
  reason?: string;
  changedAt: string;
  changedBy: string;
};

export function isPatchSaveNoop(command: PatchSaveCommand) {
  return command.changes.length === 0;
}

export function createPatchFieldChanges<RecordValue extends Record<string, unknown>>(
  previous: RecordValue,
  next: RecordValue,
  editableFields: Array<Extract<keyof RecordValue, string>>,
): Array<PatchFieldChange> {
  return editableFields.flatMap((field) => (
    Object.is(previous[field], next[field])
      ? []
      : [{
        field,
        previousValue: previous[field],
        nextValue: next[field],
      }]
  ));
}

export function applyPatchFieldChanges<RecordValue extends Record<string, unknown>>(
  record: RecordValue,
  changes: Array<PatchFieldChange>,
): RecordValue {
  return changes.reduce(
    (nextRecord, change) => ({
      ...nextRecord,
      [change.field]: change.nextValue,
    }),
    record,
  );
}
