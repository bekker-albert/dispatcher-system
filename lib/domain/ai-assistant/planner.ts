import type {
  AiAssistantActionType,
  AiAssistantApprovalAction,
  AiAssistantConnectorKey,
  AiAssistantNotification,
  AiAssistantPlannerItem,
  AiAssistantPlannerStatus,
  AiAssistantTask,
  AiAssistantTaskKind,
  AiAssistantTaskStatus,
} from "./types";
import { requiresAiAssistantApproval } from "./approval-policy";

const closedPlannerStatuses = new Set<AiAssistantPlannerStatus>(["done", "cancelled"]);

export function normalizeAiAssistantDateTimeKey(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  if (!normalized.includes("T")) return `${normalized}T23:59`;
  return normalized.slice(0, 16);
}

export function aiAssistantPlannerDateTimeKey(item: AiAssistantPlannerItem): string {
  const time = item.plannedTime?.trim() || "00:00";
  return `${item.plannedDate}T${time}`;
}

export function isAiAssistantPlannerItemDue(
  item: AiAssistantPlannerItem,
  currentDateTime: string,
): boolean {
  if (closedPlannerStatuses.has(item.status)) return false;
  return aiAssistantPlannerDateTimeKey(item) <= normalizeAiAssistantDateTimeKey(currentDateTime);
}

export function resolveAiAssistantPlannerRuntimeStatus(
  item: AiAssistantPlannerItem,
  currentDateTime: string,
): AiAssistantPlannerStatus {
  if (item.status === "planned" && isAiAssistantPlannerItemDue(item, currentDateTime)) {
    return "needs-decision";
  }

  return item.status;
}

export function createAiAssistantPlannerTaskId(item: AiAssistantPlannerItem): string {
  return item.linkedTaskId || `planner-task-${item.id}`;
}

export function createAiAssistantPlannerApprovalId(item: AiAssistantPlannerItem): string {
  return `planner-approval-${item.id}`;
}

export function createAiAssistantPlannerNotificationId(item: AiAssistantPlannerItem): string {
  return item.linkedNotificationId || `planner-notification-${item.id}`;
}

export function createDuePlannerTasks(
  plannerItems: AiAssistantPlannerItem[],
  existingTasks: AiAssistantTask[],
  currentDateTime: string,
): AiAssistantTask[] {
  const existingTaskIds = new Set(existingTasks.map((task) => task.id));

  return plannerItems
    .filter((item) => isAiAssistantPlannerItemDue(item, currentDateTime))
    .filter((item) => !existingTaskIds.has(createAiAssistantPlannerTaskId(item)))
    .map((item) => createTaskFromPlannerItem(item));
}

export function createDuePlannerApprovalActions(
  plannerItems: AiAssistantPlannerItem[],
  existingTasks: AiAssistantTask[],
  existingApprovals: AiAssistantApprovalAction[],
  currentDateTime: string,
): AiAssistantApprovalAction[] {
  const existingTaskIds = new Set(existingTasks.map((task) => task.id));
  const existingApprovalIds = new Set(existingApprovals.map((approval) => approval.id));

  return plannerItems
    .filter(plannerItemRequiresApproval)
    .filter((item) => isAiAssistantPlannerItemDue(item, currentDateTime))
    .filter((item) => !existingTaskIds.has(createAiAssistantPlannerTaskId(item)))
    .filter((item) => !existingApprovalIds.has(createAiAssistantPlannerApprovalId(item)))
    .map((item) => createApprovalFromPlannerItem(item));
}

export function createDuePlannerNotifications(
  plannerItems: AiAssistantPlannerItem[],
  existingNotifications: AiAssistantNotification[],
  currentDateTime: string,
): AiAssistantNotification[] {
  const existingNotificationIds = new Set(existingNotifications.map((notification) => notification.id));

  return plannerItems
    .filter((item) => isAiAssistantPlannerItemDue(item, currentDateTime))
    .filter((item) => !existingNotificationIds.has(createAiAssistantPlannerNotificationId(item)))
    .map((item) => createNotificationFromPlannerItem(item));
}

function createTaskFromPlannerItem(item: AiAssistantPlannerItem): AiAssistantTask {
  const needsApproval = plannerItemRequiresApproval(item);
  const taskId = createAiAssistantPlannerTaskId(item);

  return {
    id: taskId,
    title: item.title,
    kind: plannerTaskKindByAction(item.actionType),
    status: plannerTaskStatus(item),
    channel: item.channel,
    workDate: item.plannedDate,
    prompt: item.description,
    resultDraft: item.preparedText,
    evidenceIds: [],
    approvalStatus: needsApproval ? "required" : "not-required",
    approvalActionId: needsApproval ? createAiAssistantPlannerApprovalId(item) : undefined,
    owner: item.owner,
    updatedAt: item.updatedAt,
  };
}

function createApprovalFromPlannerItem(item: AiAssistantPlannerItem): AiAssistantApprovalAction {
  const targetConnector = plannerConnectorByAction(item.actionType);
  const risk = requiresAiAssistantApproval(item.actionType, "low", targetConnector) ? "critical" : "low";

  return {
    id: createAiAssistantPlannerApprovalId(item),
    taskId: createAiAssistantPlannerTaskId(item),
    title: item.title,
    actionType: item.actionType,
    risk,
    status: "required",
    targetConnector,
    targetLabel: item.target,
    draftText: item.preparedText,
    requestedBy: item.owner,
    createdAt: item.updatedAt,
    updatedAt: item.updatedAt,
  };
}

function createNotificationFromPlannerItem(item: AiAssistantPlannerItem): AiAssistantNotification {
  const needsApproval = plannerItemRequiresApproval(item);

  return {
    id: createAiAssistantPlannerNotificationId(item),
    title: item.title,
    channel: item.channel,
    status: plannerTaskStatus(item),
    target: item.target,
    body: item.preparedText || item.description,
    approvalStatus: needsApproval ? "required" : "not-required",
    workDate: item.plannedDate,
    linkedTaskId: createAiAssistantPlannerTaskId(item),
    plannerItemId: item.id,
    updatedAt: item.updatedAt,
  };
}

function plannerTaskStatus(item: AiAssistantPlannerItem): AiAssistantTaskStatus {
  if (plannerItemRequiresApproval(item)) return "needs-approval";
  if (item.actionType === "send-whatsapp" || item.actionType === "send-mail") return "draft";
  return "queued";
}

function plannerItemRequiresApproval(item: AiAssistantPlannerItem): boolean {
  return item.requireApproval
    || requiresAiAssistantApproval(item.actionType, "low", plannerConnectorByAction(item.actionType));
}

function plannerTaskKindByAction(actionType: AiAssistantActionType): AiAssistantTaskKind {
  const map: Record<AiAssistantActionType, AiAssistantTaskKind> = {
    "ask-assistant": "ask",
    "prepare-document": "prepare-document",
    "send-whatsapp": "draft-message",
    "send-mail": "draft-message",
    "create-calendar-event": "create-notification",
    "start-documentolog": "prepare-document",
    "create-push-notification": "create-notification",
    "update-report-reason": "prepare-document",
    draft: "draft-message",
    "update-knowledge-rule": "summarize",
    "create-business-trip": "prepare-document",
    "delete-data": "summarize",
  };

  return map[actionType];
}

function plannerConnectorByAction(actionType: AiAssistantActionType): AiAssistantConnectorKey {
  const map: Record<AiAssistantActionType, AiAssistantConnectorKey> = {
    "ask-assistant": "ai-api",
    "prepare-document": "documentolog",
    "send-whatsapp": "whatsapp",
    "send-mail": "mail",
    "create-calendar-event": "calendar",
    "start-documentolog": "documentolog",
    "create-push-notification": "push",
    "update-report-reason": "ai-api",
    draft: "ai-api",
    "update-knowledge-rule": "knowledge-base",
    "create-business-trip": "documentolog",
    "delete-data": "ai-api",
  };

  return map[actionType];
}
