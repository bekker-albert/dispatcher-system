import assert from "node:assert/strict";
import { createChangeHistoryEntries } from "../lib/domain/audit/changeHistory";
import {
  createServerChangeHistoryEnvelope,
  validateServerChangeHistoryDraft,
} from "../lib/domain/audit/changeHistoryEnvelope";
import { createUndoPatchCommand } from "../lib/domain/audit/undoHistory";
import {
  createPatchChangeHistoryBatch,
  createPatchSaveConflict,
  evaluateVersionedPatchSave,
} from "../lib/domain/editing/patchSavePolicy";
import type { PatchSaveCommand } from "../lib/domain/editing/patchEditing";

const patchCommand: PatchSaveCommand = {
  entityType: "mining_shift_report_line",
  entity: {
    id: "line-1",
    version: 7,
    updatedAt: "2026-05-08T09:00:00.000Z",
    updatedBy: "dispatcher-1",
  },
  changes: [
    { field: "trips", previousValue: 80, nextValue: 85 },
    { field: "comment", previousValue: "draft", nextValue: "accepted" },
  ],
  reason: "accepted trips from section report",
};

const auditContext = {
  workspaceId: "mining-dispatch" as const,
  changedAt: "2026-05-08T10:00:00.000Z",
  changedBy: "dispatcher-2",
  reasonKind: "approval" as const,
  capability: "approve" as const,
};

const auditBatch = createPatchChangeHistoryBatch(patchCommand, auditContext);
assert.equal(auditBatch.workspaceId, "mining-dispatch");
assert.equal(auditBatch.entity.version, 7);
assert.equal(auditBatch.reasonText, "accepted trips from section report");
assert.deepEqual(createChangeHistoryEntries(auditBatch).map((entry) => ({
  field: entry.field,
  oldValue: entry.oldValue,
  newValue: entry.newValue,
  capability: entry.capability,
})), [
  { field: "trips", oldValue: 80, newValue: 85, capability: "approve" },
  { field: "comment", oldValue: "draft", newValue: "accepted", capability: "approve" },
]);

const auditEnvelope = createServerChangeHistoryEnvelope(auditBatch);
assert.equal(auditEnvelope.ok, true);
if (auditEnvelope.ok) {
  assert.equal(auditEnvelope.envelope.writesPerField, true);
  assert.equal(auditEnvelope.envelope.entryCount, 2);
  assert.equal(auditEnvelope.envelope.entityId, "line-1");
  assert.equal(auditEnvelope.envelope.changedBy, "dispatcher-2");
  assert.equal(auditEnvelope.envelope.reasonKind, "approval");
}

assert.deepEqual(validateServerChangeHistoryDraft({
  ...auditBatch,
  reasonText: undefined,
  changes: [{ field: "trips", previousValue: 85, nextValue: 85 }],
}).map((issue) => issue.code), ["reason_required", "noop_history_forbidden"]);

assert.deepEqual(validateServerChangeHistoryDraft({
  ...auditBatch,
  changes: [{ field: "rows", previousValue: [], nextValue: [{ id: "line-1" }] }],
}).map((issue) => issue.code), ["whole_table_history_forbidden"]);

const successfulSave = evaluateVersionedPatchSave(
  patchCommand,
  {
    id: "line-1",
    version: 7,
    trips: 80,
    comment: "draft",
  },
  auditContext,
);
assert.equal(successfulSave.ok, true);
if (successfulSave.ok) {
  assert.equal(successfulSave.saveResult.version, 8);
  assert.equal(successfulSave.auditBatch.entity.version, 8);
}

const conflict = createPatchSaveConflict(
  patchCommand,
  {
    id: "line-1",
    version: 8,
    trips: 82,
    comment: "changed by another dispatcher",
  },
);
assert.equal(conflict.openedVersion, 7);
assert.equal(conflict.currentVersion, 8);
assert.deepEqual(conflict.serverChanges, [
  { field: "trips", previousValue: 80, nextValue: 82 },
  { field: "comment", previousValue: "draft", nextValue: "changed by another dispatcher" },
]);
assert.deepEqual(conflict.attemptedChanges, patchCommand.changes);

const rejectedSave = evaluateVersionedPatchSave(
  patchCommand,
  {
    id: "line-1",
    version: 8,
    trips: 82,
    comment: "changed by another dispatcher",
  },
  auditContext,
);
assert.equal(rejectedSave.ok, false);
if (!rejectedSave.ok) {
  assert.equal(rejectedSave.conflict.currentVersion, 8);
}

const editAccess = {
  canView: true,
  canEdit: true,
  canApprove: false,
  canDelete: false,
  canExport: false,
  canAdmin: false,
  matchedGrantIds: ["grant-edit"],
};

const historyEntries = createChangeHistoryEntries(auditBatch).map((entry, index) => ({
  ...entry,
  id: `history-${index}`,
}));

const undoCommand = createUndoPatchCommand({
  entries: historyEntries,
  currentRecord: {
    id: "line-1",
    version: 8,
    trips: 85,
    comment: "accepted",
  },
  access: editAccess,
  reason: "section returned wrong trips count",
});
assert.equal(undoCommand.ok, true);
if (undoCommand.ok) {
  assert.deepEqual(undoCommand.command.changes, [
    { field: "trips", previousValue: 85, nextValue: 80 },
    { field: "comment", previousValue: "accepted", nextValue: "draft" },
  ]);
  assert.equal(undoCommand.command.entity.version, 8);
}

const blockedUndo = createUndoPatchCommand({
  entries: historyEntries,
  currentRecord: {
    id: "line-1",
    version: 9,
    trips: 86,
    comment: "accepted",
  },
  access: editAccess,
  reason: "undo after another edit",
});
assert.equal(blockedUndo.ok, false);
if (!blockedUndo.ok) {
  assert.deepEqual(blockedUndo.rejection.issues.map((issue) => issue.code), ["current_value_changed"]);
}

const undoWithoutReason = createUndoPatchCommand({
  entries: historyEntries,
  currentRecord: {
    id: "line-1",
    version: 8,
    trips: 85,
    comment: "accepted",
  },
  access: editAccess,
});
assert.equal(undoWithoutReason.ok, false);
if (!undoWithoutReason.ok) {
  assert.equal(undoWithoutReason.rejection.issues[0]?.code, "reason_required");
}

console.log("Editing audit domain checks passed");
