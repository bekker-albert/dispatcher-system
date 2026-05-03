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
  AiAssistantTab,
  AiAssistantTask,
} from "@/features/ai-assistant/types";
import { createAiAssistantViewModel } from "@/lib/domain/ai-assistant/view-model";
import { resolveAiAssistantPermissions } from "@/lib/domain/ai-assistant/permissions";
import { getAiAssistantTaskStatusForApprovalDecision } from "@/lib/domain/ai-assistant/status";

export function useAiAssistantState() {
  const [activeTab, setActiveTab] = useState<AiAssistantTab>("tasks");
  const [chatMessages, setChatMessages] = useState(defaultAiAssistantDataset.chatMessages);
  const [approvalActions, setApprovalActions] = useState(defaultAiAssistantDataset.approvalActions);
  const [tasks, setTasks] = useState(defaultAiAssistantDataset.tasks);
  const [notifications, setNotifications] = useState(defaultAiAssistantDataset.notifications);
  const [plannerItems, setPlannerItems] = useState(defaultAiAssistantDataset.plannerItems);

  const permissions = useMemo(
    () => resolveAiAssistantPermissions(defaultAiAssistantRole),
    [],
  );
  const dataset = useMemo(
    () => ({
      ...defaultAiAssistantDataset,
      chatMessages,
      approvalActions,
      tasks,
      notifications,
      plannerItems,
    }),
    [approvalActions, chatMessages, notifications, plannerItems, tasks],
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
    status: "approved" | "rejected",
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
  }, []);

  return {
    activeTab,
    setActiveTab,
    role: defaultAiAssistantRole,
    permissions,
    viewModel,
    setPlannerItems,
    appendChatMessage,
    updateApprovalDraftText,
    setApprovalDecision,
  };
}

type AiAssistantStateValue = ReturnType<typeof useAiAssistantState>;

const AiAssistantStateContext = createContext<AiAssistantStateValue | null>(null);

export function AiAssistantProvider({ children }: { children: ReactNode }) {
  const value = useAiAssistantState();

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
