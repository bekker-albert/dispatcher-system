import { createDryRunAiAssistantConnector } from "./common";

// Реальные push-уведомления подключаются на сервере, чтобы не хранить секреты провайдера в клиентском коде.
export const notificationDomainConnector = createDryRunAiAssistantConnector({
  key: "push",
  title: "Push-уведомления",
  capabilities: ["draft", "approve", "send"],
  requiredScopes: ["ai.external.draft", "ai.external.send"],
  draftPrefix: "push",
  syncErrorCode: "PUSH_DRY_RUN_REQUIRED",
  executeErrorCode: "PUSH_APPROVAL_REQUIRED",
});
