import type { AiAssistantKnowledgeAccess } from "./tasks";

export type AiAssistantKnowledgeSource = {
  id: string;
  title: string;
  source: "manual" | "file" | "mail" | "documentolog" | "calendar" | "system";
  access: AiAssistantKnowledgeAccess;
  owner: string;
  updatedAt: string;
  tags: string[];
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
