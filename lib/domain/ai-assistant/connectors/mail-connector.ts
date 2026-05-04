import { createDryRunAiAssistantConnector } from "./common";

// Реальная почта подключается на сервере: frontend работает только с черновиками и статусами.
export const mailDomainConnector = createDryRunAiAssistantConnector({
  key: "mail",
  title: "Почта",
  capabilities: ["read", "draft", "approve", "send", "sync"],
  requiredScopes: ["ai.external.draft", "ai.external.send"],
  draftPrefix: "mail",
  syncErrorCode: "MAIL_DRY_RUN_REQUIRED",
  executeErrorCode: "MAIL_APPROVAL_REQUIRED",
});
