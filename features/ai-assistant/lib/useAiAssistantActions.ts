import { type Dispatch, type SetStateAction, useCallback } from "react";

import type {
  AiAssistantApprovalAction,
  AiAssistantChatMessage,
  AiAssistantCodexPromptDraft,
  AiAssistantDevelopmentIdea,
  AiAssistantDocument,
  AiAssistantIntegration,
  AiAssistantKnowledgeSource,
  AiAssistantMailDraft,
  AiAssistantNotification,
  AiAssistantPlannerItem,
  AiAssistantTask,
} from "@/features/ai-assistant/types";
import {
  createAiAssistantCodexPromptDraft,
  getAiAssistantDocumentStatusForApprovalDecision,
  getAiAssistantMailDraftStatusForApprovalDecision,
  upsertById,
} from "@/features/ai-assistant/lib/aiAssistantStateHelpers";
import { createAiAssistantRequestArtifacts } from "@/lib/domain/ai-assistant/request-artifacts";
import { getAiAssistantTaskStatusForApprovalDecision } from "@/lib/domain/ai-assistant/status";

type AiAssistantActionsOptions = {
  currentWorkDate: string;
  setAgentActivationDrafts: Dispatch<SetStateAction<Record<string, boolean>>>;
  setApprovalActions: Dispatch<SetStateAction<AiAssistantApprovalAction[]>>;
  setChatMessages: Dispatch<SetStateAction<AiAssistantChatMessage[]>>;
  setCodexPromptDrafts: Dispatch<SetStateAction<AiAssistantCodexPromptDraft[]>>;
  setDevelopmentIdeas: Dispatch<SetStateAction<AiAssistantDevelopmentIdea[]>>;
  setDocuments: Dispatch<SetStateAction<AiAssistantDocument[]>>;
  setIntegrations: Dispatch<SetStateAction<AiAssistantIntegration[]>>;
  setKnowledgeSources: Dispatch<SetStateAction<AiAssistantKnowledgeSource[]>>;
  setMailDrafts: Dispatch<SetStateAction<AiAssistantMailDraft[]>>;
  setNotifications: Dispatch<SetStateAction<AiAssistantNotification[]>>;
  setPlannerItems: Dispatch<SetStateAction<AiAssistantPlannerItem[]>>;
  setTasks: Dispatch<SetStateAction<AiAssistantTask[]>>;
};

export function useAiAssistantActions({
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
}: AiAssistantActionsOptions) {
  const appendChatMessage = useCallback((text: string) => {
    const normalizedText = text.trim();
    if (!normalizedText) return;

    const createdAt = new Date().toISOString();
    const artifacts = createAiAssistantRequestArtifacts({
      createdAt,
      requestText: normalizedText,
      workDate: currentWorkDate,
    });

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
        text: artifacts.assistantReply,
        createdAt,
        linkedTaskId: artifacts.task.id,
      },
    ]);
    setTasks((current) => upsertById(current, artifacts.task));
    if (artifacts.approval) {
      setApprovalActions((current) => upsertById(current, artifacts.approval!));
    }
    if (artifacts.notification) {
      setNotifications((current) => upsertById(current, artifacts.notification!));
    }
    if (artifacts.document) {
      setDocuments((current) => upsertById(current, artifacts.document!));
    }
    if (artifacts.mailDraft) {
      setMailDrafts((current) => upsertById(current, artifacts.mailDraft!));
    }
    if (artifacts.plannerItem) {
      setPlannerItems((current) => upsertById(current, artifacts.plannerItem!));
    }
  }, [
    currentWorkDate,
    setApprovalActions,
    setChatMessages,
    setDocuments,
    setMailDrafts,
    setNotifications,
    setPlannerItems,
    setTasks,
  ]);

  const updateApprovalDraftText = useCallback((approval: AiAssistantApprovalAction, draftText: string) => {
    const updatedAt = new Date().toISOString();
    const nextStatus = approval.status === "returned" ? "required" : approval.status;
    const taskStatus = nextStatus === "required" ? "needs-approval" : getAiAssistantTaskStatusForApprovalDecision(nextStatus);

    setApprovalActions((current) => {
      const exists = current.some((item) => item.id === approval.id);
      if (!exists) return [...current, { ...approval, draftText, status: nextStatus, updatedAt }];

      return current.map((item) => (item.id === approval.id ? { ...item, draftText, status: nextStatus, updatedAt } : item));
    });
    setTasks((current) => current.map((task) => (
      task.approvalActionId === approval.id || task.id === approval.taskId
        ? { ...task, status: taskStatus, approvalStatus: nextStatus, resultDraft: draftText, updatedAt }
        : task
    )));
    setNotifications((current) => current.map((notification) => (
      notification.linkedTaskId === approval.taskId
        ? { ...notification, status: taskStatus, approvalStatus: nextStatus, body: draftText, updatedAt }
        : notification
    )));
    setPlannerItems((current) => current.map((item) => (
      item.linkedTaskId === approval.taskId ? { ...item, status: "needs-decision", updatedAt } : item
    )));
    setDocuments((current) => current.map((document) => (
      document.linkedApprovalId === approval.id || document.linkedTaskId === approval.taskId
        ? { ...document, status: "draft", updatedAt }
        : document
    )));
    setMailDrafts((current) => current.map((draft) => (
      draft.linkedApprovalId === approval.id || draft.linkedTaskId === approval.taskId
        ? { ...draft, status: "needs-approval", updatedAt }
        : draft
    )));
  }, [setApprovalActions, setDocuments, setMailDrafts, setNotifications, setPlannerItems, setTasks]);

  const setApprovalDecision = useCallback((
    approval: AiAssistantApprovalAction,
    status: "approved" | "returned" | "rejected",
    task?: AiAssistantTask,
  ) => {
    const updatedAt = new Date().toISOString();
    const taskStatus = getAiAssistantTaskStatusForApprovalDecision(status);

    setApprovalActions((current) => {
      const decidedApproval = { ...approval, status, approver: "Текущий пользователь", updatedAt };
      const exists = current.some((item) => item.id === approval.id);
      if (!exists) return [...current, decidedApproval];
      return current.map((item) => (item.id === approval.id ? decidedApproval : item));
    });

    if (task) {
      setTasks((current) => {
        const decidedTask = { ...task, status: taskStatus, approvalStatus: status, updatedAt };
        const exists = current.some((item) => item.id === task.id);
        if (!exists) return [...current, decidedTask];
        return current.map((item) => (item.id === task.id ? decidedTask : item));
      });
    }

    setNotifications((current) => current.map((notification) => (
      notification.linkedTaskId === approval.taskId
        ? { ...notification, status: taskStatus, approvalStatus: status, updatedAt }
        : notification
    )));
    setDocuments((current) => current.map((document) => (
      document.linkedApprovalId === approval.id || document.linkedTaskId === approval.taskId
        ? { ...document, status: getAiAssistantDocumentStatusForApprovalDecision(status), updatedAt }
        : document
    )));
    setMailDrafts((current) => current.map((draft) => (
      draft.linkedApprovalId === approval.id || draft.linkedTaskId === approval.taskId
        ? { ...draft, status: getAiAssistantMailDraftStatusForApprovalDecision(status), updatedAt }
        : draft
    )));
    setPlannerItems((current) => current.map((item) => (
      item.linkedTaskId === approval.taskId
        ? { ...item, status: status === "approved" ? "done" : status === "returned" ? "needs-decision" : "cancelled", updatedAt }
        : item
    )));
  }, [setApprovalActions, setDocuments, setMailDrafts, setNotifications, setPlannerItems, setTasks]);

  const addKnowledgeSource = useCallback((source: Omit<AiAssistantKnowledgeSource, "id" | "updatedAt">) => {
    setKnowledgeSources((current) => [...current, { ...source, id: `knowledge-${Date.now()}`, updatedAt: new Date().toISOString() }]);
  }, [setKnowledgeSources]);

  const updateKnowledgeSource = useCallback((source: AiAssistantKnowledgeSource) => {
    setKnowledgeSources((current) => current.map((item) => (item.id === source.id ? { ...source, updatedAt: new Date().toISOString() } : item)));
  }, [setKnowledgeSources]);

  const deleteKnowledgeSource = useCallback((sourceId: string) => {
    setKnowledgeSources((current) => current.filter((item) => item.id !== sourceId));
  }, [setKnowledgeSources]);

  const addIntegration = useCallback((integration: Omit<AiAssistantIntegration, "key">) => {
    setIntegrations((current) => [...current, { ...integration, key: `custom-${Date.now()}` }]);
  }, [setIntegrations]);

  const updateIntegration = useCallback((integration: AiAssistantIntegration) => {
    setIntegrations((current) => current.map((item) => (item.key === integration.key ? integration : item)));
  }, [setIntegrations]);

  const deleteIntegration = useCallback((integrationKey: string) => {
    setIntegrations((current) => current.filter((item) => item.key !== integrationKey));
  }, [setIntegrations]);

  const setAgentActivationDraft = useCallback((agentId: string, value: boolean) => {
    setAgentActivationDrafts((current) => ({ ...current, [agentId]: value }));
  }, [setAgentActivationDrafts]);

  const setDevelopmentIdeaStatus = useCallback((ideaId: string, status: AiAssistantDevelopmentIdea["status"]) => {
    setDevelopmentIdeas((current) => current.map((idea) => (
      idea.id === ideaId ? { ...idea, status, updatedAt: new Date().toISOString() } : idea
    )));
  }, [setDevelopmentIdeas]);

  const createCodexPromptDraftForIdea = useCallback((idea: AiAssistantDevelopmentIdea) => {
    const updatedAt = new Date().toISOString();
    const promptDraft = createAiAssistantCodexPromptDraft(idea, updatedAt);

    setCodexPromptDrafts((current) => upsertById(current, promptDraft));
    setDevelopmentIdeas((current) => current.map((item) => (
      item.id === idea.id
        ? { ...item, codexPromptDraftId: promptDraft.id, status: "spec-ready", updatedAt }
        : item
    )));
  }, [setCodexPromptDrafts, setDevelopmentIdeas]);

  return {
    addIntegration,
    addKnowledgeSource,
    appendChatMessage,
    createCodexPromptDraftForIdea,
    deleteIntegration,
    deleteKnowledgeSource,
    setAgentActivationDraft,
    setApprovalDecision,
    setDevelopmentIdeaStatus,
    updateApprovalDraftText,
    updateIntegration,
    updateKnowledgeSource,
  };
}
