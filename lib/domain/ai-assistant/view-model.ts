import type {
  AiAssistantApprovalAction,
  AiAssistantApprovalStatus,
  AiAssistantDataset,
  AiAssistantDevelopmentIdea,
  AiAssistantDocument,
  AiAssistantDocumentologItem,
  AiAssistantHighPriorityAction,
  AiAssistantMailDraft,
  AiAssistantWhatsAppMessageCandidate,
  AiAssistantTask,
  AiAssistantViewModel,
} from "./types";
import {
  createDuePlannerApprovalActions,
  createDuePlannerNotifications,
  createDuePlannerTasks,
  resolveAiAssistantPlannerRuntimeStatus,
} from "./planner";
import { getAiAssistantTaskStatusForApprovalDecision } from "./status";

const activeTaskStatuses = new Set([
  "queued",
  "running",
  "needs-approval",
  "approved",
]);

const warningConnectorStatuses = new Set([
  "disabled",
  "error",
]);

const closedDocumentStatuses = new Set<AiAssistantDocument["status"]>([
  "signed",
  "rejected",
  "archive",
]);

const waitingDocumentologStatuses = new Set<AiAssistantDocumentologItem["status"]>([
  "in-approval",
  "needs-rework",
]);

const pendingDevelopmentIdeaStatuses = new Set<AiAssistantDevelopmentIdea["status"]>([
  "new",
  "reviewing",
  "needs-clarification",
  "spec-ready",
]);

export function createAiAssistantViewModel(dataset: AiAssistantDataset): AiAssistantViewModel {
  const currentDateTime = dataset.currentDateTime || `${dataset.currentWorkDate}T23:59`;
  const plannerItems = dataset.plannerItems.map((item) => ({
    ...item,
    status: resolveAiAssistantPlannerRuntimeStatus(item, currentDateTime),
  }));
  const tasksWithPlanner = [
    ...dataset.tasks,
    ...createDuePlannerTasks(plannerItems, dataset.tasks, currentDateTime),
  ];
  const approvalActions = [
    ...dataset.approvalActions,
    ...createDuePlannerApprovalActions(plannerItems, dataset.tasks, dataset.approvalActions, currentDateTime),
  ];
  const tasks = syncTasksWithApprovalActions(tasksWithPlanner, approvalActions);
  const notifications = [
    ...dataset.notifications,
    ...createDuePlannerNotifications(plannerItems, dataset.notifications, currentDateTime),
  ];
  const evidenceById = new Map(dataset.evidence.map((item) => [item.id, item]));
  const currentTaskIds = new Set(
    tasks
      .filter((task) => task.workDate === dataset.currentWorkDate)
      .map((task) => task.id),
  );
  const activeTasks = tasks.filter((task) => activeTaskStatuses.has(task.status)).length;
  const approvalsRequired = approvalActions
    .filter((item) => item.status === "required")
    .length;
  const connectorWarnings = dataset.integrations
    .filter((integration) => warningConnectorStatuses.has(integration.status))
    .length;
  const activeAgents = dataset.agents.filter((agent) => agent.status === "active");
  const whatsappCandidatesPending = dataset.whatsappMessageCandidates
    .filter(isPendingWhatsAppCandidate)
    .length;
  const documentsInProgress = dataset.documents
    .filter((document) => !closedDocumentStatuses.has(document.status))
    .length;
  const mailDraftsPendingApproval = dataset.mailDrafts
    .filter((draft) => draft.status === "needs-approval")
    .length;
  const documentologWaiting = dataset.documentologItems
    .filter((item) => waitingDocumentologStatuses.has(item.status))
    .length;
  const activeKnowledgeRules = dataset.knowledgeRules
    .filter((rule) => rule.status === "active")
    .length;
  const developmentIdeasPending = dataset.developmentIdeas
    .filter((idea) => pendingDevelopmentIdeaStatuses.has(idea.status))
    .length;

  return {
    summary: {
      activeTasks,
      approvalsRequired,
      connectorWarnings,
      knowledgeSources: dataset.knowledgeSources.length,
      activeAgents: activeAgents.length,
      whatsappCandidatesPending,
      documentsInProgress,
      mailDraftsPendingApproval,
      documentologWaiting,
      activeKnowledgeRules,
      developmentIdeasPending,
    },
    highPriorityActions: createHighPriorityActions(
      approvalActions,
      dataset.whatsappMessageCandidates,
      dataset.mailDrafts,
      dataset.documentologItems,
      dataset.developmentIdeas,
    ),
    agents: [...dataset.agents].sort((left, right) => left.title.localeCompare(right.title)),
    activeAgents: [...activeAgents].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    whatsappGroups: [...dataset.whatsappGroups].sort((left, right) => left.title.localeCompare(right.title)),
    whatsappMessageCandidates: [...dataset.whatsappMessageCandidates].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    documents: [...dataset.documents].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    documentTemplates: [...dataset.documentTemplates].sort((left, right) => left.title.localeCompare(right.title)),
    mailItems: [...dataset.mailItems].sort((left, right) => right.receivedAt.localeCompare(left.receivedAt)),
    mailDrafts: [...dataset.mailDrafts].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    calendarEvents: [...dataset.calendarEvents].sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
    documentologItems: [...dataset.documentologItems].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    knowledgeRules: [...dataset.knowledgeRules].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    knowledgeBaseItems: [...dataset.knowledgeBaseItems].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    developmentIdeas: [...dataset.developmentIdeas].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    codexPromptDrafts: [...dataset.codexPromptDrafts].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    chatMessages: [...dataset.chatMessages].sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    approvalActions: [...approvalActions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    tasks: [...tasks].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    notifications: [...notifications].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    currentWorkDate: dataset.currentWorkDate,
    currentDateTime,
    currentTasks: tasks
      .filter((task) => task.workDate === dataset.currentWorkDate)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    currentNotifications: notifications
      .filter((notification) => (
        notification.workDate === dataset.currentWorkDate
        || Boolean(notification.linkedTaskId && currentTaskIds.has(notification.linkedTaskId))
      ))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    plannerItems: [...plannerItems].sort((left, right) => {
      const dateComparison = left.plannedDate.localeCompare(right.plannedDate);
      if (dateComparison !== 0) return dateComparison;
      return (left.plannedTime ?? "").localeCompare(right.plannedTime ?? "");
    }),
    integrations: dataset.integrations,
    knowledgeSources: [...dataset.knowledgeSources].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    evidenceById,
    auditEvents: [...dataset.auditEvents].sort((left, right) => right.timestamp.localeCompare(left.timestamp)),
  };
}

function createHighPriorityActions(
  approvalActions: AiAssistantApprovalAction[],
  whatsappMessageCandidates: AiAssistantWhatsAppMessageCandidate[],
  mailDrafts: AiAssistantMailDraft[],
  documentologItems: AiAssistantDocumentologItem[],
  developmentIdeas: AiAssistantDevelopmentIdea[],
): AiAssistantHighPriorityAction[] {
  return [
    ...approvalActions
      .filter((approval) => approval.status === "required")
      .map((approval) => ({
        id: approval.id,
        title: approval.title,
        source: "approval" as const,
        reason: approval.risk === "critical" ? "Критическое действие требует решения" : "Ожидает решения пользователя",
        target: approval.targetLabel,
        updatedAt: approval.updatedAt,
      })),
    ...whatsappMessageCandidates
      .filter(isPendingWhatsAppCandidate)
      .map((candidate) => ({
        id: candidate.id,
        title: candidate.suggestedAction,
        source: "whatsapp" as const,
        reason: "WhatsApp-сообщение распознано как действие",
        target: candidate.author,
        updatedAt: candidate.createdAt,
      })),
    ...mailDrafts
      .filter((draft) => draft.status === "needs-approval")
      .map((draft) => ({
        id: draft.id,
        title: draft.subject,
        source: "mail" as const,
        reason: "Черновик письма ожидает одобрения",
        target: draft.to.join(", "),
        updatedAt: draft.updatedAt,
      })),
    ...documentologItems
      .filter((item) => waitingDocumentologStatuses.has(item.status))
      .map((item) => ({
        id: item.id,
        title: item.title,
        source: "documentolog" as const,
        reason: item.status === "needs-rework" ? "Documentolog вернул на доработку" : "Документ на согласовании",
        target: item.approver,
        updatedAt: item.updatedAt,
      })),
    ...developmentIdeas
      .filter((idea) => pendingDevelopmentIdeaStatuses.has(idea.status))
      .map((idea) => ({
        id: idea.id,
        title: idea.title,
        source: "development" as const,
        reason: "Идея развития требует решения",
        target: idea.affectedModules.join(", "),
        updatedAt: idea.updatedAt,
      })),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function isPendingWhatsAppCandidate(candidate: AiAssistantWhatsAppMessageCandidate): boolean {
  return candidate.approvalRequired && (candidate.status === "new" || candidate.status === "needs-approval");
}

function syncTasksWithApprovalActions(
  tasks: AiAssistantTask[],
  approvalActions: AiAssistantApprovalAction[],
): AiAssistantTask[] {
  const approvalByTaskId = new Map(
    approvalActions
      .filter((approval): approval is AiAssistantApprovalAction & {
        status: Extract<AiAssistantApprovalStatus, "approved" | "rejected">;
      } => approval.status === "approved" || approval.status === "rejected")
      .map((approval) => [approval.taskId, approval]),
  );

  return tasks.map((task) => {
    const approval = approvalByTaskId.get(task.id);
    if (!approval) return task;

    return {
      ...task,
      approvalStatus: approval.status,
      status: getAiAssistantTaskStatusForApprovalDecision(approval.status),
      updatedAt: approval.updatedAt > task.updatedAt ? approval.updatedAt : task.updatedAt,
    };
  });
}
