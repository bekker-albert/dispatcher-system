"use client";

import type { CSSProperties } from "react";

import { AiAssistantAgentsPanel } from "@/features/ai-assistant/components/AiAssistantAgentsPanel";
import { AiAssistantAuditLog } from "@/features/ai-assistant/components/AiAssistantAuditLog";
import { AiAssistantDevelopmentPanel } from "@/features/ai-assistant/components/AiAssistantDevelopmentPanel";
import { AiAssistantIntegrationStatus } from "@/features/ai-assistant/components/AiAssistantIntegrationStatus";
import { AiAssistantKnowledgePanel } from "@/features/ai-assistant/components/AiAssistantKnowledgePanel";
import type {
  AiAssistantCodexPromptDraft,
  AiAssistantDevelopmentIdea,
  AiAssistantIntegration,
  AiAssistantKnowledgeSource,
  AiAssistantViewModel,
} from "@/features/ai-assistant/types";
import { aiAssistantPanelStyle } from "@/features/ai-assistant/aiAssistantStyles";

export type SettingsSection = "agents" | "integrations" | "knowledge" | "development" | "audit";

const settingsSections: Array<{ id: SettingsSection; label: string }> = [
  { id: "agents", label: "Агенты" },
  { id: "integrations", label: "Интеграции" },
  { id: "knowledge", label: "Знания" },
  { id: "development", label: "Развитие" },
  { id: "audit", label: "Журнал" },
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
