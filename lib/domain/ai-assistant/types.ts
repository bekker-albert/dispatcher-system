export type AiAssistantRole =
  | "viewer"
  | "operator"
  | "supervisor"
  | "admin"
  | "security-auditor";

export type AiAssistantPermission =
  | "ai.chat.read"
  | "ai.chat.write"
  | "ai.context.dispatcher.read"
  | "ai.knowledge.read"
  | "ai.external.draft"
  | "ai.external.send"
  | "ai.calendar.read"
  | "ai.calendar.write"
  | "ai.documentolog.read"
  | "ai.documentolog.write"
  | "ai.admin.connectors"
  | "ai.audit.read";

export type AiAssistantTab =
  | "tasks"
  | "planner"
  | "integrations"
  | "knowledge"
  | "audit";

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

export type AiAssistantConnectorKey =
  | "ai-api"
  | "whatsapp"
  | "documentolog"
  | "mail"
  | "calendar"
  | "push"
  | "knowledge-base";

export type AiAssistantConnectorStatus =
  | "planned"
  | "disabled"
  | "connected"
  | "error";

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
  | "rejected";

export type AiAssistantMessageRole =
  | "user"
  | "assistant"
  | "system";

export type AiAssistantActionType =
  | "ask-assistant"
  | "prepare-document"
  | "send-whatsapp"
  | "send-mail"
  | "create-calendar-event"
  | "start-documentolog"
  | "create-push-notification"
  | "update-report-reason";

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

export type AiAssistantApprovalAction = {
  id: string;
  taskId: string;
  title: string;
  actionType: AiAssistantActionType;
  risk: AiAssistantActionRisk;
  status: Extract<AiAssistantApprovalStatus, "required" | "approved" | "rejected">;
  targetConnector: AiAssistantConnectorKey;
  targetLabel: string;
  draftText: string;
  requestedBy: string;
  approver?: string;
  createdAt: string;
  updatedAt: string;
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
  linkedTaskId?: string;
  linkedNotificationId?: string;
  comment?: string;
  updatedAt: string;
};

export type AiAssistantIntegration = {
  key: AiAssistantConnectorKey;
  title: string;
  status: AiAssistantConnectorStatus;
  mode: "read" | "write" | "read-write";
  description: string;
  requiredScopes: AiAssistantPermission[];
  lastSyncAt?: string;
};

export type AiAssistantKnowledgeSource = {
  id: string;
  title: string;
  source: "manual" | "file" | "mail" | "documentolog" | "calendar" | "system";
  access: AiAssistantKnowledgeAccess;
  owner: string;
  updatedAt: string;
  tags: string[];
};

export type AiAssistantAuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  role: AiAssistantRole;
  action: string;
  connector?: AiAssistantConnectorKey;
  target: string;
  status: "success" | "blocked" | "failed";
  summary: string;
};

export type AiAssistantConnectorContext = {
  actorUserId: string;
  role: AiAssistantRole;
  scopes: AiAssistantPermission[];
  correlationId: string;
  dryRun: boolean;
};

export type AiAssistantConnectorResult<TData> = {
  ok: boolean;
  data?: TData;
  errorCode?: string;
  auditId: string;
};

export type AiAssistantConnectorCapability =
  | "read"
  | "draft"
  | "approve"
  | "send"
  | "sync"
  | "search";

export type AiAssistantConnector = {
  key: AiAssistantConnectorKey;
  title: string;
  capabilities: AiAssistantConnectorCapability[];
  requiredScopes: AiAssistantPermission[];
  createDraft?: (
    context: AiAssistantConnectorContext,
    input: { title: string; body: string; target: string },
  ) => Promise<AiAssistantConnectorResult<{ draftId: string }>>;
  sync?: (
    context: AiAssistantConnectorContext,
  ) => Promise<AiAssistantConnectorResult<{ syncedAt: string }>>;
};

export type AiAssistantDataset = {
  currentWorkDate: string;
  currentDateTime: string;
  chatMessages: AiAssistantChatMessage[];
  approvalActions: AiAssistantApprovalAction[];
  tasks: AiAssistantTask[];
  notifications: AiAssistantNotification[];
  plannerItems: AiAssistantPlannerItem[];
  integrations: AiAssistantIntegration[];
  knowledgeSources: AiAssistantKnowledgeSource[];
  evidence: AiAssistantEvidence[];
  auditEvents: AiAssistantAuditEvent[];
};

export type AiAssistantSummary = {
  activeTasks: number;
  approvalsRequired: number;
  connectorWarnings: number;
  knowledgeSources: number;
};

export type AiAssistantViewModel = {
  summary: AiAssistantSummary;
  chatMessages: AiAssistantChatMessage[];
  approvalActions: AiAssistantApprovalAction[];
  tasks: AiAssistantTask[];
  notifications: AiAssistantNotification[];
  currentWorkDate: string;
  currentDateTime: string;
  currentTasks: AiAssistantTask[];
  currentNotifications: AiAssistantNotification[];
  plannerItems: AiAssistantPlannerItem[];
  integrations: AiAssistantIntegration[];
  knowledgeSources: AiAssistantKnowledgeSource[];
  evidenceById: Map<string, AiAssistantEvidence>;
  auditEvents: AiAssistantAuditEvent[];
};
