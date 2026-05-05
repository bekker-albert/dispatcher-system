"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import type {
  AiAssistantAgent,
  AiAssistantAgentRole,
  AiAssistantAgentRuntimeStatus,
} from "@/features/ai-assistant/types";
import {
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
  aiAssistantTableStyle,
  aiAssistantTableWrapStyle,
  aiAssistantTdStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

export function AiAssistantAgentsPanel({
  agents,
  activationDrafts,
  onSetActivationDraft,
}: {
  agents: AiAssistantAgent[];
  activationDrafts: Record<string, boolean>;
  onSetActivationDraft: (agentId: string, value: boolean) => void;
}) {
  const [activationKeys, setActivationKeys] = useState<Record<string, string>>({});
  const activatedCount = useMemo(
    () => Object.values(activationDrafts).filter(Boolean).length,
    [activationDrafts],
  );

  const setActivationKey = (agentId: string, value: string) => {
    setActivationKeys((current) => ({ ...current, [agentId]: value }));
  };

  const activateAgent = (agent: AiAssistantAgent) => {
    const key = activationKeys[agent.id]?.trim();
    if (!key || key.length < 8) return;

    onSetActivationDraft(agent.id, true);
    setActivationKeys((current) => ({ ...current, [agent.id]: "" }));
  };

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={panelHeaderStyle}>
        <div style={panelTitleStyle}>Агенты</div>
        <div style={aiAssistantMutedTextStyle}>
          Активировано в текущем сеансе: {activatedCount}. Ключ не сохраняется в браузере после нажатия.
        </div>
      </div>

      <div style={aiAssistantTableWrapStyle}>
        <table style={agentsTableStyle}>
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: 130 }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 240 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={aiAssistantThStyle}>Агент</th>
              <th style={compactThStyle}>Статус</th>
              <th style={aiAssistantThStyle}>Назначение</th>
              <th style={aiAssistantThStyle}>Разрешено</th>
              <th style={aiAssistantThStyle}>Запрещено</th>
              <th style={compactThStyle}>Решение</th>
              <th style={compactThStyle}>Активация</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const isActivated = Boolean(activationDrafts[agent.id]);
              const activationKey = activationKeys[agent.id] ?? "";
              const isActivationReady = activationKey.trim().length >= 8;

              return (
                <tr key={agent.id}>
                  <td style={textTdStyle}>
                    <div style={strongTextStyle}>{agent.title}</div>
                    <div style={aiAssistantMutedTextStyle}>{formatAgentRole(agent.role)}</div>
                    <div style={aiAssistantMutedTextStyle}>{agent.requiredConnectors.join(", ")}</div>
                  </td>
                  <td style={compactTdStyle}><AgentStatusPill status={agent.status} /></td>
                  <td style={textTdStyle}>{agent.description}</td>
                  <td style={textTdStyle}>{agent.allowedActions.join(", ")}</td>
                  <td style={textTdStyle}>{agent.blockedActions.join(", ")}</td>
                  <td style={compactTdStyle}>{agent.requiresUserApproval ? "Требуется" : "Не требуется"}</td>
                  <td style={activationTdStyle}>
                    <div style={activationFormStyle}>
                      <input
                        aria-label={`Ключ активации: ${agent.title}`}
                        autoComplete="off"
                        type="password"
                        value={activationKey}
                        placeholder={isActivated ? "Активирован" : "Ключ"}
                        onChange={(event) => setActivationKey(agent.id, event.target.value)}
                        style={activationInputStyle}
                      />
                      <button
                        type="button"
                        disabled={!isActivationReady}
                        onClick={() => activateAgent(agent)}
                        style={{
                          ...activationButtonStyle,
                          opacity: isActivationReady ? 1 : 0.45,
                          cursor: isActivationReady ? "pointer" : "default",
                        }}
                      >
                        Вкл.
                      </button>
                    </div>
                    <div style={aiAssistantMutedTextStyle}>
                      {isActivated ? "Ключ принят. Серверная проверка будет подключена позже." : "Минимум 8 символов."}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AgentStatusPill({ status }: { status: AiAssistantAgentRuntimeStatus }) {
  const meta = agentStatusMeta[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 24,
        padding: "3px 8px",
        borderRadius: 8,
        border: `1px solid ${meta.border}`,
        background: meta.background,
        color: meta.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

function formatAgentRole(role: AiAssistantAgentRole) {
  const labels: Record<AiAssistantAgentRole, string> = {
    "main-assistant": "Главный ассистент",
    "whatsapp-monitor": "WhatsApp-монитор",
    "task-planner": "Планировщик",
    "document-agent": "Документы",
    "mail-agent": "Почта",
    "calendar-agent": "Календарь",
    "documentolog-agent": "Documentolog",
    "mentor-agent": "Наставник",
    "development-agent": "Развитие / ТЗ / Codex",
    "qa-agent": "QA",
    "security-agent": "Безопасность",
  };

  return labels[role];
}

const panelHeaderStyle: CSSProperties = {
  display: "grid",
  gap: 3,
  marginBottom: 10,
};

const panelTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 900,
  color: "#0f172a",
};

const agentsTableStyle: CSSProperties = {
  ...aiAssistantTableStyle,
  tableLayout: "fixed",
  minWidth: 1320,
};

const compactThStyle: CSSProperties = {
  ...aiAssistantThStyle,
  whiteSpace: "nowrap",
};

const textTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  overflowWrap: "anywhere",
};

const compactTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  whiteSpace: "nowrap",
};

const strongTextStyle: CSSProperties = {
  fontWeight: 900,
};

const activationTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  minWidth: 220,
};

const activationFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 6,
  alignItems: "center",
  marginBottom: 4,
};

const activationInputStyle: CSSProperties = {
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "7px 8px",
  font: "inherit",
  fontSize: 12,
};

const activationButtonStyle: CSSProperties = {
  border: "1px solid #0f172a",
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  padding: "7px 9px",
  fontSize: 12,
  fontWeight: 900,
};

const agentStatusMeta: Record<AiAssistantAgentRuntimeStatus, {
  label: string;
  background: string;
  border: string;
  color: string;
}> = {
  planned: {
    label: "Планируется",
    background: "#eff6ff",
    border: "#bfdbfe",
    color: "#1d4ed8",
  },
  active: {
    label: "Активен",
    background: "#ecfdf5",
    border: "#bbf7d0",
    color: "#15803d",
  },
  paused: {
    label: "Пауза",
    background: "#f8fafc",
    border: "#cbd5e1",
    color: "#475569",
  },
  error: {
    label: "Ошибка",
    background: "#fef2f2",
    border: "#fecaca",
    color: "#b91c1c",
  },
};
