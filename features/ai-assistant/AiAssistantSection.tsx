"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { AiAssistantTabs } from "@/features/ai-assistant/components/AiAssistantTabs";
import {
  aiAssistantHeaderStyle,
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
  aiAssistantShellStyle,
  aiAssistantTitleStyle,
} from "@/features/ai-assistant/aiAssistantStyles";
import { useAiAssistantContext } from "@/features/ai-assistant/lib/useAiAssistantState";
import {
  appNavigationEventName,
  isAppNavigationEvent,
} from "@/lib/domain/navigation/appNavigationEvents";
import type { AiAssistantTab } from "@/features/ai-assistant/types";
import type { SettingsSection } from "@/features/ai-assistant/components/AiAssistantSettingsPanel";

const aiAssistantTabIds: AiAssistantTab[] = ["main", "inbox", "drafts", "history", "settings"];

const legacyAiAssistantTabMap: Record<string, AiAssistantTab> = {
  agents: "settings",
  approvals: "inbox",
  development: "settings",
  documents: "drafts",
  notifications: "inbox",
  planner: "inbox",
  tasks: "inbox",
};

const AiAssistantHomePanel = dynamic(
  () => import("@/features/ai-assistant/components/AiAssistantHomePanel").then((module) => module.AiAssistantHomePanel),
  {
    ssr: false,
    loading: () => <AiAssistantPanelLoading label="Загрузка сводки AI-ассистента..." />,
  },
);

const AiAssistantTasksPanel = dynamic(
  () => import("@/features/ai-assistant/components/AiAssistantTasksPanel").then((module) => module.AiAssistantTasksPanel),
  {
    ssr: false,
    loading: () => <AiAssistantPanelLoading label="Загрузка задач и уведомлений..." />,
  },
);

const AiAssistantWorkspacePanel = dynamic(
  () => import("@/features/ai-assistant/components/AiAssistantWorkspacePanel").then((module) => module.AiAssistantWorkspacePanel),
  {
    ssr: false,
    loading: () => <AiAssistantPanelLoading label="Загрузка черновиков и документов..." />,
  },
);

const AiAssistantAuditLog = dynamic(
  () => import("@/features/ai-assistant/components/AiAssistantAuditLog").then((module) => module.AiAssistantAuditLog),
  {
    ssr: false,
    loading: () => <AiAssistantPanelLoading label="Загрузка журнала действий..." />,
  },
);

const AiAssistantSettingsPanel = dynamic(
  () => import("@/features/ai-assistant/components/AiAssistantSettingsPanel").then((module) => module.AiAssistantSettingsPanel),
  {
    ssr: false,
    loading: () => <AiAssistantPanelLoading label="Загрузка настроек AI-ассистента..." />,
  },
);

export function AiAssistantSection() {
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("overview");
  const {
    activeTab,
    agentActivationDrafts,
    appendChatMessage,
    setActiveTab,
    setAgentActivationDraft,
    setApprovalDecision,
    updateApprovalDraftText,
    viewModel,
    addIntegration,
    updateIntegration,
    deleteIntegration,
    addKnowledgeSource,
    updateKnowledgeSource,
    deleteKnowledgeSource,
    setDevelopmentIdeaStatus,
    createCodexPromptDraftForIdea,
  } = useAiAssistantContext();

  useEffect(() => {
    const handleNavigation = (event: Event) => {
      if (!isAppNavigationEvent(event)) return;
      if (
        event.detail.topTab === "ai-assistant"
      ) {
        const nextTab = normalizeAiAssistantTab(event.detail.aiAssistantTab);
        if (nextTab) setActiveTab(nextTab);
      }
    };

    window.addEventListener(appNavigationEventName, handleNavigation);
    return () => window.removeEventListener(appNavigationEventName, handleNavigation);
  }, [setActiveTab]);

  return (
    <div style={aiAssistantShellStyle}>
      <div style={aiAssistantHeaderStyle}>
        <div>
          <h1 style={aiAssistantTitleStyle}>AI-ассистент</h1>
        </div>
        <AiAssistantTabs activeTab={activeTab} onSelectTab={setActiveTab} />
      </div>

      {activeTab === "main" && (
        <AiAssistantHomePanel
          viewModel={viewModel}
          onAppendChatMessage={appendChatMessage}
          onSetActiveTab={setActiveTab}
          onSetApprovalDecision={setApprovalDecision}
        />
      )}

      {activeTab === "inbox" && (
        <AiAssistantTasksPanel
          approvals={viewModel.approvalActions}
          currentWorkDate={viewModel.currentWorkDate}
          tasks={viewModel.currentTasks}
          notifications={viewModel.currentNotifications}
          plannerItems={viewModel.plannerItems}
          onUpdateApprovalDraftText={updateApprovalDraftText}
          onSetApprovalDecision={setApprovalDecision}
        />
      )}

      {activeTab === "drafts" && (
        <AiAssistantWorkspacePanel
          documents={viewModel.documents}
          documentologItems={viewModel.documentologItems}
          mailDrafts={viewModel.mailDrafts}
        />
      )}

      {activeTab === "history" && (
        <AiAssistantAuditLog events={viewModel.auditEvents} />
      )}

      {activeTab === "settings" && (
        <AiAssistantSettingsPanel
          viewModel={viewModel}
          agentActivationDrafts={agentActivationDrafts}
          setAgentActivationDraft={setAgentActivationDraft}
          section={settingsSection}
          onSetSection={setSettingsSection}
          addIntegration={addIntegration}
          updateIntegration={updateIntegration}
          deleteIntegration={deleteIntegration}
          addKnowledgeSource={addKnowledgeSource}
          updateKnowledgeSource={updateKnowledgeSource}
          deleteKnowledgeSource={deleteKnowledgeSource}
          setDevelopmentIdeaStatus={setDevelopmentIdeaStatus}
          createCodexPromptDraftForIdea={createCodexPromptDraftForIdea}
        />
      )}
    </div>
  );
}

function normalizeAiAssistantTab(value: unknown): AiAssistantTab | null {
  if (typeof value !== "string") return null;
  if (aiAssistantTabIds.includes(value as AiAssistantTab)) return value as AiAssistantTab;
  return legacyAiAssistantTabMap[value] ?? null;
}

function AiAssistantPanelLoading({ label }: { label: string }) {
  return (
    <section style={aiAssistantPanelStyle}>
      <div style={aiAssistantMutedTextStyle}>{label}</div>
    </section>
  );
}
