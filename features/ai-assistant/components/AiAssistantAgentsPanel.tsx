"use client";

import type { CSSProperties } from "react";

import type { AiAssistantAgent, AiAssistantAgentRole, AiAssistantAgentRuntimeStatus } from "@/features/ai-assistant/types";
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
}: {
  agents: AiAssistantAgent[];
}) {
  return (
    <section style={aiAssistantPanelStyle}>
      <div style={panelHeaderStyle}>
        <div style={panelTitleStyle}>Агенты</div>
        <div style={aiAssistantMutedTextStyle}>Внутренние роли одного AI-модуля. Реальные действия выполняются только через согласование.</div>
      </div>

      <div style={aiAssistantTableWrapStyle}>
        <table style={agentsTableStyle}>
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: 130 }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "21%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: 130 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={aiAssistantThStyle}>Агент</th>
              <th style={compactThStyle}>Статус</th>
              <th style={aiAssistantThStyle}>Назначение</th>
              <th style={aiAssistantThStyle}>Разрешено</th>
              <th style={aiAssistantThStyle}>Запрещено</th>
              <th style={compactThStyle}>Подтверждение</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
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
              </tr>
            ))}
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
  minWidth: 1180,
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
