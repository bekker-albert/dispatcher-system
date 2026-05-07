"use client";

export const appSystemNotificationEventName = "ai-assistant:system-notification";
export const appSystemNotificationDecisionEventName = "ai-assistant:system-notification-decision";

export type AppSystemNotificationDetail = {
  action?: "upsert" | "clear";
  id: string;
  title?: string;
  body?: string;
  target?: string;
  workDate?: string;
};

export type AppSystemNotificationDecisionDetail = {
  id: string;
  status: "approved" | "rejected";
};

export function dispatchAppSystemNotification(detail: AppSystemNotificationDetail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(appSystemNotificationEventName, { detail }));
}

export function dispatchAppSystemNotificationDecision(detail: AppSystemNotificationDecisionDetail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(appSystemNotificationDecisionEventName, { detail }));
}
