"use client";

export const aiAssistantSystemNotificationEventName = "ai-assistant:system-notification";

export type AiAssistantSystemNotificationDetail = {
  action?: "upsert" | "clear";
  id: string;
  title?: string;
  body?: string;
  target?: string;
  workDate?: string;
};

export function dispatchAiAssistantSystemNotification(detail: AiAssistantSystemNotificationDetail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(aiAssistantSystemNotificationEventName, { detail }));
}
