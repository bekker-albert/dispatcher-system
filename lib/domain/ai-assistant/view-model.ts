import type {
  AiAssistantApprovalAction,
  AiAssistantApprovalStatus,
  AiAssistantDataset,
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

  return {
    summary: {
      activeTasks,
      approvalsRequired,
      connectorWarnings,
      knowledgeSources: dataset.knowledgeSources.length,
    },
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
