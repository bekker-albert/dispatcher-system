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
