"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";

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
  onSetDecision,
}: {
  notifications: AiAssistantNotification[];
  onNavigate: () => void;
  onSetDecision: (notification: AiAssistantNotification, status: "approved" | "rejected") => void;
}) {
  const openAiTasks = () => {
    const detail: AppNavigationEventDetail = {
      topTab: "ai-assistant",
      aiAssistantTab: "inbox",
    };

    window.dispatchEvent(new CustomEvent(appNavigationEventName, { detail }));
    onNavigate();
  };

  const handleDecision = (
    event: MouseEvent<HTMLButtonElement>,
    notification: AiAssistantNotification,
    status: "approved" | "rejected",
  ) => {
    event.stopPropagation();
    onSetDecision(notification, status);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openAiTasks();
  };

  return (
    <div className="ai-floating-notifications" style={notificationListStyle}>
      <div style={notificationHeaderStyle}>Уведомления</div>
      {notifications.map((notification) => {
        const canDecide = notification.approvalStatus === "required" && Boolean(notification.linkedTaskId);

        return (
          <div
            key={notification.id}
            role="button"
            tabIndex={0}
            onClick={openAiTasks}
            onKeyDown={handleCardKeyDown}
            style={notificationItemStyle}
          >
            <div style={notificationItemTopStyle}>
              <div>
                <div style={notificationTitleStyle}>{notification.title}</div>
                <div style={notificationMetaStyle}>
                  {formatAiAssistantChannel(notification.channel)} · {notification.target}
                </div>
              </div>
              <AiAssistantStatusPill status={notification.status} />
            </div>
            <div style={notificationBodyStyle}>{notification.body}</div>
            {canDecide && (
              <div style={notificationActionsStyle}>
                <button
                  type="button"
                  onClick={(event) => handleDecision(event, notification, "approved")}
                  style={approveButtonStyle}
                >
                  Согласовать
                </button>
                <button
                  type="button"
                  onClick={(event) => handleDecision(event, notification, "rejected")}
                  style={rejectButtonStyle}
                >
                  Отказать
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const notificationListStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  minHeight: 0,
};

const notificationHeaderStyle: CSSProperties = {
  color: "#475569",
  fontSize: 11,
  fontWeight: 900,
  textTransform: "uppercase",
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

const notificationActionsStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  justifyContent: "flex-end",
};

const decisionButtonBaseStyle: CSSProperties = {
  borderRadius: 8,
  padding: "5px 8px",
  font: "inherit",
  fontSize: 11,
  fontWeight: 900,
  cursor: "pointer",
};

const approveButtonStyle: CSSProperties = {
  ...decisionButtonBaseStyle,
  border: "1px solid #15803d",
  background: "#f0fdf4",
  color: "#166534",
};

const rejectButtonStyle: CSSProperties = {
  ...decisionButtonBaseStyle,
  border: "1px solid #b91c1c",
  background: "#fef2f2",
  color: "#991b1b",
};
