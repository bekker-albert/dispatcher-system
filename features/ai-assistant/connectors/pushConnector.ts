import type { AiAssistantConnector } from "@/features/ai-assistant/types";

export const pushConnector: AiAssistantConnector = {
  key: "push",
  title: "Push-уведомления",
  capabilities: ["draft", "approve", "send"],
  requiredScopes: [
    "ai.external.draft",
    "ai.external.send",
  ],
  async createDraft(context, input) {
    return {
      ok: context.dryRun,
      auditId: context.correlationId,
      data: context.dryRun ? { draftId: `push-draft-${input.target}` } : undefined,
      errorCode: context.dryRun ? undefined : "PUSH_APPROVAL_REQUIRED",
    };
  },
};
