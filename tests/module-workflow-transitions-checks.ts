import assert from "node:assert/strict";
import type { EffectiveAccessDecision } from "../lib/domain/access-control/effectivePermissions";
import type { PatchSaveCommand } from "../lib/domain/editing/patchEditing";
import {
  getModuleWorkflowTransitionBinding,
  getWorkflowTransitionBindingsForUnknownModules,
  getWorkflowTransitionBindingsWithUnknownWorkflows,
  getWorkflowTransitionBindingWorkflowWorkspaceMismatches,
  getWorkflowModulesWithoutTransitionBinding,
  getWorkflowTransitionBindingWorkspaceMismatches,
  moduleWorkflowTransitionBindings,
  validateModuleWorkflowTransitionPayload,
} from "../lib/domain/data-access/moduleWorkflowTransitions";
import {
  createServerWorkflowTransitionEnvelope,
  validateServerWorkflowTransitionDraft,
} from "../lib/domain/data-access/workflowTransitionEnvelope";

const approveAccess: EffectiveAccessDecision = {
  canView: true,
  canEdit: true,
  canApprove: true,
  canDelete: false,
  canExport: false,
  canAdmin: false,
  matchedGrantIds: ["approve"],
};

const editOnlyAccess: EffectiveAccessDecision = {
  canView: true,
  canEdit: true,
  canApprove: false,
  canDelete: false,
  canExport: false,
  canAdmin: false,
  matchedGrantIds: ["edit"],
};

const fleetApprovalPatch: PatchSaveCommand = {
  entityType: "vehicle_movement",
  entity: { id: "movement-1", version: 4 },
  changes: [{ field: "status", previousValue: "approval", nextValue: "approved" }],
};

assert.equal(getModuleWorkflowTransitionBinding("taxation-waybills")?.workflowId, "waybill");
assert.equal(getModuleWorkflowTransitionBinding("fleet-movements")?.workflowId, "vehicle-movement");
assert.ok(moduleWorkflowTransitionBindings.length >= 7);
assert.deepEqual(getWorkflowModulesWithoutTransitionBinding().map((module) => module.id), []);
assert.deepEqual(getWorkflowTransitionBindingWorkspaceMismatches(), []);
assert.deepEqual(getWorkflowTransitionBindingsForUnknownModules(), []);
assert.deepEqual(getWorkflowTransitionBindingsWithUnknownWorkflows(), []);
assert.deepEqual(getWorkflowTransitionBindingWorkflowWorkspaceMismatches(), []);

assert.deepEqual(
  getWorkflowModulesWithoutTransitionBinding([{
    id: "future-workflow-module",
    workspaceId: "taxation",
    title: "Future workflow module",
    status: "planned",
    tableStrategy: "server-paginated",
    editingStrategy: "workflow",
    requiredFilters: ["date", "section_id", "status"],
    nextStep: "Bind workflow before implementation.",
  }]).map((module) => module.id),
  ["future-workflow-module"],
);

const taxationWaybillBinding = getModuleWorkflowTransitionBinding("taxation-waybills");
assert.ok(taxationWaybillBinding);
assert.deepEqual(
  getWorkflowTransitionBindingsForUnknownModules([{
    ...taxationWaybillBinding,
    moduleId: "missing-module",
  }]).map((issue) => issue.code),
  ["workflow_transition_unknown_module"],
);
assert.deepEqual(
  getWorkflowTransitionBindingsWithUnknownWorkflows([{
    ...taxationWaybillBinding,
    workflowId: "missing-workflow" as typeof taxationWaybillBinding.workflowId,
  }]).map((issue) => issue.code),
  ["workflow_transition_unknown_workflow"],
);
assert.deepEqual(
  getWorkflowTransitionBindingWorkflowWorkspaceMismatches([{
    ...taxationWaybillBinding,
    workflowId: "vehicle-movement",
  }]).map((issue) => issue.code),
  ["workflow_transition_workflow_workspace_mismatch"],
);

assert.deepEqual(
  validateModuleWorkflowTransitionPayload({
    moduleId: "fleet-movements",
    patch: fleetApprovalPatch,
    access: approveAccess,
  }).map((issue) => issue.code),
  ["workflow_reason_required"],
);

assert.deepEqual(
  validateModuleWorkflowTransitionPayload({
    moduleId: "fleet-movements",
    patch: fleetApprovalPatch,
    access: editOnlyAccess,
    reason: "section approved",
  }).map((issue) => issue.code),
  ["workflow_approval_required"],
);

assert.deepEqual(
  validateModuleWorkflowTransitionPayload({
    moduleId: "fleet-movements",
    patch: fleetApprovalPatch,
    access: approveAccess,
    reason: "section approved",
  }),
  [],
);

const fleetApprovalEnvelope = createServerWorkflowTransitionEnvelope({
  moduleId: "fleet-movements",
  patch: fleetApprovalPatch,
  access: approveAccess,
  reason: "section approved",
});
assert.equal(fleetApprovalEnvelope.ok, true);
if (fleetApprovalEnvelope.ok) {
  assert.equal(fleetApprovalEnvelope.envelope.executionMode, "server-only");
  assert.equal(fleetApprovalEnvelope.envelope.patchOnly, true);
  assert.equal(fleetApprovalEnvelope.envelope.workflowId, "vehicle-movement");
  assert.equal(fleetApprovalEnvelope.envelope.expectedVersion, 4);
  assert.equal(fleetApprovalEnvelope.envelope.currentStatus, "approval");
  assert.equal(fleetApprovalEnvelope.envelope.nextStatus, "approved");
  assert.equal(fleetApprovalEnvelope.envelope.databaseAction, "transition-vehicle-movement");
  assert.deepEqual(fleetApprovalEnvelope.envelope.requestedByGrantIds, ["approve"]);
}

assert.deepEqual(
  validateServerWorkflowTransitionDraft({
    moduleId: "fleet-movements",
    patch: fleetApprovalPatch,
    access: approveAccess,
  }).map((issue) => issue.code),
  ["reason_required", "workflow_reason_required"],
);

assert.deepEqual(
  validateModuleWorkflowTransitionPayload({
    moduleId: "fleet-movements",
    patch: {
      ...fleetApprovalPatch,
      changes: [{ field: "status", previousValue: "draft", nextValue: "approved" }],
    },
    access: approveAccess,
    reason: "skip approval",
  }).map((issue) => issue.code),
  ["workflow_transition_not_allowed"],
);

assert.deepEqual(
  validateModuleWorkflowTransitionPayload({
    moduleId: "unknown-module",
    patch: fleetApprovalPatch,
    access: approveAccess,
  }).map((issue) => issue.code),
  ["workflow_transition_plan_missing"],
);

console.log("Module workflow transitions checks passed");
