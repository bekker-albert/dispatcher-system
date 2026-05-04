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
