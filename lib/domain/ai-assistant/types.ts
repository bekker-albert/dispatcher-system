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
  | "agents"
  | "development"
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

export type AiAssistantAgentRole =
  | "main-assistant"
  | "whatsapp-monitor"
  | "task-planner"
  | "document-agent"
  | "mail-agent"
  | "calendar-agent"
  | "documentolog-agent"
  | "mentor-agent"
  | "development-agent"
  | "qa-agent"
  | "security-agent";

export type AiAssistantAgentRuntimeStatus =
  | "planned"
  | "active"
  | "paused"
  | "error";

export type AiAssistantAgent = {
  id: string;
  title: string;
  role: AiAssistantAgentRole;
  description: string;
  status: AiAssistantAgentRuntimeStatus;
  permissions: AiAssistantPermission[];
  allowedActions: AiAssistantActionType[];
  blockedActions: AiAssistantActionType[];
  requiredConnectors: AiAssistantConnectorKey[];
  requiresUserApproval: boolean;
  updatedAt: string;
};

export type AiAssistantWhatsAppGroup = {
  id: string;
  title: string;
  status: AiAssistantConnectorStatus;
  canRead: boolean;
  canWrite: boolean;
  writeMode: "disabled" | "approval-required" | "automatic";
  description: string;
  updatedAt: string;
};

export type AiAssistantWhatsAppMessageCandidate = {
  id: string;
  groupId: string;
  author: string;
  messageText: string;
  detectedIntent: "trip" | "reminder" | "task" | "incident" | "document" | "mail" | "unknown";
  confidence: number;
  suggestedAction: string;
  linkedTaskId?: string;
  approvalRequired: boolean;
  status: "new" | "needs-approval" | "approved" | "rejected" | "converted";
  createdAt: string;
};

export type AiAssistantDocumentType =
  | "memo"
  | "business-trip"
  | "letter"
  | "report"
  | "explanation"
  | "template"
  | "other";

export type AiAssistantDocumentStatus =
  | "draft"
  | "review"
  | "approved"
  | "sent-to-documentolog"
  | "signing"
  | "signed"
  | "rejected"
  | "archive";

export type AiAssistantDocument = {
  id: string;
  title: string;
  type: AiAssistantDocumentType;
  status: AiAssistantDocumentStatus;
  linkedTaskId?: string;
  linkedApprovalId?: string;
  documentologId?: string;
  updatedAt: string;
};

export type AiAssistantDocumentTemplate = {
  id: string;
  title: string;
  documentType: AiAssistantDocumentType;
  description: string;
  owner: string;
  updatedAt: string;
};

export type AiAssistantMailItem = {
  id: string;
  from: string;
  to: string[];
  subject: string;
  bodyPreview: string;
  receivedAt: string;
  linkedTaskId?: string;
};

export type AiAssistantMailDraft = {
  id: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  status: "draft" | "needs-approval" | "approved" | "sent" | "rejected";
  linkedTaskId?: string;
  linkedApprovalId?: string;
  updatedAt: string;
};

export type AiAssistantCalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  participants: string[];
  status: "draft" | "needs-approval" | "approved" | "created" | "cancelled";
  linkedTaskId?: string;
  updatedAt: string;
};

export type AiAssistantDocumentologItem = {
  id: string;
  title: string;
  externalId?: string;
  status: "prepared" | "sent" | "in-approval" | "approved" | "rejected" | "needs-rework";
  approver: string;
  comment?: string;
  linkedDocumentId?: string;
  updatedAt: string;
};

export type AiAssistantKnowledgeRule = {
  id: string;
  category: string;
  rule: string;
  exceptions: string[];
  example: string;
  status: "draft" | "needs-approval" | "active" | "archived";
  createdBy: string;
  updatedAt: string;
};

export type AiAssistantKnowledgeBaseItem = {
  id: string;
  title: string;
  content: string;
  source: AiAssistantKnowledgeSource["source"];
  access: AiAssistantKnowledgeAccess;
  tags: string[];
  updatedAt: string;
};

export type AiAssistantDevelopmentIdea = {
  id: string;
  title: string;
  description: string;
  benefit: string;
  risks: string[];
  affectedModules: string[];
  businessLogic: string[];
  accessRoles: string[];
  missingQuestions: string[];
  acceptanceCriteria: string[];
  status:
    | "new"
    | "reviewing"
    | "accepted"
    | "rejected"
    | "needs-clarification"
    | "spec-ready"
    | "sent-to-codex"
    | "in-development"
    | "done";
  codexPromptDraftId?: string;
  updatedAt: string;
};

export type AiAssistantCodexPromptDraft = {
  id: string;
  title: string;
  body: string;
  linkedIdeaId?: string;
  status: "draft" | "ready" | "used" | "archived";
  updatedAt: string;
};

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
  recurrence?: AiAssistantRecurrenceRule;
  linkedTaskId?: string;
  linkedNotificationId?: string;
  comment?: string;
  updatedAt: string;
};

export type AiAssistantIntegration = {
  key: string;
  title: string;
  status: AiAssistantConnectorStatus;
  mode: "read" | "write" | "read-write";
  description: string;
  requiredScopes: AiAssistantPermission[];
  availableCapabilities?: string[];
  stubNotes?: string;
  nextStep?: string;
  usedByAgentIds?: string[];
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

export type AiAssistantConnectorExecuteInput = {
  actionType: AiAssistantActionType;
  approvalActionId?: string;
  approved: boolean;
  idempotencyKey: string;
  target: string;
  body: string;
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
  execute?: (
    context: AiAssistantConnectorContext,
    input: AiAssistantConnectorExecuteInput,
  ) => Promise<AiAssistantConnectorResult<{ executionId: string }>>;
};

export type AiAssistantDataset = {
  currentWorkDate: string;
  currentDateTime: string;
  agents: AiAssistantAgent[];
  whatsappGroups: AiAssistantWhatsAppGroup[];
  whatsappMessageCandidates: AiAssistantWhatsAppMessageCandidate[];
  documents: AiAssistantDocument[];
  documentTemplates: AiAssistantDocumentTemplate[];
  mailItems: AiAssistantMailItem[];
  mailDrafts: AiAssistantMailDraft[];
  calendarEvents: AiAssistantCalendarEvent[];
  documentologItems: AiAssistantDocumentologItem[];
  knowledgeRules: AiAssistantKnowledgeRule[];
  knowledgeBaseItems: AiAssistantKnowledgeBaseItem[];
  developmentIdeas: AiAssistantDevelopmentIdea[];
  codexPromptDrafts: AiAssistantCodexPromptDraft[];
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
  activeAgents: number;
  whatsappCandidatesPending: number;
  documentsInProgress: number;
  mailDraftsPendingApproval: number;
  documentologWaiting: number;
  activeKnowledgeRules: number;
  developmentIdeasPending: number;
};

export type AiAssistantHighPriorityAction = {
  id: string;
  title: string;
  source: "approval" | "whatsapp" | "mail" | "documentolog" | "development";
  reason: string;
  target: string;
  updatedAt: string;
};

export type AiAssistantViewModel = {
  summary: AiAssistantSummary;
  highPriorityActions: AiAssistantHighPriorityAction[];
  agents: AiAssistantAgent[];
  activeAgents: AiAssistantAgent[];
  whatsappGroups: AiAssistantWhatsAppGroup[];
  whatsappMessageCandidates: AiAssistantWhatsAppMessageCandidate[];
  documents: AiAssistantDocument[];
  documentTemplates: AiAssistantDocumentTemplate[];
  mailItems: AiAssistantMailItem[];
  mailDrafts: AiAssistantMailDraft[];
  calendarEvents: AiAssistantCalendarEvent[];
  documentologItems: AiAssistantDocumentologItem[];
  knowledgeRules: AiAssistantKnowledgeRule[];
  knowledgeBaseItems: AiAssistantKnowledgeBaseItem[];
  developmentIdeas: AiAssistantDevelopmentIdea[];
  codexPromptDrafts: AiAssistantCodexPromptDraft[];
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
