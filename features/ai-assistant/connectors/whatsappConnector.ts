import type { AiAssistantConnector } from "@/features/ai-assistant/types";

export const whatsappConnector: AiAssistantConnector = {
  key: "whatsapp",
  title: "WhatsApp",
  capabilities: ["draft", "approve", "send"],
  requiredScopes: [
    "ai.external.draft",
    "ai.external.send",
  ],
  async createDraft(context, input) {
    return {
      ok: context.dryRun,
      auditId: context.correlationId,
      data: context.dryRun ? { draftId: `wa-draft-${input.target}` } : undefined,
      errorCode: context.dryRun ? undefined : "WHATSAPP_APPROVAL_REQUIRED",
    };
  },
};
