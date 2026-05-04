import type { AiAssistantDataset, AiAssistantRole } from "@/features/ai-assistant/types";
import { aiAssistantAgentsMock } from "./mock/agents.mock";
import { aiAssistantWhatsAppGroupsMock, aiAssistantWhatsAppMessageCandidatesMock } from "./mock/whatsapp.mock";
import { aiAssistantDocumentsMock, aiAssistantDocumentTemplatesMock } from "./mock/documents.mock";
import { aiAssistantMailItemsMock, aiAssistantMailDraftsMock } from "./mock/mail.mock";
import { aiAssistantCalendarEventsMock } from "./mock/calendar.mock";
import { aiAssistantDocumentologItemsMock } from "./mock/documentolog.mock";
import { aiAssistantKnowledgeRulesMock, aiAssistantKnowledgeBaseItemsMock, aiAssistantKnowledgeSourcesMock } from "./mock/knowledge.mock";
import { aiAssistantDevelopmentIdeasMock, aiAssistantCodexPromptDraftsMock } from "./mock/development.mock";
import { aiAssistantChatMessagesMock } from "./mock/chat.mock";
import { aiAssistantApprovalActionsMock } from "./mock/approvals.mock";
import { aiAssistantTasksMock, aiAssistantNotificationsMock, aiAssistantEvidenceMock } from "./mock/tasks.mock";
import { aiAssistantPlannerItemsMock } from "./mock/planner.mock";
import { aiAssistantIntegrationsMock } from "./mock/integrations.mock";
import { aiAssistantAuditEventsMock } from "./mock/audit.mock";

export const defaultAiAssistantRole: AiAssistantRole = "supervisor";

export const defaultAiAssistantDataset: AiAssistantDataset = {
  currentWorkDate: "2026-04-24",
  currentDateTime: "2026-04-24T16:00",
  agents: aiAssistantAgentsMock,
  whatsappGroups: aiAssistantWhatsAppGroupsMock,
  whatsappMessageCandidates: aiAssistantWhatsAppMessageCandidatesMock,
  documents: aiAssistantDocumentsMock,
  documentTemplates: aiAssistantDocumentTemplatesMock,
  mailItems: aiAssistantMailItemsMock,
  mailDrafts: aiAssistantMailDraftsMock,
  calendarEvents: aiAssistantCalendarEventsMock,
  documentologItems: aiAssistantDocumentologItemsMock,
  knowledgeRules: aiAssistantKnowledgeRulesMock,
  knowledgeBaseItems: aiAssistantKnowledgeBaseItemsMock,
  developmentIdeas: aiAssistantDevelopmentIdeasMock,
  codexPromptDrafts: aiAssistantCodexPromptDraftsMock,
  chatMessages: aiAssistantChatMessagesMock,
  approvalActions: aiAssistantApprovalActionsMock,
  tasks: aiAssistantTasksMock,
  notifications: aiAssistantNotificationsMock,
  plannerItems: aiAssistantPlannerItemsMock,
  integrations: aiAssistantIntegrationsMock,
  knowledgeSources: aiAssistantKnowledgeSourcesMock,
  evidence: aiAssistantEvidenceMock,
  auditEvents: aiAssistantAuditEventsMock,
};
