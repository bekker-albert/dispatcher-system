import { createDryRunAiAssistantConnector } from "./common";

// Реальная отправка WhatsApp должна выполняться через backend после согласования пользователем.
export const whatsappDomainConnector = createDryRunAiAssistantConnector({
  key: "whatsapp",
  title: "WhatsApp",
  capabilities: ["read", "draft", "approve", "send"],
  requiredScopes: ["ai.external.draft", "ai.external.send"],
  draftPrefix: "wa",
  syncErrorCode: "WHATSAPP_DRY_RUN_REQUIRED",
  executeErrorCode: "WHATSAPP_APPROVAL_REQUIRED",
});
