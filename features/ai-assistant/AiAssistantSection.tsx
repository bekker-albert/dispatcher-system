"use client";

import { useEffect } from "react";

import { AiAssistantAuditLog } from "@/features/ai-assistant/components/AiAssistantAuditLog";
import { AiAssistantIntegrationStatus } from "@/features/ai-assistant/components/AiAssistantIntegrationStatus";
import { AiAssistantKnowledgePanel } from "@/features/ai-assistant/components/AiAssistantKnowledgePanel";
import { AiAssistantPlannerPanel } from "@/features/ai-assistant/components/AiAssistantPlannerPanel";
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
  const {
    activeTab,
    setActiveTab,
    setApprovalDecision,
    updateApprovalDraftText,
    viewModel,
    setPlannerItems,
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

      {activeTab === "tasks" && (
        <AiAssistantTasksPanel
          approvals={viewModel.approvalActions}
          currentWorkDate={viewModel.currentWorkDate}
          tasks={viewModel.currentTasks}
          notifications={viewModel.currentNotifications}
          onUpdateApprovalDraftText={updateApprovalDraftText}
          onSetApprovalDecision={setApprovalDecision}
        />
      )}

      {activeTab === "planner" && (
        <AiAssistantPlannerPanel
          currentWorkDate={viewModel.currentWorkDate}
          plannerItems={viewModel.plannerItems}
          onChangePlannerItems={setPlannerItems}
        />
      )}

      {activeTab === "integrations" && (
        <AiAssistantIntegrationStatus integrations={viewModel.integrations} />
      )}

      {activeTab === "knowledge" && (
        <AiAssistantKnowledgePanel sources={viewModel.knowledgeSources} />
      )}

      {activeTab === "audit" && (
        <AiAssistantAuditLog events={viewModel.auditEvents} />
      )}
    </div>
  );
}
