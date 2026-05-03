import type { AiAssistantConnector } from "@/features/ai-assistant/types";

export const calendarConnector: AiAssistantConnector = {
  key: "calendar",
  title: "Календарь",
  capabilities: ["read", "draft", "approve", "sync"],
  requiredScopes: [
    "ai.calendar.read",
    "ai.calendar.write",
  ],
  async sync(context) {
    return {
      ok: context.dryRun,
      auditId: context.correlationId,
      data: context.dryRun ? { syncedAt: new Date(0).toISOString() } : undefined,
      errorCode: context.dryRun ? undefined : "CALENDAR_DRY_RUN_REQUIRED",
    };
  },
};
