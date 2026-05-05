"use client";

import { Send } from "lucide-react";
import { useMemo, useState } from "react";

import { AiAssistantFloatingNotifications } from "@/features/ai-assistant/components/AiAssistantFloatingNotifications";
import type {
  AiAssistantChatMessage,
  AiAssistantNotification,
} from "@/features/ai-assistant/types";
import {
  appNavigationEventName,
  type AppNavigationEventDetail,
} from "@/lib/domain/navigation/appNavigationEvents";
import type { AiAssistantTab } from "@/lib/domain/ai-assistant/types";

export function AiAssistantFloatingChat({
  contextLabel,
  detailLabel,
  messages,
  notifications,
  onNavigate,
  onSendMessage,
  onSetNotificationDecision,
  quickActions,
  suggestions,
  workDate,
}: {
  contextLabel: string;
  detailLabel?: string;
  messages: AiAssistantChatMessage[];
  notifications: AiAssistantNotification[];
  onNavigate: () => void;
  onSendMessage: (text: string) => void;
  onSetNotificationDecision: (notification: AiAssistantNotification, status: "approved" | "rejected") => void;
  quickActions: string[];
  suggestions: string[];
  workDate: string;
}) {
  const [draft, setDraft] = useState("");
  const visibleMessages = useMemo(
    () => messages.slice(-8),
    [messages],
  );
  const hiddenMessagesCount = Math.max(0, messages.length - visibleMessages.length);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    onSendMessage(text);
    setDraft("");
  };

  const sendPreset = (text: string) => {
    const targetTab = resolvePresetTab(text);
    if (targetTab) {
      const detail: AppNavigationEventDetail = {
        topTab: "ai-assistant",
        aiAssistantTab: targetTab,
      };

      window.dispatchEvent(new CustomEvent(appNavigationEventName, { detail }));
      onNavigate();
      return;
    }

    onSendMessage(`[${contextLabel}] ${text}`);
  };

  return (
    <div style={chatContentStyle}>
      <div style={messagesStyle}>
        <div style={contextCardStyle}>
          <div style={contextTitleStyle}>
            <span>{contextLabel}</span>
            <span style={contextDateStyle}>{workDate}</span>
          </div>
          {detailLabel && <div style={contextDetailStyle}>{detailLabel}</div>}
          <div style={quickActionsStyle}>
            {quickActions.slice(0, 4).map((action) => (
              <button key={action} type="button" onClick={() => sendPreset(action)} style={quickActionStyle}>
                {action}
              </button>
            ))}
          </div>
          <div style={suggestionsStyle}>
            {suggestions.slice(0, 5).map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => sendPreset(suggestion)} style={suggestionStyle}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {notifications.length > 0 && (
          <AiAssistantFloatingNotifications
            notifications={notifications}
            onNavigate={onNavigate}
            onSetDecision={onSetNotificationDecision}
          />
        )}

        {hiddenMessagesCount > 0 && (
          <div style={historyHintStyle}>
            Показаны последние 8 сообщений. Еще {hiddenMessagesCount} см. во вкладке «История».
          </div>
        )}

        {visibleMessages.map((message) => (
          <div
            key={message.id}
            style={{
              ...messageStyle,
              marginLeft: message.role === "user" ? "auto" : 0,
              background: message.role === "user" ? "#0f172a" : "#ffffff",
              color: message.role === "user" ? "#ffffff" : "#0f172a",
              border: message.role === "user" ? "1px solid #0f172a" : "1px solid #dbe3ec",
            }}
          >
            <div style={messageAuthorStyle}>{message.author}</div>
            <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{message.text}</div>
          </div>
        ))}
      </div>

      <div style={composerStyle}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder={`Что сделать в разделе ${contextLabel}?`}
          style={textareaStyle}
        />
        <button
          type="button"
          aria-label="Отправить сообщение"
          onClick={sendMessage}
          disabled={!draft.trim()}
          style={{
            ...sendButtonStyle,
            opacity: draft.trim() ? 1 : 0.45,
            cursor: draft.trim() ? "pointer" : "default",
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function resolvePresetTab(text: string): AiAssistantTab | null {
  const normalizedText = text.trim().toLowerCase();
  if (!normalizedText) return null;

  if (
    normalizedText.includes("входящ")
    || normalizedText.includes("решени")
  ) {
    return "inbox";
  }

  if (
    normalizedText.includes("чернов")
    || normalizedText.includes("документ")
  ) {
    return "drafts";
  }

  if (
    normalizedText.includes("истори")
    || normalizedText.includes("последн")
    || normalizedText.includes("аудит")
    || normalizedText.includes("действ")
  ) {
    return "history";
  }

  if (
    normalizedText.includes("настрой")
    || normalizedText.includes("интеграц")
    || normalizedText.includes("агент")
  ) {
    return "settings";
  }

  if (
    normalizedText.includes("главн")
    || normalizedText.includes("сводк")
  ) {
    return "main";
  }

  return null;
}

const chatContentStyle = {
  minHeight: 260,
  display: "grid",
  gridTemplateRows: "minmax(160px, 1fr) auto",
  overflow: "hidden",
} as const;

const messagesStyle = {
  display: "grid",
  alignContent: "start",
  gap: 8,
  padding: 10,
  overflow: "auto",
} as const;

const contextCardStyle = {
  display: "grid",
  gap: 8,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
} as const;

const contextTitleStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 900,
} as const;

const contextDateStyle = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
} as const;

const contextDetailStyle = {
  color: "#475569",
  fontSize: 12,
  fontWeight: 800,
} as const;

const quickActionsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
} as const;

const quickActionStyle = {
  border: "1px solid #0f172a",
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  padding: "6px 8px",
  font: "inherit",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
} as const;

const suggestionsStyle = {
  display: "grid",
  gap: 5,
} as const;

const suggestionStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#f8fafc",
  color: "#0f172a",
  padding: "6px 8px",
  font: "inherit",
  fontSize: 12,
  textAlign: "left",
  cursor: "pointer",
} as const;

const messageStyle = {
  maxWidth: "86%",
  borderRadius: 8,
  padding: "7px 9px",
  fontSize: 13,
  lineHeight: 1.35,
} as const;

const historyHintStyle = {
  border: "1px dashed #cbd5e1",
  borderRadius: 8,
  background: "#f8fafc",
  color: "#475569",
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 700,
} as const;

const messageAuthorStyle = {
  fontSize: 11,
  fontWeight: 900,
  opacity: 0.75,
  marginBottom: 3,
} as const;

const composerStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8,
  padding: 10,
  borderTop: "1px solid #dbe3ec",
  background: "#ffffff",
} as const;

const textareaStyle = {
  minHeight: 46,
  maxHeight: 110,
  resize: "vertical",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "8px 9px",
  font: "inherit",
  fontSize: 13,
  outline: "none",
} as const;

const sendButtonStyle = {
  alignSelf: "end",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 38,
  height: 38,
  border: "1px solid #0f172a",
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
} as const;
