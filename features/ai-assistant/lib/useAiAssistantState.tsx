"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { defaultAiAssistantDataset, defaultAiAssistantRole } from "@/features/ai-assistant/data";
import type {
  AiAssistantApprovalAction,
  AiAssistantCodexPromptDraft,
  AiAssistantDevelopmentIdea,
  AiAssistantIntegration,
  AiAssistantKnowledgeSource,
  AiAssistantTab,
  AiAssistantTask,
} from "@/features/ai-assistant/types";
import { createAiAssistantViewModel } from "@/lib/domain/ai-assistant/view-model";
import { resolveAiAssistantPermissions } from "@/lib/domain/ai-assistant/permissions";
import { getAiAssistantTaskStatusForApprovalDecision } from "@/lib/domain/ai-assistant/status";

type UseAiAssistantStateOptions = {
  currentWorkDate?: string;
  currentDateTime?: string;
};

export function useAiAssistantState({
  currentWorkDate = defaultAiAssistantDataset.currentWorkDate,
  currentDateTime,
}: UseAiAssistantStateOptions = {}) {
  const [activeTab, setActiveTab] = useState<AiAssistantTab>("main");
  const [chatMessages, setChatMessages] = useState(defaultAiAssistantDataset.chatMessages);
  const [approvalActions, setApprovalActions] = useState(defaultAiAssistantDataset.approvalActions);
  const [tasks, setTasks] = useState(defaultAiAssistantDataset.tasks);
  const [notifications, setNotifications] = useState(defaultAiAssistantDataset.notifications);
  const [plannerItems, setPlannerItems] = useState(defaultAiAssistantDataset.plannerItems);
  const [integrations, setIntegrations] = useState(defaultAiAssistantDataset.integrations);
  const [knowledgeSources, setKnowledgeSources] = useState(defaultAiAssistantDataset.knowledgeSources);
  const [agentActivationDrafts, setAgentActivationDrafts] = useState<Record<string, boolean>>({});
  const [agents] = useState(defaultAiAssistantDataset.agents);
  const [whatsappGroups] = useState(defaultAiAssistantDataset.whatsappGroups);
  const [whatsappMessageCandidates] = useState(defaultAiAssistantDataset.whatsappMessageCandidates);
  const [documents] = useState(defaultAiAssistantDataset.documents);
  const [documentTemplates] = useState(defaultAiAssistantDataset.documentTemplates);
  const [mailItems] = useState(defaultAiAssistantDataset.mailItems);
  const [mailDrafts] = useState(defaultAiAssistantDataset.mailDrafts);
  const [calendarEvents] = useState(defaultAiAssistantDataset.calendarEvents);
  const [documentologItems] = useState(defaultAiAssistantDataset.documentologItems);
  const [knowledgeRules] = useState(defaultAiAssistantDataset.knowledgeRules);
  const [knowledgeBaseItems] = useState(defaultAiAssistantDataset.knowledgeBaseItems);
  const [developmentIdeas, setDevelopmentIdeas] = useState(defaultAiAssistantDataset.developmentIdeas);
  const [codexPromptDrafts, setCodexPromptDrafts] = useState(defaultAiAssistantDataset.codexPromptDrafts);

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
  const appendChatMessage = useCallback((text: string) => {
    const normalizedText = text.trim();
    if (!normalizedText) return;

    const createdAt = new Date().toISOString();
    setChatMessages((current) => [
      ...current,
      {
        id: `chat-user-${createdAt}`,
        role: "user",
        author: "Вы",
        text: normalizedText,
        createdAt,
      },
      {
        id: `chat-assistant-${createdAt}`,
        role: "assistant",
        author: "AI-ассистент",
        text: "Запрос принят. Если потребуется действие, оно появится в Задачах.",
        createdAt,
      },
    ]);
  }, []);
  const updateApprovalDraftText = useCallback((
    approval: AiAssistantApprovalAction,
    draftText: string,
  ) => {
    const updatedAt = new Date().toISOString();
    setApprovalActions((current) => {
      const exists = current.some((item) => item.id === approval.id);
      if (!exists) return [...current, { ...approval, draftText, updatedAt }];

      return current.map((item) => (
        item.id === approval.id
          ? { ...item, draftText, updatedAt }
          : item
      ));
    });
  }, []);
  const setApprovalDecision = useCallback((
    approval: AiAssistantApprovalAction,
    status: "approved" | "returned" | "rejected",
    task?: AiAssistantTask,
  ) => {
    const updatedAt = new Date().toISOString();
    const taskStatus = getAiAssistantTaskStatusForApprovalDecision(status);

    setApprovalActions((current) => {
      const exists = current.some((item) => item.id === approval.id);
      if (!exists) {
        return [
          ...current,
          {
            ...approval,
            status,
            approver: "Текущий пользователь",
            updatedAt,
          },
        ];
      }

      return current.map((item) => (
        item.id === approval.id
          ? {
            ...item,
            status,
            approver: "Текущий пользователь",
            updatedAt,
          }
          : item
      ));
    });

    if (task) {
      setTasks((current) => {
        const exists = current.some((item) => item.id === task.id);
        const decidedTask = {
          ...task,
          status: taskStatus,
          approvalStatus: status,
          updatedAt,
        };

        if (!exists) return [...current, decidedTask];
        return current.map((item) => (item.id === task.id ? decidedTask : item));
      });
    }

    setNotifications((current) => current.map((notification) => (
      notification.linkedTaskId === approval.taskId
        ? {
          ...notification,
          status: taskStatus,
          approvalStatus: status,
          updatedAt,
        }
        : notification
    )));

    setPlannerItems((current) => current.map((item) => (
      item.linkedTaskId === approval.taskId
        ? {
          ...item,
          status: status === "approved" ? "done" : status === "returned" ? "needs-decision" : "cancelled",
          updatedAt,
        }
        : item
    )));
  }, []);
  const addKnowledgeSource = useCallback((source: Omit<AiAssistantKnowledgeSource, "id" | "updatedAt">) => {
    const updatedAt = new Date().toISOString();
    setKnowledgeSources((current) => [
      ...current,
      {
        ...source,
        id: `knowledge-${Date.now()}`,
        updatedAt,
      },
    ]);
  }, []);
  const updateKnowledgeSource = useCallback((source: AiAssistantKnowledgeSource) => {
    setKnowledgeSources((current) => current.map((item) => (
      item.id === source.id
        ? { ...source, updatedAt: new Date().toISOString() }
        : item
    )));
  }, []);
  const deleteKnowledgeSource = useCallback((sourceId: string) => {
    setKnowledgeSources((current) => current.filter((item) => item.id !== sourceId));
  }, []);
  const addIntegration = useCallback((integration: Omit<AiAssistantIntegration, "key">) => {
    setIntegrations((current) => [
      ...current,
      {
        ...integration,
        key: `custom-${Date.now()}`,
      },
    ]);
  }, []);
  const updateIntegration = useCallback((integration: AiAssistantIntegration) => {
    setIntegrations((current) => current.map((item) => (
      item.key === integration.key ? integration : item
    )));
  }, []);
  const deleteIntegration = useCallback((integrationKey: string) => {
    setIntegrations((current) => current.filter((item) => item.key !== integrationKey));
  }, []);
  const setAgentActivationDraft = useCallback((agentId: string, value: boolean) => {
    setAgentActivationDrafts((current) => ({ ...current, [agentId]: value }));
  }, []);
  const setDevelopmentIdeaStatus = useCallback((
    ideaId: string,
    status: AiAssistantDevelopmentIdea["status"],
  ) => {
    setDevelopmentIdeas((current) => current.map((idea) => (
      idea.id === ideaId
        ? { ...idea, status, updatedAt: new Date().toISOString() }
        : idea
    )));
  }, []);
  const createCodexPromptDraftForIdea = useCallback((idea: AiAssistantDevelopmentIdea) => {
    const updatedAt = new Date().toISOString();
    const promptDraft: AiAssistantCodexPromptDraft = {
      id: idea.codexPromptDraftId || `codex-prompt-${Date.now()}`,
      title: `Промт Codex: ${idea.title}`,
      body: [
        `Задача: ${idea.title}`,
        "",
        idea.description,
        "",
        "Бизнес-логика:",
        ...idea.businessLogic.map((item) => `- ${item}`),
        "",
        "Критерии приемки:",
        ...idea.acceptanceCriteria.map((item) => `- ${item}`),
        "",
        "Ограничения: не подключать реальные внешние API, не хранить ключи в frontend, критические действия только через approval.",
      ].join("\n"),
      linkedIdeaId: idea.id,
      status: "ready",
      updatedAt,
    };

    setCodexPromptDrafts((current) => {
      const exists = current.some((item) => item.id === promptDraft.id);
      if (!exists) return [...current, promptDraft];
      return current.map((item) => (item.id === promptDraft.id ? promptDraft : item));
    });
    setDevelopmentIdeas((current) => current.map((item) => (
      item.id === idea.id
        ? {
          ...item,
          codexPromptDraftId: promptDraft.id,
          status: "spec-ready",
          updatedAt,
        }
        : item
    )));
  }, []);

  return {
    activeTab,
    setActiveTab,
    role: defaultAiAssistantRole,
    permissions,
    viewModel,
    setPlannerItems,
    agentActivationDrafts,
    setAgentActivationDraft,
    addIntegration,
    updateIntegration,
    deleteIntegration,
    addKnowledgeSource,
    updateKnowledgeSource,
    deleteKnowledgeSource,
    setDevelopmentIdeaStatus,
    createCodexPromptDraftForIdea,
    appendChatMessage,
    updateApprovalDraftText,
    setApprovalDecision,
  };
}

type AiAssistantStateValue = ReturnType<typeof useAiAssistantState>;

const AiAssistantStateContext = createContext<AiAssistantStateValue | null>(null);

export function AiAssistantProvider({
  children,
  currentDateTime,
  currentWorkDate,
}: {
  children: ReactNode;
  currentDateTime?: string;
  currentWorkDate?: string;
}) {
  const value = useAiAssistantState({ currentDateTime, currentWorkDate });

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

function createAiAssistantCurrentDateTime(currentWorkDate: string) {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${currentWorkDate}T${hours}:${minutes}`;
}
