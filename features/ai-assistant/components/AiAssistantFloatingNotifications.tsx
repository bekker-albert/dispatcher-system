"use client";

import type { CSSProperties } from "react";

import { AiAssistantStatusPill } from "@/features/ai-assistant/components/AiAssistantStatusPill";
import { formatAiAssistantChannel } from "@/features/ai-assistant/lib/formatters";
import type { AiAssistantNotification } from "@/features/ai-assistant/types";
import {
  appNavigationEventName,
  type AppNavigationEventDetail,
} from "@/lib/domain/navigation/appNavigationEvents";

export function AiAssistantFloatingNotifications({
  notifications,
  onNavigate,
}: {
  notifications: AiAssistantNotification[];
  onNavigate: () => void;
}) {
  const openAiTasks = () => {
    const detail: AppNavigationEventDetail = {
      topTab: "ai-assistant",
      aiAssistantTab: "tasks",
    };

    window.dispatchEvent(new CustomEvent(appNavigationEventName, { detail }));
    onNavigate();
  };

  return (
    <div className="ai-floating-notifications" style={notificationListStyle}>
      {notifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          onClick={openAiTasks}
          style={notificationItemStyle}
        >
          <div style={notificationItemTopStyle}>
            <div>
              <div style={notificationTitleStyle}>{notification.title}</div>
              <div style={notificationMetaStyle}>
                {formatAiAssistantChannel(notification.channel)} В· {notification.target}
              </div>
            </div>
            <AiAssistantStatusPill status={notification.status} />
          </div>
          <div style={notificationBodyStyle}>{notification.body}</div>
        </button>
      ))}
    </div>
  );
}

const notificationListStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  padding: 8,
  overflow: "auto",
};

const notificationItemStyle: CSSProperties = {
  display: "grid",
  gap: 5,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  padding: 8,
  fontSize: 12,
  color: "#0f172a",
  cursor: "pointer",
  font: "inherit",
  textAlign: "left",
};

const notificationItemTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  alignItems: "start",
};

const notificationTitleStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 12,
  lineHeight: 1.2,
};

const notificationMetaStyle: CSSProperties = {
  fontSize: 11,
  lineHeight: 1.2,
  marginTop: 2,
  color: "#64748b",
};

const notificationBodyStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.25,
  color: "#334155",
};
