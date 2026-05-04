import { createDryRunAiAssistantConnector } from "./common";

// Индексация базы знаний должна выполняться через backend/API; здесь только dry-run контракт.
export const knowledgeBaseDomainConnector = createDryRunAiAssistantConnector({
  key: "knowledge-base",
  title: "База знаний",
  capabilities: ["read", "draft", "approve", "sync", "search"],
  requiredScopes: ["ai.knowledge.read"],
  draftPrefix: "knowledge",
  syncErrorCode: "KNOWLEDGE_DRY_RUN_REQUIRED",
  executeErrorCode: "KNOWLEDGE_APPROVAL_REQUIRED",
});
