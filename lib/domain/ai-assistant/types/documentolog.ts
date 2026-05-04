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
