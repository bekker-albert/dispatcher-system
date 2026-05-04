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
