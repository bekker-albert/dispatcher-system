"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Bell, Bot, X } from "lucide-react";

import { AiAssistantFloatingChat } from "@/features/ai-assistant/components/AiAssistantFloatingChat";
import { AiAssistantFloatingNotifications } from "@/features/ai-assistant/components/AiAssistantFloatingNotifications";
import { useAiAssistantContext } from "@/features/ai-assistant/lib/useAiAssistantState";

type FloatingPanel = "chat" | "notifications";

export function AiAssistantFloatingDock() {
  const {
    appendChatMessage,
    viewModel,
  } = useAiAssistantContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<FloatingPanel>("chat");
  const currentNotifications = useMemo(
    () => viewModel.currentNotifications.slice(0, 5),
    [viewModel.currentNotifications],
  );
  const activeNotificationsCount = currentNotifications.filter((notification) => (
    notification.status === "queued"
    || notification.status === "draft"
    || notification.approvalStatus === "required"
  )).length;
  const isChatOpen = activePanel === "chat";
  const isNotificationsOpen = activePanel === "notifications";

  return (
    <div className="ai-floating-dock" style={floatingDockStyle}>
      {isOpen && (
        <section
          style={floatingPanelStyle}
          aria-label="AI-виджет"
          role="region"
        >
          <div style={floatingPanelHeaderStyle}>
            <div style={floatingPanelTitleStyle}>
              {isNotificationsOpen ? <Bell size={17} /> : <Bot size={18} />}
              <span>{isNotificationsOpen ? "Уведомления" : "AI-ассистент"}</span>
            </div>

            <div style={floatingPanelHeaderActionsStyle}>
              <FloatingPanelTab
                active={isChatOpen}
                label="Чат"
                onClick={() => setActivePanel("chat")}
              />
              <FloatingPanelTab
                active={isNotificationsOpen}
                count={activeNotificationsCount}
                label="Уведомления"
                onClick={() => setActivePanel("notifications")}
              />
              <button
                type="button"
                aria-label="Свернуть виджет"
                onClick={() => setIsOpen(false)}
                style={floatingPanelCloseButtonStyle}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {isNotificationsOpen ? (
            <AiAssistantFloatingNotifications
              notifications={currentNotifications}
              onNavigate={() => setIsOpen(false)}
            />
          ) : (
            <AiAssistantFloatingChat
              messages={viewModel.chatMessages}
              onSendMessage={appendChatMessage}
            />
          )}
        </section>
      )}

      <div style={floatingButtonsStyle}>
        <FloatingDockButton
          active={isOpen}
          label={isOpen ? "Свернуть AI-виджет" : "Открыть AI-виджет"}
          onClick={() => setIsOpen((current) => !current)}
          primary
        >
          <Bot size={20} />
          {activeNotificationsCount > 0 && <span style={notificationBadgeStyle}>{activeNotificationsCount}</span>}
        </FloatingDockButton>
      </div>
    </div>
  );
}

function FloatingPanelTab({
  active,
  count = 0,
  label,
  onClick,
}: {
  active: boolean;
  count?: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={active ? activePanelTabStyle : panelTabStyle}
    >
      {label}
      {count > 0 && <span style={panelTabBadgeStyle}>{count}</span>}
    </button>
  );
}

function FloatingDockButton({
  active,
  children,
  label,
  onClick,
  primary = false,
}: {
  active: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  const style = primary ? primaryToggleButtonStyle : secondaryToggleButtonStyle;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        ...style,
        boxShadow: active ? "0 10px 24px rgba(15, 23, 42, 0.22)" : style.boxShadow,
      }}
    >
      {children}
    </button>
  );
}

const floatingDockStyle: CSSProperties = {
  position: "fixed",
  right: 18,
  bottom: 18,
  zIndex: 1200,
  display: "grid",
  justifyItems: "end",
  gap: 8,
};

const floatingPanelStyle: CSSProperties = {
  width: "min(420px, calc(100vw - 36px))",
  maxHeight: "min(560px, calc(100vh - 110px))",
  display: "grid",
  gridTemplateRows: "auto minmax(160px, 1fr)",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#f8fafc",
  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.18)",
  overflow: "hidden",
};

const floatingPanelHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "9px 10px",
  background: "#0f172a",
  color: "#ffffff",
  fontSize: 13,
};

const floatingPanelTitleStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 900,
  minWidth: 0,
};

const floatingPanelHeaderActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  marginLeft: "auto",
};

const panelTabStyle: CSSProperties = {
  position: "relative",
  border: "1px solid rgba(255,255,255,0.28)",
  borderRadius: 8,
  background: "transparent",
  color: "#ffffff",
  padding: "5px 8px",
  font: "inherit",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const activePanelTabStyle: CSSProperties = {
  ...panelTabStyle,
  background: "#ffffff",
  color: "#0f172a",
};

const panelTabBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 16,
  height: 16,
  marginLeft: 5,
  borderRadius: 999,
  background: "#b91c1c",
  color: "#ffffff",
  fontSize: 10,
  fontWeight: 900,
};

const floatingPanelCloseButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 27,
  height: 27,
  border: "1px solid rgba(255,255,255,0.32)",
  borderRadius: 8,
  background: "transparent",
  color: "#ffffff",
  cursor: "pointer",
};

const floatingButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "end",
  gap: 8,
  justifyContent: "flex-end",
};

const baseToggleButtonStyle: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  cursor: "pointer",
};

const secondaryToggleButtonStyle: CSSProperties = {
  ...baseToggleButtonStyle,
  width: 42,
  height: 42,
  border: "1px solid #0f172a",
  background: "#ffffff",
  color: "#0f172a",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
};

const primaryToggleButtonStyle: CSSProperties = {
  ...baseToggleButtonStyle,
  width: 46,
  height: 46,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.18)",
};

const notificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: -6,
  right: -6,
  minWidth: 18,
  height: 18,
  border: "1px solid #ffffff",
  borderRadius: 999,
  background: "#b91c1c",
  color: "#ffffff",
  fontSize: 11,
  lineHeight: "16px",
  fontWeight: 900,
  textAlign: "center",
};
