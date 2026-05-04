import { createDryRunAiAssistantConnector } from "./common";

// Реальное подключение AI API должно идти только через backend/API. В этом файле нет ключей и сетевых запросов.
export const aiApiDomainConnector = createDryRunAiAssistantConnector({
  key: "ai-api",
  title: "AI API",
  capabilities: ["read", "draft", "search"],
  requiredScopes: ["ai.chat.read", "ai.chat.write", "ai.context.dispatcher.read"],
  draftPrefix: "ai",
  syncErrorCode: "AI_ASSISTANT_DRY_RUN_REQUIRED",
  executeErrorCode: "AI_ASSISTANT_DRY_RUN_REQUIRED",
});
