export type AiAssistantTab =
  | "main"
  | "tasks"
  | "documents"
  | "settings";

export type AiAssistantTaskKind =
  | "ask"
  | "draft-message"
  | "summarize"
  | "find-document"
  | "create-notification"
  | "prepare-document";

export type AiAssistantTaskStatus =
  | "draft"
  | "queued"
  | "running"
  | "needs-approval"
  | "approved"
  | "sent"
  | "failed"
  | "cancelled";

export type AiAssistantNotificationChannel =
  | "app"
  | "whatsapp"
  | "documentolog"
  | "mail"
  | "calendar"
  | "push";

export type AiAssistantApprovalStatus =
  | "not-required"
  | "required"
  | "approved"
  | "returned"
  | "rejected";

export type AiAssistantMessageRole =
  | "user"
  | "assistant"
  | "system";

export type AiAssistantActionType =
  | "ask-assistant"
  | "draft"
  | "prepare-document"
  | "send-whatsapp"
  | "send-mail"
  | "create-calendar-event"
  | "start-documentolog"
  | "create-push-notification"
  | "update-report-reason"
  | "update-knowledge-rule"
  | "create-business-trip"
  | "delete-data";

export type AiAssistantActionRisk =
  | "low"
  | "critical";

export type AiAssistantKnowledgeAccess =
  | "public"
  | "internal"
  | "restricted";

export type AiAssistantSourceEntity = {
  type: "report" | "dispatch-summary" | "vehicle" | "pto" | "document" | "knowledge";
  id: string;
  label: string;
};

export type AiAssistantEvidence = {
  id: string;
  source: AiAssistantSourceEntity;
  summary: string;
  confidence: number;
};

export type AiAssistantTask = {
  id: string;
  title: string;
  kind: AiAssistantTaskKind;
  status: AiAssistantTaskStatus;
  channel: AiAssistantNotificationChannel;
  workDate?: string;
  sourceEntity?: AiAssistantSourceEntity;
  prompt: string;
  resultDraft?: string;
  evidenceIds: string[];
  approvalStatus: AiAssistantApprovalStatus;
  approvalActionId?: string;
  owner: string;
  updatedAt: string;
};

export type AiAssistantChatMessage = {
  id: string;
  role: AiAssistantMessageRole;
  author: string;
  text: string;
  createdAt: string;
  linkedTaskId?: string;
};

export type AiAssistantNotification = {
  id: string;
  title: string;
  channel: AiAssistantNotificationChannel;
  status: AiAssistantTaskStatus;
  target: string;
  body: string;
  approvalStatus: AiAssistantApprovalStatus;
  workDate?: string;
  linkedTaskId?: string;
  plannerItemId?: string;
  updatedAt: string;
};
