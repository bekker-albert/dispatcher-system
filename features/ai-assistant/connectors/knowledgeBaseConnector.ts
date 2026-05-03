import type { AiAssistantConnector } from "@/features/ai-assistant/types";

export const knowledgeBaseConnector: AiAssistantConnector = {
  key: "knowledge-base",
  title: "База знаний",
  capabilities: ["read", "search", "sync"],
  requiredScopes: [
    "ai.knowledge.read",
  ],
  async sync(context) {
    return {
      ok: context.dryRun,
      auditId: context.correlationId,
      data: context.dryRun ? { syncedAt: new Date(0).toISOString() } : undefined,
      errorCode: context.dryRun ? undefined : "KNOWLEDGE_DRY_RUN_REQUIRED",
    };
  },
};
