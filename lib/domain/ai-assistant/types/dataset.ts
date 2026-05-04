import type { AiAssistantAgent } from "./agents";
import type { AiAssistantApprovalAction } from "./approvals";
import type { AiAssistantAuditEvent } from "./audit";
import type { AiAssistantCalendarEvent } from "./calendar";
import type { AiAssistantDevelopmentIdea, AiAssistantCodexPromptDraft } from "./development";
import type { AiAssistantDocument, AiAssistantDocumentTemplate } from "./documents";
import type { AiAssistantDocumentologItem } from "./documentolog";
import type { AiAssistantIntegration } from "./integrations";
import type { AiAssistantKnowledgeBaseItem, AiAssistantKnowledgeRule, AiAssistantKnowledgeSource } from "./knowledge";
import type { AiAssistantMailDraft, AiAssistantMailItem } from "./mail";
import type { AiAssistantPlannerItem } from "./planner";
import type {
  AiAssistantChatMessage,
  AiAssistantEvidence,
  AiAssistantNotification,
  AiAssistantTask,
} from "./tasks";
import type { AiAssistantWhatsAppGroup, AiAssistantWhatsAppMessageCandidate } from "./whatsapp";

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
