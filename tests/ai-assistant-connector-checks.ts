import assert from "node:assert/strict";

import { aiApiConnector } from "../features/ai-assistant/connectors/aiApiConnector";
import { calendarConnector } from "../features/ai-assistant/connectors/calendarConnector";
import { documentologConnector } from "../features/ai-assistant/connectors/documentologConnector";
import { knowledgeBaseConnector } from "../features/ai-assistant/connectors/knowledgeBaseConnector";
import { mailConnector } from "../features/ai-assistant/connectors/mailConnector";
import { pushConnector } from "../features/ai-assistant/connectors/pushConnector";
import { whatsappConnector } from "../features/ai-assistant/connectors/whatsappConnector";
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

console.log("AI assistant connector checks passed");
