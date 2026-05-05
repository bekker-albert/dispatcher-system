import type {
  AiAssistantApprovalAction,
  AiAssistantNotification,
  AiAssistantNotificationChannel,
  AiAssistantPlannerItem,
  AiAssistantTask,
  AiAssistantTaskStatus,
} from "@/features/ai-assistant/types";
import { formatTaskDateLabel } from "@/features/ai-assistant/components/tasks/taskFormatters";
import { aiAssistantTaskStatusLabels } from "@/lib/domain/ai-assistant/status";

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

export type TaskStatusFilter = AiAssistantTaskStatus | "all";

export const taskStatusFilterOptions: Array<{
  value: TaskStatusFilter;
  label: string;
}> = [
  { value: "all", label: "Все статусы" },
  { value: "needs-approval", label: aiAssistantTaskStatusLabels["needs-approval"] },
  { value: "queued", label: aiAssistantTaskStatusLabels.queued },
  { value: "running", label: aiAssistantTaskStatusLabels.running },
  { value: "draft", label: aiAssistantTaskStatusLabels.draft },
  { value: "approved", label: aiAssistantTaskStatusLabels.approved },
  { value: "sent", label: aiAssistantTaskStatusLabels.sent },
  { value: "cancelled", label: aiAssistantTaskStatusLabels.cancelled },
  { value: "failed", label: aiAssistantTaskStatusLabels.failed },
];

const taskStatusOrder: AiAssistantTaskStatus[] = [
  "needs-approval",
  "queued",
  "running",
  "draft",
  "approved",
  "sent",
  "cancelled",
  "failed",
];

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

export function createStatusQueueSections(rows: CurrentQueueRow[]): CurrentQueueSection[] {
  return taskStatusOrder
    .map((status) => ({
      title: aiAssistantTaskStatusLabels[status],
      rows: rows.filter((row) => row.status === status),
    }))
    .filter((section) => section.rows.length > 0);
}

export function filterQueueRows(
  rows: CurrentQueueRow[],
  searchQuery: string,
  statusFilter: TaskStatusFilter,
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return rows.filter((row) => {
    if (statusFilter !== "all" && row.status !== statusFilter) return false;
    if (!normalizedQuery) return true;

    return [
      row.title,
      row.details,
      row.text,
      row.channel,
      row.status,
      row.approval?.draftText,
      row.task?.prompt,
      row.task?.owner,
    ].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
  });
}

export function createTaskStatusSummary(rows: CurrentQueueRow[]) {
  return taskStatusOrder
    .map((status) => ({
      status,
      label: aiAssistantTaskStatusLabels[status],
      count: rows.filter((row) => row.status === status).length,
    }))
    .filter((item) => item.count > 0);
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
