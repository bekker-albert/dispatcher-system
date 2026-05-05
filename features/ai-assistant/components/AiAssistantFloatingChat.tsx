"use client";

import { Send } from "lucide-react";
import { useMemo, useState } from "react";

import { AiAssistantFloatingNotifications } from "@/features/ai-assistant/components/AiAssistantFloatingNotifications";
import type {
  AiAssistantChatMessage,
  AiAssistantNotification,
} from "@/features/ai-assistant/types";

export function AiAssistantFloatingChat({
  messages,
  notifications,
  onNavigate,
  onSendMessage,
  onSetNotificationDecision,
}: {
  messages: AiAssistantChatMessage[];
  notifications: AiAssistantNotification[];
  onNavigate: () => void;
  onSendMessage: (text: string) => void;
  onSetNotificationDecision: (notification: AiAssistantNotification, status: "approved" | "rejected") => void;
}) {
  const [draft, setDraft] = useState("");
  const visibleMessages = useMemo(
    () => messages.slice(-8),
    [messages],
  );

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    onSendMessage(text);
    setDraft("");
  };

  return (
    <div style={chatContentStyle}>
      <div style={messagesStyle}>
        {notifications.length > 0 && (
          <AiAssistantFloatingNotifications
            notifications={notifications}
            onNavigate={onNavigate}
            onSetDecision={onSetNotificationDecision}
          />
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
          placeholder="Напишите вопрос"
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

const chatContentStyle = {
  minHeight: 260,
  display: "grid",
  gridTemplateRows: "minmax(160px, 1fr) auto",
  overflow: "hidden",
} as const;

const messagesStyle = {
  display: "grid",
  alignContent: "end",
  gap: 8,
  padding: 10,
  overflow: "auto",
} as const;

const messageStyle = {
  maxWidth: "86%",
  borderRadius: 8,
  padding: "7px 9px",
  fontSize: 13,
  lineHeight: 1.35,
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
