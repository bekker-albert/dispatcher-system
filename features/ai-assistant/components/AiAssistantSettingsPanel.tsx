"use client";

import type { CSSProperties } from "react";
import dynamic from "next/dynamic";

import { AiAssistantAuditLog } from "@/features/ai-assistant/components/AiAssistantAuditLog";
import type {
  AiAssistantCodexPromptDraft,
  AiAssistantDevelopmentIdea,
  AiAssistantIntegration,
  AiAssistantKnowledgeSource,
  AiAssistantViewModel,
} from "@/features/ai-assistant/types";
import { aiAssistantMutedTextStyle, aiAssistantPanelStyle } from "@/features/ai-assistant/aiAssistantStyles";

const AiAssistantAgentsPanel = dynamic(
  () => import("@/features/ai-assistant/components/AiAssistantAgentsPanel").then((module) => module.AiAssistantAgentsPanel),
  {
    ssr: false,
    loading: () => <SettingsSectionLoading label="Загрузка панели агентов..." />,
  },
);

const AiAssistantIntegrationStatus = dynamic(
  () => import("@/features/ai-assistant/components/AiAssistantIntegrationStatus").then((module) => module.AiAssistantIntegrationStatus),
  {
    ssr: false,
    loading: () => <SettingsSectionLoading label="Загрузка интеграций..." />,
  },
);

const AiAssistantKnowledgePanel = dynamic(
  () => import("@/features/ai-assistant/components/AiAssistantKnowledgePanel").then((module) => module.AiAssistantKnowledgePanel),
  {
    ssr: false,
    loading: () => <SettingsSectionLoading label="Загрузка базы знаний..." />,
  },
);

const AiAssistantDevelopmentPanel = dynamic(
  () => import("@/features/ai-assistant/components/AiAssistantDevelopmentPanel").then((module) => module.AiAssistantDevelopmentPanel),
  {
    ssr: false,
    loading: () => <SettingsSectionLoading label="Загрузка панели развития..." />,
  },
);

export type SettingsSection = "overview" | "agents" | "integrations" | "knowledge" | "development" | "audit";

const settingsSections: Array<{ id: SettingsSection; label: string }> = [
  { id: "overview", label: "Обзор" },
  { id: "agents", label: "Агенты" },
  { id: "integrations", label: "Интеграции" },
  { id: "knowledge", label: "Знания" },
  { id: "development", label: "Развитие" },
  { id: "audit", label: "Журнал" },
];

const settingsOverviewCards: Array<{
  id: Exclude<SettingsSection, "overview">;
  title: string;
  text: string;
}> = [
  {
    id: "agents",
    title: "Агенты",
    text: "Внутренние роли AI-модуля: что разрешено, что заблокировано и где требуется решение человека.",
  },
  {
    id: "integrations",
    title: "Интеграции",
    text: "Каналы подключения: AI API, WhatsApp, почта, календарь, Documentolog и уведомления.",
  },
  {
    id: "knowledge",
    title: "Знания",
    text: "Правила и источники, по которым ассистент готовит ответы и объясняет решения.",
  },
  {
    id: "development",
    title: "Развитие",
    text: "Идеи, ТЗ и промты для Codex без запуска внешних действий.",
  },
  {
    id: "audit",
    title: "Журнал",
    text: "История обнаруженных событий, решений и подготовленных действий.",
  },
];

export function AiAssistantSettingsPanel({
  viewModel,
  agentActivationDrafts,
  setAgentActivationDraft,
  section,
  onSetSection,
  addIntegration,
  addKnowledgeSource,
  createCodexPromptDraftForIdea,
  deleteIntegration,
  deleteKnowledgeSource,
  setDevelopmentIdeaStatus,
  updateIntegration,
  updateKnowledgeSource,
}: {
  viewModel: AiAssistantViewModel;
  agentActivationDrafts: Record<string, boolean>;
  setAgentActivationDraft: (agentId: string, value: boolean) => void;
  section: SettingsSection;
  onSetSection: (section: SettingsSection) => void;
  addIntegration: (integration: Omit<AiAssistantIntegration, "key">) => void;
  addKnowledgeSource: (source: Omit<AiAssistantKnowledgeSource, "id" | "updatedAt">) => void;
  createCodexPromptDraftForIdea: (idea: AiAssistantDevelopmentIdea) => void;
  deleteIntegration: (integrationKey: string) => void;
  deleteKnowledgeSource: (sourceId: string) => void;
  setDevelopmentIdeaStatus: (ideaId: string, status: AiAssistantDevelopmentIdea["status"]) => void;
  updateIntegration: (integration: AiAssistantIntegration) => void;
  updateKnowledgeSource: (source: AiAssistantKnowledgeSource) => void;
}) {
  return (
    <section style={settingsShellStyle}>
      <div style={settingsTabsStyle}>
        {settingsSections.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSetSection(item.id)}
            style={{
              ...settingsTabStyle,
              borderColor: section === item.id ? "#0f172a" : "#cbd5e1",
              background: section === item.id ? "#0f172a" : "#ffffff",
              color: section === item.id ? "#ffffff" : "#0f172a",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === "overview" && (
        <div style={settingsOverviewGridStyle}>
          {settingsOverviewCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSetSection(card.id)}
              style={settingsOverviewCardStyle}
            >
              <span style={settingsOverviewTitleStyle}>{card.title}</span>
              <span style={aiAssistantMutedTextStyle}>{card.text}</span>
            </button>
          ))}
        </div>
      )}

      {section === "agents" && (
        <AiAssistantAgentsPanel
          agents={viewModel.agents}
          activationDrafts={agentActivationDrafts}
          onSetActivationDraft={setAgentActivationDraft}
        />
      )}
      {section === "integrations" && (
        <AiAssistantIntegrationStatus
          integrations={viewModel.integrations}
          onAddIntegration={addIntegration}
          onUpdateIntegration={updateIntegration}
          onDeleteIntegration={deleteIntegration}
        />
      )}
      {section === "knowledge" && (
        <AiAssistantKnowledgePanel
          sources={viewModel.knowledgeSources}
          onAddSource={addKnowledgeSource}
          onUpdateSource={updateKnowledgeSource}
          onDeleteSource={deleteKnowledgeSource}
        />
      )}
      {section === "development" && (
        <AiAssistantDevelopmentPanel
          ideas={viewModel.developmentIdeas}
          codexPromptDrafts={viewModel.codexPromptDrafts as AiAssistantCodexPromptDraft[]}
          onSetIdeaStatus={setDevelopmentIdeaStatus}
          onCreateCodexPromptDraft={createCodexPromptDraftForIdea}
        />
      )}
      {section === "audit" && <AiAssistantAuditLog events={viewModel.auditEvents} />}
    </section>
  );
}

const settingsShellStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const settingsTabsStyle: CSSProperties = {
  ...aiAssistantPanelStyle,
  minHeight: 0,
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const settingsTabStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
};

const settingsOverviewGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 8,
};

const settingsOverviewCardStyle: CSSProperties = {
  ...aiAssistantPanelStyle,
  minHeight: 0,
  textAlign: "left",
  cursor: "pointer",
};

const settingsOverviewTitleStyle: CSSProperties = {
  display: "block",
  color: "#0f172a",
  fontSize: 15,
  fontWeight: 900,
  marginBottom: 5,
};

function SettingsSectionLoading({ label }: { label: string }) {
  return (
    <section style={aiAssistantPanelStyle}>
      <div style={aiAssistantMutedTextStyle}>{label}</div>
    </section>
  );
}
