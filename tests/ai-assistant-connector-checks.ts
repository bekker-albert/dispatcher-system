import assert from "node:assert/strict";

import { aiApiConnector } from "../features/ai-assistant/connectors/aiApiConnector";
import { calendarConnector } from "../features/ai-assistant/connectors/calendarConnector";
import { documentologConnector } from "../features/ai-assistant/connectors/documentologConnector";
import { knowledgeBaseConnector } from "../features/ai-assistant/connectors/knowledgeBaseConnector";
import { mailConnector } from "../features/ai-assistant/connectors/mailConnector";
import { pushConnector } from "../features/ai-assistant/connectors/pushConnector";
import { whatsappConnector } from "../features/ai-assistant/connectors/whatsappConnector";
import {
  aiApiDomainConnector,
  calendarDomainConnector,
  documentologDomainConnector,
  knowledgeBaseDomainConnector,
  mailDomainConnector,
  notificationDomainConnector,
  whatsappDomainConnector,
} from "../lib/domain/ai-assistant/connectors";
import { requiresAiAssistantApproval } from "../lib/domain/ai-assistant/approval-policy";
import type { AiAssistantConnectorContext } from "../lib/domain/ai-assistant/types";

const dryRunContext: AiAssistantConnectorContext = {
  actorUserId: "user-1",
  role: "supervisor",
  scopes: ["ai.chat.read", "ai.external.draft", "ai.external.send"],
  correlationId: "corr-dry-run",
  dryRun: true,
};

const liveContext: AiAssistantConnectorContext = {
  ...dryRunContext,
  correlationId: "corr-live",
  dryRun: false,
};

const draftInput = {
  title: "Черновик",
  body: "Проверить отклонение от плана",
  target: "Aksu",
};

const aiDraft = await aiApiConnector.createDraft?.(dryRunContext, draftInput);
assert.equal(aiDraft?.ok, true);
assert.equal(aiDraft?.auditId, dryRunContext.correlationId);
assert.equal(typeof aiDraft?.data?.draftId, "string");

const aiLiveDraft = await aiApiConnector.createDraft?.(liveContext, draftInput);
assert.equal(aiLiveDraft?.ok, false);
assert.equal(aiLiveDraft?.auditId, liveContext.correlationId);
assert.equal(aiLiveDraft?.errorCode, "AI_ASSISTANT_DRY_RUN_REQUIRED");

const mailDraft = await mailConnector.createDraft?.(dryRunContext, draftInput);
assert.equal(mailDraft?.ok, true);
assert.equal(mailDraft?.data?.draftId, `mail-draft-${draftInput.target}`);

const mailLiveDraft = await mailConnector.createDraft?.(liveContext, draftInput);
assert.equal(mailLiveDraft?.ok, false);
assert.equal(mailLiveDraft?.errorCode, "MAIL_APPROVAL_REQUIRED");

const pushDraft = await pushConnector.createDraft?.(dryRunContext, draftInput);
assert.equal(pushDraft?.ok, true);
assert.equal(pushDraft?.data?.draftId, `push-draft-${draftInput.target}`);

const pushLiveDraft = await pushConnector.createDraft?.(liveContext, draftInput);
assert.equal(pushLiveDraft?.ok, false);
assert.equal(pushLiveDraft?.errorCode, "PUSH_APPROVAL_REQUIRED");

const whatsappDraft = await whatsappConnector.createDraft?.(dryRunContext, draftInput);
assert.equal(whatsappDraft?.ok, true);
assert.equal(whatsappDraft?.data?.draftId, `wa-draft-${draftInput.target}`);

const whatsappLiveDraft = await whatsappConnector.createDraft?.(liveContext, draftInput);
assert.equal(whatsappLiveDraft?.ok, false);
assert.equal(whatsappLiveDraft?.errorCode, "WHATSAPP_APPROVAL_REQUIRED");

for (const connector of [
  calendarConnector,
  documentologConnector,
  knowledgeBaseConnector,
]) {
  const dryRunSync = await connector.sync?.(dryRunContext);
  assert.equal(dryRunSync?.ok, true);
  assert.equal(dryRunSync?.auditId, dryRunContext.correlationId);
  assert.equal(dryRunSync?.data?.syncedAt, new Date(0).toISOString());

  const liveSync = await connector.sync?.(liveContext);
  assert.equal(liveSync?.ok, false);
  assert.equal(liveSync?.auditId, liveContext.correlationId);
}

assert.equal(
  (await calendarConnector.sync?.(liveContext))?.errorCode,
  "CALENDAR_DRY_RUN_REQUIRED",
);
assert.equal(
  (await documentologConnector.sync?.(liveContext))?.errorCode,
  "DOCUMENTOLOG_DRY_RUN_REQUIRED",
);
assert.equal(
  (await knowledgeBaseConnector.sync?.(liveContext))?.errorCode,
  "KNOWLEDGE_DRY_RUN_REQUIRED",
);

assert.equal(requiresAiAssistantApproval("send-whatsapp", "low", "whatsapp"), true);
assert.equal(requiresAiAssistantApproval("send-mail", "low", "mail"), true);
assert.equal(requiresAiAssistantApproval("start-documentolog", "low", "documentolog"), true);
assert.equal(requiresAiAssistantApproval("create-calendar-event", "low", "calendar"), true);
assert.equal(requiresAiAssistantApproval("prepare-document", "low", "documentolog"), true);
assert.equal(requiresAiAssistantApproval("update-knowledge-rule", "low", "knowledge-base"), true);
assert.equal(requiresAiAssistantApproval("delete-data", "low", "ai-api"), true);
assert.equal(requiresAiAssistantApproval("ask-assistant", "low", "ai-api"), false);
assert.equal(requiresAiAssistantApproval("draft", "low", "ai-api"), false);
assert.equal(requiresAiAssistantApproval("draft", "critical", "ai-api"), true);

for (const connector of [
  aiApiDomainConnector,
  whatsappDomainConnector,
  mailDomainConnector,
  calendarDomainConnector,
  documentologDomainConnector,
  notificationDomainConnector,
  knowledgeBaseDomainConnector,
]) {
  const draft = await connector.createDraft?.(dryRunContext, draftInput);
  assert.equal(draft?.ok, true);
  assert.equal(draft?.auditId, dryRunContext.correlationId);

  const blockedExecution = await connector.execute?.(dryRunContext, {
    actionType: "send-mail",
    approved: false,
    idempotencyKey: `not-approved-${connector.key}`,
    target: "target",
    body: "body",
  });
  assert.equal(blockedExecution?.ok, false);
  assert.equal(blockedExecution?.errorCode, "AI_ASSISTANT_APPROVAL_REQUIRED");

  const dryRunExecution = await connector.execute?.(dryRunContext, {
    actionType: "send-mail",
    approvalActionId: "approval-1",
    approved: true,
    idempotencyKey: `approved-${connector.key}`,
    target: "target",
    body: "body",
  });
  assert.equal(dryRunExecution?.ok, true);
  assert.equal(typeof dryRunExecution?.data?.executionId, "string");

  const liveExecution = await connector.execute?.(liveContext, {
    actionType: "send-mail",
    approvalActionId: "approval-1",
    approved: true,
    idempotencyKey: `live-${connector.key}`,
    target: "target",
    body: "body",
  });
  assert.equal(liveExecution?.ok, false);
}

console.log("AI assistant connector checks passed");
