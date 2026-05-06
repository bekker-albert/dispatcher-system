"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { defaultAiAssistantDataset, defaultAiAssistantRole } from "@/features/ai-assistant/data";
import type {
  AiAssistantRuntimeContext,
  AiAssistantTab,
} from "@/features/ai-assistant/types";
import { useAiAssistantActions } from "@/features/ai-assistant/lib/useAiAssistantActions";
import { createAiAssistantCurrentDateTime, upsertById } from "@/features/ai-assistant/lib/aiAssistantStateHelpers";
import {
  aiAssistantSystemNotificationEventName,
  type AiAssistantSystemNotificationDetail,
} from "@/features/ai-assistant/lib/systemNotifications";
import { createAiAssistantViewModel } from "@/lib/domain/ai-assistant/view-model";
import { resolveAiAssistantPermissions } from "@/lib/domain/ai-assistant/permissions";
import { defaultAiAssistantRuntimeContext } from "@/lib/domain/ai-assistant/runtime-context";

type UseAiAssistantStateOptions = {
  currentContext?: AiAssistantRuntimeContext;
  currentWorkDate?: string;
  currentDateTime?: string;
};

export function useAiAssistantState({
  currentContext = defaultAiAssistantRuntimeContext,
  currentWorkDate = defaultAiAssistantDataset.currentWorkDate,
  currentDateTime,
}: UseAiAssistantStateOptions = {}) {
  const [activeTab, setActiveTab] = useState<AiAssistantTab>("main");
  const [chatMessages, setChatMessages] = useState<typeof defaultAiAssistantDataset.chatMessages>([]);
  const [approvalActions, setApprovalActions] = useState(defaultAiAssistantDataset.approvalActions);
  const [tasks, setTasks] = useState(defaultAiAssistantDataset.tasks);
  const [notifications, setNotifications] = useState<typeof defaultAiAssistantDataset.notifications>([]);
  const [plannerItems, setPlannerItems] = useState(defaultAiAssistantDataset.plannerItems);
  const [integrations, setIntegrations] = useState(defaultAiAssistantDataset.integrations);
  const [knowledgeSources, setKnowledgeSources] = useState(defaultAiAssistantDataset.knowledgeSources);
  const [agentActivationDrafts, setAgentActivationDrafts] = useState<Record<string, boolean>>({});
  const [agents] = useState(defaultAiAssistantDataset.agents);
  const [whatsappGroups] = useState(defaultAiAssistantDataset.whatsappGroups);
  const [whatsappMessageCandidates] = useState(defaultAiAssistantDataset.whatsappMessageCandidates);
  const [documents, setDocuments] = useState(defaultAiAssistantDataset.documents);
  const [documentTemplates] = useState(defaultAiAssistantDataset.documentTemplates);
  const [mailItems] = useState(defaultAiAssistantDataset.mailItems);
  const [mailDrafts, setMailDrafts] = useState(defaultAiAssistantDataset.mailDrafts);
  const [calendarEvents] = useState(defaultAiAssistantDataset.calendarEvents);
  const [documentologItems] = useState(defaultAiAssistantDataset.documentologItems);
  const [knowledgeRules] = useState(defaultAiAssistantDataset.knowledgeRules);
  const [knowledgeBaseItems] = useState(defaultAiAssistantDataset.knowledgeBaseItems);
  const [developmentIdeas, setDevelopmentIdeas] = useState(defaultAiAssistantDataset.developmentIdeas);
  const [codexPromptDrafts, setCodexPromptDrafts] = useState(defaultAiAssistantDataset.codexPromptDrafts);

  useEffect(() => {
    const clearSessionChat = () => {
      setChatMessages([]);
    };

    window.addEventListener("pagehide", clearSessionChat);
    return () => window.removeEventListener("pagehide", clearSessionChat);
  }, []);

  useEffect(() => {
    const handleSystemNotification = (event: Event) => {
      const detail = (event as CustomEvent<AiAssistantSystemNotificationDetail>).detail;
      if (!detail?.id) return;

      if (detail.action === "clear") {
        setNotifications((current) => current.filter((notification) => notification.id !== detail.id));
        return;
      }

      const updatedAt = new Date().toISOString();
      const title = detail.title || "Системное уведомление";
      const body = detail.body || "";

      setNotifications((current) => upsertById(current, {
        id: detail.id,
        title,
        channel: "app",
        status: "needs-approval",
        target: detail.target || "AI-чат",
        body,
        approvalStatus: "required",
        workDate: detail.workDate || currentWorkDate,
        updatedAt,
      }));
    };

    window.addEventListener(aiAssistantSystemNotificationEventName, handleSystemNotification);
    return () => window.removeEventListener(aiAssistantSystemNotificationEventName, handleSystemNotification);
  }, [currentWorkDate]);

  const permissions = useMemo(
    () => resolveAiAssistantPermissions(defaultAiAssistantRole),
    [],
  );
  const resolvedCurrentDateTime = useMemo(
    () => currentDateTime ?? createAiAssistantCurrentDateTime(currentWorkDate),
    [currentDateTime, currentWorkDate],
  );
  const dataset = useMemo(
    () => ({
      ...defaultAiAssistantDataset,
      currentWorkDate,
      currentDateTime: resolvedCurrentDateTime,
      chatMessages,
      approvalActions,
      tasks,
      notifications,
      plannerItems,
      integrations,
      knowledgeSources,
      agents,
      whatsappGroups,
      whatsappMessageCandidates,
      documents,
      documentTemplates,
      mailItems,
      mailDrafts,
      calendarEvents,
      documentologItems,
      knowledgeRules,
      knowledgeBaseItems,
      developmentIdeas,
      codexPromptDrafts,
    }),
    [
      agents,
      approvalActions,
      calendarEvents,
      chatMessages,
      codexPromptDrafts,
      currentWorkDate,
      resolvedCurrentDateTime,
      developmentIdeas,
      documentTemplates,
      documentologItems,
      documents,
      integrations,
      knowledgeBaseItems,
      knowledgeRules,
      knowledgeSources,
      mailDrafts,
      mailItems,
      notifications,
      plannerItems,
      tasks,
      whatsappGroups,
      whatsappMessageCandidates,
    ],
  );
  const viewModel = useMemo(
    () => createAiAssistantViewModel(dataset),
    [dataset],
  );
  const actions = useAiAssistantActions({
    currentWorkDate,
    setAgentActivationDrafts,
    setApprovalActions,
    setChatMessages,
    setCodexPromptDrafts,
    setDevelopmentIdeas,
    setDocuments,
    setIntegrations,
    setKnowledgeSources,
    setMailDrafts,
    setNotifications,
    setPlannerItems,
    setTasks,
  });

  return {
    activeTab,
    currentContext,
    setActiveTab,
    role: defaultAiAssistantRole,
    permissions,
    viewModel,
    setPlannerItems,
    agentActivationDrafts,
    ...actions,
  };
}

type AiAssistantStateValue = ReturnType<typeof useAiAssistantState>;

const AiAssistantStateContext = createContext<AiAssistantStateValue | null>(null);

export function AiAssistantProvider({
  children,
  currentContext,
  currentDateTime,
  currentWorkDate,
}: {
  children: ReactNode;
  currentContext?: AiAssistantRuntimeContext;
  currentDateTime?: string;
  currentWorkDate?: string;
}) {
  const value = useAiAssistantState({ currentContext, currentDateTime, currentWorkDate });

  return (
    <AiAssistantStateContext.Provider value={value}>
      {children}
    </AiAssistantStateContext.Provider>
  );
}

export function useAiAssistantContext(): AiAssistantStateValue {
  const value = useContext(AiAssistantStateContext);
  if (!value) {
    throw new Error("AiAssistantProvider is not mounted");
  }

  return value;
}
