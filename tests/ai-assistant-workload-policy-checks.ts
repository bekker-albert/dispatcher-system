import assert from "node:assert/strict";
import {
  createAiAssistantWorkloadRunEnvelope,
  evaluateAiAssistantWorkloadPlan,
} from "../lib/domain/ai-assistant/workloadPolicy";

const manualWorkload = evaluateAiAssistantWorkloadPlan({
  id: "ai-workload-1",
  mode: "manual-request",
  actionType: "ask-assistant",
  requestedBy: "dispatcher-1",
  workspaceId: "reports",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-02",
  sectionId: "baktay",
  maxInputRows: 25,
  estimatedInputRows: 12,
});

assert.equal(manualWorkload.canRun, true);
assert.deepEqual(manualWorkload.issues, []);

const blockedBackgroundWorkload = evaluateAiAssistantWorkloadPlan({
  id: "ai-background-scan",
  mode: "continuous-background",
  actionType: "ask-assistant",
  readsAllWorkspaces: true,
  usesFullHistory: true,
  periodStart: "2026-05-10",
  periodEnd: "2026-05-01",
});

assert.equal(blockedBackgroundWorkload.canRun, false);
assert.deepEqual(blockedBackgroundWorkload.issues.map((issue) => issue.code), [
  "continuous_background_forbidden",
  "requester_required",
  "full_history_forbidden",
  "all_workspace_scan_forbidden",
  "period_invalid",
  "input_limit_required",
]);

const oversizedWorkload = evaluateAiAssistantWorkloadPlan({
  id: "ai-wide-period",
  mode: "scheduled",
  actionType: "draft",
  requestedBy: "scheduler",
  workspaceId: "mining-dispatch",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-20",
  maxInputRows: 500,
  estimatedInputRows: 501,
});

assert.deepEqual(oversizedWorkload.issues.map((issue) => issue.code), [
  "date_range_too_large",
  "input_limit_exceeded",
  "input_limit_exceeded",
]);

const approvalWorkload = evaluateAiAssistantWorkloadPlan({
  id: "ai-send-mail",
  mode: "event-driven",
  actionType: "send-mail",
  targetConnector: "mail",
  requestedBy: "dispatcher-1",
  workspaceId: "common-processes",
  sourceIds: ["business-trip-1"],
  maxInputRows: 1,
});

assert.equal(approvalWorkload.canRun, false);
assert.deepEqual(approvalWorkload.issues.map((issue) => issue.code), ["approval_required"]);

const approvedEnvelope = createAiAssistantWorkloadRunEnvelope({
  id: "ai-send-mail-approved",
  mode: "event-driven",
  actionType: "send-mail",
  targetConnector: "mail",
  requestedBy: "dispatcher-1",
  workspaceId: "common-processes",
  sourceIds: ["business-trip-1"],
  maxInputRows: 1,
  approvalGranted: true,
});

assert.equal(approvedEnvelope.canRun, true);
assert.deepEqual(approvedEnvelope.issueCodes, []);

console.log("AI assistant workload policy checks passed");
