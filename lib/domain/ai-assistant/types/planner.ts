import type {
  AiAssistantActionType,
  AiAssistantNotificationChannel,
} from "./tasks";

export type AiAssistantReminderRule = {
  id: string;
  title: string;
  channel: AiAssistantNotificationChannel;
  target: string;
  recurrence: AiAssistantRecurrenceRule;
  active: boolean;
  updatedAt: string;
};

export type AiAssistantRecurrenceRule = {
  type: "none" | "daily" | "weekly" | "monthly" | "every-n-days" | "custom";
  interval?: number;
  weekdays?: number[];
  monthDay?: number;
  untilDate?: string;
};

export type AiAssistantPlannerStatus =
  | "planned"
  | "needs-decision"
  | "in-progress"
  | "done"
  | "cancelled";

export type AiAssistantPlannerPriority =
  | "low"
  | "normal"
  | "high";

export type AiAssistantPlannerItem = {
  id: string;
  title: string;
  description: string;
  plannedDate: string;
  plannedTime?: string;
  status: AiAssistantPlannerStatus;
  priority: AiAssistantPlannerPriority;
  owner: string;
  target: string;
  channel: AiAssistantNotificationChannel;
  actionType: AiAssistantActionType;
  preparedText: string;
  requireApproval: boolean;
  recurrence?: AiAssistantRecurrenceRule;
  linkedTaskId?: string;
  linkedNotificationId?: string;
  comment?: string;
  updatedAt: string;
};
