"use client";

import { useEffect, useState } from "react";

import { AiAssistantDocumentsPanel } from "@/features/ai-assistant/components/AiAssistantDocumentsPanel";
import { AiAssistantHomePanel } from "@/features/ai-assistant/components/AiAssistantHomePanel";
import {
  AiAssistantSettingsPanel,
  type SettingsSection,
} from "@/features/ai-assistant/components/AiAssistantSettingsPanel";
import { AiAssistantTabs } from "@/features/ai-assistant/components/AiAssistantTabs";
import { AiAssistantTasksPanel } from "@/features/ai-assistant/components/AiAssistantTasksPanel";
import {
  aiAssistantHeaderStyle,
  aiAssistantShellStyle,
  aiAssistantTitleStyle,
} from "@/features/ai-assistant/aiAssistantStyles";
import { useAiAssistantContext } from "@/features/ai-assistant/lib/useAiAssistantState";
import {
  appNavigationEventName,
  isAppNavigationEvent,
} from "@/lib/domain/navigation/appNavigationEvents";

export function AiAssistantSection() {
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("agents");
  const {
    activeTab,
    agentActivationDrafts,
    appendChatMessage,
    setActiveTab,
    setPlannerItems,
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
      if (event.detail.topTab === "ai-assistant" && event.detail.aiAssistantTab) {
        setActiveTab(event.detail.aiAssistantTab);
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
          onOpenSettingsSection={(section) => {
            setSettingsSection(section);
            setActiveTab("settings");
          }}
          onSetActiveTab={setActiveTab}
          onSetApprovalDecision={setApprovalDecision}
        />
      )}

      {activeTab === "tasks" && (
        <AiAssistantTasksPanel
          approvals={viewModel.approvalActions}
          currentWorkDate={viewModel.currentWorkDate}
          tasks={viewModel.currentTasks}
          notifications={viewModel.currentNotifications}
          plannerItems={viewModel.plannerItems}
          onChangePlannerItems={setPlannerItems}
          onUpdateApprovalDraftText={updateApprovalDraftText}
          onSetApprovalDecision={setApprovalDecision}
        />
      )}

      {activeTab === "documents" && (
        <AiAssistantDocumentsPanel
          documents={viewModel.documents}
          documentologItems={viewModel.documentologItems}
          mailDrafts={viewModel.mailDrafts}
        />
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
