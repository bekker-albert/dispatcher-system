import { createDryRunAiAssistantConnector } from "./common";

// Запуск Documentolog выполняется только после решения пользователя и только через backend/API.
export const documentologDomainConnector = createDryRunAiAssistantConnector({
  key: "documentolog",
  title: "Documentolog",
  capabilities: ["read", "draft", "approve", "send", "sync", "search"],
  requiredScopes: ["ai.documentolog.read", "ai.documentolog.write"],
  draftPrefix: "documentolog",
  syncErrorCode: "DOCUMENTOLOG_DRY_RUN_REQUIRED",
  executeErrorCode: "DOCUMENTOLOG_APPROVAL_REQUIRED",
});
