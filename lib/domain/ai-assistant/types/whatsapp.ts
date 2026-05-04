import type { AiAssistantConnectorStatus } from "./integrations";

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
