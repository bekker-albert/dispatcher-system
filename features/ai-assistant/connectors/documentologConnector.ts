import type { AiAssistantConnector } from "@/features/ai-assistant/types";

export const documentologConnector: AiAssistantConnector = {
  key: "documentolog",
  title: "Documentolog",
  capabilities: ["read", "draft", "approve", "sync"],
  requiredScopes: [
    "ai.documentolog.read",
    "ai.documentolog.write",
  ],
  async sync(context) {
    return {
      ok: context.dryRun,
      auditId: context.correlationId,
      data: context.dryRun ? { syncedAt: new Date(0).toISOString() } : undefined,
      errorCode: context.dryRun ? undefined : "DOCUMENTOLOG_DRY_RUN_REQUIRED",
    };
  },
};
