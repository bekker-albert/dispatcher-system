"use client";

export const aiAssistantSystemNotificationEventName = "ai-assistant:system-notification";
export const aiAssistantSystemNotificationDecisionEventName = "ai-assistant:system-notification-decision";

export type AiAssistantSystemNotificationDetail = {
  action?: "upsert" | "clear";
  id: string;
  title?: string;
  body?: string;
  target?: string;
  workDate?: string;
};

export type AiAssistantSystemNotificationDecisionDetail = {
  id: string;
  status: "approved" | "rejected";
};

export function dispatchAiAssistantSystemNotification(detail: AiAssistantSystemNotificationDetail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(aiAssistantSystemNotificationEventName, { detail }));
}

export function dispatchAiAssistantSystemNotificationDecision(detail: AiAssistantSystemNotificationDecisionDetail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(aiAssistantSystemNotificationDecisionEventName, { detail }));
}
