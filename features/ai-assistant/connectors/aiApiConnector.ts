import type { AiAssistantConnector } from "@/features/ai-assistant/types";

export const aiApiConnector: AiAssistantConnector = {
  key: "ai-api",
  title: "AI API",
  capabilities: ["read", "draft", "search"],
  requiredScopes: [
    "ai.chat.read",
    "ai.chat.write",
    "ai.context.dispatcher.read",
  ],
  async createDraft(context, input) {
    return {
      ok: context.dryRun,
      auditId: context.correlationId,
      data: context.dryRun
        ? { draftId: `ai-draft-${input.title.length}-${input.body.length}` }
        : undefined,
      errorCode: context.dryRun ? undefined : "AI_ASSISTANT_DRY_RUN_REQUIRED",
    };
  },
};
