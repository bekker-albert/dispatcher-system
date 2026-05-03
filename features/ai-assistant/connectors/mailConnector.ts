import type { AiAssistantConnector } from "@/features/ai-assistant/types";

export const mailConnector: AiAssistantConnector = {
  key: "mail",
  title: "Почта",
  capabilities: ["draft", "approve", "send", "search"],
  requiredScopes: [
    "ai.external.draft",
    "ai.external.send",
  ],
  async createDraft(context, input) {
    return {
      ok: context.dryRun,
      auditId: context.correlationId,
      data: context.dryRun ? { draftId: `mail-draft-${input.target}` } : undefined,
      errorCode: context.dryRun ? undefined : "MAIL_APPROVAL_REQUIRED",
    };
  },
};
