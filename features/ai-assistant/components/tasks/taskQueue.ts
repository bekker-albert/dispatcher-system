import type {
  AiAssistantApprovalAction,
  AiAssistantNotification,
  AiAssistantNotificationChannel,
  AiAssistantPlannerItem,
  AiAssistantTask,
  AiAssistantTaskStatus,
} from "@/features/ai-assistant/types";
import { formatTaskDateLabel } from "@/features/ai-assistant/components/tasks/taskFormatters";

export type CurrentQueueRow = {
  id: string;
  title: string;
  details?: string;
  channel: AiAssistantNotificationChannel;
  status: AiAssistantTaskStatus;
  text: string;
  approval?: AiAssistantApprovalAction;
  task?: AiAssistantTask;
};

export type CurrentQueueSection = {
  title: string;
  rows: CurrentQueueRow[];
};

export function createCurrentQueueRows(
  tasks: AiAssistantTask[],
  notifications: AiAssistantNotification[],
  approvals: AiAssistantApprovalAction[],
  plannerItems: AiAssistantPlannerItem[],
): CurrentQueueRow[] {
  const approvalsByTaskId = new Map(approvals.map((approval) => [approval.taskId, approval]));
  const approvalsById = new Map(approvals.map((approval) => [approval.id, approval]));
  const plannerByTaskId = new Map(
    plannerItems
      .filter((item) => item.linkedTaskId)
      .map((item) => [item.linkedTaskId!, item]),
  );
  const notificationsByTaskId = new Map(
    notifications
      .filter((notification) => notification.linkedTaskId)
      .map((notification) => [notification.linkedTaskId!, notification]),
  );
  const taskRows = tasks.map((task) => {
    const linkedNotification = notificationsByTaskId.get(task.id);
    const approval = task.approvalActionId
      ? approvalsById.get(task.approvalActionId) ?? approvalsByTaskId.get(task.id)
      : undefined;
    const plannerItem = plannerByTaskId.get(task.id);

    return {
      id: task.id,
      title: task.title,
      details: formatTaskDetails(task, plannerItem, linkedNotification),
      channel: linkedNotification?.channel ?? task.channel,
      status: task.status,
      text: approval?.draftText ?? task.resultDraft ?? linkedNotification?.body ?? "",
      approval,
      task,
    };
  });
  const taskIds = new Set(tasks.map((task) => task.id));
  const notificationRows = notifications
    .filter((notification) => !notification.linkedTaskId || !taskIds.has(notification.linkedTaskId))
    .map((notification) => ({
      id: notification.id,
      title: notification.title,
      details: notification.target,
      channel: notification.channel,
      status: notification.status,
      text: notification.body,
    }));

  return [...taskRows, ...notificationRows];
}

export function createQueueSections(rows: CurrentQueueRow[]): CurrentQueueSection[] {
  const decisionRows = rows.filter(isDecisionRow);
  const decisionIds = new Set(decisionRows.map((row) => row.id));
  const draftRows = rows.filter((row) => !decisionIds.has(row.id) && isDraftRow(row));
  const draftIds = new Set(draftRows.map((row) => row.id));
  const currentTaskRows = rows.filter((row) => !decisionIds.has(row.id) && !draftIds.has(row.id));

  return [
    { title: "Требуют моего решения", rows: decisionRows },
    { title: "Текущие задачи", rows: currentTaskRows },
    { title: "Черновики и подготовленные действия", rows: draftRows },
  ];
}

function isDecisionRow(row: CurrentQueueRow) {
  return row.approval?.status === "required"
    || row.task?.approvalStatus === "required"
    || row.status === "needs-approval";
}

function isDraftRow(row: CurrentQueueRow) {
  return row.status === "draft" || Boolean(row.approval && row.approval.status !== "required");
}

function formatTaskDetails(
  task: AiAssistantTask,
  plannerItem?: AiAssistantPlannerItem,
  linkedNotification?: AiAssistantNotification,
) {
  if (!plannerItem) return linkedNotification?.title ?? task.prompt;

  const plannedAt = [
    formatTaskDateLabel(plannerItem.plannedDate),
    plannerItem.plannedTime,
  ].filter(Boolean).join(" ");

  return `Планировщик: ${plannedAt}. ${plannerItem.description || task.prompt}`;
}
