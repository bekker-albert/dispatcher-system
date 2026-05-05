import type {
  AiAssistantApprovalAction,
  AiAssistantDocument,
  AiAssistantMailDraft,
  AiAssistantNotification,
  AiAssistantPlannerItem,
  AiAssistantTask,
} from "./types";

export type AiAssistantRequestArtifacts = {
  approval?: AiAssistantApprovalAction;
  assistantReply: string;
  document?: AiAssistantDocument;
  mailDraft?: AiAssistantMailDraft;
  notification?: AiAssistantNotification;
  plannerItem?: AiAssistantPlannerItem;
  task: AiAssistantTask;
};

type CreateRequestArtifactsInput = {
  createdAt: string;
  requestText: string;
  workDate: string;
};

export function createAiAssistantRequestArtifacts({
  createdAt,
  requestText,
  workDate,
}: CreateRequestArtifactsInput): AiAssistantRequestArtifacts {
  const normalizedText = requestText.trim();
  const normalizedLower = normalizedText.toLowerCase();
  const idSuffix = sanitizeArtifactId(createdAt);

  if (normalizedLower.includes("служеб") || normalizedLower.includes("командиров")) {
    return createDocumentRequest(normalizedText, idSuffix, createdAt, workDate);
  }

  if (normalizedLower.includes("сообщ") || normalizedLower.includes("подряд")) {
    return createContractorMessageRequest(normalizedText, idSuffix, createdAt, workDate);
  }

  if (normalizedLower.includes("причин") || normalizedLower.includes("невыполн")) {
    return createReportReasonRequest(normalizedText, idSuffix, createdAt, workDate);
  }

  if (normalizedLower.includes("техник") || normalizedLower.includes("ремонт")) {
    return createEquipmentCheckRequest(normalizedText, idSuffix, createdAt, workDate);
  }

  return createPlannerRequest(normalizedText, idSuffix, createdAt, workDate);
}

function createDocumentRequest(
  requestText: string,
  idSuffix: string,
  createdAt: string,
  workDate: string,
): AiAssistantRequestArtifacts {
  const taskId = `ai-request-task-${idSuffix}`;
  const approvalId = `ai-request-approval-${idSuffix}`;
  const documentId = `ai-request-document-${idSuffix}`;
  const draftText = `Подготовить служебную записку по запросу: ${requestText}`;

  return {
    assistantReply: "Создал черновик служебки и поставил действие в очередь решений.",
    task: createBaseTask({
      approvalActionId: approvalId,
      approvalStatus: "required",
      channel: "documentolog",
      id: taskId,
      kind: "prepare-document",
      owner: "AI-ассистент",
      prompt: requestText,
      resultDraft: draftText,
      status: "needs-approval",
      title: "Служебная записка",
      updatedAt: createdAt,
      workDate,
    }),
    approval: createApproval({
      actionType: "prepare-document",
      createdAt,
      draftText,
      id: approvalId,
      targetConnector: "documentolog",
      targetLabel: "Служебная записка",
      taskId,
      title: "Проверить служебную записку",
    }),
    document: {
      id: documentId,
      title: "Служебная записка",
      type: "memo",
      status: "draft",
      linkedTaskId: taskId,
      linkedApprovalId: approvalId,
      updatedAt: createdAt,
    },
  };
}

function createContractorMessageRequest(
  requestText: string,
  idSuffix: string,
  createdAt: string,
  workDate: string,
): AiAssistantRequestArtifacts {
  const taskId = `ai-request-task-${idSuffix}`;
  const approvalId = `ai-request-approval-${idSuffix}`;
  const draftText = `Просим проверить информацию по запросу диспетчерской службы: ${requestText}`;

  return {
    assistantReply: "Подготовил сообщение подрядчику. Отправка останется заблокированной до согласования.",
    task: createBaseTask({
      approvalActionId: approvalId,
      approvalStatus: "required",
      channel: "whatsapp",
      id: taskId,
      kind: "draft-message",
      owner: "AI-ассистент",
      prompt: requestText,
      resultDraft: draftText,
      status: "needs-approval",
      title: "Сообщение подрядчику",
      updatedAt: createdAt,
      workDate,
    }),
    approval: createApproval({
      actionType: "send-whatsapp",
      createdAt,
      draftText,
      id: approvalId,
      targetConnector: "whatsapp",
      targetLabel: "Подрядчик",
      taskId,
      title: "Согласовать сообщение подрядчику",
    }),
    notification: {
      id: `ai-request-notification-${idSuffix}`,
      title: "Сообщение подрядчику",
      channel: "whatsapp",
      status: "queued",
      target: "Подрядчик",
      body: draftText,
      approvalStatus: "required",
      workDate,
      linkedTaskId: taskId,
      updatedAt: createdAt,
    },
  };
}

function createReportReasonRequest(
  requestText: string,
  idSuffix: string,
  createdAt: string,
  workDate: string,
): AiAssistantRequestArtifacts {
  const taskId = `ai-request-task-${idSuffix}`;
  const approvalId = `ai-request-approval-${idSuffix}`;
  const draftText = `Проверить причины невыполнения плана и подготовить краткий вывод: ${requestText}`;

  return {
    assistantReply: "Создал задачу на проверку причины. Итог попадет в решения перед использованием в отчете.",
    task: createBaseTask({
      approvalActionId: approvalId,
      approvalStatus: "required",
      channel: "app",
      id: taskId,
      kind: "summarize",
      owner: "AI-ассистент",
      prompt: requestText,
      resultDraft: draftText,
      status: "needs-approval",
      title: "Проверка причины",
      updatedAt: createdAt,
      workDate,
    }),
    approval: createApproval({
      actionType: "ask-assistant",
      createdAt,
      draftText,
      id: approvalId,
      targetConnector: "ai-api",
      targetLabel: "Проверка причины",
      taskId,
      title: "Подтвердить вывод по причине",
    }),
  };
}

function createEquipmentCheckRequest(
  requestText: string,
  idSuffix: string,
  createdAt: string,
  workDate: string,
): AiAssistantRequestArtifacts {
  const taskId = `ai-request-task-${idSuffix}`;

  return {
    assistantReply: "Создал задачу на проверку техники. Сейчас это черновой поиск без внешних интеграций.",
    task: createBaseTask({
      approvalStatus: "not-required",
      channel: "app",
      id: taskId,
      kind: "summarize",
      owner: "AI-ассистент",
      prompt: requestText,
      resultDraft: `Проверить технику по запросу: ${requestText}`,
      status: "queued",
      title: "Проверка техники",
      updatedAt: createdAt,
      workDate,
    }),
  };
}

function createPlannerRequest(
  requestText: string,
  idSuffix: string,
  createdAt: string,
  workDate: string,
): AiAssistantRequestArtifacts {
  const taskId = `ai-request-task-${idSuffix}`;
  const plannerItemId = `ai-request-plan-${idSuffix}`;

  return {
    assistantReply: "Создал задачу на рабочую дату и сохранил ее как черновое напоминание в AI-ассистенте.",
    task: createBaseTask({
      approvalStatus: "not-required",
      channel: "app",
      id: taskId,
      kind: "ask",
      owner: "AI-ассистент",
      prompt: requestText,
      resultDraft: requestText,
      status: "queued",
      title: requestText,
      updatedAt: createdAt,
      workDate,
    }),
    plannerItem: {
      id: plannerItemId,
      title: requestText,
      description: "Создано из запроса AI-пульта",
      plannedDate: workDate,
      plannedTime: "",
      status: "planned",
      priority: "normal",
      owner: "AI-ассистент",
      target: "Диспетчерская служба",
      channel: "app",
      actionType: "ask-assistant",
      preparedText: requestText,
      requireApproval: false,
      recurrence: { type: "none" },
      linkedTaskId: taskId,
      updatedAt: createdAt,
    },
  };
}

function createBaseTask(task: Omit<AiAssistantTask, "evidenceIds"> & { evidenceIds?: string[] }): AiAssistantTask {
  return {
    evidenceIds: [],
    ...task,
  };
}

function createApproval({
  actionType,
  createdAt,
  draftText,
  id,
  targetConnector,
  targetLabel,
  taskId,
  title,
}: Pick<
  AiAssistantApprovalAction,
  "actionType" | "draftText" | "id" | "targetConnector" | "targetLabel" | "taskId" | "title"
> & { createdAt: string }): AiAssistantApprovalAction {
  return {
    id,
    taskId,
    title,
    actionType,
    risk: "critical",
    status: "required",
    targetConnector,
    targetLabel,
    draftText,
    requestedBy: "AI-ассистент",
    createdAt,
    updatedAt: createdAt,
  };
}

function sanitizeArtifactId(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
