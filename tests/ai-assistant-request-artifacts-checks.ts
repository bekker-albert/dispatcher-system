import assert from "node:assert/strict";

import {
  createAiAssistantRequestArtifacts,
} from "../lib/domain/ai-assistant/request-artifacts";
import {
  getAiAssistantDocumentStatusForApprovalDecision,
  getAiAssistantMailDraftStatusForApprovalDecision,
} from "../features/ai-assistant/lib/aiAssistantStateHelpers";

const workDate = "2026-05-05";
const createdAt = "2026-05-05T09:15:00.000Z";

const documentRequest = createAiAssistantRequestArtifacts({
  createdAt,
  requestText: "Подготовь служебную записку для командировки в Аксу",
  workDate,
});
assert.equal(documentRequest.task.kind, "prepare-document");
assert.equal(documentRequest.task.status, "needs-approval");
assert.equal(documentRequest.approval?.status, "required");
assert.equal(documentRequest.document?.type, "memo");
assert.equal(documentRequest.document?.status, "draft");
assert.equal(documentRequest.mailDraft, undefined);
assert.equal(documentRequest.notification, undefined);
assert.equal(documentRequest.plannerItem, undefined);

const contractorMessageRequest = createAiAssistantRequestArtifacts({
  createdAt,
  requestText: "Подготовь сообщение подрядчику по задержке поставки",
  workDate,
});
assert.equal(contractorMessageRequest.task.kind, "draft-message");
assert.equal(contractorMessageRequest.task.channel, "whatsapp");
assert.equal(contractorMessageRequest.approval?.targetConnector, "whatsapp");
assert.equal(contractorMessageRequest.notification?.status, "queued");
assert.equal(contractorMessageRequest.notification?.approvalStatus, "required");
assert.equal(contractorMessageRequest.document, undefined);
assert.equal(contractorMessageRequest.mailDraft, undefined);
assert.equal(contractorMessageRequest.plannerItem, undefined);

const reportReasonRequest = createAiAssistantRequestArtifacts({
  createdAt,
  requestText: "Проверь причины невыполнения плана по участку",
  workDate,
});
assert.equal(reportReasonRequest.task.kind, "summarize");
assert.equal(reportReasonRequest.task.status, "needs-approval");
assert.equal(reportReasonRequest.approval?.targetConnector, "ai-api");
assert.equal(reportReasonRequest.notification, undefined);
assert.equal(reportReasonRequest.document, undefined);
assert.equal(reportReasonRequest.mailDraft, undefined);
assert.equal(reportReasonRequest.plannerItem, undefined);

const equipmentCheckRequest = createAiAssistantRequestArtifacts({
  createdAt,
  requestText: "Проверь технику после ремонта на линии",
  workDate,
});
assert.equal(equipmentCheckRequest.task.kind, "summarize");
assert.equal(equipmentCheckRequest.task.status, "queued");
assert.equal(equipmentCheckRequest.task.approvalStatus, "not-required");
assert.equal(equipmentCheckRequest.approval, undefined);
assert.equal(equipmentCheckRequest.notification, undefined);
assert.equal(equipmentCheckRequest.document, undefined);
assert.equal(equipmentCheckRequest.mailDraft, undefined);
assert.equal(equipmentCheckRequest.plannerItem, undefined);

const plannerRequest = createAiAssistantRequestArtifacts({
  createdAt,
  requestText: "Напомни сверить график по рабочей дате",
  workDate,
});
assert.equal(plannerRequest.task.kind, "ask");
assert.equal(plannerRequest.task.status, "queued");
assert.equal(plannerRequest.task.title, "Напомни сверить график по рабочей дате");
assert.equal(plannerRequest.approval, undefined);
assert.equal(plannerRequest.plannerItem?.linkedTaskId, plannerRequest.task.id);
assert.equal(plannerRequest.plannerItem?.plannedDate, workDate);
assert.equal(plannerRequest.plannerItem?.status, "planned");
assert.match(plannerRequest.assistantReply, /чернов/);
assert.doesNotMatch(plannerRequest.assistantReply, /Задачи/);
assert.doesNotMatch(plannerRequest.assistantReply, /Входящ/);

assert.equal(getAiAssistantDocumentStatusForApprovalDecision("approved"), "approved");
assert.equal(getAiAssistantDocumentStatusForApprovalDecision("returned"), "review");
assert.equal(getAiAssistantDocumentStatusForApprovalDecision("rejected"), "rejected");
assert.equal(getAiAssistantMailDraftStatusForApprovalDecision("approved"), "approved");
assert.equal(getAiAssistantMailDraftStatusForApprovalDecision("returned"), "draft");
assert.equal(getAiAssistantMailDraftStatusForApprovalDecision("rejected"), "rejected");

console.log("AI assistant request artifact checks passed");
